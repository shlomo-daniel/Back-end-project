const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");

const config = require("../config/auth.config");

const { User, validateUser } = require("../model/users.schema");
const { options } = require("joi");

//create user
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

// admin - get all users
router.get("/", (req, res) => {
  const token = req.header("x-auth-token");

  const user = jwt.decode(token);
  console.log(user);

  // if (req.header.x -auth-token !== true) {
  //   res.status(401).json({ error: "user is not admin, unauthorized" });
  //   return;
  // }
});

router.post("/login", async (req, res) => {
  let user;

  try {
    user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(401).send("no user");
      return;
    }
  } catch (e) {
    res.send(e);
  }
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) {
    res.status(401).send("invalid password");
  }
  const token = jwt.sign(
    { _id: user._id, biz: user.biz, admin: Boolean(user.admin) },
    config.jwtKey
  );
  res.json({ token });
});

// admin - get - array of users

module.exports = router;
