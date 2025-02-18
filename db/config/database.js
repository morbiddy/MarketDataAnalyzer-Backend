const mongoose = require("mongoose");
const { URI } = require("../constants");

mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

module.exports = db;