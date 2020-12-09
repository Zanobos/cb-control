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
                <select v-model="selectedBMS" id="inputState" class="form-control">
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
      <div class="col-12">
        <card :title="selectedBMS">
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
const tableColumns = ["Time", "Voltage", "Current"];
const tableData = [
  {
  id: 1,
  time: "07/12/2020 15:30:23",
  voltage: "14.00 V",
  current: "3.45 A",
  },
  {
    id: 1,
    time: "07/12/2020 15:30:24",
    voltage: "15.00 V",
    current: "4.45 A",
  },
  {
    id: 1,
    time: "07/12/2020 15:30:25",
    voltage: "16.00 V",
    current: "5.45 A",
  },
  {
    id: 1,
    time: "07/12/2020 15:30:26",
    voltage: "17.00 V",
    current: "6.45 A",
  },
  {
    id: 1,
    time: "07/12/2020 15:30:27",
    voltage: "18.00 V",
    current: "7.45 A",
  }
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
    this.whiteTheme = document.body.classList.contains('white-content');
  }
};
</script>
<style>
</style>
