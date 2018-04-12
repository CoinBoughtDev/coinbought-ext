var $ = require('jquery');
window.jQuery = $;
require('bootstrap');
var _ = require('lodash');

var model = {
  currentMarket: null,
  cart: null,
  addingToCart: false,
};
window.model = model;

var Handlebars = require('../node_modules/handlebars/dist/handlebars.runtime.js')
Handlebars.registerHelper('and', function() {
  return Array.from(arguments).map((v)=>!!v).find((v)=>!v) === undefined;
})
Handlebars.registerHelper('not', (v)=>!v)
Handlebars.registerHelper('eq', (v1,v2)=>v1==v2)
var popupTmpl = Handlebars.template(require('./popup.tmpl'))

var bundle = require('./bundle')
var apiCall = require('./bundle').apiCall;
window.apiCall = apiCall;  // For debugging
var callJsonRpc = require('./bundle').callJsonRpc;
var staticData = require('./static_data');

function getCurrentTab() {
  return new Promise(function(resolve, reject) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      resolve(tabs[0] || null);
    });
  });
}

//proxy object which rerenders when anything in the model changes
function makeProxy(model, callback) {
  return new Proxy(model, {
    get: function(target, property, receiver) {
      var val = Reflect.get(target, property, receiver);
      var desc = Reflect.getOwnPropertyDescriptor(target, property);
      if(desc && !desc.configurable) return val;
      try {
        return makeProxy(val, callback);
      } catch (e) {
        return val;
      }
    },
    set: function(target, property, value, receiver) {
      var x = Reflect.set(target, property, value, receiver);
      callback(target, property, value, receiver);
      return x;
    },
  });
}
var render = _.debounce(()=>$('body').html(popupTmpl(model)), 100, {trailing:true})
model = makeProxy(model, render);

//When the popup displays upate the model
$(document).ready(function() {
  model.addingToCart = false
  callJsonRpc(null, 'addingToCart')
    .then((res)=>{
      model.addingToCart=res
    })
    .then(getCurrentTab)
    .then(
      function(tab) {
        // register event handlers
        $(document).delegate('#checkout', 'click', function(event){
          model.addingToCart = true
          callJsonRpc(null, 'buyProducts', [model.currentMarket, model.cart])
            .then(()=>window.close())
        });

        // tooltips
        window.setTimeout(function() { $('[data-toggle="tooltip"]').tooltip(); }, 250);

        // get current market
        model.currentMarket = _.filter(staticData.markets, function(m){
          return m.urlRegex.test(tab.url);
        })[0] || null;

        // get current cart
        model.cart = null
        model.cartLoaded = false
        if(model.currentMarket) callJsonRpc(tab, 'getCart').then((cart)=>{
          model.cartLoaded = true
          model.cart = cart
        })
      }
  );
});
