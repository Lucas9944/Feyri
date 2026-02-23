const assert = require("assert");
const mongoose = require("mongoose");

const {
  shapeIntoMongooseObjectId,
  lookup_auth_member_liked,
  product_type_by_collection_map,
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

  normalizeProductInput(data = {}) {
    const obj = { ...data };

    // string trim
    if (typeof obj.product_name === "string") {
      obj.product_name = obj.product_name.trim();
    }

    if (typeof obj.product_description === "string") {
      obj.product_description = obj.product_description.trim();
    }

    // category/type/status normalize
    if (typeof obj.product_collection === "string") {
      obj.product_collection = obj.product_collection.trim().toLowerCase();
    }

    if (typeof obj.product_type === "string") {
      obj.product_type = obj.product_type.trim().toLowerCase();
    }

    if (typeof obj.product_status === "string") {
      obj.product_status = obj.product_status.trim().toUpperCase();
    }

    if (typeof obj.product_size === "string") {
      obj.product_size = obj.product_size.trim();
    }

    if (typeof obj.discount_type === "string") {
      obj.discount_type = obj.discount_type.trim().toLowerCase();
    }

    // optional string bo'sh bo'lsa olib tashlaymiz (enum xato bermasin)
    if (obj.product_type === "") delete obj.product_type;
    if (obj.discount_type === "") delete obj.discount_type;
    if (obj.product_size === "") delete obj.product_size;

    // number fields
    if (obj.product_price !== undefined) {
      obj.product_price = Number(obj.product_price || 0);
    }

    if (obj.product_discount !== undefined) {
      obj.product_discount = Number(obj.product_discount || 0);
    }

    if (obj.product_left_cnt !== undefined) {
      obj.product_left_cnt = Number(obj.product_left_cnt);
    }

    if (obj.product_volume === "" || obj.product_volume === null) {
      delete obj.product_volume;
    } else if (obj.product_volume !== undefined) {
      obj.product_volume = Number(obj.product_volume);
    }

    // date field
    if (!obj.discount_endDate) {
      obj.discount_endDate = null;
    }

    // product_images doim array bo'lsin
    if (!Array.isArray(obj.product_images)) {
      obj.product_images = [];
    }

    return obj;
  }

  validateProductTypeByCollection(data = {}) {
    const collection = data.product_collection;
    const type = data.product_type;

    const allowedTypes =
      (product_type_by_collection_map || {})[collection] || [];

    if (!type || !allowedTypes.includes(type)) {
      throw new Error(
        `Invalid product_type for collection: ${collection} -> ${type}`
      );
    }
  }

  // ✅ Common helper: discount + discountedPrice + rating fallback
  getDiscountStage() {
    return {
      $addFields: {
        product_rating: { $ifNull: ["$product_rating", 0] },
        product_reviews: { $ifNull: ["$product_reviews", 0] },

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

  async getAllProductsData(member, data = {}) {
    try {
      const auth_mb_id = shapeIntoMongooseObjectId(member?._id);
      const isAll = (v) => !v || v === "all" || v === "ALL";

      // ✅ filter normalize (frontenddan keladigan qiymatlar uchun)
      if (typeof data.product_collection === "string") {
        data.product_collection = data.product_collection.trim().toLowerCase();
      }
      if (typeof data.product_type === "string") {
        data.product_type = data.product_type.trim().toLowerCase();
      }
      if (typeof data.product_status === "string") {
        data.product_status = data.product_status.trim().toUpperCase();
      }
      if (typeof data.product_size === "string") {
        data.product_size = data.product_size.trim();
      }

      const page = Number(data.page || 1);
      const limit = Number(data.limit || 10);
      const order = data.order || "createdAt";

      assert.ok(page > 0, "Invalid page");
      assert.ok(limit > 0 && limit <= 100, "Invalid limit");

      let match = { product_status: "PROCESS" };

      if (!isAll(data.product_collection)) {
        match.product_collection = data.product_collection;
      }

      // ✅ NEW: product_type filter
      if (!isAll(data.product_type)) {
        match.product_type = data.product_type;
      }

      if (!isAll(data.brand_mb_id)) {
        assert.ok(
          mongoose.Types.ObjectId.isValid(data.brand_mb_id),
          "Invalid brand_mb_id"
        );
        match.brand_mb_id = shapeIntoMongooseObjectId(data.brand_mb_id);
      }

      if (!isAll(data.product_size)) {
        match.product_size = data.product_size;
      }

      if (!isAll(data.product_volume)) {
        const vol = Number(data.product_volume);
        assert.ok(!Number.isNaN(vol), "Invalid product_volume");
        match.product_volume = vol;
      }

      const allowedSort = new Set([
        "createdAt",
        "updatedAt",
        "product_price",
        "product_views",
        "product_likes",
        "discount.value",
      ]);

      const safeOrder = allowedSort.has(order) ? order : "createdAt";

      let sort = { createdAt: -1 };

      if (safeOrder === "product_price") sort = { product_price: 1 };
      else if (safeOrder === "product_views") sort = { product_views: -1 };
      else if (safeOrder === "product_likes") sort = { product_likes: -1 };
      else if (safeOrder === "discount.value") sort = { "discount.value": -1 };
      else sort = { [safeOrder]: -1 };

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

      const review_text = (data.review_text || "").toString().trim();

      const product = await this.productModel
        .findOne({ _id: pid, product_status: "PROCESS" })
        .lean();
      assert.ok(product, "Product not found");

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

      // sanitize / normalize
      data = this.normalizeProductInput(data);

      // ✅ category -> type mosligini oldindan tekshirish
      this.validateProductTypeByCollection(data);

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

      // status update API uchun faqat kelgan fieldlar normalize bo'lsin
      updated_data = this.normalizeProductInput(updated_data || {});

      // ✅ agar update payload ichida collection/type kelgan bo‘lsa validate qilamiz
      const hasCollection = Object.prototype.hasOwnProperty.call(
        updated_data,
        "product_collection"
      );
      const hasType = Object.prototype.hasOwnProperty.call(
        updated_data,
        "product_type"
      );

      if (hasCollection || hasType) {
        const existing = await this.productModel
          .findOne({ _id: id, brand_mb_id: mb_id })
          .lean();

        assert.ok(existing, Definer.general_err1);

        const merged = {
          product_collection:
            updated_data.product_collection || existing.product_collection,
          product_type: updated_data.product_type || existing.product_type,
        };

        this.validateProductTypeByCollection(merged);
      }

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