"use strict";

const { setupMarketdata } = require('./db-create-database.js');
const { processIndicators } = require('./db-process-indicators.js');
const { processSignals } = require('./db-process-signals.js');
const { combineSignals } = require('./db-combine-signals.js');

module.exports = {
    setupMarketdata,
    processIndicators,
    processSignals,
    combineSignals,
    query: require('../index.js')          // export functions of db-query.js as parameter of query  => use as db.query.chartData etc...
};