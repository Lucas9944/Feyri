const Member = require("../models/Member");
const Product = require("../models/Product");

let brandController = module.exports;

brandController.home = (req, res) => {
    try {
      console.log("GET: cont/home");
      res.render("home-page");
    } catch (err) {
      console.log(`ERROR, cont/home, ${err.message}`);
      res.json({ state: "fail", message: err.message });
    }
  };
  
brandController.getMyBrandProducts = async (req, res) => {
  try {
    console.log("GET: const/getMyBrandProducts");
    // TODO: Get my brand products
    const product = new Product();
    const data = await product.getAllProductsDataResto(res.locals.member);
    
    res.render("brand-menu");
  } catch (err) {
    console.log(`ERROR, cont/getMyBrandProducts, ${err.message}`);
    res.json({ state: "fail", message: err.message });
  }
};

brandController.getSignupMyBrand = async (req, res) => {
  try {
    console.log("GET: const/getSignupMyBrand");
    res.render("signup");
  } catch (err) {
    console.log(`ERROR, cont/getSignupMyBrand, ${err.message}`);
    res.json({ state: "fail", message: err.message });
  }
};
brandController.signupProcess = async (req, res) => {
  try {
    console.log("POST: const/signupProcess");
    const data = req.body,
      member = new Member(),
      new_member = await member.signupData(data);

    req.session.member = new_member;
    res.redirect("/feyri/products/menu");
  } catch (err) {
    console.log(`ERROR, cont/signupProcess, ${err.message}`);
    res.json({ state: "fail", message: err.message });
  }
};

brandController.getLoginMyBrand = async (req, res) => {
  try {
    console.log("GET: const/getLoginMyBrand");
    res.render("login-page");
  } catch (err) {
    console.log(`ERROR, cont/getLoginMyBrand, ${err.message}`);
    res.json({ state: "fail", message: err.message });
  }
};

brandController.loginProcess = async (req, res) => {
  try {
    console.log("POST: const/loginProcess");
    const data = req.body,
      member = new Member(),
      result = await member.loginData(data);

    req.session.member = result;
    req.session.save(function () {
      res.redirect("/feyri/products/menu");
    });
  } catch (err) {
    console.log(`ERROR, cont/loginProcess, ${err.message}`);
    res.json({ state: "fail", message: err.message });
  }
};

brandController.logout = (req, res) => {
  console.log("GET. cont.logout");
  res.send("logout sahifasidasiz123");
};

brandController.validateAuthBrand = (req, res, next) => {
  if (req.session?.member?.mb_type === "BRAND") {
    req.member = req.session.member;
    next();
  } else
    res.json({
      state: "fail",
      message: "only authenticated members with brand type",
    });
};

brandController.checkSessions = (req, res) => {
  if (req.session?.member) {
    res.json({ state: "succeed", data: req.session.member });
  } else {
    res.json({ state: "fail", message: "You are not authenticated" });
  }
};
