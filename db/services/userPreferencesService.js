const UserPreferences = require("../models/UserPreferences");

async function getUserPreferences(user) {
    try {
        let prefs = await UserPreferences.findOne({ user });
        if (!prefs) prefs = await UserPreferences.create({ user });
        return prefs;
    } catch (error) {
        console.error("Error in getUserPreferences:", error);
        throw error;
    }
}

async function setUserPreferences(prefs) {
    try {
        return await UserPreferences.findOneAndUpdate(
            { user: prefs.user },   // Find user by username
            { $set: prefs },        // Update fields
            { new: true, upsert: true } // Return updated document, create if not exists
        );
    } catch (error) {
        console.error("Error in setUserPreferences:", error);
        throw error;
    }
}

module.exports = { getUserPreferences, setUserPreferences };