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
  >
    <template v-slot="{ inputValue, inputEvents }">
      <card>
        <form @submit.prevent>
          <div class="form-row">
            <base-input class="col-md-2" placeholder="Bms">
              <select v-model="selectedBMS" id="inputState" class="form-control">
                <option selected>BMS 1</option>
                <option>BMS 2</option>
                <option>BMS 3</option>
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

  <div class="row">
    <div class="col-12">
      <card type="chart">
        <template slot="header">
          <div class="row">
            <div class="col-sm-6">
              <h5 class="card-category">Battery statistics</h5>
              <h2 class="card-title">{{selectedBMS}}</h2>
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
        <div class="chart-area" style="height: 100%">
          <line-chart style="height: 100%"
                      ref="bigChart"
                      chart-id="big-line-chart"
                      :chart-data="bigLineChart.chartData"
                      :gradient-colors="bigLineChart.gradientColors"
                      :gradient-stops="bigLineChart.gradientStops"
                      :extra-options="bigLineChart.extraOptions">
          </line-chart>
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
import LineChart from '@/components/Charts/LineChart';
import config from '@/config';
import SeedableRandomDataPointGenerator from '@/components/Charts/seedableRandomDataPointGenerator.js'

export default {
  components: {
    LineChart
  },
  data() {
    return {
      whiteTheme: false,
      selectedBMS: 'BMS 1',
      range: {
        start: null,
        end: null,
      },
      masks: {
        input: 'YYYY-MM-DD h:mm A',
      },
      bigLineChart: {
        allData: [
          [100, 70, 90, 70, 85, 60, 75, 60, 90, 80, 110, 100],
          [80, 120, 105, 110, 95, 105, 90, 100, 80, 95, 70, 120],
          [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130]
        ],
        chartData: {
          datasets: [{ }],
          labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
        },
        activeIndex: 0,
        extraOptions: {
          maintainAspectRatio: false,
          legend: {
            display: false
          },
          responsive: true,
          tooltips: {
            backgroundColor: '#f5f5f5',
            titleFontColor: '#333',
            bodyFontColor: '#666',
            bodySpacing: 4,
            xPadding: 12,
            mode: "nearest",
            intersect: 0,
            position: "nearest"
          },
          scales: {
            yAxes: [{
              barPercentage: 1.6,
              gridLines: {
                drawBorder: false,
                color: 'rgba(29,140,248,0.0)',
                zeroLineColor: "transparent",
              },
              ticks: {
                suggestedMin: 60,
                suggestedMax: 125,
                padding: 20,
                fontColor: "#9a9a9a"
              }
            }],

            xAxes: [{
              barPercentage: 1.6,
              gridLines: {
                drawBorder: false,
                color: 'rgba(225,78,202,0.1)',
                zeroLineColor: "transparent",
              },
              ticks: {
                padding: 20,
                fontColor: "#9a9a9a"
              }
            }]
          },
          plugins: {
            zoom: {
              // Container for pan options
              pan: {
                  // Boolean to enable panning
                  enabled: true,

                  // Panning directions. Remove the appropriate direction to disable
                  // Eg. 'y' would only allow panning in the y direction
                  // A function that is called as the user is panning and returns the
                  // available directions can also be used:
                  //   mode: function({ chart }) {
                  //     return 'xy';
                  //   },
                  mode: 'xy',

              },

              // Container for zoom options
              zoom: {
                  // Boolean to enable zooming
                  enabled: true,

                  // Enable drag-to-zoom behavior
                  drag: false,

                  // Drag-to-zoom effect can be customized
                  // drag: {
                  // 	 borderColor: 'rgba(225,225,225,0.3)'
                  // 	 borderWidth: 5,
                  // 	 backgroundColor: 'rgb(225,225,225)',
                  // 	 animationDuration: 0
                  // },

                  // Zooming directions. Remove the appropriate direction to disable
                  // Eg. 'y' would only allow zooming in the y direction
                  // A function that is called as the user is zooming and returns the
                  // available directions can also be used:
                  //   mode: function({ chart }) {
                  //     return 'xy';
                  //   },
                  mode: 'xy',

                  rangeMin: {
                      // Format of min zoom range depends on scale type
                      x: null,
                      y: null
                  },
                  rangeMax: {
                      // Format of max zoom range depends on scale type
                      x: null,
                      y: null
                  },

                  // Speed of zoom via mouse wheel
                  // (percentage of zoom on a wheel event)
                  speed: 0.1,

                  // Minimal zoom distance required before actually applying zoom
                  threshold: 2,

                  // On category scale, minimal zoom level before actually applying zoom
                  sensitivity: 3,

                  // Function called while the user is zooming
                  //onZoom: function({chart}) { console.log(`I'm zooming!!!`); },
                  // Function called once zooming is completed
                  //onZoomComplete: function({chart}) { console.log(`I was zoomed!!!`); }
              }
            }
          }
        },
        gradientColors: config.colors.primaryGradient,
        gradientStops: [1, 0.4, 0],
        categories: []
      },
    };
  },
  methods: {
    initBigChart(index) {
      let chartData = {
        datasets: [{
          fill: true,
          borderColor: config.colors.primary,
          borderWidth: 2,
          borderDash: [],
          borderDashOffset: 0.0,
          pointBackgroundColor: config.colors.primary,
          pointBorderColor: 'rgba(255,255,255,0)',
          pointHoverBackgroundColor: config.colors.primary,
          pointBorderWidth: 20,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 15,
          pointRadius: 4,
          data: this.bigLineChart.allData[index]
        }],
        labels: ['00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00']
      }
      this.$refs.bigChart.updateGradients(chartData);
      this.bigLineChart.chartData = chartData;
      this.bigLineChart.activeIndex = index;
    }
  },
  mounted() {
    this.$root.$on('whiteTheme', (whiteTheme) => {
      this.whiteTheme = whiteTheme;
    });
    this.whiteTheme = document.body.classList.contains('white-content');
    this.initBigChart(0);
  }
};
</script>
<style>
</style>
