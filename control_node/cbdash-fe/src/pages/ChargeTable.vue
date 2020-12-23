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
    this.whiteTheme = document.body.classList.contains('white-content');
  },
  methods: {
    checkInput() {
      if(this.selectedBMS != '' && this.range.start != '' && this.range.end != '')
        this.loadData()
    },
    loadData() {
      var outerScope = this

      const dataQuery = `from(bucket: "telemetry") 
                         |> range(start: ${this.range.start.toISOString()}, stop: ${this.range.end.toISOString()})
                         |> filter(fn: (r) => r._measurement == "tlm")
                         |> filter(fn: (r) => r.bms == "${this.selectedBMS}")
                         |> filter(fn: (r) =>
                            r._field == "voltage" or 
                            r._field == "current" or
                            r._field == "tempBatt") 
                         |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
                         |> yield()`

      console.log('Querying influx for charge data.')
      console.log(dataQuery)
      queryApi.queryRows(dataQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          var datum = {}
          //datum.Time = Date.parse(o._time)
          datum.Time = o._time
          datum.Field = o._field
          datum.Value = o._value
          datum.CB = o.origin
          //outerScope.items.push(JSON.parse(o.jsonStr))
          outerScope.items.push(datum)
        },
        error(error) {
          console.error(error)
          console.log('CHARGE DATA FETCH ERROR')
        },
        complete() {
          console.log('CHARGE DATA FETCH SUCCESS')
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
