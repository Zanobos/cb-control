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

            <div class="form-group col-md-3">
              <base-button id="btnFetch" :disabled="!canQuery" @click="loadData" type="primary-nogradient">Apply time range</base-button>
            </div>

          </div>
        </form>
      </card>
    </template>
  </vc-date-picker>

  <div v-show="loadedData.current.loadedFlag" class="row">
    <div class="col-12">
      <card>
      <!--<card type="chart">-->
        <!--<template slot="header">-->
          <div class="row">
            <div class="col-sm-6">
              <h5 class="card-category">Battery statistics</h5>
              <h2 class="card-title">BMS {{loadedData.current.loadedBMS}} - Current (A)</h2>
            </div>
          </div>
        <!--</template>-->
        <div>
          <div id="chart-current">
          </div>
        </div>
      <div class="card-footer text-right">
        <base-button type="primary-nogradient" @click="queryToCsv(buildQueryCurrent(), 'current')">Export CSV</base-button>
      </div>
      </card>
    </div>
  </div>

  <div v-show="loadedData.voltage.loadedFlag" class="row">
    <div class="col-12">
      <card>
      <!--<card type="chart">-->
        <!--<template slot="header">-->
          <div class="row">
            <div class="col-sm-6">
              <h5 class="card-category">Battery statistics</h5>
              <h2 class="card-title">BMS {{loadedData.voltage.loadedBMS}} - Voltage (V)</h2>
            </div>
          </div>
        <!--</template>-->
        <div>
          <div id="chart-voltage">
          </div>
        </div>
      <div class="card-footer text-right">
        <base-button type="primary-nogradient" @click="queryToCsv(buildQueryVoltage(), 'voltage')">Export CSV</base-button>
      </div>
      </card>
    </div>
  </div>

  <div v-show="loadedData.temperature.loadedFlag" class="row">
    <div class="col-12">
      <card>
      <!--<card type="chart">-->
        <!--<template slot="header">-->
          <div class="row">
            <div class="col-sm-6">
              <h5 class="card-category">Battery statistics</h5>
              <h2 class="card-title">BMS {{loadedData.temperature.loadedBMS}} - Temperature (°C)</h2>
            </div>
          </div>
        <!--</template>-->
        <div>
          <div id="chart-temperature">
          </div>
        </div>
      <div class="card-footer text-right">
        <base-button type="primary-nogradient" @click="queryToCsv(buildQueryTemperature(), 'temperature')">Export CSV</base-button>
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
import { url, token, org, bucket, adminBucket } from '@/config/env'
import React from 'react'
import ReactDOM from 'react-dom'
import { saveAs } from "file-saver";
import { unparse } from "papaparse";
import { mapState } from 'vuex'

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
        current: { loadedFlag: false, loadedBMS: '' },
        voltage: { loadedFlag: false, loadedBMS: '' },
        temperature: { loadedFlag: false, loadedBMS: '' }
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
    },
    canQuery() {
      return this.selectedBMS != '' && 
             this.range.start != '' && 
             this.range.end != '' &&
             !this.dateEquals(this.range.start, this.range.end)
    },
    ...mapState([
      'logged'
    ])
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
    queryToCsv(query, fileName) {
      var outerScope = this
      var data = []
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          data.push(o)    
        },
        error(error) {
          console.error(error)
          this.$notify({type: 'danger', message: 'An error has occurred'})
        },
        complete() {
          outerScope.generateCsv(data, fileName)
        },
      })
    },
    generateCsv(dataExport, fileName) {
      if (!dataExport) {
        console.error("No data to export");
        return;
      }

      var advancedOptions = {
        type: Object,
        default: () => {}
      }

      let csv = unparse(
        dataExport,
        Object.assign(
          {
            delimiter: ',',
            encoding: "utf-8"
          },
          advancedOptions
        )
      );

      //Add BOM when UTF-8
      csv = "\ufeff" + csv;

      let blob = new Blob([csv], {
        type: "application/csvcharset=" + this.encoding
      });
      saveAs(blob, fileName+'.csv');
    },
    dateEquals(a, b) {
      // https://stackoverflow.com/questions/4587060/determining-date-equality-in-javascript
      return (a >= b && a <= b)
    },
    renderGiraffePlot(config, error = null){
      if (error){
        // render error message
        return React.createElement('center', null, error.toString())
      } else if (config.table.length) {
        // render giraffe plot
        const plot = React.createElement(Giraffe.Plot, {config: config})
        return React.createElement('div', {style}, plot);
      } else {
        // render empty table recevied
        return React.createElement('center', null, 'No data')
      }
    },
    segmentTable(table, giraffeConfig, threshold) {
        var flagPositive = false
        var phaseNum = 0
        var labels = []
        var colors = []

        if(table.columns._value.data[0] < threshold) {
          flagPositive = false
          colors.push('red')
        } else {
          flagPositive = true
          colors.push('green')
        }

        table.columns._value.data.forEach(dataPoint => {
          if(flagPositive && dataPoint < threshold) {
            flagPositive = false
            colors.push('red')
            phaseNum++
          }
          if(!flagPositive && dataPoint >= threshold) {
            flagPositive = true
            colors.push('green')
            phaseNum++
          }
          labels.push('phase'+phaseNum)
        });

        var lineLayer = giraffeConfig.layers[0]
        lineLayer.fill = ["phase"]
        lineLayer.colors = colors

        const newTable = table.addColumn('phase', 'string', 'string', labels);

        giraffeConfig.table = newTable
        giraffeConfig.layers = [lineLayer]

        return giraffeConfig
    },
    queryAndRender(query, bms, giraffeConfig, domId, loadedFlagPointer, threshold = null) {
      var outerScope = this
      queryToTable(
        queryApi,
        query,
        Giraffe.newTable,
        {maxTableRows: 5000}
      ). then(table => {
        console.log("Datapoint fetched: " + table.length)
        if(threshold != null && table.length) {
          giraffeConfig = outerScope.segmentTable(table, giraffeConfig, threshold)
        }
        else{
          giraffeConfig.table = table
        }
        ReactDOM.render(       
            outerScope.renderGiraffePlot(giraffeConfig),
            document.getElementById(domId)
        );
        loadedFlagPointer.loadedBMS = bms
        loadedFlagPointer.loadedFlag = true
      }). catch(error => {
        console.log('queryToTable fails', error) 
        ReactDOM.render(
            outerScope.renderGiraffePlot({}, error),
            document.getElementById(domId)
        );
        loadedFlagPointer.loadedBMS = bms
        loadedFlagPointer.loadedFlag = true
      })
    },
    loadData() {

      this.loadedData.current.loadedFlag = false
      this.loadedData.voltage.loadedFlag = false
      this.loadedData.temperature.loadedFlag = false

      // DO NOT SHARE CONFIG OBJECTS

      const valueFormatters = {
          _time: Giraffe.timeFormatter({
            timeZone: 'UTC',
            format: 'YYYY-MM-DD HH:mm:ss ZZ',
          }),
          //_value: (num) => num.toFixed(2)
        }

      const currentConfig = { 
          layers: [{
            type: 'line',
            x: '_time',
            y: '_value',
            lineWidth: 1,
            shadeBelow: true,
            shadeBelowOpacity: 0.1
          }],
          valueFormatters: valueFormatters,
          legendColumns: ["_time", "_value"],
          gridColor: '#8e91a1',
          gridOpacity: 0.5,
          axisColor: '#8e91a1',
          axisOpacity: 0.5,
          legendBackgroundColor: '#1c1f20'
        };

      const voltageConfig = { 
          layers: [{
            type: 'line',
            x: '_time',
            y: '_value',
            colors: ['orange'],
            lineWidth: 1,
            shadeBelow: true,
            shadeBelowOpacity: 0.1
          }],
          valueFormatters: valueFormatters,
          gridColor: '#8e91a1',
          gridOpacity: 0.5,
          axisColor: '#8e91a1',
          axisOpacity: 0.5,
          legendBackgroundColor: '#1c1f20'
        };

      const temperatureConfig = { 
          layers: [{
            type: 'line',
            x: '_time',
            y: '_value',
            lineWidth: 1,
            shadeBelow: true,
            shadeBelowOpacity: 0.1
          }],
          valueFormatters: valueFormatters,
          gridColor: '#8e91a1',
          gridOpacity: 0.5,
          axisColor: '#8e91a1',
          axisOpacity: 0.5,
          legendBackgroundColor: '#1c1f20'
        };   

      this.queryAndRender(this.buildQueryCurrent(), this.selectedBMS, currentConfig, 'chart-current', this.loadedData.current, 0)
      this.queryAndRender(this.buildQueryVoltage(), this.selectedBMS, voltageConfig, 'chart-voltage', this.loadedData.voltage)
      this.queryAndRender(this.buildQueryTemperature(), this.selectedBMS, temperatureConfig, 'chart-temperature', this.loadedData.temperature)

    },
    getBucket() {
      return this.logged ? adminBucket : bucket
    },
    buildQueryCurrent() {
      return `from(bucket: "${this.getBucket()}") 
              |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
              |> filter(fn: (r) => r._measurement == "tlm")
              |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
              |> filter(fn: (r) => (r._field == "current"))
              |> group(columns: ["bms"])
              |> sort(columns: ["_time"])` 
    },
    buildQueryVoltage() {
      return `from(bucket: "${this.getBucket()}") 
              |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
              |> filter(fn: (r) => r._measurement == "tlm")
              |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
              |> filter(fn: (r) => (r._field == "voltage"))
              |> group(columns: ["bms"])
              |> sort(columns: ["_time"])` 
    },
    buildQueryTemperature() {
      return `from(bucket: "${this.getBucket()}") 
              |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
              |> filter(fn: (r) => r._measurement == "tlm")
              |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
              |> filter(fn: (r) => (r._field == "tempBatt"))
              |> group(columns: ["bms"])
              |> sort(columns: ["_time"])` 
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
    },
    disposeCharts() {
    }
  },
  beforeDestroy() {
    this.disposeCharts();
  }
};
</script>
<style src="@/assets/css/input-bar.css"/>
