"use strict";

const { MongoClient } = require('mongodb');
const { URI } = require('../constants');
const { interval } = require('date-fns');

/**
 * 
 * @returns user preference object
 */
async function getUserPreferences(user) {
    const client = new MongoClient(URI);
    try {
        await client.connect();

        const db = client.db('USERS');

        const collection = db.collection('userPreferences');

        const result = await collection.findOne({ user: user });
        if (result) {
            return result;
        }
        else {
            // insert default user prefs into db
            //const userPreferences = ;

            await collection.insertOne({
                user: user,
                market: 'XBTEUR',
                interval: 15,
                from: new Date(2023, 10, 1),
                to: new Date(2023, 11, 1),
                zoomLevel: {start: 90, end: 100},
                indicators: [
                    {
                        name: 'ema1',
                        active: true,
                        color: '#18a404'
                    },
                    {
                        name: 'ema2',
                        active: true,
                        color: '#008080'
                    },
                    {
                        name: 'ema3',
                        active: false,
                        color: '#638484'
                    },
                    {
                        name: 'ema4',
                        active: true,
                        color: '#ffff80'
                    },
                    {
                        name: 'sK',
                        active: true,
                        color: '#A95643'
                    },
                    {
                        name: 'sD',
                        active: true,
                        color: '#4356A9'
                    },
                    {
                        name: 'bollingerBands',
                        active: false,
                        color: '#0080ff'
                    },
                    {
                        name: 'macd',
                        active: false,
                        color: '#A31567'
                    }
                ]
            });
            return await collection.findOne({ user: user });
        }

    } catch (error) {
        console.error('An error occured at getUserPreferences: ', error);
    } finally {
        await client.close();
    }
}
module.exports.getUserPreferences = getUserPreferences;

/**
 * 
 * @param {json} userPreference 
 */
async function setUserPreferences(prefs) {
    const client = new MongoClient(URI);
    try {
        await client.connect();
        const db = client.db('USERS');
        const collection = db.collection('userPreferences');

        const filter = { user: prefs.user };

        const updateDoc = {
            $set: {
                market: prefs.market,
                interval: prefs.interval,
                from: prefs.from,
                to: prefs.to,
                zoomLevel: prefs.zoomLevel,
                indicators: prefs.indicators
            }
        }

        const result = await collection.updateOne(filter, updateDoc);
        // Output the result of the update operation
        console.log(`${result.matchedCount} document(s) matched the filter, ${result.modifiedCount} document(s) was/were updated.`);
        return result.modifiedCount > 0 ? prefs.user + ' updated' : prefs.user + ' not found';

    } catch (error) {
        console.error('An error occured at setUserPreferences: ', error);
    } finally {
        await client.close();
    }
}
module.exports.setUserPreferences = setUserPreferences;

/**
 * 
 * @param {*} user 
 * @returns 
 */
async function chartData(user) {
    const client = new MongoClient(URI);

    // Change the global time zone to UTC
    process.env.TZ = 'UTC';

    try {

        const prefs = await getUserPreferences(user);
        const dbName = prefs.market + '_' + prefs.interval;

        await client.connect();

        const adminDB = client.db().admin();
        const { databases } = await adminDB.listDatabases();

        const dbExists = databases.some(db => db.name === dbName);

        if (!dbExists) {
            console.log(`Database ${dbName} does not exist.`);
            await client.close();
            // Revert to the system's default time zone
            delete process.env.TZ;
            return { name: dbName, exist: false };
        }

        const database = client.db(dbName);
        const marketData = database.collection("Marketdata");

        console.log('new Date(prefs.from): ', new Date(prefs.from));
        console.log('new Date(prefs.to): ', new Date(prefs.to));
        // Aggregation pipeline
        const pipeline = [
            {
                $match: {
                    timestamp: {
                        $gte: new Date(prefs.from),
                        $lt: new Date(prefs.to)
                    } // Filter documents starting from this timestamp
                }
            },
            {
                $sort: {
                    timestamp: 1                // Order by timestamp ascending 
                }
            },
            /*{
                $limit: days                  // Limit the number of documents
            },*/
            {
                $lookup: {
                    from: "Indicators",         // the collection to join
                    localField: "timestamp",    // field from the input documents
                    foreignField: "timestamp",  // field from the documents of the "from" collection
                    as: "indicatorData"         // output array field
                }
            },
            {
                $unwind: "$indicatorData"       // Optional: Flatten the indicatorData array
                // Treat each item of the array as a separate document in subsequent stages of the pipeline.
            },
            {
                $project: {                     // Optional: Specify the structure of the output documents
                    timestamp: 1,
                    time: "$time",
                    open: "$open",
                    high: "$high",
                    low: "$low",
                    close: "$close",
                    volume: "$volume",
                    count: "$count",
                    ema1: "$indicatorData.ema1",
                    ema2: "$indicatorData.ema2",
                    ema3: "$indicatorData.ema3",
                    ema4: "$indicatorData.ema4",
                    bbUpper: "$indicatorData.bollingerBands.upper",
                    bbMiddle: "$indicatorData.bollingerBands.middle",
                    bbLower: "$indicatorData.bollingerBands.lower",
                    sRsi: "$indicatorData.stochRsi.stochRSI",
                    sK: "$indicatorData.stochRsi.k",
                    sD: "$indicatorData.stochRsi.d"
                    // Add other fields you need from both collections
                }
            }
            // You can add more stages here as needed
        ];
        const result = await marketData.aggregate(pipeline).toArray();
        if (result.length !== 0) {
            return { name: dbName, exist: true, data: result };
        }
        else {
            return { name: dbName, exist: true, data: false };
        }

    } catch (error) {
        console.error(error);
        return 0;

    } finally {
        await client.close();
        // Revert to the system's default time zone
        delete process.env.TZ;
    }
}
module.exports.chartData = chartData;

