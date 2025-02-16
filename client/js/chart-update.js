"use strict";

/*
    { 
        "time": "2022-01-01 01:00:00", "ohlc": [110, 130, 90, 120], "ema1": 108, "emaX": 112, "rsi": 65, "stochasticRsi": 0.8
    }, 
*/
function updateChart(data, color) {        
    
    const bbColor           = 'rgba(45,45,180,0.7)';      // blue
    const buyColor          = 'rgba(45,255,20,1)';        // green
    const sellBorderC       = 'rgba(255,150,0,1)';
    const sellColor         = 'rgba(255,20,20,1)';        // red
    const kColor            = 'rgba(250,45,45,0.5)';
    const dColor            = 'rgba(28,82,245,0.5)';
    const areaColor         = 'rgba(82,82,82,0.3)';

    const hollow = true;
    const extraSpace        = 10;
    //const dimensions        = ['time', 'open', 'close', 'low', 'high', 'vwap', 'vol', 'count', 'stochRsi', 'stochK', 'stochD', 'ema200'];
    return {
        /*title: {
            text: "XBT/EUR",
            subtext: "15 min"
        },*/
        dataset: {
            source: data
        },
        xAxis: [
            {                
                min: -extraSpace,
                max: data.length + extraSpace
            }, 
            {
                min: -extraSpace,
                max: data.length + extraSpace
            },
            {
                min: -extraSpace,
                max: data.length + extraSpace
            }
        ],
        yAxis: [
            {},
            { min: 0, max: 100 },
            {}
        ],
        series: [
            {
                type: 'candlestick',
                name: 'candles',
                //dimensions: dimensions,
                encode: {
                    x: 'time',
                    y: ['open', 'close', 'low', 'high'],
                   // tooltip: [1, 2, 3, 4]
                },
                itemStyle: {
                    color: hollow ? null: color.up,
                    color0: hollow ? null: color.dn,
                    borderColor: color.up,
                    borderColor0: color.dn
                }
            },
            {
                type: 'line',
                name: 'ema9',              
                symbol: '',
                showSymbol: false,
                encode: { x: 'time', y: ['ema9'] },
                lineStyle:{ color: color.ema9 },
                xAxisIndex: 0,
                yAxisIndex: 0
            },
            {
                type: 'line',
                name: 'ema21',              
                symbol: '',
                showSymbol: false,
                encode: { x: 'time', y: ['ema21'] },
                lineStyle:{ color: color.ema21 },
                xAxisIndex: 0,
                yAxisIndex: 0
            },
            {
                type: 'line',
                name: 'ema200',
                symbol: '',
                showSymbol: false,
                encode: { x: 'time', y: ['ema200'] },
                lineStyle:{ color: color.ema200 },
                xAxisIndex: 0,
                yAxisIndex: 0
            },
            {
                type: 'line',
                name: 'bbLower',
                symbol: '',
                showSymbol: false,
                encode: { x: 'time', y: ['bbLower'] },
                lineStyle:{ color: bbColor },
                xAxisIndex: 0,
                yAxisIndex: 0
            },
            {
                type: 'line',
                name: 'bbUpper',
                symbol: '',
                showSymbol: false,
                encode: { x: 'time', y: ['bbUpper'] },
                lineStyle:{ color: bbColor },
                xAxisIndex: 0,
                yAxisIndex: 0
            },
            {
                type:'scatter',
                name: 'buySignal',
                encode: {
                    x: 'time',
                    y: ['signalbuy']
                },
                symbol: 'arrow',                
                symbolSize: 10,
                itemStyle:{
                    color: buyColor
                },
                xAxisIndex: 0,
                yAxisIndex: 0
            },
            {
                type:'scatter',
                name: 'sellSignal',
                encode: {
                    x: 'time',
                    y: ['signalsell']
                },
                symbol: 'circle',
                symbolSize: 10,
                itemStyle:{
                    color: sellColor,
                    borderColor: sellBorderC
                },
                xAxisIndex: 0,
                yAxisIndex: 0
            },
            {
                type: 'line',
                name: 'sK',
                symbol: '',
                showSymbol: false,
                zLevel: 10,
                encode: {
                    x: 'time',
                    y: ['sK']
                },
                xAxisIndex: 1,
                yAxisIndex: 1,                
                smooth: false,
                lineStyle: {
                    color: kColor
                },
                /*
                markLine: {
                    silent: true,
                    data: [
                        { yAxis: 20, lineStyle: { color: 'red' }, name: 'Marker Line 1', symbol: 'none' },
                        { yAxis: 80, lineStyle: { color: 'green' }, name: 'Marker Line 2', symbol: 'none' }                        
                    ]
                },*/
                markArea: {
                    itemStyle: {
                        color: areaColor
                    },
                    data: [
                        [
                            {                                
                                yAxis: 100,
                                itemStyle: {color: sellColor, opacity: 0.2}
                            },
                            {
                                yAxis: 80
                            }
                        ],
                        [
                            {
                                yAxis: 20,
                                itemStyle: {color: buyColor, opacity: 0.2}
                            },
                            {
                                yAxis: 0
                            }
                        ]
                    ]
                }
            },
            {
                type: 'line',
                name: 'sD',
                symbol: '',
                showSymbol: false,
                zLevel: 10,
                encode: {
                    x: 'time',
                    y: ['sD']
                },
                lineStyle: {
                    color: dColor
                },
                xAxisIndex: 1,
                yAxisIndex: 1
            },
            {
                type: 'bar',
                name: 'volume',
                encode: { x: 'time', y: ['volume'] },                
                itemStyle: {
                    color: (params) => {
                        var dataIndex = params.dataIndex;
                        var point = data[dataIndex];                        
                        return point.close > point.open ? color.up : color.dn; 
                    }
                },
                xAxisIndex: 2,
                yAxisIndex: 2
            }
        ],
        dataZoom: [
            {},{},{show: true}
        ],
        tooltip: {
            trigger: 'axis',
            show: true,
            axisPointer: { type: 'cross' },
            borderWidth: 0,
            borderColor: '#ccc',
            padding: 5,
            textStyle: { color: '#ccc' },
            backgroundColor: 'rgba(50,50,50,0.7)',

            position: function (point, params, dom, rect, size) {
                // You can customize the positioning here
                //alert(params);
                return [0, 0];
            },
            //formatter: 'b0: {b0}: c0: {c0}<br />{b1}: {c1}'
            formatter: function (params) {
                $('#console').text(
                    params[0].value[0] + '\n' + 
                    'Close:' + params[0].value[2] + '\n'
                );
                return;
                var tooltipContent = '';

                //console.log('size of params: ' + params.length);
                //console.log('params[0] ' + params[0].componentType);
                //tooltipContent += 'length: ' + params.length + '<br>';
                //tooltipContent += 'params[0]: ' + params[0].componentType + '<br>';

                tooltipContent += 'seriesName: ' + params[0].seriesName  + '<br>';
                tooltipContent += 'values: ' + params[0].value + '<br>';
                //tooltipContent += 'data:   ' + params[0].data + '<br>';
                tooltipContent += 'dimensionNames: ' + params[0].dimensionNames + '<br>';
                //tooltipContent += 'color:   ' + params[0].color + '<br>';
                return tooltipContent;
            },
        }        
    };
}