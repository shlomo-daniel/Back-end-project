require("dotenv").config();

const PORT = 3005;
const express = require("express");
const app = express();
const cors = require("./middleware/cors.middleware");
const mongoose = require("mongoose");

const authRouter = require("./router/auth");
const usersRouter = require("./router/users");
const cardsRouter = require("./router/cards");

app.use(cors);
app.use(require("morgan")("dev"));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/cards", cardsRouter);

connect();

async function connect() {
  try {
    await mongoose.connect(
      "mongodb+srv://Dani:learndb777@cluster0.fntrq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("connected to db");
    app.listen(PORT, console.log(`listening to port ${PORT}`));
  } catch (e) {
    console.log("failed to connect to db", e.message);
  }
}
