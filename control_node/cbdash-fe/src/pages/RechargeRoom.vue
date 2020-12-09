<template>
  <div class="row">

    <div v-for="i in 15" :key="i" class="col-lg-4 col-md-6">
      <!-- Add a function in card sass like the one fore the button, use a selector like card-border-$primary where $primary can be any of the one defined in config -->
      <div v-bind:class="['card', 'card-stats', ((i*73)%90) > 15 ? ( ((i*73)%90) > 50 ? 'charged' : 'half-charged') : 'not-charged']" >


          <div class="card-body text-center">

            <div class="row" style="margin-bottom: 15px">
       
              <div class="col-6 align-items-center d-flex justify-content-center">
                <div class="text-center" style="margin-right: 15px">
                  <img class="vc_single_image-img " :src="chargerIconSrc"
                  width="70px" height="" alt="charger" title="charger" />
                </div>            
                <h1 class="card-text">#{{i}}</h1>
              </div>

              <div class="col-6">
                <div class="numbers">
                    <p class="card-category">Charger status</p>
                    <h1 class="card-text">Good</h1>
                </div>
              </div>

            </div>

            <div class="row">

              <div class="col-6 align-items-center d-flex justify-content-center">               
                <div class="text-center" style="margin-right: 15px">
                  <img class="vc_single_image-img " :src="batteryIconSrc"
                  width="70px" height="" alt="charger" title="charger" />
                </div>
                <h1 class="card-text">#{{i*3%5}}</h1>
              </div>

              <div class="col-6">
                <div class="numbers">
                    <p class="card-category">Battery status</p>
                    <h1 class="card-text">{{(i*73)%90}}% {{ (i%5) == 0 ? '(Refill)' : ''}}</h1>
                </div>
              </div>

            </div>

          </div>
      </div>
    </div>

  </div>
</template>
<script>
const iconsContext = require.context('@/assets/icons/', true, /\.svg$/);

export default {
    components: {
  },
  data() {
    return {
      whiteTheme: false,
      batteryIconSrc: iconsContext('./batteryAlt.svg'),
      chargerIconSrc: iconsContext('./chargerAlt.svg'),
    };
  },
  methods: {
    toggleImages() {
      if(this.whiteTheme) {
        this.batteryIconSrc = iconsContext('./battery.svg');
        this.chargerIconSrc = iconsContext('./charger.svg');
      } else{
        this.batteryIconSrc = iconsContext('./batteryAlt.svg');
        this.chargerIconSrc = iconsContext('./chargerAlt.svg');
      }
    }
  },
  mounted() {
    this.$root.$on('whiteTheme', (whiteTheme) => {
      this.whiteTheme = whiteTheme;
      this.toggleImages();
    });
    this.whiteTheme = document.body.classList.contains('white-content');
    this.toggleImages();
  }
};
</script>
<style>

.charged {
  border-left: 5px solid #2dce89
}

.half-charged {
  border-left: 5px solid #fcdd42 
}

.not-charged {
  border-left: 5px solid #f5365c 
}

</style>
