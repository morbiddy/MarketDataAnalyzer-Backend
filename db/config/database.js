const mongoose = require("mongoose");
require("dotenv").config(); // load environment variables from .env

const URI = process.env.MONGO_URI;

mongoose.connect(URI);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

module.exports = mongoose;