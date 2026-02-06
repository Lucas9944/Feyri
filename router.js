const express = require("express");
const router = express.Router();
const memberController = require("./controllers/memberController");
const productController = require("./controllers/productController");
const brandController = require("./controllers/brandController");
const orderController = require("./controllers/orderController");
const communityController = require("./controllers/communityController");
const uploader_community = require("./utils/upload-multer")("community");
const uploader_member = require("./utils/upload-multer")("members");

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
  brandController.getShops
);


router.get(
  "/shops/:id",
  memberController.retrieveAuthmember,
  brandController.getChosenShop
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
/*******************************
 *        END REST API         *
 *******************************/
module.exports = router;
