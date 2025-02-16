'use strict';

import { saveCookie, getCookie, deleteCookie } from './cookies.js';

const color = {
    bg: getComputedStyle(document.documentElement).getPropertyValue('--background-color'),
    up: getComputedStyle(document.documentElement).getPropertyValue('--candle-up-color'),
    dn: getComputedStyle(document.documentElement).getPropertyValue('--candle-down-color'),
    ema9: getComputedStyle(document.documentElement).getPropertyValue('--ema-9-color'),
    ema21: getComputedStyle(document.documentElement).getPropertyValue('--ema-21-color'),
    ema100: getComputedStyle(document.documentElement).getPropertyValue('--ema-100-color'),
    ema200: getComputedStyle(document.documentElement).getPropertyValue('--ema-200-color'),
};

// Initialize chart
let myChart = echarts.init(document.getElementById('myChart'), 'dark');

myChart.setOption(configChart(color));

function resizeChart() { myChart.resize(); }
window.addEventListener('resize', resizeChart);

export { myChart };

$(document).ready(function () {

    // On page load, fetch available markets and setup dropdowns
    $.getJSON('/availableMarkets', function (markets) {
        // TO DO => show modal if failed to fetch available markets.

        let cookie = getCookie('market');
        if (!cookie) {
            saveCookie('market', 'XBTEUR'); // set default
            cookie = getCookie('market');
        }

        const marketItems = [];
        let marketIntervals = [];

        markets.forEach(market => { // fill marketItems and set corresponding marketIntervals
            const item = {
                name: market.name,
                value: market.name,
                selected: market.name === cookie.value ? true : false
            };
            marketItems.push(item);
            if (item.selected) marketIntervals = market.intervals;
        });

        // Initialize dropdown market
        $('#dd-market').dropdown({ values: marketItems });
        $('#dd-market').dropdown({
            onChange: function (value, text, $selectedItem) {
                saveCookie('market', value);
            }
        });

        cookie = getCookie('interval');
        if (!cookie) {
            saveCookie('interval', 15); // set default
            cookie = getCookie('interval');
        }

        const intervalItems = [];

        marketIntervals.forEach(interval => {
            let name = '';
            if (interval <= 60) name = interval + ' min';
            else name = (interval / 60) + ' hours';
            if (interval === 1440) name = '1 day';
            intervalItems.push({
                name: name,
                value: interval,
                selected: interval === parseInt(cookie.value) ? true : false
            });
        });

        // Initialize dropdown interval
        $('#dd-interval').dropdown({ values: intervalItems });
        $('#dd-interval').dropdown({
            onChange: function (value, text, $selectedItem) {
                saveCookie('interval', value);
            }
        });

    }).fail(function (jqxhr, textStatus, error) {
        const err = textStatus + ", " + error;
        console.error("Error fetching available markets: " + err);
    });

    // Initialize datepickers
    $("#dpFrom").datepicker({
        dateFormat: 'dd/mm/yy',
        onSelect: function (dateText, inst) {
            // format according to datepicker: dateFormat: 'dd/mm/yy'
            const strDate = `${inst.selectedDay}/${inst.selectedMonth+1}/${inst.selectedYear}`;
            saveCookie('dateFrom', strDate);

            const selectedDate = $(this).datepicker('getDate');
            // Calculate the minimum toDate by adding one day to the selected fromDate
            let minToDate = new Date(selectedDate.getTime());
            minToDate.setDate(minToDate.getDate() + 1);
            // Set the minimum date of the toDate datepicker
            $('#dpTo').datepicker('option', 'minDate', minToDate);
        }
    });
    initDatepickerAndCookie('#dpFrom', 'dateFrom', '01/10/2023');

    // Initialize datepickers
    $("#dpTo").datepicker({
        dateFormat: 'dd/mm/yy',
        onSelect: function (dateText, inst) {
            const strDate = `${inst.selectedDay}/${inst.selectedMonth+1}/${inst.selectedYear}`;
            saveCookie('dateTo', strDate);
        }
    });
    initDatepickerAndCookie('#dpTo', 'dateTo', '01/11/2023');

    // Initialize dropdowns
    $('#dd-dbInfo').dropdown();
    $('#dd-controls').dropdown();

    // Prevent click events inside the table from closing the dropdown
    $('.ui.dropdown .menu .item .ui.table').on('click', function (event) {
        event.stopPropagation();
    });

    /**
     * Load data if database exists or create new database if not exists. 
     */
    $('#btn-loadData').on('click', function (e) {
        e.preventDefault(); // prevent anchor tag behavior        

        const dbName = getDbName();

        $.getJSON('/availableDatabases', function (databasesList) {
            let dbExist = false;
            databasesList.databases.forEach(db => {
                console.log(` - ${db.name} - empty: ${db.empty} - size on disk: ${db.sizeOnDisk}`);
                db.name === dbName ? dbExist = true : '';
            });

            if (dbExist) {                
                // Load chart data
                loadChart({
                    type: 'chartData',
                    dbName: dbName,
                    from: cookieDateToObject('dateFrom'),
                    to: cookieDateToObject('dateTo')
                });
                // Load db info
                loadDBInfo();
            }
            else {
                $('#dbName').html(`${dbName}`);
                $('.ui.basic.modal').modal({
                    closable  : false,
                    /*onDeny    : function(){
                      window.alert('Wait not yet!');
                      return false;
                    },*/
                    onApprove: function () {
                        createNewDatabase(dbName);
                        return false;
                    }
                }).modal('show');
            }
        });
    });

    $(window).resize(function () {
        $.fn.dataTable.tables({ visible: true, api: true }).columns.adjust();
    });

    $('.ui.green.ok.inverted.button').click(function () {

    });

    // Adding a listener for the 'dataZoom' event
    myChart.on('dataZoom', function (params) {
        // Handle the scroll event here
        if (params.start == 0) {
            console.log('Zoom start:', params.start, 'Zoom end:', params.end);
            // get more data
            //since = since - (720 * interval);
            /*ws.send(JSON.stringify({
                type: 'ohlc',
                market: market,
                interval: interval,
                since: since,
                amount: ++amount
            }));*/
        }
    });


    for (let i = 0; i < 50; i++) {
        let row = `<tr><td>row ${i}; col 1</td><td>row ${i}; col 2</td><td>row ${i}; col 3</td><td>row ${i}; col 4</td></tr>`;
        $('#tblTrades').append(row);
    }

});


