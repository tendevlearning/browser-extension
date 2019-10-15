let cookie = {};
function currentTab(cb) {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    cb(tabs[0]);
  });
}
function getCookie(cb) {
  chrome.cookies.getAll({
    url: 'https://beyhub.com',
  }, (cookies) => {
    for (let i = 0; i < cookies.length; i++) {
      if (cookies[i].name === 'beyauth') {
        cookie = JSON.parse(decodeURIComponent(cookies[i].value));
        cb(cookie)
        break;
      }
    }
  });
}
//将data数据以桌面通知的方式显示给用户
function showNotifications(data){
  //显示一个桌面通知
  if(window.webkitNotifications){
    let notification = window.webkitNotifications.createNotification(
      'images/icon48.png',  // icon url - can be relative
      'beyhub.com',  // notification title
      data  // notification body text
    );
    notification.show();
    // 设置3秒后，将桌面通知dismiss
    setTimeout(function(){notification.cancel();}, 3000);
  }else if(chrome.notifications){
    let opt = {
      type: 'basic',
      title: 'beyhub.com',
      message: data,
      iconUrl: 'images/icon48.png',
    };
    chrome.notifications.create('', opt, function(id){
      setTimeout(function(){
        chrome.notifications.clear(id, function(){});
      }, 3000);
    });
  }else{
    alert('当前浏览器不支持消息通知');
  }
}
(function () {
  getCookie((cookie)=>{
    console.log(cookie)
  });
  chrome.omnibox.onInputChanged.addListener(debounce(function (text, suggest) {
    console.log('omnibox.inputChanged: ' + text);
    if (!text || text.length <= 1) return;
    const url = 'https://beyhub.com';
    getCookie(async function (cookie) {
      console.info("background.js " + JSON.stringify(cookie));
      let accessToken = cookie.access_token;
      let resp = await axios.get('https://beyhub.com/api/pages/ext/search', {
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



