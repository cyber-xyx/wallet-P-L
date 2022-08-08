//const knex = require('../../db');
const moment = require("moment");
const request = require('request');
const htmlParse = require('node-html-parser');
const pg = require('pg')
/*var config = {
  user: 'yixiroot', // env var: PGUSER
  database: 'yixiroot', // env var: PGDATABASE
  password: 'yixiroot@7', // env var: PGPASSWORD
  host: 'localhost', // Server hosting the postgres database
  port: 5432, // env var: PGPORT
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
}*/

var config = {
  user: 'yixi', // env var: PGUSER
  database: 'yixi', // env var: PGDATABASE
  password: 'yixi@7', // env var: PGPASSWORD
  host: 'localhost', // Server hosting the postgres database
  port: 5432, // env var: PGPORT
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
}


const pool = new pg.Pool(config);
async function query (q) {
  const client = await pool.connect()
  let res
  try {
    await client.query('BEGIN')
    try {
      res = await client.query(q)
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }
  } finally {
    client.release()
  }
  return res
}

function insertDecimal(num, decimal) {
  let value = 0;
  switch(decimal){
    case "6":
      value = (num / 1000000);
      return (Math.round(value * 100) / 100).toFixed(decimal);
    break;
    case "9":
      value = (num / 1000000000);
      return (Math.round(value * 100) / 100).toFixed(decimal);
    break;
    case "10":
     
      value = (num / 10000000000);
      return (Math.round(value * 100) / 100).toFixed(decimal);

    break;
    case "18":
      value = (num / 1000000000000000000);
      return (Math.round(value * 100) / 100).toFixed(decimal);
    break;
  }
  
}

