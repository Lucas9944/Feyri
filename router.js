const express = require("express");
const router = express.Router();
const memberController = require("./controllers/memberController");
const productController = require("./controllers/productController");
const brandController = require("./controllers/brandController");
const orderController = require("./controllers/orderController");
const communityController = require("./controllers/communityController");
const uploader_community = require("./utils/upload-multer")("community");
const uploader_member = require("./utils/upload-multer")("members");
const followController = require("./controllers/followController");

/*******************************
 *           REST API          *
 *******************************/

// memberga dahldor routerlar
router.post("/signup", memberController.signup);
router.post("/login", memberController.login);
router.get("/logout", memberController.logout);
router.get("/check-me", memberController.checkMyAuthentication);
router.get(
  "/member/:id",
  memberController.retrieveAuthmember,
  memberController.getChosenMember
);

// Prodct related routers
router.post(
  "/products",
  memberController.retrieveAuthmember,
  productController.getAllProducts
);

router.get(
  "/products/:id",
  memberController.retrieveAuthmember,
  productController.getChosenProduct
);

// Brand related routers
router.get(
  "/brand",
  memberController.retrieveAuthmember,
  brandController.getBrand
);

router.get(
  "/shops/:id",
  memberController.retrieveAuthmember,
  brandController.getChosenBrand
);

// Order related routers
router.post(
  "/orders/create",
  memberController.retrieveAuthmember,
  orderController.createOrder
);

router.get(
  "/orders",
  memberController.retrieveAuthmember,
  orderController.getMyOrders
);

router.post(
  "/orders/edit",
  memberController.retrieveAuthmember,
  orderController.editChosenOrder
);

// Community related routers
router.post(
  "/community/image",
  uploader_community.single("community_image"),
  communityController.imageInsertion
);
router.post(
  "/community/create",
  memberController.retrieveAuthmember,
  communityController.createArticle
);

router.get(
  "/community/articles",
  memberController.retrieveAuthmember,
  communityController.getMemberArticles
);

router.get(
  "/community/target",
  memberController.retrieveAuthmember,
  communityController.getArticles
);

router.get(
  "/community/single-article/:art_id",
  memberController.retrieveAuthmember,
  communityController.getChosenArticle
);

// Following related routers

router.post(
  "/follow/subscribe",
  memberController.retrieveAuthmember,
  followController.subscribe
);

router.post(
  "/follow/unsubscriber",
  memberController.retrieveAuthmember,
  followController.unsubscriber
);

router.get(
  "/follow/followings",
  memberController.retrieveAuthmember,
  followController.getMemberFollowings
);
router.get(
  "/follow/followers",
  memberController.retrieveAuthmember,
  followController.getMembeFollowers
);

// Like related routers

router.post(
  "/member-liken",
  memberController.retrieveAuthmember,
  memberController.likeMemberChosen
);
/*******************************
 *        END REST API         *
 *******************************/
module.exports = router;
