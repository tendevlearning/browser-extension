const BOOKMARK_DIRS = "bookmark-dirs";

window.beyutil = {
  categoryChange: async function (access_token) {
    let resp = await axios.get(`https://beyhub.com/api/pages/ext/page/${$('#beyHub-firstCategory').val()}/widgets`, {
      headers: {
        Authorization: 'Bearer ' + access_token
      },
    });
    if (resp.data.code === 0) {
      $('#beyHub-secondCategory').html('');
      $.each(resp.data.data, function (i, item) {
        $('#beyHub-secondCategory').append($('<option>', {
          value: item.id,
          text: item.title
        }));
      });
    } else if (resp.data.code === -8) {
      let r = confirm("您还没有登录拾贝，请登录");
      if (r) {
        window.open('https://beyhub.com/login');
      }
    } else {
      console.log(resp);
    }
  },
  getCategories: async function (access_token) {
    let resp = await axios.get(`https://beyhub.com/api/pages/ext/page/accessible`, {
      headers: {
        Authorization: 'Bearer ' + access_token
      },
    });
    if (resp.data.code === 0) {
      if (resp.data.data.length === 0) {
        let r = confirm("您还没创建过看板，请前往beyhub.com新建");
        if (r) {
          window.open('https://beyhub.com');
        }
      } else {
        category_list = resp.data.data.kanbans;
        $.each(category_list, function (i, item) {
          $('#beyHub-firstCategory').append($('<option>', {
            value: item.id,
            text: item.title
          }));
        });
        beyutil.categoryChange(access_token);
        let history_tag_html = '';
        $.each(resp.data.data.recent, function (i, item) {
          history_tag_html += `<div class='beyHub-tag' id="tag${i}">${item.pageTitle} / ${item.widgetTitle}</div>`
        })
        $('#beyHub-history-tag').html(history_tag_html);
        $.each(resp.data.data.recent, function (i, item) {
          $('#tag' + i).on('click', function () {
            beyutil.quickSaveBookmark(access_token, item);
          });
        })
      }
    } else {
      console.log(resp);
    }
  },
  quickSaveBookmark: async function (access_token, item) {
    let resp = await axios.post(`https://beyhub.com/api/pages/ext/page/${item.widgetId}/save-item`, {
      b: $('#beyHub-name').val(),
      d: $('#beyHub-url').val(),
      widgetId: item.widgetId
    }, {
      headers: {
        Authorization: 'Bearer ' + access_token
      }
    })
    if (resp.data.code === 0) {
      mui.overlay('off');
      $('.bey-alert').html('保存成功').addClass('bey-alert-success').show();
      setTimeout(function () {
        $('.bey-alert').hide();
      }, 2000);
    } else {
      console.log(resp);
    }
  },
  /**
   * 获取当前选项卡ID
   */
  getCurrentTabId: function (callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      if (callback) callback(tabs.length ? tabs[0].id : null);
    });
  },
  /**
   * 当前标签打开某个链接
   */
  openUrlCurrentTab: function (url) {
    beyutil.getCurrentTabId(function (tabId) {
      chrome.tabs.update(tabId, {url: url});
    })
  },
  /**
   * 转义
   * @param str
   * @returns {string}
   */
  htmlEncodeByRegExp: function (str) {
    let s = "";
    if (str.length === 0) return "";
    s = str.replace(/&/g, "&amp;");
    s = s.replace(/</g, "&lt;");
    s = s.replace(/>/g, "&gt;");
    s = s.replace(/\'/g, "&#39;");
    s = s.replace(/\"/g, "&quot;");
    return s;
  }
}