async function saveTransactions(data, walletAddress, tokenAction, buyOrSell) {
  // for 721
  if(tokenAction == "tokennfttx"){
    if(buyOrSell == "0"){
      query("DELETE FROM transactions WHERE wallet_address = lower('"+walletAddress+"') AND token_action = '"+tokenAction+"' ");
    }
    for(var i=0; i<data.length; i++){


      let asset = data[i].asset;
      if(asset == null){
        asset = data[i].asset_bundle.assets[0];
      }
      if(asset.asset_contract.schema_name == "ERC1155"){
        tokenAction = "tokennfttxErc1155";
      }

     
      // combining token symbol
      let insertTokenSymbol = "";
      switch(asset.asset_contract.symbol){
        case "sSPELL":
          insertTokenSymbol = "SPELL";
        break;
        case "OHM":
          insertTokenSymbol = "GOHM";
        break;
        case "nICE":
          insertTokenSymbol = "ICE";
        break;
        default: 
          insertTokenSymbol = asset.asset_contract.symbol;
        break;
      }


      
      let tkValue = await insertDecimal(data[i].base_price, data[i].payment_token_contract.decimals.toString());
      await toFixed(tkValue, 4).then((rate) => {
        if(rate > 0){
          tkValue = rate;
        }
        
      });
    
      if(tkValue == undefined){
        tkValue = 0.0000;
      }
      tokenValue = tkValue;

      let localTime  = moment.utc(data[i].created_date).toDate();
      localTime = moment.utc(localTime).format('YYYY-MM-DD HH:mm:ss'); 
      let timeStamp = moment(localTime).format("X");
      

      
      let isEntry = 1;
      let to = data[i].taker.address;
      if(buyOrSell == "0"){
        to = walletAddress;
        if(tokenValue == 0){
          isEntry = 0;
        }
      }
      
      
      if(isEntry == 1){
        const qry = {
            text: 'INSERT INTO transactions (block_number, timestamp, nonce, user_from, user_to, token_name, token_symbol, token_decimal, transaction_index, gas, gas_price, gas_used, cumulative_gas_used, input, confirmations, hash, block_hash, contract_address, token_value, wallet_address, token_action, transaction_rate)VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)',
            values: [`${data[i].id}`, `${timeStamp}`, 0, `${data[i].maker.address}`, `${to.toLowerCase()}`, `${asset.asset_contract.name}`, `${insertTokenSymbol}`, `${data[i].payment_token_contract.decimals}`, `${asset.token_id}`, 0, 0, 0, 0, '', '', `${asset.asset_contract.address}`+'/'+asset.token_id, '', `${asset.asset_contract.address}`, `${tokenValue}`, `${walletAddress.toLowerCase()}`, `${tokenAction}`, `${data[i].payment_token_contract.usd_price}`],
          }
          await pool.query(qry);
      }
    }
    
  }else{
    //for 20
    query("DELETE FROM transactions WHERE wallet_address = lower('"+walletAddress+"') AND token_action = '"+tokenAction+"' ");
    for(var i=0; i< data.length; i++){

      // combining token symbol
      let insertTokenSymbol = "";
      switch(data[i].tokenSymbol){
        case "sSPELL":
          insertTokenSymbol = "SPELL";
        break;
        case "OHM":
          insertTokenSymbol = "GOHM";
        break;
        case "nICE":
          insertTokenSymbol = "ICE";
        break;
        default: 
          insertTokenSymbol = data[i].tokenSymbol;
        break;
      }

      let tkValue = insertDecimal(data[i].value, data[i].tokenDecimal);
      await toFixed(tkValue, 4).then((rate) => {
        if(rate > 0){
          tkValue = rate;
        }
        
      });
    
      if(tkValue == undefined){
        tkValue = 0.0000;
      }
      tokenValue = tkValue;
      

      let closeRate = 0;

     
      await getRateFromDate(insertTokenSymbol, data[i].timeStamp).then((rate) => {
        closeRate = rate;
      });
      
      
      let isEntry = 1;
      if(data[i].to == walletAddress && tokenValue == 0){
        isEntry = 0;
      }
      if(isEntry == 1){
        const qry = {
            text: 'INSERT INTO transactions (block_number, timestamp, nonce, user_from, user_to, token_name, token_symbol, token_decimal, transaction_index, gas, gas_price, gas_used, cumulative_gas_used, input, confirmations, hash, block_hash, contract_address, token_value, wallet_address, token_action, transaction_rate)VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)',
            values: [`${data[i].blockNumber}`, `${data[i].timeStamp}`, `${data[i].nonce}`, `${data[i].from}`, `${data[i].to}`, `${data[i].tokenName}`, `${insertTokenSymbol}`, `${data[i].tokenDecimal}`, `${data[i].transactionIndex}`, `${data[i].gas}`, `${data[i].gasPrice}`, `${data[i].gasUsed}`, `${data[i].cumulativeGasUsed}`, `${data[i].input}`, `${data[i].confirmations}`, `${data[i].hash}`, `${data[i].blockHash}`, `${data[i].contractAddress}`, `${tokenValue}`, `${walletAddress.toLowerCase()}`, `${tokenAction}`, `${closeRate}`],
        }
        await pool.query(qry);
      }

    }
  }

  return '';
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

async function deleteTransactions(walletAddress, selectedTokenAction) {
  if(selectedTokenAction == undefined){
    query("DELETE FROM transactions WHERE wallet_address = lower('"+walletAddress+"') ");
  }else{
    query("DELETE FROM transactions WHERE wallet_address = lower('"+walletAddress+"') AND token_action = lower('"+selectedTokenAction+"') ");
  }
 
  return '';
}

async function getTransactions(selectedWalletAddress, selectedTokenAction) {
  selectedWalletAddress = selectedWalletAddress == undefined ? "0" : selectedWalletAddress;
  if(selectedTokenAction == undefined){
   
    const { rows } = await query("SELECT * FROM transactions WHERE wallet_address = lower('"+selectedWalletAddress+"') ")
    return rows;
  }else{
    const { rows } = await query("SELECT * FROM transactions WHERE wallet_address = lower('"+selectedWalletAddress+"') AND token_action = lower('"+selectedTokenAction+"') ")
    return rows;
  }
  
}

async function getWalletAddress() {
  const { rows } = await query('SELECT DISTINCT wallet_address FROM transactions;')
  return rows;
}

async function getTokensFromTransactions() {
  const { rows } = await query("SELECT DISTINCT token_symbol FROM transactions WHERE token_symbol != 'undefined';")
  return rows;
}

async function getSumAllBuy(selectedWalletAddress, tokenSymbol, tokenAction) {
  const { rows } = await query("select TRUNC(SUM(token_value), 4) as totalbuy from transactions as t WHERE t.token_symbol =  '"+tokenSymbol+"' AND user_to = lower('"+selectedWalletAddress+"') AND token_action = '"+tokenAction+"' ")
  return rows;
}

async function getSumAllSell(selectedWalletAddress, tokenSymbol, tokenAction) {
  const { rows } = await query("select TRUNC(SUM(token_value), 4) as totalsell from transactions as t WHERE t.token_symbol =  '"+tokenSymbol+"' AND user_from = lower('"+selectedWalletAddress+"') AND token_action = '"+tokenAction+"' ")
  return rows;
}

async function getConsolidatedTransactions(selectedWalletAddress, tokenAction) {
  
  if(selectedWalletAddress != undefined){

    const { rows } = await query("SELECT TRUNC(buytotal, 4) as buytotal, token_symbol FROM (SELECT token_symbol, nooftoken(token_symbol, '"+selectedWalletAddress+"', '"+tokenAction+"') as buytotal FROM transactions WHERE token_action = '"+tokenAction+"' AND wallet_address = '"+selectedWalletAddress+"' group by token_symbol HAVING token_symbol != 'undefined') as dd group by token_symbol, buytotal;");
    return rows;

  }else{
    return [];
  }
  
}

async function getbreakupReports(selectedWalletAddress, tokenAction, tokenSymbol) {
  if(selectedWalletAddress != undefined){
   
    

    const { rows } = await query("(SELECT id, timestamp, hash, token_symbol, COALESCE(token_value, 0) as buytotal, '0' as puchase_status, transaction_rate FROM transactions WHERE token_action = '"+tokenAction+"' AND token_symbol = '"+tokenSymbol+"' AND user_to = lower('"+selectedWalletAddress+"')) UNION (SELECT id,timestamp, hash, token_symbol, COALESCE(token_value, 0) as buytotal, '1' as puchase_status, transaction_rate FROM transactions WHERE token_action = '"+tokenAction+"' AND token_symbol = '"+tokenSymbol+"' AND user_from = lower('"+selectedWalletAddress+"'));");
    return rows;
  }else{
    return [];
  }
  
}



async function getRateFromDate(tokenSymbol, date) {
  
  return new Promise(resolve => {

    let startFrom = moment.unix(date).format("YYYY-MM-DDTHH:mm:ss");
    let startTo = moment.unix(date).add(1, 'minutes').format("YYYY-MM-DDTHH:mm:ss");
    
    let url = 'https://rest.coinapi.io/v1/exchangerate/'+tokenSymbol+'/USD/history?period_id=1MIN&time_start='+startFrom+'&time_end='+startTo;
    console.log(url);
    const xtoken = "CFC6EC1A-1165-4078-A059-5A7EF564A708";
    //const xtoken = "C6A6ED75-D529-4B14-A1D3-4DEF8E3B4A7A";
    //let xtoken = "87FD9A5A-47D2-4C29-99F6-C9E4DF51F48A";
    //let xtoken = "E7349B84-5069-439F-9C20-96DEB71DFB81";
    //let xtoken = "B5989AC7-6915-43FB-AA13-557C841DBAEF";
    //let xtoken = "943542BD-D943-4EA4-8325-F3A210A75D7B";
    //let xtoken = "DAE3413B-015C-4B9E-BFE0-079D31E5DF64";
    var options = {
        url: url,
        headers: {'X-CoinAPI-Key': xtoken, 'Accept': 'application/json'}
    };
    request(options, (error, response, body) => {
        
        if(response != undefined){
          var response = JSON.parse(response.body);
          if(response.error != undefined){
            resolve(0);
          }else{
            if(response.length > 0){
              console.log("CLOSERATE=", response[0].rate_close);
              resolve(response[0].rate_close);
            }else{
              resolve(0);
            }
          }
        }else{
          resolve(0);
        }
        
      

    });
  });
}

async function getRateFromCoingecko(tokenSymbol) {
  return new Promise(resolve => {
    console.log('https://api.coingecko.com/api/v3/search?query='+tokenSymbol);
    var options = {
      url: 'https://api.coingecko.com/api/v3/search?query='+tokenSymbol,
      headers: {'Accept': 'application/json'}
    };
    request(options, (error, response, body) => {
      if(response.error == undefined){
      
          var response = JSON.parse(response.body);
          if(response.coins.length > 0){
            let id = response.coins[0].id;

            var optionsInternal = {
              url: 'https://api.coingecko.com/api/v3/simple/price?ids='+id+'&vs_currencies=usd',
              headers: {'Accept': 'application/json'}
            };
            request(optionsInternal, (error, response, body) => {
              if(response.error == undefined){
                var response = JSON.parse(response.body);
                if(response[id].usd != undefined){
                  console.log("CUURPRICE=", response[id].usd);
                  resolve(response[id].usd);
                }else{
                  resolve(0);
                }
                
              }else{
                resolve(0);
              }
            });


          }else{
            resolve(0);
          }
       
      }else{
        resolve(0);
      }
    });
  });
}


async function averageAllBuy(selectedWalletAddress, tokenSymbol, tokenAction) {
  
  const { rows } = await query("select (TRUNC(SUM(transaction_rate), 4) / (CASE WHEN count(transaction_rate) = 0 then 1 else count(transaction_rate) end)) as averagetotalbuy from transactions as t WHERE t.token_symbol = '"+tokenSymbol+"' AND user_to = lower('"+selectedWalletAddress+"') AND token_action = '"+tokenAction+"'; ")
 
  return rows;
}

async function averageAllSell(selectedWalletAddress, tokenSymbol, tokenAction) {
  const { rows } = await query("select (TRUNC(SUM(transaction_rate), 4) / (CASE WHEN count(transaction_rate) = 0 then 1 else count(transaction_rate) end)) as averagetotalsell from transactions as t WHERE t.token_symbol = '"+tokenSymbol+"' AND user_from = lower('"+selectedWalletAddress+"') AND token_action = '"+tokenAction+"'; ")
  
  return rows;
}
async function relizedValue(selectedWalletAddress, tokenSymbol, tokenAction) {
  const { rows } = await query("SELECT relizedValue(token_symbol, '"+selectedWalletAddress+"', '"+tokenAction+"') as totalrelizedvalue FROM transactions WHERE token_symbol = '"+tokenSymbol+"' AND token_action = '"+tokenAction+"' ")
  
  return rows;
}

async function noOfToken(token_symbol, hash, tokenValue){
  
  return new Promise(resolve => {
    const xtoken = "CFC6EC1A-1165-4078-A059-5A7EF564A708";
    //const xtoken = "C6A6ED75-D529-4B14-A1D3-4DEF8E3B4A7A";
    //let xtoken = "87FD9A5A-47D2-4C29-99F6-C9E4DF51F48A";
    //let xtoken = "E7349B84-5069-439F-9C20-96DEB71DFB81";
    //let xtoken = "B5989AC7-6915-43FB-AA13-557C841DBAEF";
    //let xtoken = "943542BD-D943-4EA4-8325-F3A210A75D7B";
    //let xtoken = "DAE3413B-015C-4B9E-BFE0-079D31E5DF64";
    if(token_symbol == ""){
      resolve(0);
    }else{

    
      console.log('https://rest.coinapi.io/v1/exchangerate/'+token_symbol.toUpperCase()+'/USD');
      var options = {
          url: 'https://rest.coinapi.io/v1/exchangerate/'+token_symbol.toUpperCase()+'/USD',
          headers: { 'X-CoinAPI-Key': xtoken, 'Accept': 'application/json'}
      };

      request(options, (error, response, body) => {
      
        var response = JSON.parse(response.body);
        if(response.error != undefined){
          resolve(0);
        }else{
          if(response.rate > 0){
            toFixed(response.rate, 4).then((rate) => {
              resolve(rate);
            });
          }else{
            
            resolve(0);
          }
        }
      });
    }
  });
}
// update wallet token symbol
async function updateTokenSymbol(token_symbol_from, token_symbol_to) {
  token_symbol_from.forEach(function (element) {
    
    const { rows } = query("UPDATE transactions SET token_symbol = '"+token_symbol_to+"' WHERE token_symbol = '"+element+"';")
    return rows;
  });
}

//update buy price 
async function updateBuyPrice(tokenValue, id) {
  console.log("UPDATE transactions SET transaction_rate = '"+tokenValue+"' WHERE id = '"+id+"';");
  const { rows } = query("UPDATE transactions SET transaction_rate = '"+tokenValue+"' WHERE id = '"+id+"';")
  return rows;
}

module.exports = {
  saveTransactions,
  getTransactions,
  getConsolidatedTransactions,
  getWalletAddress,
  deleteTransactions,
  getSumAllBuy,
  getSumAllSell,
  getRateFromDate,
  averageAllBuy,
  averageAllSell,
  relizedValue,
  toFixed,
  getbreakupReports,
  getRateFromCoingecko,
  noOfToken,
  getTokensFromTransactions,
  updateTokenSymbol,
  updateBuyPrice
};
