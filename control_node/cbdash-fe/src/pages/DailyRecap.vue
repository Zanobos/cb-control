<template>
  <div>
    <vc-date-picker 
      v-model="startDate"
      :masks="masks"
      color="green"
      :is-dark="!whiteTheme"
      locale="en"
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
                placeholder="day"
                :value="inputValue"
                v-on="inputEvents"
              />

              <div class="form-group col-md-3">
                <base-button id="btnFetch" @click="checkInput" type="primary-nogradient">Apply time range</base-button>
              </div>
            </div>
          </form>
        </card>
      </template>
    </vc-date-picker>

    <div v-if="loadedData" class="row">

      <div class="col-md-3">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Min. Voltage </h5>
          <h1 class="card-text">
            <i class="fas fa-bolt spaced-icon"></i>
            {{ minVoltage | numeralFormat('0[.]00') }} V</h1> 
        </card>
      </div>

      <div class="col-md-3">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Max. Ampere </h5>
          <h1 class="card-text">
            <i class="fas fa-bolt spaced-icon"></i>
            {{ maxCurrent | numeralFormat('0[.]00') }} A</h1> 
        </card>
      </div>
    
      <div class="col-md-3">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Uptime </h5>
          <h1 class="card-text">
            <i class="tim-icons icon-watch-time spaced-icon"></i>
            {{formatMinutes(totalTmr)}}</h1> 
        </card>
      </div>

      <div class="col-md-3">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Cycles </h5>
          <h1 class="card-text">
            <i class="tim-icons icon-refresh-02 spaced-icon"></i>
            {{numCycles}}</h1> 
        </card>
      </div>

      <div class="col-md-3">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Min. Temperature </h5>
          <h1 class="card-text">
            <i class="fas fa-temperature-low spaced-icon"></i>
            {{minTempBatt | numeralFormat('0[.]00') }}° C</h1> 
        </card>
      </div>

      <div class="col-md-3">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Max. Temperature </h5>
          <h1 class="card-text">
            <i class="fas fa-temperature-high spaced-icon"></i>
            {{ maxTempBatt | numeralFormat('0[.]00') }}° C
          </h1> 
        </card>
      </div>

      <div class="col-md-3">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Charger N° </h5>
          <h1 class="card-text">
            <i class="fas fa-charging-station spaced-icon"></i>
            {{cb}}</h1> 
        </card>
      </div>

      <div class="col-md-3">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Charge Time </h5>
          <h1 class="card-text">
            <i class="fas fa-hourglass-half spaced-icon"></i>
            {{formatMinutes(chgTmr)}}</h1> 
        </card>
      </div>

    </div>

    <div class="row">
      <div v-if="loadedErrors" class="col-md-8">
        <!--<card :title="'BMS ' + selectedBMS + ' errors'">-->
        <card>
          <h2 class="card-title">BMS {{loadedBMS}} - Errors</h2>
          <div class="table-responsive">
            <b-table 
              striped 
              hover 
              sticky-header
              id="my-table"
              :items="items"
              :per-page="perPage"
              :current-page="currentPage">
            </b-table>
            <b-pagination
              v-model="currentPage"
              :total-rows="rows"
              :per-page="perPage"
              aria-controls="my-table"
            ></b-pagination>
          </div>
        </card>
      </div>

      <div v-if="loadedSettings" class="col-md-4">
        <card>
          <h2 class="card-title">
            <i class="tim-icons icon-notes spaced-icon"></i>
            BMS {{loadedBMS}} - Settings</h2>
          <b-table hover :items="getSettings" thead-class="d-none"></b-table>
        </card>
      </div>
    </div>

  </div>
