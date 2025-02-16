"use strict"


const StochRSI = require('technicalindicators').StochasticRSI;
const EMA = require('technicalindicators').EMA;
const BB = require('technicalindicators').BollingerBands;
const Hammer = require('technicalindicators').hammerpattern;

function toNumber(val){
    return Math.round(Number(val) * 100) / 100;
}

function updateIndicators(data) {
    return new Promise((resolve, reject) => {
        let close = [];
        data.forEach(item => {
            close.push(Number(item.close));
        });

        let stochRsi = new StochRSI({
            rsiPeriod: 14,
            stochasticPeriod: 14,
            kPeriod: 3,
            dPeriod: 3,
            values: close
        });
        let stoch = stochRsi.getResult();
        stoch = Array(31).fill({ stochRSI: null, k: null, d: null }).concat(stoch);

        let ema50 = Array(9).fill(null).concat(
            EMA.calculate({
                period: 10,
                values: close
            })
        );

        let ema100 = Array(19).fill(null).concat(
            EMA.calculate({
                period: 20,
                values: close
            })
        );

        let ema200 = Array(199).fill(null).concat(
            EMA.calculate({
                period: 200,
                values: close
            })
        );

        let bb = new BB({ period: 30, stdDev: 2, values: close });
        let bollingerBands = bb.getResult();
        bollingerBands = Array(29).fill({upper: null, middle: null, lower: null}).concat(bollingerBands);
        
        let bbWidth = [];

        for(let i = 0; i < bollingerBands.length; i++){
            if(bollingerBands[i].upper !== null){
                let diff = bollingerBands[i].upper - bollingerBands[i].lower;
                bbWidth.push(diff/bollingerBands[i].middle*100);
            }
            else bbWidth.push(null);
        }

        for (let i = 0; i < data.length; i++) {
            data[i].sRsi = stoch[i].stochRSI !== null ? toNumber(stoch[i].stochRSI): null;
            data[i].sK = stoch[i].k !== null ? toNumber(stoch[i].k): null;
            data[i].sD = stoch[i].d !== null ? toNumber(stoch[i].d): null;
            data[i].ema50 = ema50[i] !== null ? toNumber(ema50[i]): null;
            data[i].ema100 = ema100[i] !== null ? toNumber(ema100[i]): null;
            data[i].ema200 = ema200[i] !== null ? toNumber(ema200[i]): null;
            data[i].bbUpper = bollingerBands[i].upper !== null ? toNumber(bollingerBands[i].upper): null;
            data[i].bbMiddle = bollingerBands[i].middle !== null ? toNumber(bollingerBands[i].middle): null;
            data[i].bbLower = bollingerBands[i].lower !== null ? toNumber(bollingerBands[i].lower): null;
            data[i].bbWidth = bbWidth[i] !== null ? toNumber(bbWidth[i]): null;
        }
        console.log('Indicators updated.');
        resolve();
    });
}

/**
 * Entry Rules:
 *  1)Stochastic RSI Oversold/Overbought:
 *      - Buy Signal: Stochastic RSI crosses above the oversold threshold (e.g., 20).
 *      - Sell Signal: Stochastic RSI crosses below the overbought threshold (e.g., 80).
 *  2)Trend Confirmation with EMA200:
 *      - Only take buy signals if the price is above the EMA200.
 *      - Only take sell signals if the price is below the EMA200.
 *
 * Exit Rules:
 *  1)Stochastic RSI Crossing:
 *      - For Buy positions, consider selling if Stochastic RSI crosses below the overbought threshold.
 *      - For Sell positions, consider buying if Stochastic RSI crosses above the oversold threshold.
 *  2)EMA200 Cross:
 *      - Consider closing positions if the price crosses below the EMA200 for long positions or above for short positions.
 * @param {*} data 
 */
function updateSignals(data) {
    return new Promise((resolve, reject) => {

        const oversold = 20;
        const overbought = 80;
        const size = data.length;

        let sK = '';
        let oldK = sK;
        let sD = '';
        let ema200 = '';
        let close = '';

        let currentEntry = 'sell';

        for (let i = 0; i < size; i++) {
            sK = data[i].sK;
            sD = data[i].sD;
            ema200 = data[i].ema200;
            close = data[i].close;

            if(ema200 === null){
                data[i].signalbuy = null;
                data[i].signalsell = null;
                continue;
            }
            
            // EXIT RULES
            /*if (currentEntry === 'buy'){
                if (oldK >= overbought && sK < overbought){
                    // consider selling if rsi crosses below overbought
                    currentEntry = 'sell';
                    console.log( data[i].time, 'buy position & rsi cross below overbought ');
                }
            }
            else if (currentEntry === 'sell'){
                if (oldK <= oversold && sK > oversold){
                    // consider buying if rsi crosses above oversold
                    currentEntry = 'buy';
                    console.log(data[i].time, 'sell position & rsi cross above oversold ');
                }
            }*/

            // ENTRY RULES

            // CHECK FOR BUY
            if (oldK <= oversold && sK > oversold) {     // % K crossed above oversold (20)

                if (close > ema200) {                    // if market is above ema

                    if (currentEntry === 'sell') {        //  if entry = sell

                        data[i].signalbuy = close;      //   - do buy 
                        data[i].signalsell = null;
                        currentEntry = 'buy';

                    }
                    else {
                        data[i].signalbuy = null;
                        data[i].signalsell = null;
                    }

                    //console.log(data[i].time, ' buy');
                }
                else {
                    data[i].signalbuy = null;
                    data[i].signalsell = null;
                }
            }
            // CHECK FOR SELL
            else if (oldK >= overbought && sK < overbought) {  // % K crossed below overbought (80)

                if (close < ema200) {                     // if market is below ema => confirm sell

                    if (currentEntry === 'buy') {         // - only sell if currentEntry = buy

                        data[i].signalsell = close;
                        data[i].signalbuy = null;
                        currentEntry = 'sell';
                    }
                    else {
                        data[i].signalbuy = null;
                        data[i].signalsell = null;
                    }

                    //console.log(data[i].time, ' sell');
                }
                else {
                    data[i].signalbuy = null;
                    data[i].signalsell = null;
                }
            }
            else {
                data[i].signalbuy = null;
                data[i].signalsell = null;
            }

            oldK = sK;
        }
        console.log('Signals updated.');
        resolve();
    });
}

/**
 * Risk Management:
 *  1)Stop Loss:
 *      - Set a stop-loss order to limit potential losses in case the trade goes against you.
 *  2)Take Profit:
 *      - Set a take-profit order to secure profits when the market moves in your favor.
 *  3)Position Sizing:
 *      - Adjust the size of your positions based on your risk tolerance and overall protfolio management strategy.
 * @param {*} data 
 */
function updateRiskManagement(data) {
    return new Promise((resolve, reject) => {
        for (let i = 0; i < data.length; i++) {

        }
        console.log('Risk management updated.');
        resolve();
    });
}

// Export the functions to make them accessible in other files
module.exports = {
    updateIndicators,
    updateSignals,
    updateRiskManagement
    //calculateOtherIndicator
};