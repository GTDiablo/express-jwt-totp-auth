require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const speakeasy = require('speakeasy');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const _ = require('lodash');
const Joi = require('joi');

// App constants
const PORT = process.env['PORT'] || 3000;
const MONGO_URI = `mongodb://${process.env['MONGO_HOST']}:${process.env['MONGO_PORT']}/${process.env['MONGO_DATABASE']}`;
const APP_NAME = process.env['APP_NAME'] || 'Auth app';
const JWT_SECRET = process.env['JWT_SECRET'];

// Express instance and middlewares
const app = express();
app.use(bodyParser.json());

// Connect to mongoDb
mongoose.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then((result)=> {
       console.log('Successfully connected to database: ' + MONGO_URI);
    })
    .catch((error)=> {
       console.error('Failed to connected to database: ', error);
       process.exit(1);
    });

app.post('/registration', async (req, res)=> {
    // Validate data
    const validator = Joi.object({
        username: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
    });
    const { value, error } = validator.validate(req.body);
    if(error) {
        res.status(400).json({
            details: error.details,
        }).end();
        return;
    }

    // Destructure validated data
    const { username, email, password } = value;

    // Check if user already exists
    const exists = await User.findOne({email});
    if(exists){
        res.status(400).json({
            'details': 'User already exists!'
        }).end();
        return;
    }

    // Hash password with salt
   const hashedPassword = await bcrypt.hash(password, 8);

   // Generate totp credentials
   const secret = speakeasy.generateSecret({length: 20});
   const url = speakeasy.otpauthURL({ secret: secret.ascii, label: APP_NAME, algorithm: 'sha512' });

   // Save processed user to database
   const user = new User({username, email, password: hashedPassword, secret: secret.ascii});
   const savedUser = await user.save();
    res.json({
        ..._.pick(savedUser,['username', 'email']),
        totpUrl: url
    });
});

app.post('/login', async (req, res) => {
    // Validate request data
    const validator = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        totp: Joi.string().required()
    });
    const {value, error} = validator.validate(req.body);
    if (error) {
        res.status(400).json({
            details: error.details
        }).end();
        return;
    }

    // Destructure validated data
    const {email, password, totp} = value;

    // Check if user exists
    const user = await User.findOne({email});
    if (!user) {
        res.status(400).json({
            'details': 'User does not exists!'
        }).end();
        return;
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        res.status(400).json({
            'details': 'Wrong email or password!'
        }).end();
        return;
    }
    // Verify totp
    const verified = speakeasy.totp.verify({
        secret: user.secret,
        algorithm: 'sha512',
        token: totp
    })
    if (!verified) {
        res.status(400).json({
            details: 'TOTP token missmatch!'
        }).end()
        return;
    }

    // Send jwt with user data
    res.json({
        token: jwt.sign(_.pick(user, ['username', 'email']), JWT_SECRET)
    })

});

// Start server
app.listen(PORT, ()=> {
   console.log(`App is running on: http://localhost:${PORT}`);
})
