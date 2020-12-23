import DashboardLayout from "@/layout/dashboard/DashboardLayout.vue";
// GeneralViews
import NotFound from "@/pages/NotFoundPage.vue";

// These components are lazy-loaded. webpackChunkName configures the name of the corresponding chunk produced by webpack
const RechargeRoom = () => import(/* webpackChunkName: "dashboard" */"@/pages/RechargeRoom.vue");
const ChargeGraph = () => import(/* webpackChunkName: "dashboard" */"@/pages/ChargeGraph.vue");
const ChargeTable = () => import(/* webpackChunkName: "dashboard" */"@/pages/ChargeTable.vue");
const GlobalRecap = () => import(/* webpackChunkName: "dashboard" */"@/pages/GlobalRecap.vue");
const DailyRecap = () => import(/* webpackChunkName: "dashboard" */"@/pages/DailyRecap.vue");

const routes = [
  {
    path: "/",
    component: DashboardLayout,
    redirect: "/recharge-room",
    children: [
      {
        path: "recharge-room",
        name: "recharge-room",
        component: RechargeRoom
      },
      {
        path: "charge-graph",
        name: "charge-graph",
        component: ChargeGraph
      },
      {
        path: "charge-table",
        name: "charge-table",
        component: ChargeTable
      },
      {
        path: "global-recap",
        name: "global-recap",
        component: GlobalRecap
      },
      {
        path: "daily-recap",
        name: "daily-recap",
        component: DailyRecap
      }
    ]
  },
  { path: "*", redirect: "/recharge-room" },
];

/**
 * Asynchronously load view (Webpack Lazy loading compatible)
 * The specified component must be inside the Views folder
 * @param  {string} name  the filename (basename) of the view to load.
function view(name) {
   var res= require('../components/Dashboard/Views/' + name + '.vue');
   return res;
};**/

export default routes;
