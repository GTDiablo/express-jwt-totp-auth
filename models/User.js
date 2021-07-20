const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    secret: {
        type: String,
        required: true,
        maxlength: 50,
        minlength: 50,
    }
});

module.exports = mongoose.model('User', UserSchema);
