<template>
  <div>
    <card>
      <form @submit.prevent>
        <div class="form-row">
          <base-input class="col-md-2" placeholder="Bms">
            <select v-model="selectedBMS" id="inputState" class="form-control">
              <option selected>BMS 1</option>
              <option>BMS 2</option>
              <option>BMS 3</option>
            </select>
          </base-input>
        </div>
      </form>
    </card>

    <div class="row">
    
      <div class="col-md-4">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Uptime </h5>
          <h1 class="card-text">
            <i class="tim-icons icon-watch-time spaced-icon"></i>
            16 h 31 m </h1> 
        </card>
      </div>

      <div class="col-md-4">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Cycles </h5>
          <h1 class="card-text">
            <i class="tim-icons icon-refresh-02 spaced-icon"></i>
            420</h1> 
        </card>
      </div>

      <div class="col-md-4">
        <card class="padded-card text-center">  
          <h5 class="card-category"> Badge info </h5>
          <h1 class="card-text">
            <i class="tim-icons icon-notes spaced-icon"></i>
            Lorem Ipsum</h1> 
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

.padded-card {
  padding: 25px 0px 35px 0px;
}

.spaced-icon {
  margin-right: 15px;
}

</style>
