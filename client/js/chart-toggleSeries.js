"use strict";

import { myChart } from './client.js';

// Handle checkbox change event

$('#toggleSignals').change(function () {
    let isChecked = $(this).prop('checked');
    let option = myChart.getOption();
    for (let i = 0; i < option.series.length; i++) {
        if (option.series[i].name === 'buySignal' || option.series[i].name === 'sellSignal') {
            option.series[i].itemStyle = {
                normal: { opacity: isChecked ? 1 : 0 }
            };
        }
    }
    myChart.setOption(option);
});

$('#toggleVolume').change(function () {
    let isChecked = $(this).prop('checked');
    let option = myChart.getOption();
    for (let i = 0; i < option.series.length; i++) {
        if (option.series[i].name === 'volume') {
            option.series[i].itemStyle = {
                normal: { opacity: isChecked ? 1 : 0 }
            };
            break;
        }
    }
    myChart.setOption(option);
});

$('#toggleStochRsi').change(function () {
    console.log('toggle stoch rsi');
    let isChecked = $(this).prop('checked');
    let option = myChart.getOption();
    for (let i = 0; i < option.series.length; i++) {
        if (option.series[i].name === 'sD' || option.series[i].name === 'sK') {
            option.series[i].lineStyle = {
                opacity: isChecked ? 1 : 0
            };
        }
    }
    myChart.setOption(option);
});

$('#toggleBB').change(function () {
    let isChecked = $(this).prop('checked');
    let option = myChart.getOption();
    for (let i = 0; i < option.series.length; i++) {
        if (option.series[i].name === 'bbUpper' || option.series[i].name === 'bbLower') {
            option.series[i].lineStyle = {
                opacity: isChecked ? 1 : 0
            };
        }
    }
    myChart.setOption(option);
});

$('#toggleMACD').change(function () {
    let isChecked = $(this).prop('checked');
    let option = myChart.getOption();
    console.log('to do toggle macd series in echarts.');
    /*for (let i = 0; i < option.series.length; i++) {
        if (option.series[i].name === 'bbUpper' || option.series[i].name === 'bbLower') {
            option.series[i].lineStyle = {
                opacity: isChecked ? 1 : 0
            };
        }
    }
    myChart.setOption(option);*/
});

$('#toggleEMA1-2').change(function () {
    let isChecked = $(this).prop('checked');
    let option = myChart.getOption();
    for (let i = 0; i < option.series.length; i++) {
        if (option.series[i].name === 'ema9' || option.series[i].name === 'ema21') {
            option.series[i].lineStyle = {
                opacity: isChecked ? 1 : 0
            };
        }
    }
    myChart.setOption(option);
});
$('#toggleEMA200').change(function () {
    let isChecked = $(this).prop('checked');
    let option = myChart.getOption();
    for (let i = 0; i < option.series.length; i++) {
        if (option.series[i].name === 'ema200') {
            option.series[i].lineStyle = {
                opacity: isChecked ? 1 : 0
            };
            break;
        }
    }
    myChart.setOption(option);
});
$('#toggleCandles').change(function () {
    let isChecked = $(this).prop('checked');
    let option = myChart.getOption();
    for (let i = 0; i < option.series.length; i++) {
        if (option.series[i].name === 'candles') {
            option.series[i].itemStyle = {
                normal: { opacity: isChecked ? 1 : 0 }
            };
            break;
        }
    }
    myChart.setOption(option);
});