/**
 * Queries documents from a MongoDB collection starting from a specified start date.
 * The function connects to the MongoDB using the provided database information,
 * constructs a query to find documents where the timestamp is greater than or equal to the start date,
 * and returns the matching documents.
 * 
 * @param {String} startDate An ISO 8601 date string (e.g., '2023-10-01T18:15:00.000Z') that specifies the starting point
 * @returns {Promise<Array>} A promise that resolves to an array of documents that match the query criteria.
 */
async function documents(user, collection) {
    const client = new MongoClient(URI);

    // Change the global time zone to UTC
    process.env.TZ = 'UTC';

    try {

        const prefs = await getUserPreferences(user);
        const dbName = prefs.market + '_' + prefs.interval;

        await client.connect();

        const adminDB = client.db().admin();
        const { databases } = await adminDB.listDatabases();

        const dbExists = databases.some(db => db.name === dbName);

        if(!dbExists){
            console.log(`Database ${dbName} does not exist.`);
            await client.close();
            // Revert to the system's default time zone
            delete process.env.TZ;
            return { name: dbName, exist: false};
        }

        const database = client.db(dbName);        
        
        // Query for documents starting from the given date
        const query = { timestamp: { $gte: new Date(prefs.from), $lt: new Date(prefs.to) } };
        const options = { sort: { timestamp: 1 } };

        const cursor = database.collection(collection).find(query, options);

        const documents = [];
        for await (const doc of cursor) {
            documents.push(doc);
        }
        console.log('return ' + documents.length + ' documents from ' + collection);
        return documents;

    } catch (error) {
        console.error(error);
        return 0; //res.status(500).send('Error querying the database');
    } finally {
        await client.close();
    }
}
module.exports.documents = documents;

async function documentsByMonth(dbName, collection, year, month) {
    const client = new MongoClient(URI);

    // Change the global time zone to UTC
    process.env.TZ = 'UTC';

    try {
        await client.connect();
        const database = client.db(dbName);

        // Start of month in UTC  => month index 0-11
        const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
        const endOfMonth = new Date(year, month, 1, 0, 0, 0);

        const query = {
            timestamp: {
                $gte: startOfMonth,
                $lt: endOfMonth
            }
        };
        const options = {
            sort: { timestamp: 1 }
        };

        const cursor = database.collection(collection).find(query, options);

        const documents = [];

        for await (const doc of cursor) {
            documents.push(doc);
        }

        return documents;

    } catch (error) {
        console.error(error);
        return 0; //res.status(500).send('Error querying the database');
    } finally {
        await client.close();
        // Revert to the system's default time zone
        delete process.env.TZ;
    }
}
module.exports.documentsByMonth = documentsByMonth;


/**
 * Counts the documents in each collection of a MongoDB database.
 * 
 * @param {String} dbName - The database info: URI, name.
 * @returns {Promise<Object>} A promise that resolves to an object where keys are collection names and values are document counts.
 */
async function countDocumentsInAllCollections(dbName) {
    const client = new MongoClient(URI);
    try {
        // Connect to the MongoDB client
        await client.connect();

        // Connect to the specified database
        const db = client.db(dbName);

        // Get all collections in the database
        const collections = await db.listCollections().toArray();
        const counts = [];

        // Iterate over each collection to count documents
        for (const collection of collections) {
            const collectionName = collection.name;
            const count = await db.collection(collectionName).countDocuments();
            counts.push({ collection: collectionName, count: count });
        }
        return counts;

    } catch (error) {
        console.error("An error occurred while counting documents in collections:", error);
        throw error; // Rethrow the error for further handling if needed
    } finally {
        // Ensure the client is closed when done
        await client.close();
    }
}
module.exports.countDocumentsInAllCollections = countDocumentsInAllCollections;


/**
 * Get the size and count of documents of all collections in database.
 *
 * @param {String} dbName 
 * @param {string} collectionName
 * @returns {Promise<Object>} A promise that resolves to an object containing size information about the collection.
 */
async function collectionsInfo(dbName) {
    const client = new MongoClient(URI);
    try {
        // Connect to the MongoDB client
        await client.connect();

        // Connect to the specified database
        const db = client.db(dbName);

        const pipeline = [
            {
                $collStats: {
                    //latencyStats: { histograms: true },
                    storageStats: { scale: 1 },      // scale: 1024 = kilobytes
                    //count: {},
                    //queryExecStats: {}
                }
            }
        ];

        const collections = ['Marketdata', 'Indicators', 'Signals', 'CombinedSignals'];
        const dbStats = [];
        let totalCount = 0;
        let totalSize = 0;

        for (const colName of collections) {

            //console.log(stats);
            const count = await db.collection(colName).countDocuments();
            //console.log(count);

            const stats = await db.collection(colName).aggregate(pipeline).toArray();
            const size = stats[0].storageStats.size;

            dbStats.push({
                name: colName,
                count: count,
                size: Number(stats[0].storageStats.size / (1000 * 1000)).toFixed(2)
            });

            totalCount += count;
            totalSize += size;
        };

        dbStats.push({
            name: 'Total',
            count: totalCount,
            size: Number(totalSize / (1000 * 1000)).toFixed(2)
        });

        return dbStats;

    } catch (error) {
        console.error("An error occurred while getting collection stats:", error);
        throw error; // Rethrow the error for further handling if needed
    } finally {
        // Ensure the client is closed when done
        await client.close();
    }
}
module.exports.collectionsInfo = collectionsInfo;

/**
 * Get a list of available databases 
 */
async function listDatabases() {
    const client = new MongoClient(URI);

    try {
        await client.connect();

        return await client.db().admin().listDatabases();
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
module.exports.listDatabases = listDatabases;