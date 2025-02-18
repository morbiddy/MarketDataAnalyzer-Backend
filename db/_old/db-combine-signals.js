"use strict";

const { MongoClient } = require('mongodb');
const { URI } = require('./constants');

/**
 * Combine signals[] with equal timestamp into new collection 'CombinedSignals.
 * Each document contains 2 or more signals[] 
 * 
 * @param {String} dbName
 */
async function combineSignals(dbName) {
    const client = new MongoClient(URI);
    try {
        await client.connect();
        console.log("Combine signals ....");

        const db = client.db(dbName);
        const signals = db.collection('Signals');        
        
        const pipeline = [
            {
                // Group the documents by 'timestamp' and accumulate the details into an array 'signals'.
                $group: {
                    _id: "$timestamp",
                    signals: {
                        $push: {
                            price: "$price",
                            action: "$action",
                            strategy: "$strategy",
                            motif: "$motif",
                            _id: "$_id"
                        }
                    }
                }
            },
            {
                $match: {
                    "signals.1": { $exists: true }  // if signals [1] exist => we have multiple signals at the given timestamp
                }
            },
            {
                $project: {                       // This stage formats the output
                    timestamp: "$_id",            // The timestamp is extracted from the _id field created by the $group stage
                    _id: 0,                       // _id field is excluded from the output
                    signals: 1                    // the nested signals array 
                }
            },
            {
                $out: "CombinedSignals"       // $out stage => output of the aggregation into new collection "CombinedSignals".
            }
        ];
        
        // Execute the aggregation pipeline
        await signals.aggregate(pipeline).toArray(); // // The `toArray` is just to trigger the pipeline
        
    } catch (error) {
        console.error(error);
        return 0;
    } finally {
        await client.close();
    }
}
module.exports = { combineSignals }