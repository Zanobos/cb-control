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

  <!--<div v-if="dataCurrent.length > 0" class="row">-->
  <div v-if="dataCurrent.length > 0" class="row">
    <div class="col-12">
      <card type="chart">
        <template slot="header">
          <div class="row">
            <div class="col-sm-6">
              <h5 class="card-category">Battery statistics</h5>
              <h2 class="card-title">BMS {{selectedBMS}} - Current (A)</h2>
            </div>
            <!--
            <div class="col-sm-6">
              <div class="btn-group btn-group-toggle"
                    :class="isRTL ? 'float-left' : 'float-right'"
                    data-toggle="buttons">
                <label v-for="(option, index) in bigLineChartCategories"
                        :key="option"
                        class="btn btn-sm btn-primary btn-simple"
                        :class="{active: bigLineChart.activeIndex === index}"
                        :id="index">
                  <input type="radio"
                          @click="initBigChart(index)"
                          name="options" autocomplete="off"
                          :checked="bigLineChart.activeIndex === index">
                  {{option}}
                </label>
              </div>
            </div>
            -->
          </div>
        </template>
        <div v-if="dataCurrent.length > 0" class="chart-area" style="height: 100%">
          <div class="hello" ref="chartdivcurrent">
          </div>
        </div>
      <div class="card-footer text-right">
        <base-button type="primary-nogradient">Export CSV</base-button>
      </div>
      </card>
    </div>
  </div>

  <div v-if="dataVoltage.length > 0" class="row">
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
        <div class="chart-area" style="height: 100%">
          <div class="hello" ref="chartdivvoltage">
          </div>
        </div>
      <div class="card-footer text-right">
        <base-button type="primary-nogradient">Export CSV</base-button>
      </div>
      </card>
    </div>
  </div>

  <div v-if="dataTemperature.length > 0" class="row">
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
        <div class="chart-area" style="height: 100%">
          <div class="hello" ref="chartdivtemperature">
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
import {url, token, org} from '@/influx/env'

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_material from "@amcharts/amcharts4/themes/material";
import am4themes_dark from "@amcharts/amcharts4/themes/dark";
const queryApi = new InfluxDB({url, token}).getQueryApi(org)

