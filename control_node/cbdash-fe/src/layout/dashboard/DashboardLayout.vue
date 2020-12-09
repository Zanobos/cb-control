<template>
  <div class="wrapper">
    <side-bar>
      <template slot="links">
        <sidebar-link to="/recharge-room" :name="$t('sidebar.rechargeRoom')" icon="tim-icons icon-atom"/>
        <sidebar-link to="/charge-graph" :name="$t('sidebar.chargeGraph')" icon="tim-icons icon-sound-wave"/>
        <sidebar-link to="/charge-table" :name="$t('sidebar.chargeTable')" icon="fas fa-list-ul"/>
        <sidebar-link to="/global-recap" :name="$t('sidebar.globalRecap')" icon="tim-icons icon-chart-pie-36"/>
        <sidebar-link to="/daily-recap" :name="$t('sidebar.dailyRecap')" icon="tim-icons icon-calendar-60"/>    
      </template>
    </side-bar>
    <div class="main-panel">
      <top-navbar></top-navbar>

      <dashboard-content @click.native="toggleSidebar">

      </dashboard-content>
<!--
      <content-footer></content-footer>
-->
    </div>
  </div>
</template>
<style lang="scss">
</style>
<script>
import TopNavbar from "./TopNavbar.vue";
import ContentFooter from "./ContentFooter.vue";
import DashboardContent from "./Content.vue";
import MobileMenu from "./MobileMenu";
export default {
  components: {
    TopNavbar,
    ContentFooter,
    DashboardContent,
    MobileMenu
  },
  methods: {
    toggleSidebar() {
      if (this.$sidebar.showSidebar) {
        this.$sidebar.displaySidebar(false);
      }
    }
  }
};
</script>
