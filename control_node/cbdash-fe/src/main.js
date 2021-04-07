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
import router from "./router/index";
import BlackDashboard from "./plugins/blackDashboard";
import i18n from "./i18n";
import VCalendar from 'v-calendar'
import Vuex from 'vuex'
import {DropdownPlugin, ModalPlugin, TablePlugin, PaginationPlugin} from 'bootstrap-vue'
import VueNumerals from 'vue-numerals';
import {InfluxDB} from '@influxdata/influxdb-client'
import {url, token, org} from '@/config/env'
import colors from '@/assets/sass/colors.scss'

import '@fontsource/poppins/200.css'
import '@fontsource/poppins/300.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/800.css'
import '@fortawesome/fontawesome-free/css/all.css'

Vue.use(BlackDashboard)
Vue.use(DropdownPlugin)
Vue.use(ModalPlugin)
Vue.use(PaginationPlugin)
Vue.use(TablePlugin)
Vue.use(VueNumerals)
Vue.use(VueRouter)
Vue.use(RouterPrefetch)
Vue.use(Vuex)
Vue.use(VCalendar, {
  componentPrefix: 'vc',  // Use <vc-calendar /> instead of <v-calendar />
});

const store = new Vuex.Store({
  state: {
    bmss: [],
    logged: false,
    whiteTheme: true,
    calendarColor: colors.mainColor ? hueToColor(hexToHsl(colors.mainColor)[0]) : 'green'
  },
  mutations: {
    setBMSs(state, newBMSs) {
      state.bmss = newBMSs
    },
    toggleWhiteTheme(state, whiteTheme) {
      state.whiteTheme = whiteTheme
    },
    login(state) {
      state.logged = true
    },
    logout(state) {
      state.logged = false
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
                          |> range(start: -10y)
                          |> filter(fn: (r) => r["_measurement"] == "tlm")
                          |> filter(fn: (r) => r["_field"] == "IP")
                          |> group(columns: ["bms"])
                          |> distinct(column: "bms")`
      const outerScope = this
      var bms = []
      //console.log('BMS FETCH')
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          //console.log(o)
          if (o.bms && !bms.includes(o.bms)) {
            bms.push(o.bms)
          }
        },
        error(error) {
          console.log('BMS FETCH ERROR')
          console.error(error)
        },
        complete() {
          //console.log('BMS FETCH SUCCESS')
          //console.log(bms)
          outerScope.$store.commit('setBMSs', bms)
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


function hexToHsl(hexColor){

  var r = parseInt(hexColor.substr(1,2), 16);
  var g = parseInt(hexColor.substr(3,2), 16);
  var b = parseInt(hexColor.substr(5,2), 16);

  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
      h = s = 0; // achromatic
  }else{
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
  }

  return [h, s, l];
}

function hueToColor(h) {
  var hue = h*360;
  if(hue >= 20 && hue < 40)
    return 'orange';
  if(hue >= 40 && hue < 80)
    return 'yellow';
  if(hue >= 80 && hue < 160)
    return 'green';
  if(hue >= 160 && hue < 200)
    return 'teal';
  if(hue >= 200 && hue < 270)
    return 'blue';
  if(hue >= 270 && hue < 300)
    return 'purple';
  if(hue >= 300 && hue < 330)
    return 'pink';
  else
    return 'red';
}
