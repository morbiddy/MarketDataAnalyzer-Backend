"use strict";

const { MongoClient } = require('mongodb');
const { StochasticRSI, BollingerBands, EMA, MACD } = require('technicalindicators');
const { URI } = require('./constants');

/**
 * @param {String} dbName 
 */
async function processIndicators(dbName) {
    //return;
    const client = new MongoClient(URI);
    try {
        await client.connect();
        console.log("Process indicators ....");

        const db = client.db(dbName);

        const marketData = db.collection('Marketdata').find({}).sort({ timestamp: 1 });

        const chunkSize = 100000;  // Adjust based on memory constraints and indicator requirements
        let overlap = 200;         // Overlap size for moving indicators

        let chunk = [];
        let previousChunkLastElements = [];
        const collection = db.collection('Indicators');

        for await (const doc of marketData) {

            if (chunk.length < chunkSize) {
                chunk.push(doc);
            } else {
                // Process the chunk
                let combinedChunk = previousChunkLastElements.concat(chunk);
                let indicators = calculateIndicators(combinedChunk, indicatorParams);

                // Store indicators in MongoDB
                await collection.insertMany(indicators);

                // Prepare for the next chunk
                previousChunkLastElements = chunk.slice(-overlap);      // copy (amount of overlap) of last values to prevChunkLastElements
                chunk = [doc];          // make sure shunk = last doc
            }
        }

        // Process the last chunk if it exists
        if (chunk.length > 0) {
            let combinedChunk = previousChunkLastElements.concat(chunk);
            let indicators = calculateIndicators(combinedChunk, indicatorParams);
            // Store indicators in MongoDB
            await collection.insertMany(indicators);
        }

    } catch (err) {
        console.error("An error occurred:", err);
    } finally {
        await client.close();
    }
}
module.exports = { processIndicators };

// TO DO: move object to db. Under user preferences. So they can be updated through frontend user.
const indicatorParams = {
    "stochasticRsiParams": {
        "rsiPeriod": 14,
        "stochasticPeriod": 14,
        "kPeriod": 3,
        "dPeriod": 3
    },
    "bollingerBandsParams": {
        "period": 20,
        "stdDev": 2
    },
    "macdParams": {
        "fastPeriod": 12,
        "slowPeriod": 26,
        "signalPeriod": 9
    },
    "emaParams": {
        "period1": 9,
        "period2": 21,
        "period3": 50,
        "period4": 100    
    }
    //"emaPeriods": [9, 21, 50, 100]
};

function calculateIndicators(chunk, params) {
    // Extract close prices
    const closePrices = chunk.map(doc => doc.close);

    // Calculate Stochastic RSI
    const stochRsi = StochasticRSI.calculate({
        values: closePrices,
        ...params.stochasticRsiParams
    });

    // Calculate Bollinger Bands
    const bollingerBands = BollingerBands.calculate({
        values: closePrices,             
        ...params.bollingerBandsParams
    });

    // Calculate MACD
    const macd = MACD.calculate({
        values: closePrices,
        SimpleMAOscillator: true,
        SimpleMASignal: true,
        ...params.macdParams
    });

    // Calculate EMAs with different periods
    //let emas = params.emaPeriods.map(period => EMA.calculate({ period, values: closePrices}));
    const ema1 = EMA.calculate({ 
        values: closePrices,
        period: params.emaParams.period1 
    });
    const ema2 = EMA.calculate({ 
        values: closePrices,
        period: params.emaParams.period2
    });
    const ema3 = EMA.calculate({ 
        values: closePrices,
        period: params.emaParams.period3
    });
    const ema4 = EMA.calculate({ 
        values: closePrices,
        period: params.emaParams.period4
    });

    // Combine and align indicator values with timestamps
    // Note: Handle initial undefined values due to indicator warm-up periods
    let indicators = [];
    for (let i = 0; i < chunk.length; i++) {
        if (i < chunk.length - stochRsi.length ||
            i < chunk.length - bollingerBands.length ||
            i < chunk.length - macd.length ||
            i < chunk.length - ema1.length ||
            i < chunk.length - ema2.length ||
            i < chunk.length - ema3.length ||
            i < chunk.length - ema4.length) {
            continue;  // Skip initial undefined values
        }
        indicators.push({
            price: closePrices[i],
            timestamp: chunk[i].timestamp,
            // shift => index - emaSize  ( total length - ema length = ema size => 1000 - 990 = 10)
            ema1: ema1[i - (chunk.length - ema1.length)],
            ema2: ema2[i - (chunk.length - ema2.length)],
            ema3: ema3[i - (chunk.length - ema3.length)],
            ema4: ema4[i - (chunk.length - ema4.length)],
            stochRsi: stochRsi[i - (chunk.length - stochRsi.length)],
            bollingerBands: bollingerBands[i - (chunk.length - bollingerBands.length)],
            macd: macd[i - (chunk.length - macd.length)]
        });
    }

    return indicators;
}

/*
function calculateIndicators(chunk) {
    // Extract close prices
    const closePrices = chunk.map(doc => doc.close);

    // Calculate Stochastic RSI
    const stochRsi = StochasticRSI.calculate({
        values: closePrices,
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3
    });

    // Calculate Bollinger Bands
    const bollingerBands = BollingerBands.calculate({
        period: 20,             // MA (moving average)
        values: closePrices,
        stdDev: 2               // standard deviation
    });

    // Calculate MACD
    const macd = MACD.calculate({
        values: closePrices,
        SimpleMAOscillator: true,
        SimpleMASignal: true,
        fastPeriod: 12,         // fast EMA
        slowPeriod: 26,         // slow EMA
        signalPeriod: 9         // signal line
    });

    // Calculate EMAs with different periods
    const ema1 = EMA.calculate({ period: 9, values: closePrices });
    const ema2 = EMA.calculate({ period: 21, values: closePrices });
    const ema3 = EMA.calculate({ period: 50, values: closePrices });
    const ema4 = EMA.calculate({ period: 100, values: closePrices });    

    // Combine and align indicator values with timestamps
    // Note: Handle initial undefined values due to indicator warm-up periods
    let indicators = [];
    for (let i = 0; i < chunk.length; i++) {
        if (i < chunk.length - stochRsi.length ||
            i < chunk.length - bollingerBands.length ||
            i < chunk.length - macd.length ||
            i < chunk.length - ema1.length ||
            i < chunk.length - ema2.length ||
            i < chunk.length - ema3.length ||
            i < chunk.length - ema4.length ) {
            continue;  // Skip initial undefined values
        }
        indicators.push({
            price: closePrices[i],
            timestamp: chunk[i].timestamp,            
            // shift => index - emaSize  ( total length - ema length = ema size => 1000 - 990 = 10)
            ema1: ema1[i - (chunk.length - ema1.length)],        
            ema2: ema2[i - (chunk.length - ema2.length)],
            ema3: ema3[i - (chunk.length - ema3.length)],
            ema4: ema4[i - (chunk.length - ema4.length)],
            stochRsi: stochRsi[i - (chunk.length - stochRsi.length)],
            bollingerBands: bollingerBands[i - (chunk.length - bollingerBands.length)],
            macd: macd[i - (chunk.length - macd.length)]
        });
    }

    return indicators;
}
*/