const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stocksSchema = new Schema({
    instrument: String,
    symbol : String,
    price : [
        {
            date : String,
            open : String,
            close : String,
            contracts :String
        }
    ]
  })

const Stock = new mongoose.model('stock', stocksSchema);

module.exports = Stock;