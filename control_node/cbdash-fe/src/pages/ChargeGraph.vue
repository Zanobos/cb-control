<template>

<div>
  <vc-date-picker
    v-model="range"
    mode="dateTime"
    :masks="masks"
    is-range
    color="green"
    :is-dark="!whiteTheme"
    locale="en"
    is24hr
    :max-date="new Date()"
    :popover="{ visibility: 'click' }"
  >
    <template v-slot="{ inputValue, inputEvents }">
      <card>
        <form @submit.prevent>
          <div class="form-row">
            <base-input class="col-md-2" placeholder="Bms">
              <select v-model="selectedBMS" id="inputState" class="form-control">
                <option
                  v-for="(bms) in getBMSs"
                  :value="bms"
                  :key="bms"
                >{{bms}}</option>
              </select>
              
            </base-input>


            <base-input
              class="col-md-3"
              addon-left-icon="tim-icons icon-calendar-60"
              placeholder="from"
              :value="inputValue.start"
              v-on="inputEvents.start"
            />

            <base-input
              class="col-md-3"
              addon-left-icon="tim-icons icon-calendar-60"
              placeholder="to"
              :value="inputValue.end"
              v-on="inputEvents.end"
            />

           <base-button id="btnFetch" @click="checkInput" type="primary-nogradient">Apply time range</base-button>

          </div>
        </form>
      </card>
    </template>
  </vc-date-picker>

  <div v-show="loadedData.current" class="row">
    <div class="col-12">
      <card type="chart">
        <template slot="header">
          <div class="row">
            <div class="col-sm-6">
              <h5 class="card-category">Battery statistics</h5>
              <h2 class="card-title">BMS {{selectedBMS}} - Current (A)</h2>
            </div>
          </div>
        </template>
        <div>
          <div id="chart-current">
          </div>
        </div>
      <div class="card-footer text-right">
        <base-button type="primary-nogradient">Export CSV</base-button>
      </div>
      </card>
    </div>
  </div>

  <div v-show="loadedData.voltage" class="row">
    <div class="col-12">
      <card type="chart">
        <template slot="header">
          <div class="row">
            <div class="col-sm-6">
              <h5 class="card-category">Battery statistics</h5>
              <h2 class="card-title">BMS {{selectedBMS}} - Voltage (V)</h2>
            </div>
          </div>
        </template>
        <div>
          <div id="chart-voltage">
          </div>
        </div>
      <div class="card-footer text-right">
        <base-button type="primary-nogradient">Export CSV</base-button>
      </div>
      </card>
    </div>
  </div>

  <div v-show="loadedData.temperature" class="row">
    <div class="col-12">
      <card type="chart">
        <template slot="header">
          <div class="row">
            <div class="col-sm-6">
              <h5 class="card-category">Battery statistics</h5>
              <h2 class="card-title">BMS {{selectedBMS}} - Temperature (°C)</h2>
            </div>
          </div>
        </template>
        <div>
          <div id="chart-temperature">
          </div>
        </div>
      <div class="card-footer text-right">
        <base-button type="primary-nogradient">Export CSV</base-button>
      </div>
      </card>
    </div>
  </div>

</div>
</template>
<script>
import Card from '@/components/Cards/Card.vue';
import {InfluxDB, FluxTableMetaData} from '@influxdata/influxdb-client'
import {queryToTable} from '@influxdata/influxdb-client-giraffe'
import * as Giraffe from  '@influxdata/giraffe' 
import {url, token, org} from '@/influx/env'
import React from 'react'
import ReactDOM from 'react-dom'

const queryApi = new InfluxDB({url, token}).getQueryApi(org)

const style = {
  height: "calc(30vh)",
  margin: "20px",
  "textAlign": "left"
};

