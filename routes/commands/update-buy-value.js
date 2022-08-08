var rep = require('../commands/repository');
async function updateBuyValue(req, res) {

  await rep.updateBuyPrice(req.body.price, req.body.id);

  res.send({
    status: true,
    message: "Updated"
  });
  
}
module.exports = updateBuyValue;