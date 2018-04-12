$ = require('jquery');

function sleep(milliseconds){
  return new Promise((resolve, _)=> setTimeout(resolve, milliseconds))
}
module.exports.sleep = sleep;

var apiCall = function apiCall(method, url, dataType) {
  console.log(url)
  return new Promise(function(resolve, reject) {
    $.ajax({
      method: method,
      url: url,
      contentType: "application/json",
      dataType:dataType||'json',
      xhrFields: { withCredentials: true },
      success: function(result) { resolve(result); },
      error: function(error) { reject(error); }
    });
  });
};
module.exports.apiCall = apiCall;

function addJsonRpcListener(methodName, handler) {
  chrome.runtime.onMessage.addListener(function(request, sender) {
    // Check if the call is for this listener
    if (request.method != methodName) {
      return;
    }

    var ret = handler.apply(null, request.params || []);
    if (!(ret || {}).then) {
      ret = Promise.resolve(ret);
    }
    ret.then(
      function(result) {
        if (sender.tab) {
          chrome.tabs.sendMessage(sender.tab.id, { error: null, result: result, id: request.id });
        } else {
          chrome.runtime.sendMessage({ error: null, result: result, id: request.id });
        }
      },
      function(error) {
        if (sender.tab) {
          chrome.tabs.sendMessage(sender.tab.id, { error: error, result: null, id: request.id });
        } else {
          chrome.runtime.sendMessage({ error: error, result: null, id: request.id });
        }
      }
    );
  });
}
module.exports.addJsonRpcListener = addJsonRpcListener;

// Pass null to tab to talk to background or popup
function callJsonRpc(tab, method, params) {
  return new Promise(function(resolve, reject) {
    var id = Math.random();

    function cb(request) {
      if (request.id !== id) return; //its not us... ignore
      chrome.runtime.onMessage.removeListener(cb);
      if (request.error) { reject(request.error) } else { resolve(request.result) }
    }
    chrome.runtime.onMessage.addListener(cb);
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { method: method, params: params, id: id });
    } else {
      chrome.runtime.sendMessage({ method: method, params: params, id: id });
    }
  });
}
module.exports.callJsonRpc = callJsonRpc;
