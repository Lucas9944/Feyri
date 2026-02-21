const assert = require("assert");
const mongoose = require("mongoose");

const {
  shapeIntoMongooseObjectId,
  lookup_auth_member_liked,
} = require("../lib/config");

const ReviewModel = require("../schema/review.model");
const ProductModel = require("../schema/product.model");
const Definer = require("../lib/mistake");
const Member = require("./Member");

class Product {
  constructor() {
    this.productModel = ProductModel;
    this.reviewModel = ReviewModel;
  }

  // ✅ Common helper: discount + discountedPrice + rating fallback
  getDiscountStage() {
    return {
      $addFields: {
        // rating fallback
        product_rating: { $ifNull: ["$product_rating", 0] },
        product_reviews: { $ifNull: ["$product_reviews", 0] },

        // discount active check
        _discountActive: {
          $and: [
            { $gt: [{ $ifNull: ["$product_discount", 0] }, 0] },
            {
              $or: [
                { $eq: ["$discount_endDate", null] },
                { $gt: ["$discount_endDate", "$$NOW"] },
              ],
            },
          ],
        },

        // ✅ IMPORTANT FIX:
        // frontend `product.discount?.value` undefined bo‘lmasin
        // shuning uchun default object qaytaramiz (value:0)
        discount: {
          $cond: [
            {
              $and: [
                { $gt: [{ $ifNull: ["$product_discount", 0] }, 0] },
                {
                  $or: [
                    { $eq: ["$discount_endDate", null] },
                    { $gt: ["$discount_endDate", "$$NOW"] },
                  ],
                },
              ],
            },
            {
              type: { $ifNull: ["$discount_type", "percent"] },
              value: { $ifNull: ["$product_discount", 0] },
              endDate: "$discount_endDate",
            },
            // ✅ DEFAULT (null emas!)
            { type: "percent", value: 0, endDate: null },
          ],
        },

        discountedPrice: {
          $cond: [
            {
              $and: [
                { $gt: [{ $ifNull: ["$product_discount", 0] }, 0] },
                {
                  $or: [
                    { $eq: ["$discount_endDate", null] },
                    { $gt: ["$discount_endDate", "$$NOW"] },
                  ],
                },
              ],
            },
            {
              $cond: [
                {
                  $eq: [{ $ifNull: ["$discount_type", "percent"] }, "amount"],
                },
                {
                  $max: [
                    0,
                    {
                      $floor: {
                        $subtract: [
                          { $ifNull: ["$product_price", 0] },
                          { $ifNull: ["$product_discount", 0] },
                        ],
                      },
                    },
                  ],
                },
                {
                  $max: [
                    0,
                    {
                      $floor: {
                        $multiply: [
                          { $ifNull: ["$product_price", 0] },
                          {
                            $subtract: [
                              1,
                              {
                                $divide: [
                                  { $ifNull: ["$product_discount", 0] },
                                  100,
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
            0,
          ],
        },
      },
    };
  }

  async getAllProductsData(member, data) {
    try {
      const auth_mb_id = shapeIntoMongooseObjectId(member?._id);
      const isAll = (v) => !v || v === "all" || v === "ALL";

      // ✅ defaults
      const page = Number(data.page || 1);
      const limit = Number(data.limit || 10);
      const order = data.order || "createdAt";

      assert.ok(page > 0, "Invalid page");
      assert.ok(limit > 0 && limit <= 100, "Invalid limit");

      let match = { product_status: "PROCESS" };

      if (!isAll(data.product_collection))
        match.product_collection = data.product_collection;

      // ✅ brand filter: faqat valid ObjectId bo‘lsa
      if (!isAll(data.brand_mb_id)) {
        assert.ok(
          mongoose.Types.ObjectId.isValid(data.brand_mb_id),
          "Invalid brand_mb_id"
        );
        match.brand_mb_id = shapeIntoMongooseObjectId(data.brand_mb_id);
      }

      if (!isAll(data.product_size)) match.product_size = data.product_size;

      if (!isAll(data.product_volume)) {
        const vol = Number(data.product_volume);
        assert.ok(!Number.isNaN(vol), "Invalid product_volume");
        match.product_volume = vol;
      }

      // ✅ safe sort allow-list
      const allowedSort = new Set([
        "createdAt",
        "updatedAt",
        "product_price",
        "product_views",
        "product_likes",
      ]);
      const safeOrder = allowedSort.has(order) ? order : "createdAt";

      const sort =
        safeOrder === "product_price"
          ? { [safeOrder]: 1 }
          : safeOrder === "product_views"
          ? { product_views: -1 }
          : safeOrder === "product_likes"
          ? { product_likes: -1 }
          : { [safeOrder]: -1 };

      const result = await this.productModel
        .aggregate([
          { $match: match },
          this.getDiscountStage(),
          { $sort: sort },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          lookup_auth_member_liked(auth_mb_id),
          { $project: { _discountActive: 0 } },
        ])
        .exec();

      assert.ok(result, Definer.general_err1);
      return result;
    } catch (err) {
      throw err;
    }
  }

  async getChosenProductData(member, id) {
    try {
      const auth_mb_id = shapeIntoMongooseObjectId(member?._id);

      assert.ok(mongoose.Types.ObjectId.isValid(id), "Invalid product id");
      id = shapeIntoMongooseObjectId(id);

      if (member) {
        const member_obj = new Member();
        await member_obj.viewChosenItemByMember(member, id, "product");
      }

      const result = await this.productModel
        .aggregate([
          { $match: { _id: id, product_status: "PROCESS" } },
          this.getDiscountStage(),
          lookup_auth_member_liked(auth_mb_id),
          { $project: { _discountActive: 0 } },
        ])
        .exec();

      assert.ok(result, Definer.general_err1);
      return result[0];
    } catch (err) {
      throw err;
    }
  }

  async createReviewData(member, productId, data) {
    try {
      const auth_mb_id = shapeIntoMongooseObjectId(member?._id);
      assert.ok(auth_mb_id, "Auth required");

      assert.ok(
        mongoose.Types.ObjectId.isValid(productId),
        "Invalid product id"
      );
      const pid = shapeIntoMongooseObjectId(productId);

      const review_rating = Number(data.review_rating);
      assert.ok(!Number.isNaN(review_rating), "Invalid review_rating");
      assert.ok(
        review_rating >= 1 && review_rating <= 5,
        "review_rating must be 1..5"
      );

      // (ixtiyoriy) 0.5 stepni majbur qilmoqchi bo‘lsangiz:
      // assert.ok(Number.isInteger(review_rating * 2), "review_rating must be x.0 or x.5");

      const review_text = (data.review_text || "").toString().trim();

      // product mavjudligini tekshiramiz
      const product = await this.productModel
        .findOne({ _id: pid, product_status: "PROCESS" })
        .lean();
      assert.ok(product, "Product not found");

      // ✅ upsert: bitta user bitta productga bitta review
      const saved = await this.reviewModel.findOneAndUpdate(
        { product_id: pid, mb_id: auth_mb_id },
        {
          $set: {
            review_rating,
            review_text,
            review_status: "active",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // ✅ rating + review countni Product’da cache qilib qo‘yamiz
      const stats = await this.recalcProductRating(pid);

      return {
        review: saved,
        product_id: pid,
        product_rating: stats.product_rating,
        product_reviews: stats.product_reviews,
      };
    } catch (err) {
      throw err;
    }
  }

  async recalcProductRating(productId) {
    try {
      const pid = shapeIntoMongooseObjectId(productId);

      const agg = await this.reviewModel
        .aggregate([
          { $match: { product_id: pid, review_status: "active" } },
          {
            $group: {
              _id: "$product_id",
              avg: { $avg: "$review_rating" },
              cnt: { $sum: 1 },
            },
          },
        ])
        .exec();

      const avg = agg?.[0]?.avg ? Number(agg[0].avg) : 0;
      const cnt = agg?.[0]?.cnt ? Number(agg[0].cnt) : 0;

      // ✅ 0.5 stepga yaqinlashtirish (frontend precision=0.5)
      const roundedAvg = Math.round(avg * 2) / 2;

      await this.productModel.updateOne(
        { _id: pid },
        { $set: { product_rating: roundedAvg, product_reviews: cnt } }
      );

      return { product_rating: roundedAvg, product_reviews: cnt };
    } catch (err) {
      throw err;
    }
  }

  async getProductReviewsData(member, productId, query = {}) {
    try {
      assert.ok(
        mongoose.Types.ObjectId.isValid(productId),
        "Invalid product id"
      );
      const pid = shapeIntoMongooseObjectId(productId);

      const page = Number(query.page || 1);
      const limit = Number(query.limit || 10);
      assert.ok(page > 0, "Invalid page");
      assert.ok(limit > 0 && limit <= 50, "Invalid limit");

      const result = await this.reviewModel
        .find({ product_id: pid, review_status: "active" })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return result;
    } catch (err) {
      throw err;
    }
  }

  async getAllProductsDataResto(member) {
    try {
      member._id = shapeIntoMongooseObjectId(member._id);
      const result = await this.productModel.find({ brand_mb_id: member._id });
      assert.ok(result, Definer.general_err1);
      return result;
    } catch (err) {
      throw err;
    }
  }

  async addNewProductData(data, member) {
    try {
      data.brand_mb_id = shapeIntoMongooseObjectId(member._id);
      const new_product = new this.productModel(data);
      const result = await new_product.save();
      assert.ok(result, Definer.product_err1);
      return result;
    } catch (err) {
      throw err;
    }
  }

  async updateChosenProductData(id, updated_data, mb_id) {
    try {
      assert.ok(mongoose.Types.ObjectId.isValid(id), "Invalid product id");
      assert.ok(mongoose.Types.ObjectId.isValid(mb_id), "Invalid member id");

      id = shapeIntoMongooseObjectId(id);
      mb_id = shapeIntoMongooseObjectId(mb_id);

      const result = await this.productModel
        .findOneAndUpdate({ _id: id, brand_mb_id: mb_id }, updated_data, {
          runValidators: true,
          lean: true,
          returnDocument: "after",
        })
        .exec();

      assert.ok(result, Definer.general_err1);
      return result;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Product;
