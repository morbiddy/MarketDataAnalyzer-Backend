"use strict";

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs').promises;
const { body, query, validationResult } = require('express-validator');

const db = require('./db');

const app = express();

// Enable CORS (restrict origins in production)
app.use(cors());        // CORS (Cross-Origin Resource Sharing)
//While enabling CORS for all origins is convenient for development, 
//it's important to restrict origins to those you trust in production environments to prevent unwanted access to your API.

// Serve static files from the 'client' folder
app.use(express.static(path.join(__dirname, 'client')));

// Middleware to parse JSON data in the request body
app.use(bodyParser.json());

// HTTP server for both Express and WebSocket Server
const server = http.createServer(app);
const port = 3000;

//const DIR_DATA = '/mnt/d/Documents/_Kraken_Csv_Data/Kraken_OHLCVT/';
const DIR_DATA = 'D://Documents//_Kraken_Csv_Data//Kraken_OHLCVT';

// Helper function to catch asynchronous errors
const catchAsync = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/**
 * GET /availableMarkets
 * Scans the data directory for CSV files, filters by supported currencies (EUR, USD)
 * and assets (SOL, XBT, XCF), extracts market names and available intervals.
 */
app.get('/availableMarkets', catchAsync(async (req, res) => {
    const files = await fs.readdir(DIR_DATA);

    const filtered = files.filter(str => {
        const currencyRegex = /(EUR|USD)/;
        const assetRegex = /(SOL|XBT|XCF)/;

        // Check if the string contains the specified currencies and assets
        // String.search returns: The index of the first match between the regular expression and the given string, or -1 if no match was found.
        const hasCurrency = str.search(currencyRegex) !== -1;
        const hasAsset = str.search(assetRegex) !== -1;

        // If the condition returns true, the string is included in the filteredArray.
        return hasCurrency && hasAsset;
    });

    const marketData = {};

    // Iterate and extract data
    filtered.forEach(str => {
        // Extract the market name and interval from string using regex 
        // (eg 'XBTEUR_1440.csv' => 'marketName_interval.csv')        
        const matches = str.match(/(.*?)_(\d+)\.csv$/);
        if (matches) {
            const [, marketName, interval] = matches;
            // example: matches = ['XBTEUR_1440.csv', 'XBTEUR', '1440', ...]
            //          => marketName = XBTEUR & interval = 1440

            // Group intervals by market name
            if (!marketData[marketName]) {
                marketData[marketName] = [];
            }
            marketData[marketName].push(parseInt(interval));
        }
    });

    // Transform into desired format => array of objects (eg { name: name, intervals: [] } )
    const result = Object.keys(marketData).map(name => ({
        name: name,
        intervals: marketData[name].sort((a, b) => a - b) // Sort intervals in ascending order
    }));

    res.json(result);
}));

/**
 * GET /availableDatabases
 * Retrieves a list of available databases from the db module.
 */
app.get('/availableDatabases', catchAsync(async (req, res) => {
    const databases = await db.query.listDatabases();
    res.json(databases);
}));

/**
 * GET /preferences
 * Retrieves user preferences.
 * Expects query parameter: ?user=<user>
 */
app.get('/preferences', [
    query('user').exists().withMessage('User is required.')
], catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user = req.query.user;
    const prefs = await db.query.getUserPreferences(user);
    res.json(prefs);
}));

/**
 * POST /preferences
 * Sets/updates user preferences.
 * Expects JSON body: { "preferences": { ... } }
 */
app.post('/preferences', [
    body('preferences').exists().withMessage('Preferences data is required.')
], catchAsync(async (req, res) => {
    const errors = validationResult(req); µ
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const preferences = req.body.preferences;
    const response = await db.query.setUserPreferences(preferences);
    res.json(response);
}));

/**
 * GET /chart-data
 * Retrieves chart data (OHLC + indicators) for a user.
 * Expects query parameter: ?user=<user>
 */
app.post('/chart-data', [
    query('user').exists().withMessage('User is required.')
], catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user = req.query.user;
    const documents = await db.query.chartData(user);
    res.json(documents);
}));

