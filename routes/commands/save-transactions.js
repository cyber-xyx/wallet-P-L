
var fetchUrl = require("fetch").fetchUrl;
var rep = require('../commands/repository');
const moment = require("moment");
const request = require('request');
const htmlParse = require('node-html-parser');

async function updateUserTransactions(req, res) {
  let transactions = {};
  
  await updateNextTokenAction(0, req.body.wallet_address);
  
  await updateNextTokenAction(1, req.body.wallet_address).then((data) => {
    //res.redirect('/save-transactions');
  });
  
  
  
  fetchUrl("https://api.etherscan.io/api?module=account&action=tokentx&address="+req.body.wallet_address+"&sort=asc&apikey=W1BRHMDZ3TT3Z21V898YJUPX4SS9KYDPM8", function(error, meta, body){
    try {
      var data = JSON.parse(body);
      transactions = rep.saveTransactions(data.result, req.body.wallet_address, "tokentx", "").then((rows) => {
        
        res.redirect('/save-transactions');
      });
     
    } catch (e) {
      const errorData = "Your wallet address or contractaddress is incorrect";
      res.redirect('/save-transactions');
    }
  });
  
}

async function updateNextTokenAction(buyOrSell, wallet_address) {
  let url = "https://api.opensea.io/wyvern/v1/orders?owner="+wallet_address+"&bundled=false&include_bundled=false&side="+buyOrSell+"&order_by=created_date&order_direction=asc";
  console.log(url);
  var options = {
      url: url,
      headers: {'X-API-KEY': 'd3d0ad80246b42c4bb24ef6d68bbb497', 'Accept': 'application/json'}
  };
  request(options, (error, response, body) => {
    var data = JSON.parse(response.body);
    transactions = rep.saveTransactions(data.orders, wallet_address, "tokennfttx", buyOrSell);
   
  });
  
};


module.exports = updateUserTransactions;
