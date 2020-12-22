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
    :max-date="new Date()"
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
          </div>
        </form>
      </card>
    </template>
  </vc-date-picker>

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

  <div v-if="dataTension.length > 0" class="row">
    <div class="col-12">
      <card type="chart">
        <template slot="header">
          <div class="row">
            <div class="col-sm-6">
              <h5 class="card-category">Battery statistics</h5>
              <h2 class="card-title">BMS {{selectedBMS}} - Tension (V)</h2>
            </div>
          </div>
        </template>
        <div class="chart-area" style="height: 100%">
          <div class="hello" ref="chartdivtension">
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
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

//am4core.useTheme(am4themes_animated);

const queryApi = new InfluxDB({url, token}).getQueryApi(org)

export default {
    components: {
        Card
  },
  data() {
    return {
      selectedBMS: '',
      perPage: 15,
      currentPage: 1,
      dataCurrent: [],
      dataTension: [],
      dataTemperature: [],

      chartCurrent: null,
      chartTension: null,
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
      this.checkInput()
    },
    selectedBMS: function(val) {
      this.checkInput()
    }
  },
  mounted() {
    this.$root.$on('whiteTheme', (whiteTheme) => {
      this.whiteTheme = whiteTheme;
    });
    this.whiteTheme = document.body.classList.contains('white-content');
  },
  methods: {
    checkInput() {
      if(this.selectedBMS != '' && this.range.start != '' && this.range.end != '')
        this.loadData()
    },
    loadData() {
      var outerScope = this

      const dataQuery = `import "json"
                         from(bucket: "telemetry") 
                         |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                         |> drop(columns: ["_start", "_stop"])
                         |> filter(fn: (r) => r._measurement == "tlm" and r.bms == "${this.selectedBMS}" and 
                            (r._field == "voltage" or 
                            r._field == "current" or
                            r._field == "tempBatt") )
                         |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
                         |> map(fn: (r) => ({ r with
                            jsonStr: string(v: json.encode(v: {"Time":r._time,"Field":r._field,"Value":r._value,"CB":r.origin}))}))
                         |> yield()`

      console.log('Querying influx for charge data.');
      queryApi.queryRows(dataQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          var e = JSON.parse(o.jsonStr)
          if(o._field == 'current') {
            outerScope.dataCurrent.push({ date: new Date(e.Time), value: e.Value });
          }
          if(o._field == 'voltage') {
            outerScope.dataTension.push({ date: new Date(e.Time), value: e.Value });
          }
          if(o._field == 'tempBatt') {
            outerScope.dataTemperature.push({ date: new Date(e.Time), value: e.Value });
          }
        },
        error(error) {
          console.error(error)
          console.log('CHARGE DATA FETCH ERROR')
        },
        complete() {
          console.log('CHARGE DATA FETCH SUCCESS')
          console.log(outerScope.dataCurrent.length)
          outerScope.drawChartCurrent()
          outerScope.drawChartTension()
          outerScope.drawChartTemperature()
        },
      })
      
    },
    drawChartCurrent() {
      let chart = am4core.create(this.$refs.chartdivcurrent, am4charts.XYChart);

      chart.paddingRight = 20;

      chart.data = this.dataCurrent

      let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.renderer.grid.template.location = 0;

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
    },
    drawChartTension() {
      let chart = am4core.create(this.$refs.chartdivtension, am4charts.XYChart);

      chart.paddingRight = 20;

      chart.data = this.dataTension

      let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.renderer.grid.template.location = 0;

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

      this.chartTension = chart;
    },
    drawChartTemperature() {
      let chart = am4core.create(this.$refs.chartdivtemperature, am4charts.XYChart);

      chart.paddingRight = 20;

      chart.data = this.dataTemperature

      let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.renderer.grid.template.location = 0;

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
  },
  beforeDestroy() {
    if (this.chartCurrent)
      this.chartCurrent.dispose();
    if (this.chartTension)
      this.chartTension.dispose();
    if (this.chartTemperature)
      this.chartTemperature.dispose();
  }
};
</script>
<style scoped>
.hello {
  width: 100%;
  height: 500px;
}
</style>