function cookieDateToObject(cookieName){
    const cookie = getCookie(cookieName);
    // Split the date string by "/"
    const parts = cookie.value.split("/");
            
    // Assuming the date format is DD/MM/YYYY    
    return {
        day: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10),// Note: months are 0-indexed in JavaScript Date objects, but here we keep it 1-indexed for the object representation
        year: parseInt(parts[2], 10)
    }
}

/**
 * Setup datepicker with cookie or if not set with default date.
 * @param {*} dp 
 * @param {*} cookieName 
 */
function initDatepickerAndCookie(dp, cookieName, defaultDate) {
    const cookie = getCookie(cookieName);
    console.log(cookie);
    if (cookie) $(dp).datepicker('setDate', cookie.value);
    else {
        // Initialize to default is no date cookie is set
        $(dp).datepicker('setDate', defaultDate);
        saveCookie(cookieName, defaultDate);
    }
}

/**
 * @returns 'market_interval' like 'XBTEUR_15'
 */
function getDbName() {
    const market = getCookie('market').value;
    const interval = getCookie('interval').value;
    if (market != null && interval != null) return `${market}_${interval}`;
    else return 'XBTEUR_15';
}

function createNewDatabase(name) {
    var ws = new WebSocket('ws://' + window.location.host);

    let intervalId;
    ws.onopen = function () {
        console.log('WebSocket connection established');
        ws.send(JSON.stringify({
            type: 'createDatabase',
            dbName: name
        }));
        intervalId = setInterval(() => ws.send(JSON.stringify({ type: 'ping' })), 30000);
    };

    ws.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data);
            $('.ui.basic.modal .content').append(`<div class="item">${data.message}</div>`);
        } catch (error) {
            console.log(error);
            return;
        }
    };
    ws.onclose = function () {
        clearInterval(intervalId);
        console.log('WebSocket connection closed');
    };
}

function loadDBInfo() {
    $.ajax({
        type: 'POST',
        url: '/query-data',
        contentType: 'application/json',
        data: JSON.stringify({ type: 'collectionsInfo', dbName: getDbName() }),
        success: function (collectionsInfo) {
            $('#tbl-dbInfo tbody').html('');
            collectionsInfo.forEach(col => {
                let row = `<tr><td>${col.name}</td><td>${col.count.toLocaleString('en-US')}</td><td class="right aligned">${col.size}</td></tr>`;
                $('#tbl-dbInfo tbody').append(row);
            });
        }
    });
}

