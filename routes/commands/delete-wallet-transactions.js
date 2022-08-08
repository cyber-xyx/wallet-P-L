var rep = require('../commands/repository');
const moment = require("moment");
async function deleteWalletTransactions(req, res) {
  selectedWalletAddress = req.query.wallet_address;
  selectedTokenAction = req.query.token_action;
  let walletAddress = {};

  transactions = rep.deleteTransactions(selectedWalletAddress, selectedTokenAction).then((rows) => {
    rep.getWalletAddress().then((data) => {
      walletAddress = data;
      res.render('pages/delete-wallet-transactions', {walletAddress: walletAddress, selectedWalletAddress: selectedWalletAddress, selectedTokenAction: selectedTokenAction});
    });    
  });
}

module.exports = deleteWalletTransactions;
