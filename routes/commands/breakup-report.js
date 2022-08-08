var rep = require('../commands/repository');
const request = require('request');
const moment = require("moment");

async function viewBreakupReports(req, res) {
  var tokenSymbol = req.params.tokenSymbol;
  var select_wallet_address = req.params.walletAddress;
  var token_action = req.params.tokenAction;
  res.locals.moment = moment;

  selectedWalletAddress = select_wallet_address;
  let walletAddress = {};
  let ERC20Transactions = [];
  let ERC721Transactions = [];


  await rep.getWalletAddress().then((rows) => {
    walletAddress = rows;
  });
  // here are start for ERC20 reports
  let tempERC20Transactions = [];
  await rep.getbreakupReports(selectedWalletAddress, token_action, tokenSymbol).then((rows) => {
    tempERC20Transactions = rows;
  });

  for(var i=0; i<tempERC20Transactions.length; i++){

    let nOfToken = 'Nil';
    let sumAllBuy = tempERC20Transactions[i].puchase_status == 0 ? tempERC20Transactions[i].buytotal : '-';
    let sumAllSell = tempERC20Transactions[i].puchase_status == 1 ? tempERC20Transactions[i].buytotal : '-';
    let averageOfBuy = 'Nil';
    let averageOfSell = 'Nil';

      await rep.noOfToken(tempERC20Transactions[i].token_symbol, tempERC20Transactions[i].hash, tempERC20Transactions[i].token_value).then((tkname) => {
        nOfToken = tkname;
      });
      if(nOfToken == 0 || nOfToken == "Nil"){
        await rep.getRateFromCoingecko(tempERC20Transactions[i].token_symbol).then((rate) => {
          nOfToken = rate;
        });
      }
      averageOfBuy = tempERC20Transactions[i].puchase_status == 0 ? tempERC20Transactions[i].transaction_rate : '-';
      averageOfSell = tempERC20Transactions[i].puchase_status == 1 ? tempERC20Transactions[i].transaction_rate : '-';
      
    
    let ttBoughtValue = sumAllBuy != '-' && averageOfBuy != '-' ? (sumAllBuy * averageOfBuy): '-';
    let ttSoldValue = sumAllSell != '-' && averageOfSell != '-' ? (sumAllSell * averageOfSell) : '-';
  
    ERC20Transactions.push({
      id: tempERC20Transactions[i].id, 
      timestamp: tempERC20Transactions[i].timestamp,
      token_name: tempERC20Transactions[i].token_symbol,
      buytotal: tempERC20Transactions[i].buytotal,
      nOfToken: nOfToken,
      totalMarketValue: nOfToken != 'Nil' ?  (nOfToken * tempERC20Transactions[i].buytotal): 'Nil',
      sumOfAllBuy: sumAllBuy,
      sumOfAllSell: sumAllSell,
      averageOfBuy: averageOfBuy,
      averageOfSell: averageOfSell,
      totalBoughtValue: ttBoughtValue,
      totalSoldValue: ttSoldValue,
      hash: tempERC20Transactions[i].hash,
      tokenAction: token_action

    });
  }
  // here are end for ERC20 reports
  res.render('pages/breakup-report',{ERC20Transactions : ERC20Transactions, walletAddress: walletAddress, selected_wallet_address: selectedWalletAddress});

}


module.exports = viewBreakupReports;
