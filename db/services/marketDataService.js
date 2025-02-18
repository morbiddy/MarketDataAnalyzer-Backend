const MarketData = require("../models/MarketData");
const { getUserPreferences } = require("./userPreferencesService");

async function chartData(user) {
    try {
        const prefs = await getUserPreferences(user);
        return await MarketData.aggregate([
            { $match: { timestamp: { $gte: prefs.from, $lt: prefs.to } } },
            { $sort: { timestamp: 1 } },
            {
                $lookup: {
                    from: "indicators",
                    localField: "timestamp",
                    foreignField: "timestamp",
                    as: "indicatorData",
                },
            },
            { $unwind: "$indicatorData" },
        ]);
    } catch (error) {
        console.error("Error in chartData:", error);
        throw error;
    }
}

module.exports = { chartData };
