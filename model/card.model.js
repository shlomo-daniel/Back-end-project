const Joi = require("joi");
const mongoose = require("mongoose");
const _ = require("lodash");

const cardSchema = new mongoose.Schema({
  bizName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 255,
  },
  bizDescription: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 500,
  },
  bizAddress: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 255,
  },
  bizPhone: {
    type: String,
    required: true,
    minlength: 9,
    maxlength: 10,
  },
  bizImage: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 500,
  },
  bizNumber: {
    type: Number,
    required: true,
    min: 100,
    max: 3_999_999_999,
    unique: true,
  },
});

const Card = mongoose.model("Card", cardSchema, "cards");

function validateCard(card) {
  const schema = Joi.object({
    title: Joi.string().min(2).max(50).required(),
    subtitle: Joi.string().min(2).max(70).required(),
    description: Joi.string().min(2).max(400).required(),
    phone: Joi.string().min(9).max(11).required(),
    email: Joi.string().min(2).max(255).email().required(),
    web: Joi.string().min(5).max(255),
    image: {
      url: Joi.string().min(2).max(500),
      alt: Joi.string().min(2).max(100),
    },
    address: {
      state: Joi.string().min(2).max(255).required(),
      country: Joi.string().min(2).max(255),
      city: Joi.string().min(2).max(255),
      street: Joi.string().min(2).max(255),
      houseNumber: Joi.number().min(2).max(10),
      zip: Joi.number().min(2).max(15),
    },
    likes: [],
  });
  return schema.validate(card);
}

async function generateBizNumber() {
  while (true) {
    const random = _.random(100, 9_999_999_999);
    const card = await Card.find({ bizNumber: random });

    if (!card) {
      return random;
    }
  }
}

module.exports = { Card, validateCard, generateBizNumber };
