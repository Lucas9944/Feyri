const express = require("express");
const router_bssr = express.Router();
const brandController = require("./controllers/brandController");

/*******************************
 *           BSSR EJS          *
 *******************************/

router_bssr.get("/signup", brandController.getSignupMyBrand);
router_bssr.post("/signup", brandController.signupProcess);

router_bssr.get("/login", brandController.getLoginMyBrand);
router_bssr.post("/login", brandController.loginProcess);

router_bssr.get("/logout", brandController.logout);

module.exports = router_bssr;