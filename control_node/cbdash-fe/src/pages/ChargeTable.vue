<template>
  <div>

    <card>
      <form @submit.prevent>
        <div class="form-row">
          <base-input class="col-md-1" placeholder="Bms">
            <select v-model="selectedBMS" id="inputState" class="form-control">
              <option
                v-for="(bms) in getBMSs"
                :value="bms"
                :key="bms"
              >{{bms}}</option>
            </select>
          </base-input>

          <base-input class="col-md-2" placeholder="Measure">
            <select v-model="selectedMeasure" class="form-control">
              <option value="Current">Current</option>
              <option value="Voltage">Voltage</option>
              <option value="Temperature">Temperature</option>
            </select>
          </base-input>

          <div class="col-md-3">
            <vc-date-picker
              v-model="range.start"
              mode="dateTime"
              :color="calendarColor"
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
              :color="calendarColor"
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

    <div v-if="items.length > 0" class="row">
      <div class="col-12">
        <card :title="'Charge data for bms ' + selectedBMS">
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
      selectedBMS: '',
      selectedMeasure: 'Current',
      perPage: 15,
      currentPage: 1,
      items: [],
      range: {
        start: new Date((new Date((new Date).setHours(0))).setMinutes(0)),
        end: new Date((new Date((new Date).setHours(23))).setMinutes(59)),
      }
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
      'logged',
      'whiteTheme',
      'calendarColor'
    ])
  },
  methods: {
    dateEquals(a, b) {
      // https://stackoverflow.com/questions/4587060/determining-date-equality-in-javascript
      return (a >= b && a <= b)
    },
    buildQuery() {
      var metric = 'current'
      if(this.selectedMeasure == 'Voltage')
        metric = 'voltage'
      else if(this.selectedMeasure == 'Temperature')
        metric = 'tempBatt'

      return `from(bucket: "telemetry") 
              |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
              |> filter(fn: (r) => r._measurement == "tlm")
              |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
              |> filter(fn: (r) => r._field == "${metric}") 
              |> group()
              |> sort(columns: ["_time"])`
    },
    loadData() {
      var outerScope = this
      this.items = []

      const dataQuery = this.buildQuery()

      //console.log('Querying influx for charge data.')
      //console.log(dataQuery)
      queryApi.queryRows(dataQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          var datum = {}
          //datum.Time = Date.parse(o._time).toGMTString()
          var date = new Date(o._time)
          //datum.Time = date.toGMTString()
          datum.Time = date.toLocaleString()
          //datum.Time = o._time
          //datum.Field = o._field
          if(outerScope.selectedMeasure == 'Current')
            datum.Current = o._value.toFixed(1)
          else if(outerScope.selectedMeasure == 'Voltage')
            datum.Voltage = o._value.toFixed(1)
          else if(outerScope.selectedMeasure == 'Temperature')
            datum.Temperature = o._value.toFixed(1)
          datum.CB = o.origin
          //outerScope.items.push(JSON.parse(o.jsonStr))
          outerScope.items.push(datum)
        },
        error(error) {
          console.error(error)
          console.log('CHARGE DATA FETCH ERROR')
        },
        complete() {
          //console.log('CHARGE DATA FETCH SUCCESS')
        },
      })
      
    }
  }
};
</script>
<style src="@/assets/css/input-bar.css"/>
