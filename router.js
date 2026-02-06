const express = require("express");
const router = express.Router();
const memberController = require("./controllers/memberController");
const productController = require("./controllers/productController");
const brandController = require("./controllers/brandController");

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

module.exports = router;
