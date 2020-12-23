/*
 =========================================================
 * Vue Black Dashboard - v1.1.0
 =========================================================

 * Product Page: https://www.creative-tim.com/product/black-dashboard
 * Copyright 2018 Creative Tim (http://www.creative-tim.com)

 =========================================================

 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 */
import Vue from "vue";
import VueRouter from "vue-router";
import RouterPrefetch from 'vue-router-prefetch'
import App from "./App";
// TIP: change to import router from "./router/starterRouter"; to start with a clean layout
import router from "./router/index";
import BlackDashboard from "./plugins/blackDashboard";
import i18n from "./i18n";
import './registerServiceWorker'
import VueApexCharts from 'vue-apexcharts'
import VCalendar from 'v-calendar'
import Vuex from 'vuex'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import { DropdownPlugin, TablePlugin } from 'bootstrap-vue'
import { PaginationPlugin } from 'bootstrap-vue'
import VueNumerals from 'vue-numerals';
import {InfluxDB, FluxTableMetaData} from '@influxdata/influxdb-client'
import {url, token, org} from '@/influx/env'

Vue.use(BlackDashboard);
Vue.use(VueApexCharts);
Vue.use(VueNumerals);
Vue.component('apexchart', VueApexCharts);
Vue.use(DropdownPlugin)
Vue.use(PaginationPlugin)
Vue.use(TablePlugin)
Vue.use(VueRouter);
Vue.use(Vuex)
Vue.use(RouterPrefetch);
Vue.use(VCalendar, {
  componentPrefix: 'vc',  // Use <vc-calendar /> instead of <v-calendar />
});


const store = new Vuex.Store({
  state: {
    bmss: []
  },
  mutations: {
    setBMSs (state, newBMSs) {
      state.bmss = newBMSs
    }
  }
})

/* eslint-disable no-new */
new Vue({
  router,
  store,
  i18n,
  render: h => h(App),
  methods: {
    fetchBMS: function () {
      const queryApi = new InfluxDB({url, token}).getQueryApi(org)
      const fluxQuery = `from(bucket: "telemetry") 
                          |> range(start: -1d)
                          |> filter(fn: (r) => r["_measurement"] == "tlm")
                          |> filter(fn: (r) => r["_field"] == "ID Batt")
                          |> group(columns: ["_value"])
                          |> top(n:1, columns: ["_time"])
                          |> yield()`
      const outerScope = this
      var bms = []
      console.log('BMS FETCH')
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          console.log(o)
          if (!bms.includes(o.bms)) {
            bms.push(o.bms)
          }
        },
        error(error) {
          console.error(error)
          console.log('BMS FETCH ERROR')
        },
        complete() {
          console.log(bms)
          outerScope.$store.commit('setBMSs', bms)
          console.log('BMS FETCH SUCCESS')
        },
      })
    }
  },
  created: function () {
    this.fetchBMS()
    this.interval = setInterval(function () {
      this.fetchBMS()
    }.bind(this), 5000)
  },
  beforeDestroy: function(){
    clearInterval(this.interval)
  }
}).$mount("#app");
