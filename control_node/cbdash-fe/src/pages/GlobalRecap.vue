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
        </div>
      </form>
    </card>

    <div v-if="loadedData" class="row">
      <div class="col-md-6">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Uptime </h5>
          <h1 class="card-text">
            <i class="tim-icons icon-watch-time spaced-icon"></i>
            {{formatMinutes(totalTmr)}}</h1> 
        </card>
      </div>

      <div class="col-md-6">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Cycles </h5>
          <h1 class="card-text">
            <i class="tim-icons icon-refresh-02 spaced-icon"></i>
            {{numCycles}}</h1> 
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
import { mapState } from 'vuex'
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
      perPage: 15,
      currentPage: 1,
      items: [],
      settings: {},
      loaded: false,
      selectedBMS: '',
      numCycles: '',
      totalTmr: '',
      totalChgTime: '',

      loadedData: false,
      loadedSettings: false,
      loadedErrors: false,
      loadedBMS: '',

      range: {
        start: null,
        end: null,
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
    getSettings() {
      return [
        { key: 'Serial Number', value: (this.alias[this.loadedBMS] || "") },
        { key: 'Nominal voltage', value: this.settings.vNominal },
        { key: 'Charge curve', value: this.settings.tech },
        { key: 'Charge time', value: this.formatMinutes(this.totalChgTime) },
        { key: 'Manufacturer', value: this.settings.man },
        { key: 'Year', value: this.settings.yearConst },
        { key: 'Type', value: this.settings.batt_type },
        { key: 'Capacity', value: this.settings.cNominal }
      ]
    },
    ...mapState([
      'alias',
      'logged',
      'whiteTheme',
      'calendarColor'
    ])
  },
  watch: {
    selectedBMS: function(val) {
      this.loadData();
    }
  },
  methods: {
    formatMinutes(minutes) {
      return Math.trunc(minutes/60) + 'h '  + (minutes % 60) + 'm'
    },
    loadData() {
      var outerScope = this
      var settings = {}
      var cycleTimes = []
      var partialChargeTimes = []
      this.items = []
      this.loadedData = false
      this.loadedSettings = false
      this.loadedErrors = false
      this.loadedBMS = this.selectedBMS
      this.numCycles = 0
      this.totalTmr = 0

      const cyclesQuery = `from(bucket: "telemetry")
                          |> range(start: -10y)
                          |> filter(fn: (r) => r._measurement == "tlm" )
                          |> filter(fn: (r) => r.bms == "${this.selectedBMS}" )
                          |> filter(fn: (r) => r._field == "totalTmr" or
                            r._field == "chgTime" )
                          |> top(n:1, columns: ["_value"])`                  

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

      const errorQuery = `from(bucket: "telemetry") 
                          |> range(start: -10y)
                          |> filter(fn: (r) => r._measurement == "tlm" and r.bms == "${this.selectedBMS}" and r._field == "BMSerror")
                          |> filter(fn: (r) => r._value != 0)
                          |> group()
                          |> sort(columns: ["_time"])
                          |> yield(name: "errors")`

      //console.log('Querying influx for global recap.');
      //console.log(cyclesQuery)
      //console.log(settingsQuery)
      //console.log(errorQuery)

      queryApi.queryRows(cyclesQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          if(o.numCycle && o._field == 'totalTmr')
            cycleTimes.push(Number(o._value) || 0)
          if(o._field == 'chgTime') {
            partialChargeTimes.push(Number(o._value) || 0)
          }
        },
        error(error) {
          console.log('CYCLES FETCH ERROR')
          console.error(error)
        },
        complete() {
          //console.log('CYCLES FETCH SUCCESS')
          outerScope.totalTmr = cycleTimes.reduce((a,b) => a + b, 0)
          outerScope.totalChgTime = partialChargeTimes.reduce((a,b) => a + b, 0)
          outerScope.numCycles = cycleTimes.length > 0 ? cycleTimes.length - 1 : 0
          outerScope.loadedData = true;
        },
      })


      queryApi.queryRows(settingsQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          switch (o._field) {
            case 'vNominal':
              settings.vNominal = o._value
              break
            case 'tech':
              settings.tech = o._value
              break
            case 'chgTime':
              settings.chgTime = o._value
              break
            case 'man':
              settings.man = o._value
              break
            case 'yearConst':
              settings.yearConst = o._value
              break
            case 'batt_type':
              settings.batt_type = o._value
              break
            case 'cNominal':
              settings.cNominal = o._value
              break
          }
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

      queryApi.queryRows(errorQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          //outerScope.items.push(JSON.parse(o.jsonStr))
          var datum = {}
          var date = new Date(o._time)
          //datum.Time = date.toGMTString()
          datum.Time = date.toLocaleString()
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
<style>

.padded-card {
  padding: 25px 0px 35px 0px;
}

.spaced-icon {
  margin-right: 15px;
}

</style>
