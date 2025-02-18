const db = require("../config/database"); // Ensure this is imported first

const { getUserPreferences, setUserPreferences } = require("./services/userPreferencesService");
const { chartData, documents, documentsByMonth } = require("./services/marketDataService");
const { collectionsInfo, countDocumentsInAllCollections, listDatabases } = require("./services/databaseService");

module.exports = {
  getUserPreferences,
  setUserPreferences,
  chartData,
  documents,
  documentsByMonth,
  collectionsInfo,
  countDocumentsInAllCollections,
  listDatabases  
};