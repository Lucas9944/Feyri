const express = require("express");
const router_bssr = express.Router();
const brandController = require("./controllers/brandController");
const productController = require("./controllers/productController");

/*******************************
 *           BSSR EJS          *
 *******************************/

router_bssr
  .get("/signup", brandController.getSignupMyBrand)
  .post("/signup", brandController.signupProcess);

router_bssr
  .get("/login", brandController.getLoginMyBrand)
  .post("/login", brandController.loginProcess);
router_bssr.get("/logout", brandController.logout);
router_bssr.get("/check-me", brandController.checkSessions);

router_bssr.get("/products/menu", brandController.getMyBrandData);
router_bssr.post(
  "/products/create",
  brandController.validateAuthBrand,
  productController.addNewProduct
);
router_bssr.post("/products/edit/:id", productController.updateChosenProduct);

module.exports = router_bssr;
