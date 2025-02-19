const mongoose = require("../config/database");

const marketDataSchema = new mongoose.Schema({
    timestamp: Date,
    time: String,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
    count: Number,
    indicatorData: Object,
});

module.exports = mongoose.model("Marketdata", marketDataSchema);