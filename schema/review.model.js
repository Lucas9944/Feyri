const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new mongoose.Schema(
  {
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    mb_id: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },

    review_rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review_text: {
      type: String,
      required: false,
      default: "",
    },

    review_status: {
      type: String,
      required: false,
      default: "active",
      enum: ["active", "deleted"],
    },
  },
  { timestamps: true }
);

// ✅ bitta user bitta productga faqat 1 marta review (update bo‘ladi)
reviewSchema.index({ product_id: 1, mb_id: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
