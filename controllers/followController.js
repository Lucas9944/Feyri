let followController = module.exports;
const Definer = require("../lib/mistake");
const assert = require("assert");
const Community = require("../models/Community");
const Follow = require("../models/Follow");

followController.subscribe = async (req, res) => {
  try {
    console.log("POST: cont/subscribe");
    assert.ok(req.member, Definer.auth_err5);
    const follow = new Follow();
    await follow.subscribeData(req.member, req.body);
    res.json({ state: "success", data: "subscribed" });
  } catch (err) {
    console.log(`ERROR, cont/subscribe,${err.message}`);
    res.json({ state: "fail", message: err.message });
  }
};

followController.unsubscriber = async (req, res) => {
  try {
    console.log("POST: cont/unsubscriber");
    assert.ok(req.member, Definer.auth_err5);
    const follow = new Follow();
    await follow.unsubscriberData(req.member, req.body);
    res.json({ state: "success", data: "unsubscribed" });
  } catch (err) {
    console.log(`ERROR, cont/subscribe,${err.message}`);
    res.json({ state: "fail", message: err.message });
  }
};

followController.getMemberFollowings = async (req, res) => {
  try {
    console.log("GET: cont/getMemberFollowings");
    const follow = new Follow();
    const result = await follow.getMemberFollowingsDAta(req.query);
    assert.ok(result, Definer.auth_err5);
    res.json({ state: "success", data: result });
  } catch (err) {
    console.log(`ERROR, cont/getMemberFollowings,${err.message}`);
    res.json({ state: "fail", message: err.message });
  }
};

followController.getMembeFollowers = async (req, res) => {
  try {
    console.log("GET: cont/getMembeFollowers");
    const follow = new Follow();
    const result = await follow.getMembeFollowersData(req.member, req.query);
    assert.ok(result, Definer.auth_err5);
    res.json({ state: "success", data: result });
  } catch (err) {
    console.log(`ERROR, cont/subscribe,${err.message}`);
    res.json({ state: "fail", message: err.message });
  }
};
