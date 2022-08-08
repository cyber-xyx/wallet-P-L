var express = require('express');
var router = express.Router();
const { wrap } = require('async-middleware');
const saveTransactions = require('./commands/save-transactions');
const reports = require('./commands/reports');
const consolidatedReport = require('./commands/consolidated-report');
const deleteWalletTransactions = require('./commands/delete-wallet-transactions');
const breakupReport = require('./commands/breakup-report');
const combineToken = require('./commands/combine-token');
const updateCombineToken = require('./commands/update-combine-token');
const updateBuyValue = require('./commands/update-buy-value');

router.get('/', function (req, res) {   
    res.render('pages/create_transactions');
});
router.get('/save-transactions', function (req, res) {   
    res.render('pages/create_transactions');
});
router.post('/save-transactions', wrap(saveTransactions));

router.get('/reports', wrap(reports));
router.get('/consolidated-report', wrap(consolidatedReport));
router.get('/breakup/:tokenSymbol/:walletAddress/:tokenAction', wrap(breakupReport));
router.get('/delete-wallet-transactions', wrap(deleteWalletTransactions));
router.get('/combine-token', wrap(combineToken));
router.post('/update-combine-token', wrap(updateCombineToken));

router.post('/update-buy-value', wrap(updateBuyValue));

module.exports = router; 

