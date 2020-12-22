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

    <div v-if="loaded" class="row">
    
      <div class="col-md-4">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Uptime </h5>
          <h1 class="card-text">
            <i class="tim-icons icon-watch-time spaced-icon"></i>
            {{totalTmr}} h</h1> 
        </card>
      </div>

      <div class="col-md-4">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Cycles </h5>
          <h1 class="card-text">
            <i class="tim-icons icon-refresh-02 spaced-icon"></i>
            {{cycleNum}}</h1> 
        </card>
      </div>

      <div class="col-md-4">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Badge info </h5>
          <h1 class="card-text">
            <i class="tim-icons icon-notes spaced-icon"></i>
            {{`${man}\n${batt_type }\n${techfield }`}}</h1> 
        </card>
      </div>

    </div>


    <div v-if="items.length > 0" class="row">
      <div class="col-12">
        <card :title="'BMS ' + selectedBMS + ' errors'">
          <div class="table-responsive">
            <!--
            <base-table :data="table1.data"
                        :columns="table1.columns"
                        thead-classes="text-primary">
            </base-table>
            -->
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
      perPage: 15,
      currentPage: 1,
      items: [],
      loaded: false,
      selectedBMS: '',
      whiteTheme: false,
      totalTmr: '',
      cycleNum: '',
      man: '',
      batt_type: '',
      techfield: '',
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
      }
  },
  watch: {
    selectedBMS: function(val) {
      this.loadData();
    }
  },
  mounted() {
    this.$root.$on('whiteTheme', (whiteTheme) => {
      this.whiteTheme = whiteTheme;
    });
  },
  methods: {
    loadData() {
      var outerScope = this
      var errs = []

      const infoQuery = `import "json"

                        from(bucket: "telemetry") 
                        |> range(start: -10d)
                        |> drop(columns: ["_start", "_stop", "origin"])
                        |> filter(fn: (r) => r._measurement == "tlm" and r.bms == "${this.selectedBMS}" and 
                            (r._field == "totalTmr" or 
                            r._field == "cycleNum" or
                            r._field == "man" or
                            r._field == "batt_type" or
                            r._field == "techfield" ))
                        |> top(n:1, columns: ["_time"])
                        |> yield(name: "info")`

      const errorQuery = `import "json"

                          from(bucket: "telemetry") 
                          |> range(start: -10d)
                          |> drop(columns: ["_start", "_stop"])
                          |> filter(fn: (r) => r._measurement == "tlm" and r.bms == "${this.selectedBMS}" and r._field == "BMSerror")
                          |> sort(columns: ["_time"])
                          |> map(fn: (r) => ({ r with
                              jsonStr: string(v: json.encode(v: {"Time":r._time,"Error":r._value,"BMS":r.bms,"CB":r.origin}))}))
                          |> yield(name: "errors")`

      console.log('Querying influx for global recap.');
      queryApi.queryRows(infoQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          switch (o._field) {
            case 'batt_type':
              outerScope.batt_type = o._value
              break
            case 'cycleNum':
              outerScope.cycleNum = o._value
              break
            case 'man':
              outerScope.man = o._value
              break
            case 'totalTmr':
              outerScope.totalTmr = o._value
              break
            case 'techfield':
              outerScope.techfield = o._value
              break
          }
        },
        error(error) {
          console.error(error)
          console.log('INFO FETCH ERROR')
        },
        complete() {
          console.log('INFO FETCH SUCCESS')
          outerScope.loaded = true;
        },
      })

      queryApi.queryRows(errorQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          outerScope.items.push(JSON.parse(o.jsonStr))
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

.padded-card {
  padding: 25px 0px 35px 0px;
}

.spaced-icon {
  margin-right: 15px;
}

</style>
