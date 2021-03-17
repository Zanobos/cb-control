<template>
  <div class="row">

    <!--<div v-for="i in 15" :key="i" class="col-lg-4 col-md-6">-->
      
    <div v-for="(cbData, index) in cbsData" :key="index" class="col-lg-6 col-md-6">
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
import { mapState } from 'vuex'
const iconsContext = require.context('@/assets/icons/', true, /\.svg$/);
import {InfluxDB, FluxTableMetaData} from '@influxdata/influxdb-client'
import {url, token, org} from '@/config/env'
const queryApi = new InfluxDB({url, token}).getQueryApi(org)
/*
const fluxQuery = `from(bucket: "telemetry") 
                    |> range(start: -5m)
                    |> filter(fn: (r) => r["_measurement"] == "tlm")
                    |> filter(fn: (r) => r["_field"] == "IP")
                    |> distinct()
                    |> yield()`
*/
const fluxQuery = `from(bucket: "telemetry") 
                    |> range(start: -10m)
                    |> filter(fn: (r) => r["_measurement"] == "tlm")
                    |> filter(fn: (r) => r["_field"] == "IP")
                    |> group(columns: ["origin"]) 
                    |> top(n:1, columns: ["_time"])
                    |> yield()`
                
export default {
  components: {
  },
  data() {
    return {
      batteryIconSrc: iconsContext('./batteryAlt.svg'),
      chargerIconSrc: iconsContext('./chargerAlt.svg'),
      cbsList: [],
      // A map would be ideal but maps are not currently supported by v-for https://github.com/vuejs/vue/issues/6644
      cbsData: []
    };
  },
  computed: {
    ...mapState([
      'logged',
      'whiteTheme'
    ])
  },
  watch: {
    whiteTheme(newValue, oldValue) {
      this.toggleImages()
    }
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
      const outerScope = this
      const newCBsList = []
      //console.log('Fetching CBs.');
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          //console.log("CB found ", o)
          //if(o.origin && o.bms)

          /*
          if(newCBsList.some(item => item.cbs == o.origin)) {
            var foundIndex = newCBsList.findIndex(item => item.cbs == o.origin);
            newCBsList[foundIndex] = {cbs: o.origin, bms: o.bms};
          } else {
            newCBsList.push({cbs: o.origin, bms: o.bms})
          }
          */

          newCBsList.push({cbs: o.origin, bms: o.bms})

        },
        error(error) {
          console.log('CBS FETCH ERROR')
          console.error(error)
        },
        complete() {
          //console.log('CBS FETCH SUCCESS')
          outerScope.cbsList = newCBsList
          outerScope.getCBsStatuses()
        },
      })
    },
    getCBsStatuses() {
      var outerScope = this 
      var promises = []

      //console.log("CBs list found: ", this.cbsList)
      //console.log("CBs data: ", this.cbsData)

      this.cbsList.forEach(e => {
        //console.log(`Telemetry for cb: ${e.cbs}`)
        promises.push(outerScope.getStatusPromise(e))       
      })

      Promise.allSettled(promises).then((results) => {
        const resolved = results.filter(r => r.status === "fulfilled");
        const values = resolved.map(r => r.value)
        values.sort( (a, b) => a.cbs.localeCompare(b.cbs));
        outerScope.cbsData = values
      });

    },
    getStatusPromise(cbsListElement) {
      return new Promise((resolve, reject) => {
        var outerscope = {resolve, reject}
        var query = `from(bucket: "telemetry") 
                      |> range(start: -1d)
                      |> filter(fn: (r) => r._measurement == "tlm")
                      |> filter(fn: (r) => r.origin == "${cbsListElement.cbs}")
                      |> filter(fn: (r) =>  r._field == "chgPercent" or 
                        r._field == "capacity" or
                        r._field == "chgTmr" or
                        r._field == "chgTime" )
                      |> group(columns: ["origin", "_field"])
                      |> top(n:1, columns: ["_time"])`;

        queryApi.queryRows(query, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row)
            if(o._field == "chgPercent") cbsListElement.charge = o._value
            if(o._field == "capacity") cbsListElement.ah = o._value
            if(o._field == "chgTmr") cbsListElement.minutesRecharged = o._value
            if(o._field == "chgTime") cbsListElement.hoursToRecharge = o._value
          },
          error(error) {
            console.log(`${cbsListElement.cbs} DATA FETCH ERROR`)
            console.error(error)
            outerscope.reject(new Error(error))
          },
          complete() {
            //console.log(`${e.cbs} DATA FETCH SUCCESS`)
            //console.log(`Telemetry for cb: ${cbsListElement.cbs}`)
            //console.log(cbsListElement)
            outerscope.resolve(cbsListElement)
          },
        })
      });
    }
  },
  mounted() {
    this.getCBs();
    this.toggleImages();
    this.interval = setInterval(function () {
      this.getCBs()
    }.bind(this), 5000)   
  }
};
</script>
<style>

.charged {
  border-left: 75px solid #2dce89
}

.half-charged {
  border-left: 75px solid #fcdd42 
}

.not-charged {
  border-left: 75px solid #f5365c 
}

</style>
