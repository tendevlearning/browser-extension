// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import axios from 'axios'
import VueAxios from 'vue-axios'
import App from './App';
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

import '@/assets/main.css';
Vue.use(VueAxios, axios);
Vue.use(Vuetify);
Vue.config.productionTip = false;
Vue.prototype.$http.defaults.withCredentials = false;

/* eslint-disable no-new */
new Vue({
	el: '#app',
	// router,
	template: '<App/>',
	components: {App},
});
