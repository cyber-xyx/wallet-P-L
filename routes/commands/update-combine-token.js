var rep = require('../commands/repository');
async function updateCombineToken(req, res) {

  if(req.body.token_symbol_from != undefined && req.body.token_symbol_to != undefined){
    await rep.updateTokenSymbol(req.body.token_symbol_from, req.body.token_symbol_to).then((rows) => {
      res.redirect('/');
    });
  }
  
}
module.exports = updateCombineToken;
