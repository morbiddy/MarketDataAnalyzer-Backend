"use strict";

/**
 * Evaluate the strategies and find signals
 * 
 * return newSignals
 * 
 * @param {*} indicator 
 */
function evaluate(indicator) {

    // to do : for each strategies => add to signals array
    let signals = [];

    evaluateStrategyA(indicator, signals);

    bbBreakouts(indicator, signals);
    bbBounce(indicator.price, indicator.timestamp, indicator.bollingerBands, signals);
    bbSqueeze(indicator, signals);
    bbMeanReversion(indicator, signals);

    evaluateStrategyC(indicator, signals);

    return signals;
}
module.exports.evaluate = evaluate;

function signal(time, strategy, action, rationale) {
    return {
        timestamp: time,
        strategy: strategy,
        action: action,
        motif: rationale
    };
}

function evaluateStrategyA(indicator, signals) {

    // Evaluate EMA Strategy
    if (indicator.price > indicator.ema4) {                // Price above ema ?
        signals.push({
            timestamp: indicator.timestamp,
            strategy: 'emaCross',
            action: 'buy',
            price: indicator.price,
            motif: 'Price above EMA 4'
        });

    } else if (indicator.price < indicator.ema4) {           // 
        signals.push({
            timestamp: indicator.timestamp,
            strategy: 'emaCross',
            action: 'sell',
            price: indicator.price,
            motif: 'Price below EMA 4'
        });     // Sell signal
    }
}

/**
 * Bollinger Bands Bounce Strategy
 * 
 * Strategy: Prices tend to bounce off the bands. When the price touches or approaches a band, 
 * it can be used as a buy signal (at the lower band) or a sell signal (at the upper band), especially when combined with other indicators.
 * 
 * Parameters: Standard settings are used. Traders may also look for confirmation from other indicators, 
 * like the Relative Strength Index (RSI) or Moving Average Convergence Divergence (MACD).
 * 
 * @param {*} indicator 
 * @param {*} signals 
 */
function bbBounce(signals, timestamp, price, bb) {

    if (price < bb.lower) {
        signals.push({
            timestamp: timestamp,
            strategy: 'bbBreakout',
            action: 'buy',
            price: indicator.price,
            motif: 'Price below lower BB'
        });    // Buy signal
    } else if (price > bb.upper) {
        signals.push({
            timestamp: indicator.timestamp,
            strategy: 'bbBreakout',
            action: 'sell',
            price: indicator.price,
            motif: 'Price above upper BB'
        });   // Sell signal
    }
}

/**
 * Bollinger Bands Breakout Strategy
 * 
 * Strategy: When the price closes outside of the Bollinger Bands, it may indicate an overbought or oversold condition, 
 * suggesting a potential reversal or continuation of the trend.
 * 
 * Parameters: Standard settings apply, but some traders adjust the standard deviation to 2.5 or 3 
 * for stronger confirmation of overbought or oversold conditions.
 * 
 * @param {*} indicator 
 * @param {*} signals 
 */
function bbBreakouts(indicator, signals) {
    
}

/**
 * Bollinger Bands Squeeze Strategy
 * 
 * Strategy: This occurs when the bands tighten, indicating low volatility. A subsequent expansion in the bands can signal the start of a strong trend. 
 * Traders look for breaks above or below the bands as potential buy or sell signals, respectively.
 * 
 * Parameters: Use the standard settings but pay special attention to periods of low volatility followed by a sudden widening of the bands.
 * 
 * @param {*} indicator 
 * @param {*} signals 
 */
function bbSqueeze(indicator, signals) {

}

/**
 * Mean Reversion:
 * 
 * Strategy: This is based on the assumption that prices tend to revert to the mean. 
 * Traders might buy when the price is near the lower band and sell when it's near the upper band, assuming the price will move back to the MA.
 * 
 * Parameters: Standard settings, with possibly a shorter MA period for more sensitive mean reversion signals.

 * @param {*} indicator 
 * @param {*} signals 
 */
function bbMeanReversion(indicator, signals){

}

/**
 * 
 * @param {*} indicator 
 * @param {*} signals 
 */
function evaluateStrategyC(indicator, signals) {
    // Evaluate Stochastic RSI Strategy
    if (indicator.stochRsi.k > 20 && indicator.stochRsi.d > 20 && (indicator.stochRsi.k < indicator.stochRsi.d)) {
        // Buy signal
        signals.push({
            timestamp: indicator.timestamp,
            strategy: 'sRsi',
            action: 'buy',
            price: indicator.price,
            motif: 'Stochastic rsi cross above oversold level'
        });
    } else if (indicator.stochRsi.k < 80 && indicator.stochRsi.d < 80 && (indicator.stochRsi.k > indicator.stochRsi.d)) {
        // Sell signal
        signals.push({
            timestamp: indicator.timestamp,
            strategy: 'sRsi',
            action: 'sell',
            price: indicator.price,
            motif: 'Stochastic rsi cross below overbought level'
        });   // Sell signal        
    }
}