</template>
<script>
import Card from '@/components/Cards/Card.vue';
import {InfluxDB, FluxTableMetaData} from '@influxdata/influxdb-client'
import {url, token, org} from '@/config/env'
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
      items: [],
      settings: {},

      cb: '',
      chgTmr: '',
      minVoltage: '',
      maxCurrent: '',
      minTempBatt: '',
      maxTempBatt: '',
      numCycles: '',
      totalTmr: '',


      loadedData: false,
      loadedSettings: false,
      loadedErrors: false,
      loadedBMS: '',

      whiteTheme: false,
      startDate: '',
      endDate: '',
      masks: {
        input: 'YYYY-MM-DD',
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
    getSettings() {
      return [
        { key: 'Nominal voltage', value: this.settings.vNominal },
        { key: 'Charge curve', value: this.settings.tech },
        { key: 'Charge time', value: this.settings.chgTime },
        { key: 'Manufacturer', value: this.settings.man },
        { key: 'Year', value: this.settings.yearConst },
        { key: 'Type', value: this.settings.batt_type },
        { key: 'Capacity', value: this.settings.cNominal }
      ]
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
      this.whiteTheme = whiteTheme;
    });
  },
  methods: {
    checkInput() {
      if(this.selectedBMS != '' && this.startDate != '') {
        var end = new Date(this.startDate)
        end.setDate(end.getDate() + 1)
        this.endDate = end
        this.loadData()
      }
    },
    formatMinutes(minutes) {
      return Math.trunc(minutes/60) + 'h '  + (minutes % 60) + 'm'
    },
    loadData() {    
      var outerScope = this
      var settings = {}
      var cycleTimes = []
      this.items = []
      this.loadedData = false
      this.loadedSettings = false
      this.loadedErrors = false
      this.loadedBMS = this.selectedBMS
      
      const infoQuery = `from(bucket: "telemetry") 
                        |> range(start: ${this.startDate.toISOString()}, stop: ${this.endDate.toISOString()})
                        |> filter(fn: (r) => r._measurement == "tlm")
                        |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
                        |> filter(fn: (r) => r._field == "chgTmr")
                        |> group()
                        |> top(n:1, columns: ["_time"])
                        |> yield(name: "timeCharged")

                        from(bucket: "telemetry") 
                        |> range(start: ${this.startDate.toISOString()}, stop: ${this.endDate.toISOString()})
                        |> filter(fn: (r) => r._measurement == "tlm")
                        |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
                        |> filter(fn: (r) => r._field == "current")
                        |> group()
                        |> max()
                        |> yield(name: "maxCurrent")

                        from(bucket: "telemetry") 
                        |> range(start: ${this.startDate.toISOString()}, stop: ${this.endDate.toISOString()})
                        |> filter(fn: (r) => r._measurement == "tlm")
                        |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
                        |> filter(fn: (r) => r._field == "tempBatt")
                        |> group()
                        |> max()
                        |> yield(name: "maxTempBatt")

                        from(bucket: "telemetry") 
                        |> range(start: ${this.startDate.toISOString()}, stop: ${this.endDate.toISOString()})
                        |> filter(fn: (r) => r._measurement == "tlm")
                        |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
                        |> filter(fn: (r) => r._field == "voltage")
                        |> group()
                        |> min()
                        |> yield(name: "minVoltage")

                        from(bucket: "telemetry") 
                        |> range(start: ${this.startDate.toISOString()}, stop: ${this.endDate.toISOString()})
                        |> filter(fn: (r) => r._measurement == "tlm")
                        |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
                        |> filter(fn: (r) => r._field == "tempBatt")
                        |> group()
                        |> min()
                        |> yield(name: "minTempBatt")`

      const settingsQuery = `from(bucket: "telemetry") 
                            |> range(start: -10y)
                            |> filter(fn: (r) => r._measurement == "tlm")
                            |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
                            |> filter(fn: (r) => 
                              r._field == "vNominal" or 
                              r._field == "tech" or 
                              r._field == "chgTime" or 
                              r._field == "man" or 
                              r._field == "yearConst" or 
                              r._field == "batt_type" or 
                              r._field == "cNominal" )
                            |> group(columns: ["_field"])
                            |> top(n:1, columns: ["_time"])
                            |> yield(name: "info")`

      const cyclesQuery = `from(bucket: "telemetry")
                          |> range(start: ${this.startDate.toISOString()}, stop: ${this.endDate.toISOString()})
                          |> filter(fn: (r) => r._measurement == "tlm" )
                          |> filter(fn: (r) => r.bms == "1" )
                          |> filter(fn: (r) => r._field == "totalTmr" )
                          |> top(n:1, columns: ["_time"])`

      const errorQuery = `from(bucket: "telemetry") 
                          |> range(start: ${this.startDate.toISOString()}, stop: ${this.endDate.toISOString()})
                          |> filter(fn: (r) => r._measurement == "tlm" and r.bms == "${this.selectedBMS}" and r._field == "BMSerror")
                          |> filter(fn: (r) => r._value != 0)
                          |> group()
                          |> sort(columns: ["_time"])
                          |> yield(name: "errors")`

      //console.log('Querying influx for daily recap.');
      //console.log(infoQuery)
      //console.log(settingsQuery)
      //console.log(cyclesQuery)
      //console.log(errorQuery)
      queryApi.queryRows(infoQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)

          outerScope.cb = o.origin
          switch (o.result) {
            case 'timeCharged':
              if(o._field == 'chgTmr')
                outerScope.chgTmr = o._value
              break
            case 'minVoltage':
              if(o._field == 'voltage')
                outerScope.minVoltage = o._value
              break
            case 'minTempBatt':
              if(o._field == 'tempBatt')
                outerScope.minTempBatt = o._value
              break        
            case 'maxCurrent':  
              if(o._field == 'current')
                outerScope.maxCurrent = o._value
              break
            case 'maxTempBatt':
              if(o._field == 'tempBatt')
                outerScope.maxTempBatt = o._value
              break
          }
        },
        error(error) {
          console.error(error)
          console.log('INFO FETCH ERROR')
        },
        complete() {
          //console.log('INFO FETCH SUCCESS')
          outerScope.loadedData = true;
        },
      })

      queryApi.queryRows(settingsQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          if(o._field == 'vNominal')
            settings.vNominal = o._value
          if(o._field == 'tech')
            settings.tech = o._value
          if(o._field == 'chgTime')
            settings.chgTime = o._value
          if(o._field == 'man')
            settings.man = o._value
          if(o._field == 'yearConst')
            settings.yearConst = o._value
          if(o._field == 'batt_type')
            settings.batt_type = o._value
          if(o._field == 'cNominal')
            settings.cNominal = o._value
        },
        error(error) {
          console.log('SETTINGS FETCH ERROR')
          console.error(error)
        },
        complete() {
          //console.log('SETTINGS FETCH SUCCESS') 
          outerScope.settings = settings
          outerScope.loadedSettings = true;
        },
      })

      queryApi.queryRows(cyclesQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          if(o.numCycle && o._field == 'totalTmr')
            cycleTimes.push(Number(o._value) || 0)
        },
        error(error) {
          console.log('CYCLES FETCH ERROR')
          console.error(error)
        },
        complete() {
          //console.log('CYCLES FETCH SUCCESS')
          outerScope.totalTmr = cycleTimes.reduce((a,b) => a + b, 0)
          outerScope.numCycles = cycleTimes.length
        },
      })

      queryApi.queryRows(errorQuery, {
        next(row, tableMeta) {
          /*
          const o = tableMeta.toObject(row)
          var errLine = JSON.parse(o.jsonStr)
          if(!isNaN(parseInt(errLine._value))) {
            var errCode = parseInt(errLine._value)
            errCode = errCode >> 7
            if(errCode == 1) {
              errLine._value = "Refill"
            }
          }
          */
          const o = tableMeta.toObject(row)
          //outerScope.items.push(JSON.parse(o.jsonStr))
          var datum = {}
          var date = new Date(o._time)
          datum.Time = date.toGMTString()
          if(!isNaN(parseInt(o._value))) {
            var errCode = parseInt(o._value)
            errCode = errCode >> 7
            if(errCode == 1) {
              o._value = "Refill"
            }
          }
          datum.Error = o._value
          //datum.BMS = o.bms
          datum.CB = o.origin
          outerScope.items.push(datum)

          //outerScope.items.push(errLine)
        },
        error(error) {
          console.log('ERRORS FETCH ERROR')
          console.error(error)
        },
        complete() {
          //console.log('ERRORS FETCH SUCCESS')
          outerScope.loadedErrors = true;
        },
      })
      
    }
  }
};
</script>
<style src="@/assets/css/input-bar.css"/>
