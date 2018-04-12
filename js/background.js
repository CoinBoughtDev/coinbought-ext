var apiCall = require('./bundle').apiCall;
var addJsonRpcListener = require('./bundle').addJsonRpcListener;
var sleep = require('./bundle').sleep;
var markets = require('./static_data').markets;

function checkListing(market, item, b, attempts){
  url = `https://${market.coinboughtDomain}/cbapi/check_listing?pid=${item.asin}&b=${b}`
  return apiCall('get', url).then((res)=>{
    if(typeof(res.success)!=="boolean" && attempts){
      return sleep(5000)
        .then(checkListing.bind(this, market, item, b, attempts-1))
    } else if(res.success){
      item.id = res.id
      item.url = res.url
    } else {
      item.id = null //failure
    }
    return item
  })
}

var addingToCart = false
addJsonRpcListener('addingToCart', ()=>addingToCart);

function buyProducts(market, cart){
  addingToCart = true;
  sleep(3*60*1000).then(()=>addingToCart=false);// failsafe so eventually no matter what customer can retry add to cart
  //Get the listing for all products
  var promises = cart.map((item)=>
    apiCall('get', `https://${market.coinboughtDomain}/cbapi/search?s=${item.asin}`)
      .then((data)=>{
        if(data.id){
          item.id = data.id
          item.url = data.url
          return item
        }
        return checkListing(market, item, data.b, 24)
      }).catch(()=>{
        console.err("failed to add listing", arguments)
        return item
      })
    )
  //Clear the cart
  promises.push(apiCall('get', `https://${market.coinboughtDomain}/clearcart`, 'text').catch(()=>null).then(()=>null))
  //Add all products to cart
  return Promise.all(promises)
    .then((responses)=>{
      responses = responses.filter((i)=>i)
      function doNext(){
        if(responses.length == 0) return
        var item = responses.pop()
        return apiCall('get', `https://${market.coinboughtDomain}/?add-to-cart=${item.id}&quantity=${item.quantity||1}`, 'text')
          .then(doNext)
      }
      return doNext()
    })
    .then(()=>{
      addingToCart = false;
      var failedItems = cart.filter((item)=>!item.id).map((item)=>item.asin)
      chrome.tabs.create({url:`https://${market.coinboughtDomain}/cart/?failed_items=${failedItems.join(',')}`})
      return cart
    })
}
addJsonRpcListener('buyProducts', buyProducts);
