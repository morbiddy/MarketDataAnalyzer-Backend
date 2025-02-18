/**
 * Get collection statistics.
 */
async function collectionsInfo(dbName) {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const stats = await Promise.all(
            collections.map(async (collection) => {
                const count = await mongoose.connection.collection(collection.name).countDocuments();
                return { collection: collection.name, count };
            })
        );
        return stats;
    } catch (error) {
        console.error("Error in collectionsInfo:", error);
        throw error;
    }
}

/**
 * Count documents in all collections of a database.
 */
async function countDocumentsInAllCollections(dbName) {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const counts = await Promise.all(
            collections.map(async (collection) => {
                const count = await mongoose.connection.collection(collection.name).countDocuments();
                return { collection: collection.name, count };
            })
        );
        return counts;
    } catch (error) {
        console.error("Error in countDocumentsInAllCollections:", error);
        throw error;
    }
}

/**
 * List available databases.
 */
async function listDatabases() {
    try {
        return await mongoose.connection.db.admin().listDatabases();
    } catch (error) {
        console.error("Error in listDatabases:", error);
        throw error;
    }
}

module.exports = { collectionsInfo, countDocumentsInAllCollections, listDatabases };