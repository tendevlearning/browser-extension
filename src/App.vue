<template>
  <v-app id="app">
    <v-content>
      <v-toolbar :height="60">
        <v-toolbar-side-icon>
          <v-avatar v-if="bookmark.favIconUrl" size="32" :tile="true">
            <img :src="bookmark.favIconUrl" alt="favicon">
          </v-avatar>
          <v-icon size="32" color="grey" v-else>language</v-icon>
        </v-toolbar-side-icon>
        <v-toolbar-title>将当前页加入Beyhub书签</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn color="amber darken-3" icon flat @click="openUrl('https://beyhub.com')">
          <v-icon>web</v-icon>
        </v-btn>
      </v-toolbar>
      <div class="text-xs-center mt-5" v-show="loading">
        <v-progress-circular
          indeterminate
          :size="60"
          :width="5"
          color="amber"
        ></v-progress-circular>
      </div>
      <v-card v-show="!loading" class="mx-auto">
        <v-divider></v-divider>
        <v-card-text>
          <v-layout row wrap>
            <v-flex sm12>
              <v-text-field prepend-icon="bookmark_border" v-model="bookmark.title" label="书签名"></v-text-field>
            </v-flex>
            <v-flex sm12>
              <v-text-field v-model="bookmark.url" prepend-icon="link" label="URL"></v-text-field>
            </v-flex>
            <v-flex sm6>
              <v-autocomplete
                v-model="selectedPage"
                :items="pages"
                :loading="isLoading"
                :search-input.sync="searchPage"
                hide-no-data
                hide-selected
                @change="loadWidgets"
                auto-select-first
                item-text="title"
                item-value="id"
                placeholder="选择看板"
                dense
                prepend-icon="picture_in_picture_alt"
                return-object
              ></v-autocomplete>
            </v-flex>
            <v-flex sm6>
              <v-autocomplete
                v-model="selectedWidget"
                :items="widgets"
                :loading="isLoading"
                hide-selected
                :search-input.sync="searchWidget"
                prepend-icon="widgets"
                open-on-clear
                hide-no-data
                dense
                item-text="title"
                item-value="id"
                placeholder="选择组件"
                return-object
              ></v-autocomplete>
            </v-flex>
          </v-layout>
        </v-card-text>
        <v-card-actions>
          <v-btn icon outline color="primary" :disabled="!selectedPage.id" @click="createWidgetDialog=true">
            <v-icon>add</v-icon>
          </v-btn>
          <v-btn icon flat color="primary" :disabled="!selectedPage.id" outline
                 @click="openUrl(`https://beyhub.com/p/${selectedPage.id}`)">
            <v-icon>open_in_new</v-icon>
          </v-btn>
          <v-btn color="primary" :disabled="is_bookmark_can_save"
                 @click="saveBookmark(selectedWidget.id)"
                 block>保存书签
          </v-btn>
        </v-card-actions>
        <v-divider class="mt-3"></v-divider>
        <v-card-text>
          <v-list dense>
            <v-subheader>快捷保存</v-subheader>
            <template v-for="(item, index) in recent">
              <v-divider></v-divider>
              <v-list-tile :key="item.title" @click="saveBookmark(item.widgetId);selectedPage.id=item.pageId">
                <v-list-tile-content>
                  <v-list-tile-title>{{ item.pageTitle }} - {{ item.widgetTitle }}</v-list-tile-title>
                  <v-list-tile-sub-title>{{ dateFormat(item.createdAt) }}</v-list-tile-sub-title>
                </v-list-tile-content>
                <v-list-tile-action>
                  <v-btn color="primary" icon small outline
                         @click.stop.native="openUrl(`https://beyhub.com/w/${item.widgetId}`)">
                    <v-icon small>open_in_new</v-icon>
                  </v-btn>
                </v-list-tile-action>
              </v-list-tile>
            </template>
          </v-list>
        </v-card-text>
      </v-card>
    </v-content>
    <v-dialog v-model="createWidgetDialog" width="300">
      <v-card>
        <v-card-title class="headline">添加新的书签组件</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-text-field v-model="newWidgetForm.title" label="组件名称"></v-text-field>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn block color="grey" flat="flat" @click="createWidgetDialog = false">
            关闭
          </v-btn>
          <v-btn block color="primary" @click="createWidget">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
  import dayjs from "dayjs"
  import relativeTime from 'dayjs/plugin/relativeTime'
  import zh_cn from 'dayjs/locale/zh-cn'

  dayjs.locale(zh_cn);
  dayjs.extend(relativeTime);
  let bgPage;
  if (chrome.extension) {
    bgPage = chrome.extension.getBackgroundPage();
  }
  export default {
    name: 'app',
    components: {},
    data() {
      return {
        createWidgetDialog: false,
        access_token: '',
        loading: false,
        bookmark: {
          favIconUrl: null,
          url: '',
          title: '',
        },
        newWidgetForm: {
          title: null,
          pageId: null,
        },
        selectedPage: {title: null, id: null},
        selectedWidget: {title: null, id: null},
        isLoading: false,
        searchWidget: null,
        searchPage: null,
        pages: [],
        widgets: [],
        recent: []
      }
    },
    computed: {
      run_as_extension: function () {
        return chrome.extension !== undefined;
      },
      is_login: function () {
        return !!this.access_token;
      },
      // 页面和widget是否都已选好了
      is_bookmark_can_save: function () {
        return !(this.selectedWidget.id && this.selectedPage.id);
      }
    },
    mounted() {
      this.init();
    },
    methods: {
      init() {
        let tabObj;
        if (this.run_as_extension) {
          bgPage.currentTab((tab) => {
            tabObj = JSON.parse(JSON.stringify(tab));
          });
          bgPage.getCookie((cookie) => {
            this.access_token = cookie.access_token;
          })
        } else {
          // web开发模式下测试用
          this.access_token = 'e3ce8513-7eb9-41d7-9abc-d7697e0012e1';
          tabObj = {
            "favIconUrl": "https://g.alicdn.com/trip/tools/img/favicon.ico",
            "highlighted": true,
            "pinned": false,
            "selected": true,
            "status": "complete",
            "title": "飞猪 - CRS",
            "url": "https://sell.fliggy.com/transcrs/index#/",
          }
        }
        setTimeout(() => {
          this.bookmark.favIconUrl = tabObj.favIconUrl;
          this.bookmark.title = tabObj.title;
          this.bookmark.url = tabObj.url;
          this.loadPages();
          if (!this.is_login) {
            this.showMessage("请先登录");
            this.openUrl('https://beyhub.com/login')
          }
        }, 100)
      },
      openUrl(url) {
        window.open(url, '_blank')
      },
      // 加载用户可编辑的页面
      async loadPages() {
        this.isLoading = true;
        let resp = await this.$http.get(`https://beyhub.com/api/pages/ext/page/accessible`, {
          headers: {
            Authorization: `Bearer ${this.access_token}`
          },
        });
        this.isLoading = false;
        if (resp.data.code === 0) {
          if (resp.data.data.length === 0) {
            let r = confirm("您还没创建过看板，请前往beyhub.com新建");
            if (r) {
              window.open('https://beyhub.com');
            }
          } else {
            this.pages = resp.data.data.kanbans.filter(e => {
              return e.bmwCount > 0
            });
            this.recent = resp.data.data.recent;
          }
        } else {
          console.log(resp);
        }
      },
      // 保存书签
      async saveBookmark(widgetId) {
        this.loading = true;
        let wId = widgetId || this.selectedWidget.id;
        if (!wId) {
          this.showMessage("请先选择看板和组件");
        }
        let resp = await this.$http.post(`https://beyhub.com/api/pages/ext/page/${wId}/save-item`, {
          b: this.bookmark.title,
          d: this.bookmark.url,
          favIconUrl: this.bookmark.favIconUrl,
          widgetId: wId
        }, {
          headers: {Authorization: 'Bearer ' + this.access_token}
        });
        this.loading = false;
        let message;
        if (resp.data.code === 0 && resp.status === 200) {
          message = "书签已保存";
        } else {
          message = "保存失败：" + resp.data.message;
        }
        this.showMessage(message);
      },
      // 加载组件
      async loadWidgets() {
        let resp = await this.$http.get(`https://beyhub.com/api/pages/ext/page/${this.selectedPage.id}/widgets`, {
          headers: {
            Authorization: 'Bearer ' + this.access_token
          },
        });
        if (resp.data.code === 0) {
          this.widgets = resp.data.data;
        } else {
          console.log(resp);
        }
      },
      dateFormat(date) {
        return dayjs(date).toNow();
      },
      showMessage(message) {
        if (this.run_as_extension) {
          bgPage.showNotifications({message: message, pageId: this.selectedPage.id});
          window.close();
        } else {
          alert(message);
        }
      },
      // 如果没有对应名字的组件，则创建一个
      async createWidget() {
        if (this.createWidgetDialog.pageId === null || this.createWidgetDialog.title === null) {
          this.showMessage("创建组件的表单不完整");
          return
        }
        this.newWidgetForm.pageId = this.selectedPage.id;
        let resp = await this.$http.post(`https://beyhub.com/api/pages/ext/page/${this.selectedPage.id}/create-widget`,
          this.newWidgetForm, {
            headers: {
              Authorization: 'Bearer ' + this.access_token
            },
          });
        if (resp.data.code === 0) {
          this.widgets = resp.data.data;
          this.selectedWidget = this.widgets[0];
          this.createWidgetDialog = false;
        } else {
          this.showMessage(`创建失败${resp.data.message}`);
          console.log(resp);
        }
        this.createWidgetDialog = false;
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
