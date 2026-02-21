const mongoose = require("mongoose");

exports.member_type_enums = ["USER", "ADMIN", "PEDAL", "BRAND"];
exports.member_status_enums = ["ONPAUSE", "ACTIVE", "DELETED"];
exports.ordernary_enums = ["Y", "N"];

exports.product_collection_enums = [
  "skincare",
  "makeup",
  "body_hair",
  "fragrance",
  "beauty_tools",
];

exports.board_id_enums_list = ["celebrity", "free", "qna", "notice"];
exports.board_article_status_enums_list = ["active", "deleted"];

exports.order_status_enums = ["PAUSED", "PROCESS", "DELIVERED", "CANCELLED"];

exports.product_status_enums = [
  "AVAILABLE",
  "OUT_OF_STOCK",
  "DISCONTINUED",
  "PAUSED",
  "PROCESS",
  "DELETED",
];

exports.product_status_enums2 = ["PAUSED", "PROCESS", "DELETED"];

// Cosmetics sizes (UI + schema uchun bitta source)
exports.product_size_types_enums = [
  "15ml",
  "30ml",
  "40ml",
  "50ml",
  "75ml",
  "100ml",
  "125ml",
  "150ml",
  "200ml",
];

// FEYRI COSMETICS - Product types (subcategory / filter)
exports.product_type_enums = [
  // skincare
  "cleanser",
  "toner",
  "serum",
  "ampoule",
  "essence",
  "cream",
  "eye_cream",
  "face_mask",
  "sunscreen",
  "mist",

  // makeup
  "primer",
  "foundation",
  "cushion",
  "bb_cream",
  "cc_cream",
  "concealer",
  "powder",
  "blush",
  "mascara",
  "eyeliner",
  "lip_tint",
  "lipstick",

  // body & hair
  "body_wash",
  "body_lotion",
  "shampoo",
  "conditioner",
  "hair_treatment",

  // fragrance
  "perfume",
  "body_mist",
  "hair_mist",

  // tools
  "beauty_tool",
];

// Optional numeric volume (agar ishlatsangiz)
exports.product_volume_enums = [0.1, 0.5, 1, 2, 5];

// Alias (eski importlar buzilmasin)
exports.product_category_enums = exports.product_collection_enums;
exports.product_size_display_enums = exports.product_size_types_enums;

// VIEW / LIKE GROUP ENUMS
exports.like_view_group_list = [
  "member",
  "product",
  "community",
  "article",
  "brand",
];

/***************************************
 *       MONGODB RELATED COMMANDS      *
 ***************************************/
exports.shapeIntoMongooseObjectId = (target) => {
  if (typeof target === "string") {
    return new mongoose.Types.ObjectId(target);
  } else return target;
};

exports.lookup_auth_member_following = (mb_id, origin) => {
  const follow_id = origin === "follows" ? "$subscriber_id" : "$_id";
  return {
    $lookup: {
      from: "follows",
      let: {
        lc_follow_id: follow_id,
        lc_subscriber_id: mb_id,
        nw_my_following: true,
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$follow_id", "$$lc_follow_id"] },
                { $eq: ["$subscriber_id", "$$lc_subscriber_id"] },
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            subscriber_id: 1,
            follow_id: 1,
            my_following: "$$nw_my_following",
          },
        },
      ],
      as: "me_followed",
    },
  };
};

exports.lookup_auth_member_liked = (mb_id) => {
  return {
    $lookup: {
      from: "likes",
      let: {
        lc_liked_item_id: "$_id",
        lc_mb_id: mb_id,
        nw_my_favorite: true,
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$like_ref_id", "$$lc_liked_item_id"] },
                { $eq: ["$mb_id", "$$lc_mb_id"] },
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            mb_id: 1,
            like_ref_id: 1,
            my_favorite: "$$nw_my_favorite",
          },
        },
      ],
      as: "me_liked",
    },
  };
};