export default {
    components: {
        Card
  },
  data() {
    return {
      timer: null,
      selectedBMS: '',
      perPage: 15,
      currentPage: 1,
      dataCurrent: [],
      dataVoltage: [],
      dataTemperature: [],

      chartCurrent: null,
      chartVoltage: null,
      chartTemperature: null,

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
  },
  methods: {
    checkInput() {
      if(this.selectedBMS != '' && this.range.start != '' && this.range.end != '')
        this.loadData()
    },
    loadData() {
      var outerScope = this
      this.disposeCharts();
      outerScope.dataCurrent = []
      outerScope.dataVoltage = []
      outerScope.dataTemperature = []
      /*
      // All in one
      const queryCurrent = `from(bucket: "telemetry") 
                         |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                         |> filter(fn: (r) => r._measurement == "tlm")
                         |> filter(fn: (r) => r.bms == "123")
                         |> filter(fn: (r) => (r._field == "voltage" or 
                             r._field == "current" or
                             r._field == "tempBatt"))
                         |> group(columns: ["bms", "_field"])
                         |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)`
      */                  
      const queryCurrent = `from(bucket: "telemetry") 
                            |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                            |> filter(fn: (r) => r._measurement == "tlm")
                            |> filter(fn: (r) => r.bms == "123")
                            |> filter(fn: (r) => (r._field == "current"))
                            |> group(columns: ["bms"])
                            |> sort(columns: ["_time"])`                       

      console.log('Querying influx for charge data.')
      console.log(queryCurrent)
      console.log("START")
      this.startTimer()
      queryApi.queryRows(queryCurrent, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          var datum = { date: Date.parse(o._time), value: o._value }
          outerScope.dataCurrent.push(datum);
        },
        error(error) {
          console.error(error)
          console.log('CHARGE DATA FETCH ERROR')
        },
        complete() {
          outerScope.lapTimer()
          console.log('CHARGE DATA FETCH SUCCESS')
          console.log(outerScope.dataCurrent.length + " current data points")
          outerScope.drawChartCurrent()
        },
      })

      const queryVoltage = `from(bucket: "telemetry") 
                            |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                            |> filter(fn: (r) => r._measurement == "tlm")
                            |> filter(fn: (r) => r.bms == "123")
                            |> filter(fn: (r) => (r._field == "voltage"))
                            |> group(columns: ["bms"])
                            |> sort(columns: ["_time"])` 
                                                  
      queryApi.queryRows(queryVoltage, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          var datum = { date: Date.parse(o._time), value: o._value }
          outerScope.dataVoltage.push(datum);
        },
        error(error) {
          console.error(error)
          console.log('CHARGE DATA FETCH ERROR')
        },
        complete() {
          outerScope.drawChartVoltage()
          console.log(outerScope.dataCurrent.length + " voltage data points")
        },
      })

      const queryTemperature = `from(bucket: "telemetry") 
                                |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                                |> filter(fn: (r) => r._measurement == "tlm")
                                |> filter(fn: (r) => r.bms == "123")
                                |> filter(fn: (r) => (r._field == "tempBatt"))
                                |> group(columns: ["bms"])
                                |> sort(columns: ["_time"])`                       

      queryApi.queryRows(queryTemperature, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          var datum = { date: Date.parse(o._time), value: o._value }
          outerScope.dataTemperature.push(datum);
        },
        error(error) {
          console.error(error)
          console.log('CHARGE DATA FETCH ERROR')
        },
        complete() {
          outerScope.drawChartTemperature()
          console.log(outerScope.dataCurrent.length + " temperature data points")
        },
      })
      
    },
    drawChartCurrent() {
      let chart = am4core.create(this.$refs.chartdivcurrent, am4charts.XYChart);

      chart.paddingRight = 20;

      chart.data = this.dataCurrent

      let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.renderer.grid.template.location = 0;

      // this makes the data to be grouped
      dateAxis.groupData = true;
      dateAxis.groupCount = 500;

      let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.tooltip.disabled = true;
      valueAxis.renderer.minWidth = 35;

      let series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.dateX = "date";
      series.dataFields.valueY = "value";

      series.tooltipText = "{valueY.value}";
      chart.cursor = new am4charts.XYCursor();

      let scrollbarX = new am4charts.XYChartScrollbar();
      scrollbarX.series.push(series);
      chart.scrollbarX = scrollbarX;

      this.chartCurrent = chart;
      console.log("DRAWN FINISH")
      this.lapTimer()
    },
    drawChartVoltage() {
      let chart = am4core.create(this.$refs.chartdivvoltage, am4charts.XYChart);

      chart.paddingRight = 20;

      chart.data = this.dataVoltage

      let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.renderer.grid.template.location = 0;

      // this makes the data to be grouped
      dateAxis.groupData = true;
      dateAxis.groupCount = 500;

      let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.tooltip.disabled = true;
      valueAxis.renderer.minWidth = 35;

      let series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.dateX = "date";
      series.dataFields.valueY = "value";

      series.tooltipText = "{valueY.value}";
      chart.cursor = new am4charts.XYCursor();

      let scrollbarX = new am4charts.XYChartScrollbar();
      scrollbarX.series.push(series);
      chart.scrollbarX = scrollbarX;

      this.chartVoltage = chart;
    },
    drawChartTemperature() {
      let chart = am4core.create(this.$refs.chartdivtemperature, am4charts.XYChart);

      chart.paddingRight = 20;

      chart.data = this.dataTemperature

      let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.renderer.grid.template.location = 0;

      // this makes the data to be grouped
      dateAxis.groupData = true;
      dateAxis.groupCount = 500;

      let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.tooltip.disabled = true;
      valueAxis.renderer.minWidth = 35;

      let series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.dateX = "date";
      series.dataFields.valueY = "value";

      series.tooltipText = "{valueY.value}";
      chart.cursor = new am4charts.XYCursor();

      let scrollbarX = new am4charts.XYChartScrollbar();
      scrollbarX.series.push(series);
      chart.scrollbarX = scrollbarX;

      this.chartTemperature = chart;
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
      if(this.whiteTheme)
        am4core.useTheme(am4themes_material);
      else
        am4core.useTheme(am4themes_dark);
    },
    disposeCharts() {
      if (this.chartCurrent)
        this.chartCurrent.dispose();
      if (this.chartVoltage)
        this.chartVoltage.dispose();
      if (this.chartTemperature)
        this.chartTemperature.dispose();
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
