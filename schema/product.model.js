const mongoose = require("mongoose");
const {
  product_collection_enums,
  product_volume_enums,
  product_status_enums,
  product_size_types_enums,
  product_type_enums,
  product_type_by_collection_map, // config.js ga qo'shilgan map
} = require("../lib/config");

const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: true,
      trim: true,
    },

    // Main category
    product_collection: {
      type: String,
      required: true,
      enum: {
        values: product_collection_enums,
        message: "{VALUE} is not among permitted enum values",
      },
    },

    // Subcategory (serum, toner, foundation ...)
    product_type: {
      type: String,
      required: true, // admin formda majburiy bo'ldi
      trim: true,
      enum: {
        values: product_type_enums,
        message: "{VALUE} is not among permitted enum values",
      },
      validate: {
        validator: function (value) {
          if (!value || !this.product_collection) return false;

          const typeMap = product_type_by_collection_map || {};
          const allowedTypes = typeMap[this.product_collection] || [];

          return allowedTypes.includes(value);
        },
        message: "product_type does not match selected product_collection",
      },
    },

    product_status: {
      type: String,
      required: false,
      default: "PAUSED", // admin form hidden input bilan mos
      enum: {
        values: product_status_enums,
        message: "{VALUE} is not among permitted enum values",
      },
    },

    product_price: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },

    product_discount: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },

    product_left_cnt: {
      type: Number,
      required: true,
      min: 0,
    },

    // Cosmetics size (15ml, 30ml ...)
    product_size: {
      type: String,
      required: function () {
        const sizedList = ["skincare", "makeup", "fragrance", "body_hair"];
        return sizedList.includes(this.product_collection);
      },
      enum: {
        values: product_size_types_enums,
        message: "{VALUE} is not among permitted enum values",
      },
    },

    // Optional legacy volume
    product_volume: {
      type: Number,
      required: false,
      enum: {
        values: product_volume_enums,
        message: "{VALUE} is not among permitted enum values",
      },
    },

    product_description: {
      type: String,
      required: true,
      trim: true,
    },

    product_images: {
      type: Array,
      required: false,
      default: [],
    },

    product_likes: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },

    product_views: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },

    brand_mb_id: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: false,
    },

    // Discount meta
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
    product_rating: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },

    product_reviews: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Frontend selectdan "" kelsa tozalab yuboramiz
productSchema.pre("validate", function (next) {
  if (this.product_type === "") this.product_type = undefined;
  if (this.product_size === "") this.product_size = undefined;
  if (this.product_volume === "") this.product_volume = undefined;

  // beauty_tools uchun size shart emas
  if (this.product_collection === "beauty_tools" && !this.product_size) {
    this.product_size = undefined;
  }

  next();
});

// Unique combo
productSchema.index(
  { brand_mb_id: 1, product_name: 1, product_size: 1, product_volume: 1 },
  { unique: true }
);

module.exports = mongoose.model("Product", productSchema);
