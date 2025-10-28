const express = require("express");
const router_bssr = express.Router();
const brandController = require("./controllers/brandController");

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

module.exports = router_bssr;
