<template>
  <div class="row"> 
    <div v-for="(cbData, index) in cbsData" :key="index" class="col-lg-6 col-md-6">
      <!-- Add a function in card sass like the one for the button, use a selector like card-border-$primary where $primary can be any of the ones defined in config -->
      <div v-bind:class="cbData | computeBMSCardCssClass" >
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
                    <p class="card-category">Charge Time</p>
                    <h1 class="card-text">{{computeChargeTime(cbData)}}</h1>
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
                    <h1 class="card-text">
                      <i v-if="(cbData.bms && cbData.bmsError) || (cbData.cbError && !cbData.bms)" class="fas fa-exclamation-triangle" style="color: red;"></i>
                      {{cbData | computeBMSstatus}}
                    </h1>
                    
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
import {url, token, org, presenceLookbackTime} from '@/config/env'
const queryApi = new InfluxDB({url, token}).getQueryApi(org)

const fluxQuery = `from(bucket: "telemetry") 
                    |> range(start: -${presenceLookbackTime})
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
  filters: {
    computeBMSstatus(cbData) {
      //console.log("Computing bms status")
      //console.log(cbData)
      if(cbData.bms) {
        var status = cbData.charge + "%"
        if(cbData.bmsError) {
          var errCode = cbData.bmsError >> 7
          if(errCode == 1) {
            status += " Refill"
          }
          else
            status += " Error"
        }
        return status
      }
        
      else if (cbData.cbError) {
        const errCode = cbData.cbError
        if(errCode == 1)
          return "CAN error"
        else if(errCode == 2)
          return "AUX error"
        else if(errCode == 3)
          return "CAN & AUX error"
        else if(errCode == 4)
          return "PWR error"
        else if(errCode == 5)
          return "PWR, CAN error"
        else if(errCode == 6)
          return "PWR, AUX error"
        else
          return "Error"
      }  
      else
        return "-"
    },
    computeBMSCardCssClass(cbData) {
      if(!cbData.bms || !cbData.charge)
        return ['card', 'card-stats', 'disconnected']
      if(cbData.charge < 80)
        return ['card', 'card-stats', 'not-charged']
      if(cbData.charge < 100)
        return ['card', 'card-stats', 'half-charged']
      else
        return ['card', 'card-stats', 'charged']
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
    computeChargeTime(cbData) {
      if(!cbData.bms) return "-"
      if(cbData.charge && cbData.charge == 100) return this.formatMinutes(0)
      return this.formatRemainingChargeTime(cbData.minutesRecharged, cbData.hoursToRecharge*60)
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
          //console.log(newCBsList)
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
        const outerScope = {resolve, reject}
        const bmsStatusQuery = `from(bucket: "telemetry") 
                              |> range(start: -1d)
                              |> filter(fn: (r) => r._measurement == "tlm")
                              |> filter(fn: (r) => r.origin == "${cbsListElement.cbs}")
                              |> filter(fn: (r) =>  r._field == "chgPercent" or 
                                r._field == "capacity" or
                                r._field == "chgTmr" or
                                r._field == "chgTime" or
                                r._field == "bmsError" or
                                r._field == "cbError" )
                              |> group(columns: ["origin", "_field"])
                              |> top(n:1, columns: ["_time"])`;

        queryApi.queryRows(bmsStatusQuery, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row)
            if(o._field == "chgPercent") cbsListElement.charge = o._value
            if(o._field == "capacity") cbsListElement.ah = o._value
            if(o._field == "chgTmr") cbsListElement.minutesRecharged = o._value
            if(o._field == "chgTime") cbsListElement.hoursToRecharge = o._value
            if(o._field == "bmsError") cbsListElement.bmsError = o._value
            if(o._field == "cbError") cbsListElement.cbError = o._value
          },
          error(error) {
            console.log(`${cbsListElement.cbs} DATA FETCH ERROR`)
            console.error(error)
            outerScope.reject(new Error(error))
          },
          complete() {
            //console.log(`${cbsListElement.cbs} DATA FETCH SUCCESS`)
            //console.log(`Telemetry for cb: ${cbsListElement.cbs}`)
            //console.log(cbsListElement)
            outerScope.resolve(cbsListElement)
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
  border-left: 75px solid #fc8c42 
}

.not-charged {
  border-left: 75px solid #f5365c 
}

.disconnected {
  border-left: 75px solid #035afc
}

</style>
