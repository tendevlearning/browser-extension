<template>
  <div id="app">
    <template v-if="cookie">
      您已登录，可使用右键菜单收藏网页到您的拾贝       {{cookie}}

    </template>
    <template v-else>
      <!--<p class="text-center app-title">登录到您的拾贝</p>-->
      <!--<el-form ref="form" :model="form" label-width="80px">-->
      <!--<el-form-item label="用户名">-->
      <!--<el-input v-model="form.use_name"></el-input>-->
      <!--</el-form-item>-->
      <!--<el-form-item label="密码">-->
      <!--<el-input v-model="form.password" show-password></el-input>-->
      <!--</el-form-item>-->
      <!--<el-form-item>-->
      <!--<el-button type="primary" @click="onSubmit">登录</el-button>-->
      <!--</el-form-item>-->
      <!--</el-form>-->
      <el-button type="primary" @click="toLogin">登录到拾贝</el-button>
    </template>
  </div>
</template>

<script>

  export default {
    name: 'app',
    components: {},
    data() {
      return {
        form: {
          use_name: '',
          password: ''
        },
        has_login: false,
        cookie: {},
      }
    },
    mounted() {
      this.init();
    },
    methods: {
      init() {
        let bgPage = chrome.extension.getBackgroundPage();
        chrome.storage.sync.get('beyauth', (beyAuth) => {
          this.cookie = beyAuth.beyauth.access_token;
        })
        // bgPage.test();
      },
      toLogin() {
        window.open('https://beyhub.com/login')
      },
      onSubmit() {
        let bgPage = chrome.extension.getBackgroundPage();
        bgPage.creatLoginAjax('http://beyhub.com/api/o/oauth/token', {
          client_id: 'client_1',
          client_secret: 'secret',
          grant_type: 'password',
          scope: 'read',
          username: this.form.use_name,
          password: this.form.password
        }, function (callback) {
          console.log(callback)
        })
      }
    }
  }
</script>