function loadSignals() {
    $.ajax({
        type: 'POST',
        url: '/query-data',
        contentType: 'application/json',
        data: JSON.stringify({ type: 'documentsByMonth', collection: 'CombinedSignals', year: year, month: month }),
        success: function (combinedSignals) {
            writeTable(combinedSignals);
        },
        error: function (error) {

            console.log('Error receiving combinedSignals ', error);
        }
    });
}

function loadChart(requestData) {
    myChart.showLoading('default', {
        maskColor: color.bg,
        color: '#626561',
        textColor: '#ccc'
    });

    $.ajax({
        type: 'POST',
        url: '/query-data',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: function (documents) {
            //console.log(documents);
            let option = updateChart(documents, color);
            // read active sliders
            if (!document.getElementById('toggleEMA1-2').checked) {
                for (let i = 0; i < option.series.length; i++) {
                    if (option.series[i].name === 'ema9') {
                        option.series[i].lineStyle = {
                            opacity: 0
                        };
                    }
                    else if (option.series[i].name === 'ema21') {
                        option.series[i].lineStyle = {
                            opacity: 0
                        };
                    }
                }
            }
            myChart.setOption(option);
            myChart.resize();    // update chart by calling resize()
            myChart.hideLoading();
        }
    });
}

/*
function findTrades() {
    let buyPrice = null;
    let sellPrice = null;
    let profitTotal = 0;
    let profitTrade = 0;
    let profitPercentage = 0;
    let profitPercentageTotal = 0;
    let tradeCount = 0;
    let trades = [];
    marketData.forEach(row => {
        //console.log(`signal buy: ${row.signalbuy}, signal sell: ${row.signalsell}`);
        //console.log(`buy price: ${buyPrice}, sell price: ${sellPrice}`);
        if (row.signalbuy !== null && sellPrice === null) { // Buy signal
            buyPrice = row.signalbuy;
        } else if (row.signalsell !== null && buyPrice !== null) { // Sell signal after a buy  ( Long position )              
            sellPrice = row.signalsell;
            profitTrade = sellPrice - buyPrice;
            profitTotal += profitTrade;
            profitPercentage = profitTrade / buyPrice * 100;
            profitPercentageTotal += profitPercentage;
            tradeCount++;
            let fee = 0;
            trades.push({
                count: tradeCount,
                time: row.time,
                type: 'Buy -> sell',
                buyPrice: buyPrice,
                sellPrice: sellPrice,
                fee: fee,
                volume: row.volume.toFixed(2),
                profit: profitTrade.toFixed(2),
                profitPercentage: profitPercentage.toFixed(2)
            });
            console.log(`${tradeCount}. Buy at ${buyPrice}, Sell at ${sellPrice} -> ${profitTrade >= 0 ? 'Profit' : 'Loss'} ${profitTrade / buyPrice * 100}`);
            buyPrice = null;
            sellPrice = null;
        } else if (row.signalsell !== null && buyPrice === null) { // Sell signal (short sell)
            sellPrice = row.signalsell;
        } else if (row.signalbuy !== null && sellPrice !== null) { // Buy signal after a sell (close short sell)
            buyPrice = row.signalbuy;
            profitTrade = sellPrice - buyPrice;
            profitTotal += profitTrade;
            profitPercentage = profitTrade / buyPrice * 100;
            profitPercentageTotal += profitPercentage;
            tradeCount++;
            let fee = 0;
            trades.push({
                count: tradeCount,
                time: row.time,
                type: 'Sell -> buy',
                buyPrice: buyPrice,
                sellPrice: sellPrice,
                fee: fee,
                volume: row.volume.toFixed(2),
                profit: profitTrade.toFixed(2),
                profitPercentage: profitPercentage.toFixed(2)
            });
            console.log('Buy signal after a sell (close short sell)');
            console.log(`${tradeCount}. Buy at ${buyPrice}, Sell at ${sellPrice} -> ${profitTrade >= 0 ? 'Profit' : 'Loss'} ${profitTrade.toFixed(2)}`);
            buyPrice = null;
            sellPrice = null;
        }
    });

    tblTrades.clear();
    tblTrades.rows.add(trades).draw();

    $('#rptFrom').text(marketData[199].time);
    $('#rptTo').text(' - -');
    $('#rptTrades').text(tradeCount);
    $('#rptProfit').text(profitPercentageTotal.toFixed(2) + " %");
}*/