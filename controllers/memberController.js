let memberController = module.exports;

memberController.home = (req, res) => {
  console.log("GET. cont.home");
  res.send("home sahifasidasiz123");
};

memberController.signup = (req, res) => {
  console.log("POST. cont.signup");
  res.send("signup sahifasidasiz123");
};

memberController.login = (req, res) => {
  console.log("POST. cont.login");
  res.send("login sahifasidasiz123");
};

memberController.logout = (req, res) => {
  console.log("GET. cont.logout");
  res.send("logout sahifasidasiz");
};