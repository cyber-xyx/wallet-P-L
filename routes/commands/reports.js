var rep = require('../commands/repository');
const moment = require("moment");
async function viewReports(req, res) {
  selectedWalletAddress = req.query.wallet_address;
  selectedTokenAction = req.query.token_action;

  let walletAddress = {};
  rep.getWalletAddress().then((rows) => {
    walletAddress = rows;

    transactions = rep.getTransactions(selectedWalletAddress, selectedTokenAction).then((rows) => {
      res.locals.moment = moment;
      console.log("wallet_address_wallet_address"+JSON.stringify(walletAddress));
      res.render('pages/reports',{transactions : rows, walletAddress: walletAddress, selected_wallet_address: selectedWalletAddress, selectedTokenAction: selectedTokenAction});
    });

  });
}

module.exports = viewReports;
