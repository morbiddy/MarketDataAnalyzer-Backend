"use strict";

const csv = require('csv-parser');
const { MongoClient } = require('mongodb');
const { URI } = require('./constants');
const moment = require('moment');

/**
 * 
 * @param {String} dbName 
 * @param {String} csvFile 
 * @returns {new Promise}
 */
async function setupMarketdata(dbName, csvFile) {
    //console.log(`dbName: ${dbName}, csvFile: ${csvFile}`);
    await checkHeaderRow(csvFile);                              // to do : is necessary?
    
    return new Promise((resolve, reject) => {
        
        const stream = fs.createReadStream(csvFile, 'utf8');
        const jsData = [];

        stream.pipe(csv({ columns: true, from_line: 2 }))       // read csv data with piped stream
            .on('data', (row) => {
                jsData.push({
                    timestamp: new Date(row.time * 1000),       // use BSON timestamp format to use in MongoDB
                    time: moment.unix(Number(row.time)).format('DD-MM-YY HH:mm'),
                    open: Number(row.open),
                    high: Number(row.high),
                    low: Number(row.low),
                    close: Number(row.close),
                    volume: Number(row.volume),
                    count: Number(row.count)
                    //timeframe: timeframe
                });
            })
            .on('end', async () => {                                      // when jsData is complete then 
                console.log(`Json data array loaded from: ${csvFile}`);
                const client = new MongoClient(URI);
                try {
                    await client.connect();

                    const db = client.db(dbName);                    // create new database
                    console.log(`Dropping collections ...`);
                    // Fetch all collection names
                    const collections = await db.listCollections().toArray();
                    for (let collection of collections) {
                        // Skip system collections
                        if (!collection.name.startsWith('system.')) {                            
                            await db.collection(collection.name).drop();   // drop old collections
                        }
                    }
                    console.log(`Database, ${dbName} cleared!`);

                    await db.createCollection('Marketdata', { timeseries: { timeField: 'timestamp' } });
                    await db.createCollection('Indicators', { timeseries: { timeField: 'timestamp' } });
                    await db.createCollection('Signals', { timeseries: { timeField: 'timestamp' } });
                    await db.createCollection('CombinedSignals', { timeseries: { timeField: 'timestamp'} });
                    
                    await db.collection('Marketdata').createIndex({ timestamp: 1 });
                    await db.collection('Indicators').createIndex({ timestamp: 1 });
                    await db.collection('Signals').createIndex({ timestamp: 1 });
                    await db.collection('CombinedSignals').createIndex({ timestamp: 1 });

                    console.log(`Initialize Marketdata ...`);
                    await db.collection('Marketdata').insertMany(jsData);

                } catch (e) {
                    console.log(`Database creation failed: ${e}`);
                    reject(error);
                } finally {
                    await client.close();
                    resolve();
                }
            })
            .on('error', function (error) {
                console.log(error.message);
                reject(error);
            });
    });
}
module.exports = { setupMarketdata };

const fs = require('fs');

function checkHeaderRow(csvFile) {
    return new Promise((resolve, reject) => {
        fs.readFile(csvFile, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading CSV file: ', err);
                reject(err);
            }
            // make sure first column = ['time', 'open', 'high', 'low', 'close', 'volume', 'count']
            if (data.startsWith('time')) {
                //console.log('Header row already exists in file: ', csvFile);
                resolve();
            }
            else {
                const columns = ['time', 'open', 'high', 'low', 'close', 'volume', 'count'];
                const newData = columns.join(',') + '\n' + data;

                fs.writeFile(csvFile, newData, 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing CSV file: ', err);
                        reject(err);
                    }
                    //console.log('Header row added to CSV file: ', csvFile);
                    resolve();
                });
            }
        });
    });
}