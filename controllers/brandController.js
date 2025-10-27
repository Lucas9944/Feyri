const Member = require("../models/Member");
let brandController = module.exports;

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

    res.json({ state: "succeed", data: new_member });
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

    res.json({ state: "succeed", data: result });
  } catch (err) {
    console.log(`ERROR, cont/loginProcess, ${err.message}`);
    res.json({ state: "fail", message: err.message });
  }
};

brandController.logout = (req, res) => {
  console.log("GET. cont.logout");
  res.send("logout sahifasidasiz123");
};