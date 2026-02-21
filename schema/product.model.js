const mongoose = require("mongoose");
const {
  product_collection_enums,
  product_volume_enums,
  product_status_enums,
  product_size_types_enums,
  product_type_enums,
} = require("../lib/config");

const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true },

    // Main category (Feyri cosmetics)
    product_collection: {
      type: String,
      required: true,
      enum: {
        values: product_collection_enums,
        message: "{VALUE} is not among permitted enum values",
      },
    },

    // Optional subcategory (toner, serum, cleanser...)
    // Hozir formda bo'lmasa ham keyin filter uchun tayyor turadi
    product_type: {
      type: String,
      required: false,
      enum: {
        values: product_type_enums,
        message: "{VALUE} is not among permitted enum values",
      },
    },

    product_status: {
      type: String,
      required: false,
      default: "AVAILABLE",
      enum: {
        values: product_status_enums,
        message: "{VALUE} is not among permitted enum values",
      },
    },

    product_price: {
      type: Number,
      required: false,
      default: 0,
    },

    product_discount: {
      type: Number,
      required: false,
      default: 0,
    },

    product_left_cnt: {
      type: Number,
      required: true,
    },

    // Cosmetics size (15ml, 30ml, 150ml ...)
    product_size: {
      type: String,
      default: "50ml",
      required: function () {
        const sized_list = ["skincare", "makeup", "fragrance", "body_hair"];
        return sized_list.includes(this.product_collection);
      },
      enum: {
        values: product_size_types_enums,
        message: "{VALUE} is not among permitted enum values",
      },
    },

    // Optional volume (agar ishlatmoqchi bo'lsangiz)
    // Eski luxury logikasi olib tashlandi
    product_volume: {
      type: Number,
      required: false,
      enum: {
        values: product_volume_enums,
        message: "{VALUE} is not among permitted enum values",
      },
    },

    product_description: { type: String, required: true },
    product_images: { type: Array, required: false, default: [] },

    product_likes: {
      type: Number,
      required: false,
      default: 0,
    },

    product_views: {
      type: Number,
      required: false,
      default: 0,
    },

    brand_mb_id: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: false,
    },

    // Discount metadata (optional)
    discount_type: {
      type: String,
      required: false,
      enum: ["amount", "percent"],
      default: "percent",
    },

    discount_endDate: {
      type: Date,
      required: false,
      default: null,
    },

    // Rating / reviews
    product_rating: { type: Number, required: false, default: 0 },
    product_reviews: { type: Number, required: false, default: 0 },
  },
  { timestamps: true }
);

// Unique combo (minimal hold)
productSchema.index(
  { brand_mb_id: 1, product_name: 1, product_size: 1, product_volume: 1 },
  { unique: true }
);

module.exports = mongoose.model("Product", productSchema);
