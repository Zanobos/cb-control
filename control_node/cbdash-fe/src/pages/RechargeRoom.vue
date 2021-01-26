<template>
  <div class="row">

    <!--<div v-for="i in 15" :key="i" class="col-lg-4 col-md-6">-->
      
    <div v-for="(cbData, index) in cbsData" :key="index" class="col-lg-4 col-md-6">
      <!-- Add a function in card sass like the one fore the button, use a selector like card-border-$primary where $primary can be any of the one defined in config -->
      <!--<div v-bind:class="['card', 'card-stats', ((i*73)%90) > 15 ? ( ((i*73)%90) > 50 ? 'charged' : 'half-charged') : 'not-charged']" >-->
      <div v-bind:class="['card', 'card-stats', cbData.bms ? (
        cbData.charge ? ( 
          cbData.charge > 15 ? ( 
            cbData.charge > 50 ? 'charged' : 'half-charged') : 
            'not-charged') : 
            '') :
            '']" >
          <div class="card-body text-center">

            <div class="row" style="margin-bottom: 15px">
       
              <div class="col-6 align-items-center d-flex justify-content-center">
                <div class="text-center" style="margin-right: 15px">
                  <img class="vc_single_image-img " :src="chargerIconSrc"
                  width="70px" height="" alt="charger" title="charger" />
                </div>            
                <!--<h1 class="card-text">#{{i}}</h1>-->
                <h1 class="card-text">{{cbData.cbs}}</h1>
              </div>

              <div class="col-6">
                <div class="numbers">
                    <!--<p class="card-category">Charger status</p>-->
                    <!--<h1 class="card-text">Good</h1>-->
                    <p class="card-category">Charge Time</p>
                    <h1 class="card-text">{{cbData.bms ? formatRemainingChargeTime(cbData.minutesRecharged, cbData.hoursToRecharge*60) : "-"}}</h1>
                </div>
              </div>

            </div>

            <div class="row">

              <div class="col-6 align-items-center d-flex justify-content-center">               
                <div class="text-center" style="margin-right: 15px">
                  <img class="vc_single_image-img " :src="batteryIconSrc"
                  width="70px" height="" alt="charger" title="charger" />
                </div>
                <!--<h1 class="card-text">#{{i*3%5}}</h1>-->
                <h1 class="card-text">{{cbData.bms ? cbData.bms : "-"}}</h1>
              </div>

              <div class="col-6">
                <div class="numbers">
                    <p class="card-category">Battery status</p>
                    <!--<h1 class="card-text">{{(i*73)%90}}% {{ (i%5) == 0 ? '(Refill)' : ''}}</h1>-->
                    <h1 class="card-text">{{cbData.bms ? cbData.charge + "%" : "-"}}</h1>
                </div>
              </div>

            </div>

          </div>
      </div>
    </div>

  </div>
</template>
<script>
const iconsContext = require.context('@/assets/icons/', true, /\.svg$/);
import {InfluxDB, FluxTableMetaData} from '@influxdata/influxdb-client'
import {url, token, org} from '@/config/env'
const queryApi = new InfluxDB({url, token}).getQueryApi(org)

const fluxQuery = `from(bucket: "telemetry") 
                    |> range(start: -5m)
                    |> filter(fn: (r) => r["_measurement"] == "tlm")
                    |> filter(fn: (r) => r["_field"] == "IP")
                    |> distinct()
                    |> yield()`

export default {
    components: {
  },
  data() {
    return {
      whiteTheme: false,
      batteryIconSrc: iconsContext('./batteryAlt.svg'),
      chargerIconSrc: iconsContext('./chargerAlt.svg'),
      cbsList: [],
      cbsData: []
    };
  },
  methods: {
    toggleImages() {
      if(this.whiteTheme) {
        this.batteryIconSrc = iconsContext('./battery.svg');
        this.chargerIconSrc = iconsContext('./charger.svg');
      } else{
        this.batteryIconSrc = iconsContext('./batteryAlt.svg');
        this.chargerIconSrc = iconsContext('./chargerAlt.svg');
      }
    },
    formatRemainingChargeTime(minutesCharged, fullChargeInMinutes) {
      var remainingTime = fullChargeInMinutes - minutesCharged
      if(remainingTime < 0) remainingTime = 0
      return this.formatMinutes(remainingTime)
    },
    formatMinutes(minutes) {
      return Math.trunc(minutes/60) + 'h '  + (minutes % 60) + 'm'
    },
    getCBs() {
      var cbs = []
      var outerScope = this
      //console.log('Querying influx for chargers list.');
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          if (!outerScope.cbsList.some(e => e.cbs == o.origin)) {
            outerScope.cbsList.push({cbs: o.origin, bms: o.bms})
          }
        },
        error(error) {
          console.log('CBS FETCH ERROR')
          console.error(error)
        },
        complete() {
          //console.log('CBS FETCH SUCCESS')
          outerScope.getCBsStatuses()
        },
      })
    },
    getCBsStatuses() {
      var outerScope = this
      //console.log("CBs list found: ")
      //console.log(this.cbsList)
      this.cbsList.forEach(e => {
        //console.log(`Telemetry for cb: ${e.cbs}`)
        var query = `from(bucket: "telemetry") 
                      |> range(start: -1d)
                      |> filter(fn: (r) => r._measurement == "tlm")
                      |> filter(fn: (r) => r.origin == "${e.cbs}")
                      |> filter(fn: (r) =>  r._field == "chgPercent" or 
                        r._field == "capacity" or
                        r._field == "chgTmr" or
                        r._field == "chgTime" )
                      |> group(columns: ["origin", "_field"])
                      |> top(n:1, columns: ["_time"])`;

        queryApi.queryRows(query, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row)
            if(o._field == "chgPercent") e.charge = o._value
            if(o._field == "capacity") e.ah = o._value
            if(o._field == "chgTmr") e.minutesRecharged = o._value
            if(o._field == "chgTime") e.hoursToRecharge = o._value
          },
          error(error) {
            console.error(error)
            console.log(`${e.cbs} DATA FETCH ERROR`)
          },
          complete() {
            //console.log(`${e.cbs} DATA FETCH SUCCESS`)
            //console.log(outerScope.cbsData)
            if (!outerScope.cbsData.some(i => i.cbs == e.cbs))
              outerScope.cbsData.push(e)
          },
        })
      })
    }
  },
  mounted() {
    this.getCBs();
    this.$root.$on('whiteTheme', (whiteTheme) => {
      this.whiteTheme = whiteTheme;
      this.toggleImages();
    });
    this.whiteTheme = document.body.classList.contains('white-content');
    this.toggleImages();
    this.interval = setInterval(function () {
      this.getCBs()
    }.bind(this), 5000)   
  }
};
</script>
<style>

.charged {
  border-left: 5px solid #2dce89
}

.half-charged {
  border-left: 5px solid #fcdd42 
}

.not-charged {
  border-left: 5px solid #f5365c 
}

</style>
