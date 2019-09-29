let category_list, modalEl, beyAlert;
(function () {
  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      console.log('content.js ', JSON.stringify(request).trim());
      sendResponse({code: 0});
      if (request.action !== 'showBookmarkDialog') {
        return;
      }
      let dialog_html = "<div class=\"mui-container\">" +
        "<div class=\"mui-panel\">" +
        "<form class=\"mui-form\">" +
        "<legend>收藏至 beyhub.com</legend>" +
        "<br>" +
        "<div class=\"mui-textfield mui-textfield--float-label\">" +
        "<input type=\"text\" id=\'beyHub-url\' value=\'" + request.data.url + "\'>" +
        "<label>地址</label>" +
        "</div>" +
        "<div class=\"mui-textfield mui-textfield--float-label\">" +
        "<input type=\"text\" id=\'beyHub-name\' value=\'" + request.data.title + "\'>" +
        "<label>书签名（建议添加方便搜索的关键词）</label>" +
        "</div>" +
        "<div class=\"mui-select\">" +
        "<select id=\'beyHub-firstCategory\'>" +
        "</select>" +
        "<label>选择看板</label>" +
        "</div>" +
        "<div class=\"mui-select\">" +
        "<select id=\'beyHub-secondCategory\'>" +
        "</select>" +
        "<label>选择碎片</label>" +
        "</div>" +
        "</form>" +
        "<label class=\'beyHub-label\'>点击快速保存</label>" +
        "<div id=\'beyHub-history-tag\'></div>" +
        "<button id='beyHub-save' class=\"mui-btn mui-btn--primary\">保存</button>" +
        "</div>" +
        "</div>";
      modalEl = document.createElement('div');
      modalEl.style.width = '500px';
      modalEl.style.height = '400px';
      modalEl.style.margin = '100px auto';
      modalEl.innerHTML = dialog_html;
      beyAlert = document.createElement('div');
      beyAlert.innerHTML = "<div class=\"bey-alert\"></div>";
      chrome.storage.sync.get("beyauth", function (beyAuth) {
          let access_token = beyAuth.beyauth.access_token;
          if (access_token) {
            $('body').append(beyAlert);
            mui.overlay('on', modalEl);
            beyutil.getCategories(access_token);
            $('#beyHub-firstCategory').on('change', function () {
              beyutil.getCategories(access_token);
            });
            $('#beyHub-save').on('click', function () {
              beyutil.saveBookmark(access_token);
            });
          } else {
            let r = confirm("您还没有登录拾贝，请登录");
            if (r) {
              window.open('https://beyhub.com/login');
            }
          }
        }
      )
    });
})()
