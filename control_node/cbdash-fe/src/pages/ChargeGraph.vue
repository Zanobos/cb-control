<template>

<div>
  
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

        <div class="col-md-3">
          <vc-date-picker
            v-model="range.start"
            mode="dateTime"
            color="green"
            :is-dark="!whiteTheme"
            locale="en-GB"
            is24hr
            :max-date="new Date()"
            :popover="{ visibility: 'click' }"
          >
            <template v-slot="{ inputValue, inputEvents }">
              <date-input
                addon-left-icon="tim-icons icon-calendar-60"
                placeholder="from"
                :value="inputValue"
                v-on="inputEvents"
              />
            </template>
          </vc-date-picker>
        
        </div>
        <div class="col-md-3">

          <vc-date-picker
            v-model="range.end"
            mode="dateTime"
            color="green"
            :is-dark="!whiteTheme"
            locale="en-GB"
            is24hr
            :min-date="range.start"
            :max-date="new Date()"
            :popover="{ visibility: 'click' }"
          >
            <template v-slot="{ inputValue, inputEvents }">
              <date-input
                addon-left-icon="tim-icons icon-calendar-60"
                placeholder="to"
                :value="inputValue"
                v-on="inputEvents"
              />
            </template>
          </vc-date-picker>
        </div>
        
        <div class="form-group col-md-3">
          <base-button id="btnFetch" :disabled="!canQuery" @click="loadData" type="primary-nogradient">Apply time range</base-button>
        </div>

      </div>
    </form>
  </card>

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

// Assuming 1 datapoint per ms
const maxDataPoints = 10000
const currentDomain = [-500, 200]
const voltageDomain = [0, 100]
const temperatureDomain = [-20, 70]

const style = {
  height: "calc(30vh)",
  margin: "20px",
  "textAlign": "left"
}

const commonGiraffeConfigs = { 
  onSetYDomain: () => {},
  onResetYDomain: () => {},
  gridColor: '#8e91a1',
  gridOpacity: 0.5,
  axisColor: '#8e91a1',
  axisOpacity: 0.5,
  legendBackgroundColor: '#1c1f20',
  legendFont: ''
}

const baseGiraffeLineLayerConfig = {
  type: 'line',
  x: '_time',
  y: '_value',
  lineWidth: 1,
  shadeBelow: true,
  shadeBelowOpacity: 0.1
}

// DO NOT SHARE CONFIG OBJECTS

const timeFormatter = Giraffe.timeFormatter({
      timeZone: 'Europe/Rome',
      format: 'DD/MM/YYYY HH:mm:ss',
    })

const currentConfig = { 
    layers: [{
      ...baseGiraffeLineLayerConfig,
      maxTooltipRows: 120
    }],
    valueFormatters: {
      _time: timeFormatter,
      _value: (num) => num.toFixed(1)+' A'
    },
    legendColumns: ["_time", "_value"],
    yDomain: currentDomain,
    ...commonGiraffeConfigs
  };

const voltageConfig = { 
    layers: [{
      ...baseGiraffeLineLayerConfig,
      colors: ['orange']
    }],
    valueFormatters: {
      _time: timeFormatter,
      _value: (num) => num.toFixed(1)+' V'
    },
    yDomain: voltageDomain,
    ...commonGiraffeConfigs
  };

const temperatureConfig = { 
    layers: [ baseGiraffeLineLayerConfig ],
    valueFormatters: {
      _time: timeFormatter,
      _value: (num) => num.toFixed(1)+' °C'
    },
    yDomain: temperatureDomain,
    ...commonGiraffeConfigs
  };  

