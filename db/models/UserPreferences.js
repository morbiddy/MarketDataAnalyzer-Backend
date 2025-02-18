const mongoose = require("mongoose");

const userPreferencesSchema = new mongoose.Schema({
    user: { type: String, required: true, unique: true },
    market: { type: String, default: "XBTEUR" },
    interval: { type: Number, default: 15 },
    from: { type: Date, default: new Date(2023, 10, 1) },
    to: { type: Date, default: new Date(2023, 11, 1) },
    zoomLevel: { start: Number, end: Number },
    indicators: [{ name: String, active: Boolean, color: String }],
});

module.exports = mongoose.model("UserPreferences", userPreferencesSchema);