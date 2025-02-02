const express = require("express");
const router = express.Router();
const authMW = require("../middleware/auth.middleware");
const {
  validateCard,
  Card,
  generateBizNumber,
} = require("../model/card.model");

// get all cards
router.get("/", async (req, res) => {
  const allCards = await Card.find({});

  res.json(allCards);
});

// get all mycards
router.get("/my-cards", authMW, async (req, res) => {
  try {
    const user_id = req.user._id;
    const myCards = await Card.find({ user_id });

    res.send(myCards);
  } catch (error) {
    res.status(500).send({ error, message: "server error" });
  }
});

// find card by its id
router.get("/:id", async (req, res) => {
  try {
    const cardID = req.params.id;
    const foundCard = await Card.findById(cardID);
    console.log(foundCard);

    if (!foundCard) {
      res.status(404).send("card was not found");
      return;
    }

    res.send(foundCard);
  } catch (error) {
    res.status(500).send({ error, message: "server error" });
  }
});
// edit card
router.put("/:id", authMW, async (req, res) => {
  try {
    const cardID = req.params.id;
    const foundCard = await Card.findById(cardID, {
      _id: 0,
      user_id: 0,
      bizNumber: 0,
      __v: 0,
    });
    const foundCardObj = foundCard.toObject();

    const updatedCard = {
      ...foundCardObj,
      ...req.body,
    };

    const { error } = validateCard(updatedCard);
    if (error) {
      res.status(400).send(error.details[0].message);
      return;
    }

    const editedCard = await Card.findByIdAndUpdate(cardID, updatedCard, {
      new: true,
    });

    res.json(editedCard);
  } catch (error) {
    res.status(500).send({ error, message: "server error" });
  }
});

// delete card
router.delete("/:id", authMW, async (req, res) => {
  try {
    const { id: cardID } = req.params;
    const { admin, _id: userID } = req.user;
    const cardToDelete = Card.findById(cardID);
    const { user_id: user_id_in_card } = cardToDelete;

    if (userID !== user_id_in_card && !admin) {
      res.status(401).send("unauthrized to delete card");
      return;
    }

    const deletedCard = await Card.findByIdAndDelete(cardID);

    res.send(
      deletedCard
        ? `card with the id of ${deletedCard._id} was deleted`
        : "card was not found to delete"
    );
  } catch (error) {
    res.status(500).send({ error, message: "server error" });
  }
});

router.post("/", authMW, async (req, res) => {
  try {
    //   validate user's input
    const { error } = validateCard(req.body);
    if (error) {
      res.status(400).send(error.details[0].message);
      return;
    }

    // validate system
    if (!req.user.biz) {
      res.status(400).send("User must be of type business to create a card");
      return;
    }
    // process
    const card = await new Card({
      ...req.body,
      bizImage:
        req.body.bizImage ??
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
      user_id: req.user._id,
      bizNumber: await generateBizNumber(),
    }).save();
    // response
    res.json(card);
  } catch (error) {
    res.status(500).send({ error, message: "server error" });
  }
});

// like card
router.patch("/like/:id/", authMW, async (req, res) => {
  try {
    const { id: cardID } = req.params;
    const { _id: userID } = req.user;

    const likedCard = await Card.findByIdAndUpdate(
      cardID,
      {
        $addToSet: { likes: userID },
      },
      { new: true }
    );

    if (!likedCard) {
      res.status(404).send("card not found");
      return;
    }

    res.json(likedCard);
  } catch (error) {
    res.status(500).send({ error, message: "server error" });
  }
});

// remove like from card
router.patch("/unlike/:id", authMW, async (req, res) => {
  try {
    const { id: cardID } = req.params;
    const { _id: userID } = req.user;

    const likedCard = await Card.findByIdAndUpdate(
      cardID,
      {
        $pull: { likes: userID },
      },
      { new: true }
    );

    if (!likedCard) {
      res.status(404).send("card not found");
      return;
    }

    res.json(likedCard);
  } catch (error) {
    res.status(500).send({ error, message: "server error" });
  }
});

module.exports = router;
