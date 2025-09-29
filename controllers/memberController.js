const Member = require("../models/Member");
let memberController = module.exports;

memberController.signup = async (req, res) => {
  try {
    console.log("POST: const/signup");
    const data = req.body;
    const member = new Member();
    const new_member = await member.signupData(data);

    res.send("done");
  } catch (err) {
    console.log(`ERROR, cont/signup, ${err.message}`);
  }
};

memberController.login = (req, res) => {
  console.log("POST. cont.login");
  res.send("login sahifasidasiz123");
};

memberController.logout = (req, res) => {
  console.log("GET. cont.logout");
  res.send("logout sahifasidasiz123");
}; 