/**
 * GET /documents
 * Retrieves documents from a specified collection for a user.
 * Expects query parameters: ?user=<user>&collection=<collection>
 */
app.get('/documents', [
    query('user').exists().withMessage('User is required.'),
    query('collection').exists().withMessage('Collection is required.')
], catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { user, collection } = req.query;
    const documents = await db.query.documents(user, collection);
    res.json(documents);
}));

/**
 * GET /documents/by-month
 * Retrieves documents filtered by year and month from a specified collection.
 * Expects query parameters: ?collection=<collection>&year=<year>&month=<month>
 * Note: Month should be an integer between 0 and 11.
 */
app.get('/documents/by-month', [
    query('collection').exists().withMessage('Collection is required.'),
    query('year').exists().isInt().withMessage('Year must be an integer.'),
    query('month').exists().isInt({ min: 0, max: 11 }).withMessage('Month must be between 0 and 11.')
], catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { collection, year, month } = req.query;
    const documents = await db.query.documentsByMonth(collection, parseInt(year), parseInt(month));
    res.json(documents);
}));

/**
 * GET /collections
 * Retrieves counts of documents in all collections.
 */
app.get('/collections', catchAsync(async (req, res) => {
    const collectionInfo = await db.query.countDocumentsInAllCollections();
    res.json(collectionInfo);
}));

/**
 * GET /collections/info
 * Retrieves detailed information about collections for a specified database.
 * Expects query parameter: ?dbName=<dbName>
 */
app.get('/collections/info', [
    query('dbName').exists().withMessage('dbName is required.')
], catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const dbName = req.query.dbName;
    const collectionInfo = await db.query.collectionsInfo(dbName);
    res.json(collectionInfo);
}));

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    req.status(500).json({ error: 'Internal Server Error', details: err.message });
});

/**
 * WebSocket: Create Database Process
 * This function handles the process of creating and processing a new database.
 */
const processCreateDatabase = async (ws, dbName) => {
    try {
        const file = `${dbName}.csv`;
        const filePath = path.join(DIR_DATA, file);

        // Progress update: Reading data
        ws.send(JSON.stringify({ done: false, message: `Read OHLC data from ${file}` }));
        ws.send(JSON.stringify({ done: false, message: `Create new database: ${dbName}` }));
        ws.send(JSON.stringify({ done: false, message: `Write OHLC data to 'Marketdata' ...` }));

        // Setup market data
        await db.setupMarketdata(dbName, filePath);

        // Process Indicators
        ws.send(JSON.stringify({ done: false, message: `Processing Indicators...` }));
        console.time('processIndicators');
        await db.processIndicators(dbName);
        console.timeEnd('processIndicators');

        // Process Signals
        ws.send(JSON.stringify({ done: false, message: `Processing Signals...` }));
        console.time('processSignals');
        await db.processSignals(dbName);
        console.timeEnd('processSignals');

        // Combine Signals
        ws.send(JSON.stringify({ done: false, message: `Combining Signals...` }));
        console.time('combineSignals');
        await db.combineSignals(dbName);
        console.timeEnd('combineSignals');

        // Final update: Database ready
        ws.send(JSON.stringify({ done: false, message: `Database ${dbName} ready!` }));
        ws.send(JSON.stringify({ done: true, message: 'done' }));

        // Close WebSocket connection gracefully
        ws.close(1000, 'Operation completed');
    } catch (error) {
        console.error('Error during createDatabase process:', error);
        ws.send(JSON.stringify({ error: 'Error during createDatabase process', details: error.message }));
    }
};

// Initialize the WebSocket server instance
const wss = new WebSocketServer({ server });
//
wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'createDatabase') {
                if (!data.dbName) {
                    ws.send(JSON.stringify({ error: 'dbName is required for createDatabase' }));
                    return;
                }
                await processCreateDatabase(ws, data.dbName);
            } else {
                ws.send(JSON.stringify({ error: 'Unsupported message type' }));
            }
        } catch (error) {
            console.error('WebSocket message handling error:', error);
            ws.send(JSON.stringify({ error: 'Invalid message format', details: error.message }));
        }
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});