export default {
    components: {
        Card
  },
  data() {
    return {
      timer: null,
      selectedBMS: '',
      loadedBMS: '',
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
      date: '',
      currentRange: {},
      voltageRange: {},
      temperatureRange: {}
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
    computeAggregationWindowIntervalString(maxDataPoints, startDateTime, endDateTime) {
      const second = 1000
      const minute = 60*second
      const hour = 60*minute
      const day = 24*hour

      var timeRangeMs = endDateTime - startDateTime
      var aggregationIntervalMs = Math.floor(timeRangeMs / maxDataPoints)

      if(aggregationIntervalMs < 1) aggregationIntervalMs = 1

      if(aggregationIntervalMs < second)
        return aggregationIntervalMs+'ms'
      if(aggregationIntervalMs < minute)
        return Math.floor(aggregationIntervalMs/second)+'s'
      if(aggregationIntervalMs < hour)
        return Math.floor(aggregationIntervalMs/minute)+'m'
      if(aggregationIntervalMs < day)
        return Math.floor(aggregationIntervalMs/hour)+'h'
      else
        return Math.floor(aggregationIntervalMs/day)+'d'
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

        var dataColumnName = giraffeConfig.layers[0].y
        if(table.columns[dataColumnName].data[0] < threshold) {
          flagPositive = false
          colors.push('red')
        } else {
          flagPositive = true
          colors.push('green')
        }

        table.columns[dataColumnName].data.forEach(dataPoint => {
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
    queryAndRender(query, bms, giraffeConfig, seriesName, domId, loadedFlagPointer, threshold = null) {
      var outerScope = this
      queryToTable(
        queryApi,
        query,
        Giraffe.newTable
      ). then(table => {
        console.log("Datapoint fetched: " + table.length)
          
        if(threshold != null && table.length) {
          giraffeConfig = outerScope.segmentTable(table, giraffeConfig, threshold)
        }
        else{
          giraffeConfig.table = table
        }

        if(table.length) {
          table.columns._time.name = 'Time'
          table.columns._value.name = seriesName
          
          // Force the graph to zoom between first and last available data
          const timeValues = table.columns._time.data
          const firstDataPointTime = timeValues[0]
          const lastDataPointTime = timeValues[timeValues.length - 1]
          giraffeConfig.xDomain = [firstDataPointTime, lastDataPointTime]          
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
      this.loadedBMS = this.selectedBMS

      this.loadedData.current.loadedFlag = false
      this.loadedData.voltage.loadedFlag = false
      this.loadedData.temperature.loadedFlag = false

      this.currentRange = {...this.range}
      this.voltageDomain = {...this.range}
      this.temperatureRange = {...this.range}

      if(this.logged) {
        this.setGiraffeControlledMode()
      } else {
        this.setGiraffeDefaultMode()
      }

      this.queryAndRender(this.buildQuery('current', this.currentRange), this.selectedBMS, currentConfig, 'Current', 'chart-current', this.loadedData.current, 0)
      this.queryAndRender(this.buildQuery('voltage', this.voltageDomain), this.selectedBMS, voltageConfig, 'Voltage', 'chart-voltage', this.loadedData.voltage)
      this.queryAndRender(this.buildQuery('tempBatt', this.temperatureRange), this.selectedBMS, temperatureConfig, 'Temperature', 'chart-temperature', this.loadedData.temperature)

    },
    setGiraffeDefaultMode() {
      currentConfig.xDomain = null
      currentConfig.onSetXDomain = null
      currentConfig.onResetXDomain = null
      voltageConfig.xDomain = null
      voltageConfig.onSetXDomain = null
      voltageConfig.onResetXDomain = null
      temperatureConfig.xDomain = null
      temperatureConfig.onSetXDomain = null
      temperatureConfig.onResetXDomain = null
    },
    setGiraffeControlledMode() {
      // If the 3 config parameters xDomain, onSetXDomain, onResetXDomain are all set, giraffe works in "controlled mode"
      
      currentConfig.xDomain = null
      //currentConfig.xDomain = [this.range.start.getTime(), this.range.end.getTime()]
      currentConfig.onSetXDomain = (range) => {
        const newRange = {start: new Date(range[0]), end: new Date(range[1])}
        currentConfig.xDomain = [newRange.start.getTime(), newRange.end.getTime()]
        this.queryAndRender(this.buildQuery('current', newRange), this.loadedBMS, currentConfig, 'Current', 'chart-current', this.loadedData.current, 0)
      }
      currentConfig.onResetXDomain = () => {
        currentConfig.xDomain = [this.range.start.getTime(), this.range.end.getTime()]
        this.queryAndRender(this.buildQuery('current', this.range), this.loadedBMS, currentConfig, 'Current', 'chart-current', this.loadedData.current, 0)
      }

      voltageConfig.xDomain = null
      //voltageConfig.xDomain = [this.range.start.getTime(), this.range.end.getTime()]
      voltageConfig.onSetXDomain = (range) => {
        const newRange = {start: new Date(range[0]), end: new Date(range[1])}
        voltageConfig.xDomain = [newRange.start.getTime(), newRange.end.getTime()]
        this.queryAndRender(this.buildQuery('voltage', newRange), this.loadedBMS, voltageConfig, 'Voltage', 'chart-voltage', this.loadedData.voltage)
      }
      voltageConfig.onResetXDomain = () => {
        voltageConfig.xDomain = [this.range.start.getTime(), this.range.end.getTime()]
        this.queryAndRender(this.buildQuery('voltage', this.range), this.loadedBMS, voltageConfig, 'Voltage', 'chart-voltage', this.loadedData.voltage)
      }

      temperatureConfig.xDomain = null
      //temperatureConfig.xDomain = [this.range.start.getTime(), this.range.end.getTime()]
      temperatureConfig.onSetXDomain = (range) => {
        const newRange = {start: new Date(range[0]), end: new Date(range[1])}
        temperatureConfig.xDomain = [newRange.start.getTime(), newRange.end.getTime()]
        this.queryAndRender(this.buildQuery('tempBatt', newRange), this.loadedBMS, temperatureConfig, 'Temperature', 'chart-temperature', this.loadedData.temperature)
      }
      temperatureConfig.onResetXDomain = () => {
        temperatureConfig.xDomain = [this.range.start.getTime(), this.range.end.getTime()]
        this.queryAndRender(this.buildQuery('tempBatt', this.range), this.loadedBMS, temperatureConfig, 'Temperature', 'chart-temperature', this.loadedData.temperature)
      }
    },
    getBucket() {
      return this.logged ? adminBucket : bucket
    },
    buildQuery(field, range) {
      return `from(bucket: "${this.getBucket()}") 
              |> range(start: ${range.start.toISOString()}, stop: ${range.end.toISOString()})
              |> filter(fn: (r) => r._measurement == "tlm")
              |> filter(fn: (r) => r.bms == "${this.loadedBMS}")
              |> filter(fn: (r) => (r._field == "${field}"))` +
              (this.logged ? this.getAggregationWindow(range) : '') +
             `|> group(columns: ["bms"])
              |> sort(columns: ["_time"])` 
    },
    getAggregationWindow(range) {
      var aw = this.computeAggregationWindowIntervalString(maxDataPoints, range.start, range.end)
      //return `|> aggregateWindow(every: ${aw}, fn: last, createEmpty: false)`
      return `|> aggregateWindow(every: ${aw}, fn: mean, createEmpty: false)`
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
<style>

.white-content .giraffe-tooltip{
  background-color: white !important
}

.white-content .giraffe-tooltip-column-header{
  color: black !important
}

</style>
