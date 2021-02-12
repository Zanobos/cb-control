<template>
  <nav class="navbar navbar-expand-lg navbar-absolute"
       :class="{'bg-white': showMenu, 'navbar-transparent': !showMenu}">
    <div class="container-fluid">
      <div class="navbar-wrapper">
        <div class="navbar-toggle d-inline" :class="{toggled: $sidebar.showSidebar}">
          <button type="button"
                  class="navbar-toggler"
                  aria-label="Navbar toggle button"
                  @click="toggleSidebar">
            <span class="navbar-toggler-bar bar1"></span>
            <span class="navbar-toggler-bar bar2"></span>
            <span class="navbar-toggler-bar bar3"></span>
          </button>
        </div>
        <a class="navbar-brand" href="#">{{routeName}}</a>
      </div>
      <button class="navbar-toggler" type="button"
              @click="toggleMenu"
              data-toggle="collapse"
              data-target="#navigation"
              aria-controls="navigation-index"
              aria-label="Toggle navigation">
        <span class="navbar-toggler-bar navbar-kebab"></span>
        <span class="navbar-toggler-bar navbar-kebab"></span>
        <span class="navbar-toggler-bar navbar-kebab"></span>
      </button>

      <collapse-transition>
        <div class="collapse navbar-collapse show" v-show="showMenu">
          <ul class="navbar-nav" :class="$rtl.isRTL ? 'mr-auto' : 'ml-auto'">
            <div class="search-bar input-group" @click="toggleTheme">
              <button class="btn btn-link" id="switch-theme">
                <i v-bind:class="whiteTheme ? 'fas fa-sun' : 'far fa-moon' "></i>
              </button>
            </div>

            <div class="search-bar input-group" @click="toggleAdminMode">
              <button class="btn btn-link" id="switch-admin">
                <i class="fas fa-user-shield"></i>               
                <span v-if="logged" class="badge badge-primary" style="height: 1.2rem;">Admin Mode ON</span>                
              </button>
            </div>

          </ul>
        </div>
      </collapse-transition>
    </div>
    <b-modal id="bv-modal-login" title="Admin mode" hide-footer>
        <base-input alternative
                    v-model="insertedPassword"
                    type="password"
                    placeholder="Password"
                    addon-left-icon="tim-icons icon-lock-circle"
                    v-bind:class="{ error: wrongPassword }">
        </base-input>
        <div class="text-center">
            <base-button type="primary-nogradient" class="my-4" @click="login">Login</base-button>
        </div>
    </b-modal>

    <b-modal id="bv-modal-logout" title="Admin mode" hide-footer>
        <div class="text-center">
            <base-button type="danger-nogradient" class="my-4" @click="logout">Logout</base-button>
        </div>
    </b-modal>
  </nav>
</template>
<script>
  import { mapState } from 'vuex'
  import { CollapseTransition } from 'vue2-transitions';
  import Modal from '@/components/Modal';
  import {password} from '@/config/env'

  export default {
    components: {
      CollapseTransition,
      Modal
    },
    computed: {
      routeName() {
        const { name } = this.$route;
        return this.capitalizeFirstLetter(name);
      },
      isRTL() {
        return this.$rtl.isRTL;
      },
      ...mapState([
        'logged'
      ])
    },
    data() {
      return {
        whiteTheme: false,
        activeNotifications: false,
        showMenu: false,
        searchModalVisible: false,
        searchQuery: '',
        showModal: true,
        insertedPassword: '',
        wrongPassword: false,
      };
    },
    methods: {
      capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      },
      toggleNotificationDropDown() {
        this.activeNotifications = !this.activeNotifications;
      },
      closeDropDown() {
        this.activeNotifications = false;
      },
      toggleSidebar() {
        this.$sidebar.displaySidebar(!this.$sidebar.showSidebar);
      },
      hideSidebar() {
        this.$sidebar.displaySidebar(false);
      },
      toggleMenu() {
        this.showMenu = !this.showMenu;
      },
      toggleTheme() {
        document.body.classList.toggle('white-content');
        this.whiteTheme = !this.whiteTheme;
        this.$root.$emit('whiteTheme', document.body.classList.contains('white-content'));
      },
      toggleAdminMode() {
        this.showMenu = false
        if(!this.logged)
          this.$bvModal.show('bv-modal-login')
        else
          this.$bvModal.show('bv-modal-logout')
      },
      login() {
        if(this.insertedPassword === password) {
          this.$bvModal.hide('bv-modal-login')
          this.insertedPassword = ''
          this.$store.commit('login')
        }
        else {
          var outerScope = this
          this.wrongPassword = true
          setTimeout(function() {
              outerScope.wrongPassword = false
            }, 300)
        }          
      },
      logout() {  
        this.$store.commit('logout')
        this.$bvModal.hide('bv-modal-logout')
      }
    }
  };
</script>
<style>

.modal-body {
  max-width: 300px;
  margin: auto;
}

.white-content .modal-content {
  background-color: white !important;
}

.modal-content {
  background-color: #242729 !important;
}

.modal-title {
  color: white !important;
}

.white-content .modal-title {
  color: black !important;
}

.error {
    position: relative;
    animation: shake .1s linear;
    animation-iteration-count: 3;
}

@keyframes shake {
    0% { left: -5px; }
    100% { right: -5px; }
}

</style>
