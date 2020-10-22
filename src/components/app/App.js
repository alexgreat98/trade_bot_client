import React from 'react';
// import socket class
import Socket from '../../socket';
import Chart from "react-apexcharts";
import axios from "axios";


export default class App extends React.Component {
  constructor(props) {
    super(props);

    // state variables
    this.state = {
      connected: false,
      messages: [],
      kline_series: [{
        data: []
      }],
      pushingData: {
        start_time: '2020-01-01',
        low: '',
        high: '',
        open: '',
        close: '',
      },
      kline_options: {
        chart: {
          type: 'candlestick',
          height: 350,
          id: 'candles',
        },
        title: {
          text: 'CandleStick Chart',
          align: 'left'
        },
        xaxis: {
          type: 'datetime'
        },
        yaxis: {
          tooltip: {
            enabled: true
          }
        }
      },
      bar_series: [{
        data: []
      }],
      bar_options: {
        chart: {
          height: 160,
          type: 'bar',
          brush: {
            enabled: true,
            target: 'candles'
          },
          selection: {
            enabled: true,
            fill: {
              color: '#ccc',
              opacity: 0.4
            },
            stroke: {
              color: '#0D47A1',
            }
          },
        },
        dataLabels: {
          enabled: false
        },
        plotOptions: {
          bar: {
            columnWidth: '80%',
            colors: {
              ranges: [{
                from: -1000,
                to: 0,
                color: '#F15B46'
              }, {
                from: 1,
                to: 10000,
                color: '#FEB019'
              }],

            },
          }
        },
        stroke: {
          width: 0
        },
        xaxis: {
          type: 'datetime',
          axisBorder: {
            offsetX: 13
          }
        },
        yaxis: {
          labels: {
            show: false
          }
        }
      }


    }
  }

  // componentDidMount is a react life-cycle method that runs after the component
  //   has mounted.
  componentDidMount() {
    // establish websocket connection to backend server.
    let ws = new WebSocket('ws://localhost:4000');

    // create and assign a socket to a variable.
    let socket = this.socket = new Socket(ws);

    // handle connect and disconnect events.
    socket.on('connect', this.onConnect);
    socket.on('disconnect', this.onDisconnect);

    /* EVENT LISTENERS */
    // event listener to handle 'hello' from a server
    socket.on('helloFromServer', this.helloFromServer);
  }

  // onConnect sets the state to true indicating the socket has connected
  //    successfully.
  onConnect = () => {
    this.setState({connected: true});
  };

  // onDisconnect sets the state to false indicating the socket has been
  //    disconnected.
  onDisconnect = () => {
    this.setState({connected: false});
  };

  // helloFromClient is an event emitter that sends a hello message to the backend
  //    server on the socket.
  helloFromClient = () => {
    console.log('saying hello...');
    axios.get('http://localhost:3000/kline').then(({data}) => {
      console.log(data);
      let klineData = [];
      let barData = [];
      data.forEach(item => klineData.push(this.klineToCandleChart(item)));
      data.forEach(item => barData.push(this.klineToBarChart(item)));
      this.setState({
        kline_series: [{data: klineData}],
        bar_series: [{data: barData}]
      });
      console.log(this.state);
      this.socket.emit('helloFromClient', 'hello server!');
    })

  };

  // helloFromServer is an event listener/consumer that handles hello messages
  //    from the backend server on the socket.
  helloFromServer = (item) => {
    let klineData = this.state.kline_series[0].data.slice();
    let barData = this.state.bar_series[0].data.slice();

    klineData.push(this.klineToCandleChart(item));
    barData.push(this.klineToBarChart(item));
    this.setState({
      kline_series: [{data: klineData}],
      bar_series: [{data: barData}]
    });
    console.log(this.state)
  };

  klineToCandleChart(kline) {
    return {
      x: new Date(kline.start_time),
      y: [this.formatMoney(kline.open), this.formatMoney(kline.high), this.formatMoney(kline.low), this.formatMoney(kline.close)]

    }
  }

  klineToBarChart(kline) {
    return {
      x: new Date(kline.start_time),
      y: [this.formatMoney(kline.high), this.formatMoney(kline.low)]

    }
  }

  formatMoney(value) {
    return value / 100000000
  }

  pushCandle = (e) => {
    e.preventDefault();

    let klineData = this.state.kline_series[0].data.slice();
    let barData = this.state.bar_series[0].data.slice();

    klineData.push(this.klineToCandleChart(this.state.pushingData))
    barData.push(this.klineToBarChart(this.state.pushingData))
    this.setState({


      kline_series: [{data: klineData}],
      bar_series: [{data: barData}]
    });
    console.log(this.state)
  };

  render() {
    const title = "Awesome Socket App";
    const {messages, pushingData} = this.state;

    return (
      <div>
        <h1>{title}</h1>
        <form onSubmit={this.pushCandle}>
          <input type="date" value={pushingData.start_time}
                 onChange={e => this.setState({pushingData: {...pushingData, start_time: e.target.value}})}/>
          <input placeholder="low" type="text" name="low" value={pushingData.low}
                 onChange={e => this.setState({pushingData: {...pushingData, low: parseInt(e.target.value)}})}/>
          <input placeholder="high" type="text" name="high" value={pushingData.high}
                 onChange={e => this.setState({pushingData: {...pushingData, high: parseInt(e.target.value)}})}/>
          <input placeholder="start" type="text" name="open" value={pushingData.open}
                 onChange={e => this.setState({pushingData: {...pushingData, open: parseInt(e.target.value)}})}/>
          <input placeholder="end" type="text" name="close" value={pushingData.close}
                 onChange={e => this.setState({pushingData: {...pushingData, close: parseInt(e.target.value)}})}/>
          <button type="submit">Push</button>
        </form>
        <hr/>
        <button onClick={this.helloFromClient}>
          Say Hello to Backend Server
        </button>
        <table>
          <thead>
          <tr>
            <td>Volume</td>
            <td>Low</td>
            <td>High</td>
          </tr>
          </thead>
          <tbody>
          {messages.map((item, i) => (<tr key={i}>
            <td>{item.volume}</td>
            <td>{item.low}</td>
            <td>{item.high}</td>
          </tr>))}
          </tbody>
        </table>
        <Chart
          options={this.state.kline_options}
          series={this.state.kline_series}
          type="candlestick"
          width="1000"
        />
        <Chart
          options={this.state.bar_options}
          series={this.state.bar_series}
          type="rangeBar"
          width="1000"
        />
      </div>
    )
  }
}