"use strict";

const fs = require('fs');
const csv = require('csv-parser');
const moment = require('moment');

/**
 * 
 * @param {*} file 
 * @returns 
 */
function readJsonData(file) {
  return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf-8')
          .then(fileContent => {
              const data = JSON.parse(fileContent);
              resolve(data);
          })
          .catch(error => {
              reject(error);
          });
  });
}
module.exports.readJsonData = readJsonData;

/**
 * 
 * @param {*} data 
 * @param {*} file 
 * @returns 
 */
function writeJsonData(data, file) {
  return new Promise((resolve, reject) => {
      fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8')
          .then(resolve())
          .catch(error => {
              reject(error);
          });
  });
}
module.exports.writeJsonData = writeJsonData;

/**
 * 
 * @param {*} csvFile 
 * @param {*} jsonFile 
 * @returns 
 */
async function csvToJsonFile(csvFile, jsonFile) {

  await checkHeaderRow(csvFile);

  return new Promise((resolve, reject) => {
    console.log('now read again to create json file');
    const stream = fs.createReadStream(csvFile, 'utf8');
    const jsData = [];
    stream.pipe(csv({ columns: true, from_line: 2 }))
      .on('data', (row) => {
        jsData.push({
          timestamp: Number(row.time),
          time: moment.unix(Number(row.time)).format('DD-MM HH:mm'),
          open: Number(row.open),
          high: Number(row.high),
          low: Number(row.low),
          close: Number(row.close),
          volume: Number(row.volume),
          count: Number(row.count)
        });
      })
      .on('end', () => {
        fs.writeFileSync(jsonFile, JSON.stringify(jsData, null, 2), 'utf8');
        console.log('Data processing complete. Check the output.json file.');
        resolve();
      })
      .on("error", function (error) {
        console.log(error.message);
        reject(error);
      });
  });
};
module.exports.csvToJsonFile = csvToJsonFile;


function checkHeaderRow(csvFile) {
  return new Promise((resolve, reject) => {
    fs.readFile(csvFile, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading CSV file: ', err);
        reject(err);
      }
      // make sure first column = ['time', 'open', 'high', 'low', 'close', 'volume', 'count']
      if (data.startsWith('time')) {
        console.log('Header row already exists in file: ', csvFile);
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
          console.log('Header row added to CSV file: ', csvFile);
          resolve();
        });
      }
    });
  });
}