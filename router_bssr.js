const express = require("express");
const router_bssr = express.Router();
const brandController = require("./controllers/brandController");
const productController = require("./controllers/productController");
const uploader_product = require("./utils/upload-multer")("products");
const uploader_members = require("./utils/upload-multer")("members");

/*******************************
 *           BSSR EJS          *
 *******************************/

router_bssr.get("/", brandController.home);

router_bssr
  .get("/signup", brandController.getSignupMyBrand)
  .post(
    "/signup",
    uploader_members.single("brand_img"),
    brandController.signupProcess
  );

router_bssr
  .get("/login", brandController.getLoginMyBrand)
  .post("/login", brandController.loginProcess);
router_bssr.get("/logout", brandController.logout);
router_bssr.get("/check-me", brandController.checkSessions);

router_bssr.get("/products/menu", brandController.getMyBrandProducts);
router_bssr.post(
  "/products/create",
  brandController.validateAuthBrand,
  uploader_product.array("product_images", 5),
  productController.addNewProduct
);
router_bssr.post(
  "/products/edit/:id",
  brandController.validateAuthBrand,
  productController.updateChosenProduct
);

module.exports = router_bssr;
