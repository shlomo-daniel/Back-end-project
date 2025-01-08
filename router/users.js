const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const _ = require("lodash");
const jwt = require("jsonwebtoken");

const { User, validateUser } = require("../model/users.schema");

router.post("/", async (req, res) => {
  // validate input
  const { error } = validateUser(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  // valitate system
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    res.status(400).send("user is already created");
    return;
  }

  // process
  user = await new User(req.body);
  user.password = await bcrypt.hash(user.password, 12);

  await user.save();

  // response
  res.json(_.pick(user, ["_id", "name", "email"]));
});

// log in router ---
router.post("/login", async (req, res) => {
  let user;
  // valitate system
  try {
    user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(400).send("no user");
      return;
    }
  } catch (e) {
    res.send(e);
  }
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) {
    res.status(400).send("unvalid password");
  }
  const token = jwt.sign({ _id: user._id, biz: user.biz }, config.jwtKey);
  res.json({ token });
});
// validate input

// process
// what to return
// token

// response

module.exports = router;
