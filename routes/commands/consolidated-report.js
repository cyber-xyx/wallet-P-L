var rep = require('../commands/repository');
const request = require('request');


async function viewConsolidatedTransactions(req, res) {
  selectedWalletAddress = req.query.wallet_address;
  let walletAddress = {};
  let ERC20Transactions = [];
  let ERC721Transactions = [];


  await rep.getWalletAddress().then((rows) => {
    walletAddress = rows;
  });
  // here are start for ERC20 reports
  let tempERC20Transactions = [];
  await rep.getConsolidatedTransactions(selectedWalletAddress, "tokentx").then((rows) => {
    tempERC20Transactions = rows;
  });

  for(var i=0; i<tempERC20Transactions.length; i++){

    let nOfToken = 'Nil';
    let sumAllBuy = 'Nil';
    let sumAllSell = 'Nil';
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
      // sum taking
      await rep.getSumAllBuy(selectedWalletAddress, tempERC20Transactions[i].token_symbol, "tokentx").then((rows) => {
        sumAllBuy = rows[0].totalbuy == "null" ? 'Nil' : rows[0].totalbuy;
      });
      
      await rep.getSumAllSell(selectedWalletAddress, tempERC20Transactions[i].token_symbol, "tokentx").then((rows) => {
        sumAllSell = rows[0].totalsell == null ? 'Nil': rows[0].totalsell;
      });


      // average taking
      await rep.averageAllBuy(selectedWalletAddress, tempERC20Transactions[i].token_symbol, "tokentx").then((rows) => {
        if(rows[0].averagetotalbuy != null){
          averageOfBuy = rows[0].averagetotalbuy;
        }
      });
      await rep.averageAllSell(selectedWalletAddress, tempERC20Transactions[i].token_symbol, "tokentx").then((rows) => {
        if(rows[0].averagetotalsell != null){
          averageOfSell = rows[0].averagetotalsell;
        }
      });

    
    let ttBoughtValue = sumAllBuy != 'Nil' && averageOfBuy != 'Nil' ? (sumAllBuy * averageOfBuy) : 'Nil';
    let ttSoldValue = sumAllSell != 'Nil' && averageOfSell != 'Nil' ? (sumAllSell * averageOfSell) : 'Nil';
  
    ERC20Transactions.push({
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
      totalRelizedValue: ttBoughtValue != 'Nil' && ttSoldValue != 'Nil' ? (sumAllSell * (averageOfSell - averageOfBuy)) : 'Nil',
      totalUnRelizedValue: nOfToken != 'Nil' ? ((nOfToken - averageOfBuy) * tempERC20Transactions[i].buytotal): 'Nil',

    });
  }
  // here are end for ERC20 reports

  // here are start for ERC20 reports
  let tempERC721Transactions = [];
  await rep.getConsolidatedTransactions(selectedWalletAddress, "tokennfttx").then((rows) => {
    tempERC721Transactions = rows;
  });

  for(var i=0; i<tempERC721Transactions.length; i++){
    let nOfToken = 0;
    let sumAllBuy = 0;
    let sumAllSell = 0;
    let averageOfBuy = 0;
    let averageOfSell = 0;
      
      await rep.noOfToken(tempERC721Transactions[i].token_symbol, tempERC721Transactions[i].hash, tempERC721Transactions[i].token_value).then((tkname) => {
        nOfToken = tkname;
      });
      if(nOfToken == 0 || nOfToken == "Nil"){
        await rep.getRateFromCoingecko(tempERC721Transactions[i].token_symbol).then((rate) => {
          nOfToken = rate;
        });
      }

      // sum taking
      await rep.getSumAllBuy(selectedWalletAddress, tempERC721Transactions[i].token_symbol, "tokennfttx").then((rows) => {
        sumAllBuy = rows[0].totalbuy == "null" ? 'Nil' : rows[0].totalbuy;
      });
      
      await rep.getSumAllSell(selectedWalletAddress, tempERC721Transactions[i].token_symbol, "tokennfttx").then((rows) => {
        sumAllSell = rows[0].totalsell == null ? 'Nil': rows[0].totalsell;
      });


      // average taking
      await rep.averageAllBuy(selectedWalletAddress, tempERC721Transactions[i].token_symbol, "tokennfttx").then((rows) => {
        if(rows[0].averagetotalbuy != null){
          averageOfBuy = rows[0].averagetotalbuy;
        }
      });
      await rep.averageAllSell(selectedWalletAddress, tempERC721Transactions[i].token_symbol, "tokennfttx").then((rows) => {
        if(rows[0].averagetotalsell != null){
          averageOfSell = rows[0].averagetotalsell;
        }
      });

    
    let ttBoughtValue = sumAllBuy != 'Nil' && averageOfBuy != 'Nil' ? (sumAllBuy * averageOfBuy) : 'Nil';
    let ttSoldValue = sumAllSell != 'Nil' && averageOfSell != 'Nil' ? (sumAllSell * averageOfSell) : 'Nil';
  
    ERC721Transactions.push({
      token_name: tempERC721Transactions[i].token_symbol,
      buytotal: tempERC721Transactions[i].buytotal,
      nOfToken: nOfToken,
      totalMarketValue: nOfToken != 'Nil' ?  (nOfToken * tempERC721Transactions[i].buytotal): 'Nil',
      sumOfAllBuy: sumAllBuy,
      sumOfAllSell: sumAllSell,
      averageOfBuy: averageOfBuy,
      averageOfSell: averageOfSell,
      totalBoughtValue: ttBoughtValue,
      totalSoldValue: ttSoldValue,
      totalRelizedValue: ttBoughtValue != 'Nil' && ttSoldValue != 'Nil' ? (sumAllSell * (averageOfSell - averageOfBuy)) : 'Nil',
      totalUnRelizedValue: nOfToken != 'Nil' ? ((nOfToken - averageOfBuy) * tempERC721Transactions[i].buytotal): 'Nil',

    });
  }
  // here are end for ERC721 reports

  res.render('pages/consolidated-report',{ERC20Transactions : ERC20Transactions, ERC721Transactions : ERC721Transactions, walletAddress: walletAddress, selected_wallet_address: selectedWalletAddress});

}



async function toFixed(value, precision) {
  var precision = precision || 0,
      neg = value < 0,
      power = Math.pow(10, precision),
      value = Math.round(value * power),
      integral = String((neg ? Math.ceil : Math.floor)(value / power)),
      fraction = String((neg ? -value : value) % power),
      padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');

  return precision ? integral + '.' +  padding + fraction : integral;
}


module.exports = viewConsolidatedTransactions;
