const mongoose = require('mongoose');

const MONGO_HOST = process.env['MONGO_HOST'];
const MONGO_PORT = process.env['MONGO_PORT']
const MONGO_DATABASE = process.env['MONGO_DATABASE'];
const MONGO_URI = `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`;

const connectToDatabase = () => {
    return mongoose.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
}

module.exports = connectToDatabase
