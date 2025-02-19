const mongoose = require("../config/database");
const Marketdata = require("../models/Marketdata");
const { getUserPreferences } = require("./userPreferencesService");

async function chartData(user) {
    try {
        //console.log(`get chartdata for user ${user}`);
        const prefs = await getUserPreferences(user);
        console.log(`From ${new Date(prefs.from)}, to ${new Date(prefs.to)}`);
        return await Marketdata.aggregate([
            { $match: { timestamp: { $gte: new Date(prefs.from), $lt: new Date(prefs.to) } } },
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

async function documents(user, collectionName) {
    // Change the global time zone to UTC
    process.env.TZ = 'UTC';

    try {
        const prefs = await getUserPreferences(user);
        const dbName = `${prefs.market}_${prefs.interval}`;

        // Use the existing Mongoose connection to switch database context
        const database = mongoose.useDb(dbName);
        const collection = database.collection(collectionName);

        // Query for documents starting from the given date
        const query = { timestamp: { $gte: prefs.from, $lt: prefs.to } };
        const options = { sort: { timestamp: 1 } };

        const data = await collection.find(query, options).toArray();

        console.log(`Returned ${data.length} documents from ${collectionName}`);
        return data;

    } catch (error) {
        console.error("Error in documents:", error);
        throw error;
    } finally {
        // Revert to the system's default time zone
        delete process.env.TZ;
    }
}

async function documentsByMonth(dbName, collectionName, year, month) {
    // Change the global time zone to UTC
    process.env.TZ = 'UTC';

    try {
        const database = mongoose.useDb(dbName);

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

        const cursor = database.collection(collectionName).find(query, options);

        const documents = [];

        for await (const doc of cursor) {
            documents.push(doc);
        }

        return documents;

    } catch (error) {
        console.error(error);
        return 0; //res.status(500).send('Error querying the database');
    } finally {
        // Revert to the system's default time zone
        delete process.env.TZ;
    }
}

module.exports = { chartData, documents, documentsByMonth };
