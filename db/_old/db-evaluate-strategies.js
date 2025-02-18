"use strict"


/**
 * To implement trading strategies based on indicators calculated in the previous steps, you would typically follow these steps:
 * 1. Define Strategies: Clearly define the trading strategies you want to implement. For example, a simple moving average crossover strategy 
 *    or a strategy that involves Bollinger Bands.
 * 2. Access Indicator Data: Query the indicator data from the Indicators collection, which you populated in the previous steps. 
*     This data will be used to make trading decisions based on your strategies.
 * 3. Evaluate Strategies: For each piece of indicator data, evaluate your trading strategies. This involves checking whether the conditions 
 *    for a trade (entry or exit) are met according to the strategy rules.
 * 4. Store Strategy Decisions: For each evaluation, store the decision (e.g., buy, sell, hold) along with 
 *    relevant information (like the date, indicator values, and decision rationale) in a Strategies collection.
 * 5. Considering the large amount of data, you'll continue using a chunk-based approach to process the data in manageable segments.
 * 
 * Example Implementation
 * Suppose you have two strategies:
 * Strategy A: Enter (buy) when the closing price crosses above the EMA, and exit (sell) when it crosses below.
 * Strategy B: Enter (buy) when the lower Bollinger Band is breached, and exit (sell) when the upper band is breached.
 * 
 * 
 * Notes:
 * Chunk Size: The chunkSize determines how many indicator documents are processed in memory at a time. 
 * Adjust this based on your system's memory capacity and the complexity of your strategies.
 * 
 * Strategy Evaluation: evaluateStrategyA and evaluateStrategyB are placeholder functions where you would implement the actual logic 
 * of your trading strategies. This involves comparing indicator values to determine whether to make a buy, sell, or hold decision.
 * 
 * Storing Decisions: The storeDecisions function inserts the decisions into the Strategies collection in your MongoDB database. 
 * This collection can then be used to review the decisions made by your strategies and, if connected to a trading system, 
 * to execute trades based on these decisions.
 * 
 * This implementation keeps the data processing manageable by working in chunks and only keeping a small portion of the data in memory at any given time, 
 * similar to the approach used for calculating indicators.} chunkSize 
 */

/**
 * 
 * @param {Number} chunkSize 
 */
async function evaluateStrategies(chunkSize) {
    const cursor = indicatorCollection.find({}).sort({ timestamp: 1 });
    let chunk = [];

    for await (const indicator of cursor) {
        chunk.push(indicator);
        if (chunk.length >= chunkSize) {
            const decisions = evaluateChunk(chunk);
            await storeDecisions(decisions);
            chunk = []; // Reset chunk for next set of indicators
        }
    }

    // Process the last chunk if it's not empty
    if (chunk.length > 0) {
        const decisions = evaluateChunk(chunk);
        await storeDecisions(decisions);
    }
}

function evaluateChunk(chunk) {
    let decisions = [];
    
    for (let i = 0; i < chunk.length; i++) {
        let decisionA = evaluateStrategyA(chunk[i]);
        let decisionB = evaluateStrategyB(chunk[i]);

        if (decisionA) decisions.push(decisionA);
        if (decisionB) decisions.push(decisionB);
    }

    return decisions;
}

function evaluateStrategyA(indicator) {
    // Example logic for Strategy A
    if (indicator.close > indicator.EMA) {
        return { time: indicator.time, decision: 'buy', strategy: 'A', rationale: 'Close above EMA' };
    } else if (indicator.close < indicator.EMA) {
        return { time: indicator.time, decision: 'sell', strategy: 'A', rationale: 'Close below EMA' };
    }
    // Return null or similar if no decision is made
    return null;
}

function evaluateStrategyB(indicator) {
    // Example logic for Strategy B
    if (indicator.close < indicator.lowerBollingerBand) {
        return { time: indicator.time, decision: 'buy', strategy: 'B', rationale: 'Close below lower BB' };
    } else if (indicator.close > indicator.upperBollingerBand) {
        return { time: indicator.time, decision: 'sell', strategy: 'B', rationale: 'Close above upper BB' };
    }
    // Return null or similar if no decision is made
    return null;
}

async function storeDecisions(decisions) {
    if (decisions.length > 0) {
        await strategiesCollection.insertMany(decisions);
    }
}

// Calling the function to start the evaluation
evaluateStrategies(5000); // Chunk size can be adjusted based on performance
