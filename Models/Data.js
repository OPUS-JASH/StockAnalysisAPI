const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dataSchema = new Schema({
    name: String,
    language: String,
    id: String,
    bio: String,
    version: Number
  })

const Data = new mongoose.model('data', dataSchema);

module.exports = Data;