const MarketData = require("../models/MarketData");
const { getUserPreferences } = require("./userPreferencesService");
const mongoose = require("mongoose");
const { StochasticRSI, BollingerBands, EMA, MACD } = require("technicalindicators");

const indicatorParams = {
    stochasticRsiParams: { rsiPeriod: 14, stochasticPeriod: 14, kPeriod: 3, dPeriod: 3 },
    bollingerBandsParams: { period: 20, stdDev: 2 },
    macdParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    emaParams: { period1: 9, period2: 21, period3: 50, period4: 100 },
};

async function processIndicators(dbName) {
    try {
        console.log(`Processing indicators for ${dbName}...`);

        const db = mongoose.connection.useDb(dbName);
        const marketCollection = db.collection("Marketdata");
        const indicatorCollection = db.collection("Indicators");

        const cursor = marketCollection.find({}).sort({ timestamp: 1 });

        const chunkSize = 100000;
        let overlap = 200;

        let chunk = [];
        let previousChunkLastElements = [];

        for await (const doc of cursor) {
            if (chunk.length < chunkSize) {
                chunk.push(doc);
            } else {
                await storeIndicators(indicatorCollection, previousChunkLastElements.concat(chunk));
                previousChunkLastElements = chunk.slice(-overlap);
                chunk = [doc];
            }
        }

        if (chunk.length > 0) {
            await storeIndicators(indicatorCollection, previousChunkLastElements.concat(chunk));
        }

        console.log("Indicators processing complete.");
    } catch (err) {
        console.error("Error in processIndicators:", err);
    }
}

async function storeIndicators(collection, chunk) {
    const indicators = calculateIndicators(chunk);
    if (indicators.length > 0) {
        await collection.insertMany(indicators);
    }
}

function calculateIndicators(chunk) {
    const closePrices = chunk.map((doc) => doc.close);

    const stochRsi = StochasticRSI.calculate({ values: closePrices, ...indicatorParams.stochasticRsiParams });
    const bollingerBands = BollingerBands.calculate({ values: closePrices, ...indicatorParams.bollingerBandsParams });
    const macd = MACD.calculate({ values: closePrices, SimpleMAOscillator: true, SimpleMASignal: true, ...indicatorParams.macdParams });
    const ema1 = EMA.calculate({ values: closePrices, period: indicatorParams.emaParams.period1 });
    const ema2 = EMA.calculate({ values: closePrices, period: indicatorParams.emaParams.period2 });
    const ema3 = EMA.calculate({ values: closePrices, period: indicatorParams.emaParams.period3 });
    const ema4 = EMA.calculate({ values: closePrices, period: indicatorParams.emaParams.period4 });

    let indicators = [];
    for (let i = 0; i < chunk.length; i++) {
        if (i < chunk.length - Math.min(stochRsi.length, bollingerBands.length, macd.length, ema1.length, ema2.length, ema3.length, ema4.length)) {
            continue;
        }
        indicators.push({
            timestamp: chunk[i].timestamp,
            ema1: ema1[i - (chunk.length - ema1.length)],
            ema2: ema2[i - (chunk.length - ema2.length)],
            ema3: ema3[i - (chunk.length - ema3.length)],
            ema4: ema4[i - (chunk.length - ema4.length)],
            stochRsi: stochRsi[i - (chunk.length - stochRsi.length)],
            bollingerBands: bollingerBands[i - (chunk.length - bollingerBands.length)],
            macd: macd[i - (chunk.length - macd.length)],
        });
    }

    return indicators;
}

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

module.exports = { processIndicators, chartData };
