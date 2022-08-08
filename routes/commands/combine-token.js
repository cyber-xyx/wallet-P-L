var rep = require('../commands/repository');
async function combineToken(req, res) {

  let tokens = {};
  await rep.getTokensFromTransactions().then((rows) => {
    tokens = rows;
  });
  res.render('pages/combine-token',{tokens: tokens});

}
module.exports = combineToken;
