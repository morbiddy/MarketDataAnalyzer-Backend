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

module.exports = { chartData, documents, documentsByMonth };
