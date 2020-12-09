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
    >
      <template v-slot="{ inputValue, inputEvents }">
        <card>
          <form @submit.prevent>
            <div class="form-row">
              <base-input class="col-md-2" placeholder="Bms">
                <select id="inputState" class="form-control">
                  <option selected>BMS 1</option>
                  <option>BMS 2</option>
                  <option>BMS 3</option>
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
            </div>
          </form>
        </card>
      </template>
    </vc-date-picker>

    <div class="row">

      <div class="col-md-4">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Min. Voltage </h5>
          <h1 class="card-text">
            <i class="fas fa-bolt spaced-icon"></i>
            16.30 V</h1> 
        </card>
      </div>

      <div class="col-md-4">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Max. Ampere </h5>
          <h1 class="card-text">
            <i class="fas fa-bolt spaced-icon"></i>
            8.92 A</h1> 
        </card>
      </div>
    
      <div class="col-md-4">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Uptime </h5>
          <h1 class="card-text">
            <i class="tim-icons icon-watch-time spaced-icon"></i>
            16 h 31 m </h1> 
        </card>
      </div>

      <div class="col-md-3">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Charger N° </h5>
          <h1 class="card-text">
            <i class="fas fa-charging-station spaced-icon"></i>
            1</h1> 
        </card>
      </div>

      <div class="col-md-3">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Min. Temperature </h5>
          <h1 class="card-text">
            <i class="fas fa-temperature-low spaced-icon"></i>
            18.2° C V</h1> 
        </card>
      </div>

      <div class="col-md-3">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Max. Temperature </h5>
          <h1 class="card-text">
            <i class="fas fa-temperature-high spaced-icon"></i>
            37.5° C V</h1> 
        </card>
      </div>

      <div class="col-md-3">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Charge Time </h5>
          <h1 class="card-text">
            <i class="fas fa-hourglass-half spaced-icon"></i>
            16 h 31 m </h1> 
        </card>
      </div>

    </div>

    <div class="row">
      <div class="col-12">
        <card :title="selectedBMS + ' errors'">
          <div class="table-responsive">
            <base-table :data="table1.data"
                        :columns="table1.columns"
                        thead-classes="text-primary">
            </base-table>
          </div>
        </card>
      </div>
    </div>

  </div>
</template>
<script>
import Card from '@/components/Cards/Card.vue';
import { BaseTable } from "@/components";
const tableColumns = ["Date", "Error", "Code"];
const tableData = [
  {
  id: 1,
  date: "07/12/2020 15:30:23",
  error: "66",
  code: "Lorem ipsum dolor",
  },
  {
    id:2,
  },{
    id:3,
  },{
    id:4,
  },{
    id:5,
  },{
    id:6,
  },{
    id:7,
  },

];

export default {
    components: {
      Card,
      BaseTable
  },
  data() {
    return {
      selectedBMS: 'BMS 1',
      whiteTheme: false,
      range: {
        start: null,
        end: null,
      },
      masks: {
        input: 'YYYY-MM-DD h:mm A',
      },
      table1: {
        title: "Simple Table",
        columns: [...tableColumns],
        data: [...tableData]
      },
    };
  },
  mounted() {
    this.$root.$on('whiteTheme', (whiteTheme) => {
      this.whiteTheme = whiteTheme;
    });
  }
};
</script>
<style>
</style>
