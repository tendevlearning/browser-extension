function currentTab(cb) {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    cb(tabs[0]);
  });
}
(function () {
  setInterval(function () {
    beyutil.checkBeyAuth();
  }, 600);
  /**
   * 收藏当前页面
   *
   * @param info
   * @param tab
   * @constructor
   */
  let StorePageToBookmarkDialog = function () {
    console.log("background.js", 'StorePageToBookmarkDialog');
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      let message = {
        action: 'showBookmarkDialog',
        data: tabs[0]
      };
      chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
        console.log(response);
      });
    });
  };
  let StoreLinkToBookmarkDialog = function (data) {
    console.log("background.js", 'StorePageToBookmarkDialog', data);
    let message = {
      action: 'showBookmarkDialog',
      data: {
        title: data.selectionText,
        url: data.linkUrl,
      }
    };
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
        console.log(response);
      });
    });
  };
  let setUpContextMenus = function () {
    chrome.contextMenus.create({
      "title": "收藏本页至 beyhub.com",
      "contexts": ['page'],
      "onclick": StorePageToBookmarkDialog
    });
    chrome.contextMenus.create({
      "title": "接藏该链接至 beybub.com",
      "contexts": ['link'],
      "onclick": StoreLinkToBookmarkDialog
    });
  };
  chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    // example
    if (request.action === 'example') {
      let histories = window.localStorage.getItem(BOOKMARK_DIRS);
      if (histories) {
        sendResponse({code: 0, data: JSON.parse(histories)});
      } else {
        sendResponse({code: 0, data: []});
      }
    }
  });
  chrome.tabs.onActiveChanged.addListener(function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      if (tabs.length) {
        chrome.contextMenus.removeAll();
        if (tabs[0].url.indexOf('chrome://') === -1) {
          setUpContextMenus();
        }
      }
    });
  });
  /**
   * 右键菜单
   */
  chrome.tabs.onUpdated.addListener(function (tabId, selectInfo, tab) {
    if (tab) {
      chrome.contextMenus.removeAll();
      // 排除系统页
      if (tab.url.indexOf('chrome://') === -1) {
        setUpContextMenus();
      }
    }
  });

  chrome.runtime.onInstalled.addListener(function () {
    setUpContextMenus();
  });

  chrome.omnibox.onInputChanged.addListener(debounce(function (text, suggest) {
    console.log('omnibox.inputChanged: ' + text);
    if (!text || text.length <= 1) return;
    const url = 'https://beyhub.com';
    chrome.storage.sync.get("beyauth", async function (beyAuth) {
      console.info("background.js " + JSON.stringify(beyAuth));
      let accessToken = beyAuth.beyauth.access_token;
      let resp = await axios.get('http://beyhub.com/api/pages/ext/search', {
        headers: {
          Authorization: 'Bearer ' + accessToken
        },
        params: {q: text}
      }).catch(function (error) {
        // 处理未登录的情况
        console.log("background.js: " + error.message);
        if (error.message.indexOf('401') > -1) {
          suggest([
            {
              content: `${url}/login`,
              description: `登录 beyhub.com - ${url}/login`
            }
          ])
          return;
        }
      });
      console.info('background.js omnibox.onInputChanged', resp, text, suggest);
      if (resp.data.code === 0) {
        let list = [];
        if (resp.data.data.bookmarks.length) {
          for (let i = 0; i < resp.data.data.bookmarks.length; i++) {
            let url = beyutil.htmlEncodeByRegExp(resp.data.data.bookmarks[i].url);
            list.push({
              content: url,
              description: beyutil.htmlEncodeByRegExp(resp.data.data.bookmarks[i].name) + ' - ' + url
            })
          }
        }
        if (resp.data.data.kanbans.length) {
          for (let i = 0; i < resp.data.data.kanbans.length; i++) {
            list.push({
              content: resp.data.data.kanbans[i].url,
              description: beyutil.htmlEncodeByRegExp(resp.data.data.kanbans[i].title) + ' - ' + resp.data.data.kanbans[i].url
            })
          }
        }
        suggest(list);
      }
    });
  }, 500));
  /**
   * 当用户接收关键字建议时触发
   */
  chrome.omnibox.onInputEntered.addListener(function (text) {
    console.log('inputEntered: ' + text);
    if (!text) return;
    beyutil.openUrlCurrentTab(text);
  });
})();



