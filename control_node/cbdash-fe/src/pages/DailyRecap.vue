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

    <div v-if="loaded" class="row">

      <div class="col-md-4">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Min. Voltage </h5>
          <h1 class="card-text">
            <i class="fas fa-bolt spaced-icon"></i>
            {{ minVoltage | numeralFormat('0[.]00') }} V</h1> 
        </card>
      </div>

      <div class="col-md-4">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Max. Ampere </h5>
          <h1 class="card-text">
            <i class="fas fa-bolt spaced-icon"></i>
            {{ maxCurrent | numeralFormat('0[.]00') }} A</h1> 
        </card>
      </div>
    
      <div class="col-md-4">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Uptime </h5>
          <h1 class="card-text">
            <i class="tim-icons icon-watch-time spaced-icon"></i>
            {{totalTmr}} h</h1> 
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
          <h5 class="card-category"> Min. Temperature </h5>
          <h1 class="card-text">
            <i class="fas fa-temperature-low spaced-icon"></i>
            {{minTempBatt | numeralFormat('0[.]00') }}° C V</h1> 
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
          <h5 class="card-category"> Charge Time </h5>
          <h1 class="card-text">
            <i class="fas fa-hourglass-half spaced-icon"></i>
            {{chgTmr}} h</h1> 
        </card>
      </div>

    </div>

    <div v-if="items.length > 0" class="row">
      <div class="col-12">
        <card :title="selectedBMS + ' errors'">
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
    </div>

  </div>
</template>
<script>
import Card from '@/components/Cards/Card.vue';
import {InfluxDB, FluxTableMetaData} from '@influxdata/influxdb-client'
import {url, token, org} from '@/influx/env'
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

      cb: '',
      chgTmr: '',
      totalTmr: '',
      minVoltage: '',
      maxCurrent: '',
      minTempBatt: '',
      maxTempBatt: '',
      loaded: false,

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
      this.whiteTheme = whiteTheme;
    });
  },
  methods: {
    checkInput() {
      if(this.selectedBMS != '' && this.range.start != '' && this.range.end != '')
        this.loadData()
    },
    loadData() {
      var outerScope = this
      this.loaded = false
      this.items = []

      const dataQuery = `from(bucket: "telemetry") 
                          |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                          |> filter(fn: (r) => r._measurement == "tlm" and r.bms == "${this.selectedBMS}" and 
                              (r._field == "totalTmr" or 
                              r._field == "chgTmr" ))
                          |> top(n:1, columns: ["_time"])
                          |> yield(name: "times")

                          from(bucket: "telemetry") 
                          |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                          |> filter(fn: (r) => r._measurement == "tlm" and r.bms == "${this.selectedBMS}" and 
                              (r._field == "tempBatt" or 
                              r._field == "current"
                              ))
                          |> max()
                          |> yield(name: "max")

                          from(bucket: "telemetry") 
                          |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                          |> filter(fn: (r) => r._measurement == "tlm" and r.bms == "${this.selectedBMS}" and 
                              (r._field == "tempBatt" or 
                              r._field == "voltage"
                              ))
                          |> min()
                          |> yield(name: "min")`

      const errorQuery = `import "json"

                          from(bucket: "telemetry") 
                          |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                          |> filter(fn: (r) => r._measurement == "tlm" and r.bms == "${this.selectedBMS}" and r._field == "BMSerror")
                          |> filter(fn: (r) => r._value != 0)
                          |> sort(columns: ["_time"])
                          |> map(fn: (r) => ({ r with
                              jsonStr: string(v: json.encode(v: {"Time":r._time,"Error":r._value,"BMS":r.bms,"CB":r.origin}))}))
                          |> yield(name: "errors")`

      console.log('Querying influx for daily recap.');
      console.log(dataQuery)
      console.log(errorQuery)
      queryApi.queryRows(dataQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)

          outerScope.cb = o.origin

          switch (o.result) {
            case 'times':
              if(o._field == 'chgTmr')
                outerScope.chgTmr = o._value
              if(o._field == 'totalTmr')
                outerScope.totalTmr = o._value
              break
            case 'min':
              if(o._field == 'tempBatt')
                outerScope.minTempBatt = o._value
              if(o._field == 'voltage')
                outerScope.minVoltage = o._value
              break
            case 'max':
              if(o._field == 'tempBatt')
                outerScope.maxTempBatt = o._value
              if(o._field == 'current')
                outerScope.maxCurrent = o._value
              break

          }
        },
        error(error) {
          console.error(error)
          console.log('RECAP FETCH ERROR')
        },
        complete() {
          console.log('RECAP FETCH SUCCESS')
          outerScope.loaded = true;
        },
      })

      queryApi.queryRows(errorQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          var errLine = JSON.parse(o.jsonStr)
          if(!isNaN(parseInt(errLine._value))) {
            var errCode = parseInt(errLine._value)
            errCode = errCode >> 7
            if(errCode == 1) {
              errLine._value = "Refill"
            }
          }
          outerScope.items.push(errLine)
        },
        error(error) {
          console.error(error)
          console.log('INFO FETCH ERROR')
        },
        complete() {
          console.log('INFO FETCH SUCCESS')
        },
      })
      
    }
  }
};
</script>
<style>

#btnFetch {
  margin-top: 0px;
  margin-bottom: 0px;
  height: 38px;
}

</style>
