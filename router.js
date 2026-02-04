const express = require("express");
const router = express.Router();
const memberController = require("./controllers/memberController");
const productController = require("./controllers/productController");

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


// others || boshqa routerlar
router.get("/menu", (req, res) => {
  res.send("Menu sahifadasiz");
});

router.get("/community", (req, res) => {
  res.send("Jamiyat sahifasidasiz");
});

module.exports = router;
