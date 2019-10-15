<template>
  <v-app id="app">
    <v-content>
      <v-card>
        <v-card-title primary-title class="title">将当前页面加入书签</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <div class="title">
            <v-avatar size="32" :tile="true">
              <img :src="tab.favIconUrl" alt="">
            </v-avatar>
            {{tab.title}}
          </div>
          {{tab}}
        </v-card-text>
      </v-card>
    </v-content>
  </v-app>
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
        access_token: '',
        tab: {},
      }
    },
    computed: {
      run_as_extension: function () {
        return chrome.extension !== undefined;
      }
    },
    mounted() {
      this.init();
    },
    methods: {
      init() {
        if (this.run_as_extension) {
          let bgPage = chrome.extension.getBackgroundPage();
          chrome.storage.sync.get('beyauth', (beyAuth) => {
            this.access_token = beyAuth.beyauth.access_token;
          });
          bgPage.currentTab((tab) => {
            this.tab = JSON.parse(JSON.stringify(tab));
          });
        } else {
          // web开发模式下测试用
          this.access_token = '6c9a6e55-4b10-4699-9789-afbeace19846';
          this.tab = {
            "active": true,
            "audible": false,
            "autoDiscardable": true,
            "discarded": false,
            "favIconUrl": "https://g.alicdn.com/trip/tools/img/favicon.ico",
            "height": 877,
            "highlighted": true,
            "id": 884,
            "incognito": false,
            "index": 6,
            "mutedInfo": {"muted": false},
            "pinned": false,
            "selected": true,
            "status": "complete",
            "title": "飞猪 - CRS",
            "url": "https://sell.fliggy.com/transcrs/index#/",
            "width": 1680,
            "windowId": 757
          }
        }
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
<style scoped>
  #app {
    width: 100vh;
    height: 100vh;
  }
</style>
