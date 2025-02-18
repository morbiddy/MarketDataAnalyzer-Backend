"use strict";

const { MongoClient } = require('mongodb');
const strategies = require('./strategies.js');
const { URI } = require('./constants.js');
/**
 * To implement a strategies collection that uses the data from the indicators collection, 
 * you can follow a similar chunk-based approach to process the indicators efficiently. 
 * We'll define two trading strategies as examples: one based on Bollinger Bands and another on the Stochastic RSI. 
 * Each strategy will evaluate the indicators for trading signals (e.g., buy or sell conditions) and store the results in the strategies collection.
 * 
 * Strategy 1: Bollinger Bands
 *  Buy Signal: When the price crosses above the lower Bollinger Band.
 *  Sell Signal: When the price crosses below the upper Bollinger Band.
 * 
 * Strategy 2: Stochastic RSI
 *  Buy Signal: When the Stochastic RSI crosses above a certain threshold (e.g., 20).
 *  Sell Signal: When the Stochastic RSI crosses below a certain threshold (e.g., 80).
 * 
 * Implementation Steps:
 * 1. Query the Indicators Collection: Use a cursor to stream data from the indicators collection, sorted by time.
 * 2. Process in Chunks: Process the indicators in manageable chunks to evaluate the strategies efficiently.
 * 3. Evaluate Strategies: For each chunk, evaluate the conditions for buy and sell signals based on the strategies defined.
 * 4. Store Strategy Results: For each signal detected, store the result in the strategies collection with relevant information (e.g., signal type, timestamp, strategy used).
 * 
 * 
 * 
 * Notes:
 * Chunk Size: Determine the optimal chunk size through testing, based on memory usage and performance.
 * Strategy Logic: The buy and sell conditions in the strategies are simplified for illustration. Adjust the logic according to your actual trading strategy requirements.
 * Overlap: Depending on the strategy, you might need to consider an overlap between chunks to ensure that signals are not missed at the boundaries.
 * Performance Optimization: Monitor the performance and adjust the implementation as necessary. For very large datasets, consider using more advanced techniques like parallel processing or distributed computing.
 * This example provides a basic framework for evaluating trading strategies based on indicator data. You should tailor the strategy logic, chunk processing, and performance optimizations to fit your specific use case and dataset size.
 * 
 */

/**
 * Iterate over the collection 'Indicators' and find all possible signals
 * Write found signals to collection 'Signals' 
 * @param {String} dbName
 */
async function processSignals(dbName) {
    const client = new MongoClient(URI);
    try {
        await client.connect();
        console.log("Find all signals ...");

        const db = client.db(dbName);        
        const dataCursor = db.collection('Indicators').find({}).sort({ timestamp: 1 });

        const chunkSize = 1000;    // Adjust based on memory constraints and indicator requirements
                
        let chunk = [];

        for await (const doc of dataCursor) {               // iterate over the indicator collection
            chunk.push(doc);                                // add each indicator to the current chunk    
            if (chunk.length >= chunkSize) {                // if chunk is filled?

                let newSignals = findSignals(chunk);        // 
                
                if(newSignals.length > 0){                  // If newSignals write them to Signals collection                    
                     await db.collection('Signals').insertMany(newSignals);                     
                }
                chunk = [];                                 // Reset indicators for the next batch
            }
        }

        // Process any remaining indicators in the last chunk
        if (chunk.length > 0) {

            let newSignals = findSignals(chunk);

            if(newSignals.length > 0 ){
                await db.collection('Signals').insertMany(newSignals);                
            }                
        }

    } catch (err) {
        console.error("An error occurred while processing signals:\n", err);
    } finally {
        await client.close();
    }
}
module.exports = { processSignals };

function findSignals(indicators) {   // Find signals in chunk of indicators 
    
    let newSignals = [];

    for (let i = 0; i < indicators.length; i++) {        
        const signals = strategies.evaluate(indicators[i]);

        for(const signal of signals){
            newSignals.push(signal);
        }        
    }
    return newSignals;
}

