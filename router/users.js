const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const authMW = require("../middleware/auth.middleware");
const config = require("../config/auth.config");
const { User, validateUser } = require("../model/users.schema");

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
    res.status(400).send("user has already neen created");
    return;
  }

  // process
  user = await new User(req.body);
  user.password = await bcrypt.hash(user.password, 12);

  await user.save();

  // response
  res.json(_.pick(user, ["_id", "name", "email"]));
});

// log in
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

// admin - get all users
router.get("/", authMW, async (req, res) => {
  const { admin } = req.user;

  if (!admin) {
    res.status(403).send("unauthorized, you are not an admin");
  }

  const users = await User.find({}, { password: 0, __v: 0 });
  res.send(users);
});

// get one user
router.get("/:id", authMW, async (req, res) => {
  const { id: userId } = req.params;

  try {
    const user = await User.findOne({ _id: userId }, { __v: 0, password: 0 });

    if (!user) {
      res.status(400).send("user is not found");
      return;
    }

    res.send(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// edit user
router.put("/:id", authMW, async (req, res) => {
  const { id: paramId } = req.params;

  try {
    const userData = await User.findOne(
      { _id: paramId },
      { _id: 0, __v: 0, createdAt: 0 }
    );

    if (paramId !== req.user._id) {
      res.status(401).send("unauthorized to edit user");
      return;
    }

    const userDataObj = userData.toObject();
    const updatedUser = { ...userDataObj, ...req.body };

    const { error } = validateUser(updatedUser);
    if (error) {
      res.status(400).send(error.details[0].message);
      return;
    }

    const user = await User.findByIdAndUpdate(paramId, updatedUser, {
      new: true,
    });

    res.json(_.pick(user, ["_id", "name", "email"]));
  } catch (error) {
    res.status(500).send("error in server");
  }
});

// edit user's business status value
router.patch("/:id", authMW, async (req, res) => {
  const { id: paramId } = req.params;

  try {
    const userData = await User.findOne(
      { _id: paramId },
      { _id: 0, __v: 0, createdAt: 0 }
    );

    if (paramId !== req.user._id) {
      res.status(401).send("unauthorized to edit user");
      return;
    }

    const bizStatus = req.body.biz;
    const userDataObj = userData.toObject();
    const updatedUser = { ...userDataObj, biz: bizStatus };

    const { error } = validateUser(updatedUser);
    if (error) {
      res.status(400).send(error.details[0].message);
      return;
    }

    const user = await User.findByIdAndUpdate(paramId, updatedUser, {
      new: true,
    });

    res.json(_.pick(user, ["_id", "name", "email", "biz"]));
  } catch (error) {
    res.status(500).send("error in server");
  }
});

// user - delete user
router.delete("/:id", authMW, async (req, res) => {
  const { id: paramId } = req.params;

  const { admin } = req.user;

  if (!admin || paramId !== req.user._id) {
    res.status(401).send("unauthrized to delete user");
  }

  const userToDelete = await User.findByIdAndDelete(paramId, {
    __v: 0,
    password: 0,
  });

  res.send(`${userToDelete?.name ?? "no user"} deleted`);
});

module.exports = router;
