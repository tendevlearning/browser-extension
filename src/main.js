// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import axios from 'axios'
import VueAxios from 'vue-axios'
import App from './App';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-default/index.css';

import '@/assets/style.less';

Vue.use(VueAxios, axios);
Vue.use(ElementUI);

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
	el: '#app',
	// router,
	template: '<App/>',
	components: {App},
});