export default {
    components: {
        Card
  },
  data() {
    return {
      timer: null,
      selectedBMS: '',
      loadedData: {
        current: false,
        voltage: false,
        temperature: false
      },
      whiteTheme: false,
      range: {
        start: '',
        end: '',
      },
      masks: {
        input: 'YYYY-MM-DD h:mm A',
      },
    };
  },
  computed: {
    getBMSs () {
      return this.$store.state.bmss
    },
    rows() {
      return this.items.length
    }
  },
  watch: {
    range: function(val) {
      //this.checkInput()
    },
    selectedBMS: function(val) {
      //this.checkInput()
    }
  },
  mounted() {
    this.$root.$on('whiteTheme', (whiteTheme) => {
      this.whiteTheme = whiteTheme
      this.toggleChartTheme()
    });
    this.whiteTheme = document.body.classList.contains('white-content');
    this.toggleChartTheme()
    //this.loadData()
  },
  methods: {
    checkInput() {
      if(this.selectedBMS != '' && this.range.start != '' && this.range.end != '')
        this.loadData()
    },
    renderGiraffePlot({error, table}){
      if (error){
        // render error message
        return React.createElement('center', null, error.toString())
      } else if (table.length) {
        // render giraffe plot
        const plotConfig = { 
          table: table,
          layers: [{
            type: 'line',
            x: '_time',
            y: '_value'
          }],
          valueFormatters: {
            _time: Giraffe.timeFormatter({
              timeZone: 'UTC',
              format: 'YYYY-MM-DD HH:mm:ss ZZ',
            }),
          }
        };
        const plot = React.createElement(Giraffe.Plot, {config: plotConfig})
        return React.createElement('div', {style}, plot);
      } else {
        // render empty table recevied
        return React.createElement('center', null, 'Empty Table Received')
      }
    },
    queryAndRender(query, domId) {
      var outerScope = this
      queryToTable(
        queryApi,
        query,
        Giraffe.newTable,
        {maxTableRows: 5}
      ). then(table => {
        console.log('queryToTable returns', table)       
        ReactDOM.render(       
            React.createElement(outerScope.renderGiraffePlot, {table}),
            document.getElementById(domId)
        );
      }). catch(error => {
        console.log('queryToTable fails', error) 
        ReactDOM.render(
            React.createElement(outerScope.renderGiraffePlot, {error}),
            document.getElementById(domId)
        );
      })
    },
    renderDemoData() {
      class PlotRenderer extends React.Component {
        render() {
          const style = {
            height: "calc(30vh)",
            margin: "40px",
          };

          const lineLayer = {
            type: "line",
            x: "_time",
            y: "_value"
          };

          const table = Giraffe.newTable(3)
            .addColumn('_time', 'dateTime:RFC3339', 'time', [1589838401244, 1589838461244, 1589838521244])
            .addColumn('_value', 'double', 'number', [2.58, 7.11, 4.79]);

          const config = {
            table,
            layers: [lineLayer]
          };

          const SimplePlot = React.createElement(Giraffe.Plot, {config}, null);
          return React.createElement('div', {style}, SimplePlot);
        }
      }

      ReactDOM.render(
        React.createElement(PlotRenderer),
        document.getElementById('chart-current')
      );
    },
    loadData() {
                
      const queryCurrent = `from(bucket: "telemetry") 
                            |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                            |> filter(fn: (r) => r._measurement == "tlm")
                            |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
                            |> filter(fn: (r) => (r._field == "current"))
                            |> group(columns: ["bms"])
                            |> sort(columns: ["_time"])`                       

      const queryVoltage = `from(bucket: "telemetry") 
                            |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                            |> filter(fn: (r) => r._measurement == "tlm")
                            |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
                            |> filter(fn: (r) => (r._field == "voltage"))
                            |> group(columns: ["bms"])
                            |> sort(columns: ["_time"])` 

      const queryTemperature = `from(bucket: "telemetry") 
                                |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                                |> filter(fn: (r) => r._measurement == "tlm")
                                |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
                                |> filter(fn: (r) => (r._field == "tempBatt"))
                                |> group(columns: ["bms"])
                                |> sort(columns: ["_time"])` 
                                
          
/*
      const demoQuery = `from(bucket: "telemetry") 
        |> range(start: 2020-11-30T23:00:00.000Z, stop: 2020-12-30T23:00:00.000Z)
        |> filter(fn: (r) => r._measurement == "tlm")
        |> filter(fn: (r) => r.bms == "2")
        |> filter(fn: (r) => (r._field == "current"))
        |> group(columns: ["bms"])
        |> sort(columns: ["_time"])`
*/

      this.queryAndRender(queryCurrent, 'chart-current')
      this.loadedData.current = true
      this.queryAndRender(queryVoltage, 'chart-voltage')
       this.loadedData.voltage = true
      this.queryAndRender(queryTemperature, 'chart-temperature')
      this.loadedData.temperature = true
      
    },
    startTimer() {
      this.timer = new Date()
      console.log("Timer started")
    },
    lapTimer() {
      var lap = new Date()
      var timeDiff = lap - this.timer
      this.timer = lap
      console.log(timeDiff + "ms elapsed")
    },
    toggleChartTheme() {
      console.log("TODO: toggle chart theme")
    },
    disposeCharts() {
      console.log("TODO: dispose chart data")
    }
  },
  beforeDestroy() {
    this.disposeCharts();
  }
};
</script>
<style scoped>
.hello {
  width: 100%;
  height: 500px;
}

#btnFetch {
  margin-top: 0px;
  margin-bottom: 0px;
  height: 38px;
}
</style>
