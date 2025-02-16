"use strict";

/*
Dataset format
[
    {
        "time": "2022-01-01 00:00:00", 
        "ohlc": [100, 120, 80, 110],
        "ema1": 105, 
        "emaX": 110, 
        "rsi": 60, 
        "stochasticRsi": 0.75
    },
    { 
        "time": "2022-01-01 01:00:00", "ohlc": [110, 130, 90, 120], "ema1": 108, "emaX": 112, "rsi": 65, "stochasticRsi": 0.8
    },        
]
*/



function configChart(color) {
    // Get the custom background color from the CSS variable
    /*var customBgColor = getComputedStyle(document.documentElement).getPropertyValue('--background-color');
    var candleUpColor = getComputedStyle(document.documentElement).getPropertyValue('--candle-up-color');
    var candleDnColor = getComputedStyle(document.documentElement).getPropertyValue('--candle-down-color');*/

    return {
        /*title: {
            text: 'data.market',
            subtext: 'data.interval',
            left: 'center' 
        },*/
        animation: false,
        backgroundColor: color.bg,
        dataset: {
            source: []
        },
        grid: [
            { left: '2%', top: '7%', width: '94%', height: '52%' }, // First chart grid           
            { left: '2%', top: '62%', width: '94%', height: '11%' },
            { left: '2%', top: '76%', width: '94%', height: '11%'}
        ],
        xAxis: [
            {                
                type: 'category', 
                boundaryGap: false,         // false => the candle is centered at the tick
                gridIndex: 0, 
                splitLine: { show: true },
                axisLine: { onZero: false, show: false },
                axisLabel: { show: false },
                
                
            }, 
            { 
                type: 'category',
                boundaryGap: false,
                gridIndex: 1,
                splitLine: { show: true },
                axisLine: { onZero: false, show: false },
                axisTick: { show: false }                
            },
            {
                type: 'category',
                boundaryGap: false,
                gridIndex: 2,
                splitLine: { show: true },
                axisLine: { onZero: false, show: false },
                axisTick: { show: false }
            }
        ],
        yAxis: [            
            {
                type: 'value',
                scale: true,
                position: 'right',
                //splitArea: { show: true },          // like striped table                
                gridIndex: 0,
                axisLabel: { formatter: function (value) { return value.toFixed(0) } }
            },
            {
                type: 'value',
                scale: false,
                position: 'right',
                /*min: 0,
                max: 100,*/
                gridIndex: 1,
                axisLabel: { show: true },
                axisLine: { show: false },
                axisTick: { show: true },
                splitLine: { show: false },
            },
            {
                type: 'value',
                scale: true,
                position: 'right',                
                gridIndex: 2,
                axisLabel: { show: true },
                axisLine: { show: false },
                axisTick: { show: true },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                type: 'candlestick'                
            },
            {
                type: 'line',
                xAxisIndex: 1,
                yAxisIndex: 1
            }
        ],
        dataZoom: [
            {
                type: 'inside',
                xAxisIndex: [0, 1, 2],
                start: 90,
                end: 100
            },
            {
                
                type: 'inside',
                xAxisIndex: [0, 1, 2],
                //top: '90%',
                start: 90,
                end: 100
            },
            {
                type: 'slider',
                show: false,
                xAxisIndex: [0, 1, 2],
                start: 90,
                end: 100
            }
        ],
        axisPointer: {
            show: true,
            link: [ { xAxisIndex: 'all' }],
            label: {
                backgroundColor: 'rgba(50,50,50,0.7)'
            }
        }
    };
}

