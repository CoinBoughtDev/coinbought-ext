$ = require('jquery');
_ = require('lodash');

var addJsonRpcListener = require('./bundle').addJsonRpcListener;
var sleep = require('./bundle').sleep;
var markets = require('./static_data').markets;

function getCart(){
  var iframe = $(`<iframe style="width:100%;height:400px;display:none;" src="/gp/cart/view.html"></iframe>`)[0]
  $("body").append(iframe)
  return new Promise((resolve, reject)=>{
    //wait for iframe to load with cart page
    setTimeout(reject.bind(null, null), 90000) //failsafe
    function checkReadyState(){
      var headerText = (iframe.contentDocument.querySelector('.sc-cart-header')||{}).innerText||""
      if(headerText.indexOf('empty')!==-1 || headerText.indexOf('leer')!==-1){
        reject(null)
      }
      else if(iframe.contentDocument.querySelector("#sc-active-cart [data-asin]")){
        resolve()
      }
      else {
        setTimeout(checkReadyState, 50)
      }
    }
    checkReadyState()
  }).then(()=>sleep(1000))
  .then(()=>{
    //parse cart from iframe
    var tryParseFloat = (str) => isNaN(parseFloat(str)) ? str : parseFloat(str)
    return Array.from(iframe.contentDocument.querySelectorAll("#sc-active-cart [data-asin]"))
      .map((e)=>{
          var ret = {}
          Array.from(e.attributes).forEach((attr)=>{
              ret[attr.name.replace('data-', '')] = tryParseFloat(attr.value)
          })
          ret['title'] =(e.querySelector('.sc-product-title')||{}).innerText || null
          return ret;
      })
  })
  .then((ret)=>{
    //cleanup
    $(iframe).remove()
    return ret;
  })
}
addJsonRpcListener('getCart', getCart);
