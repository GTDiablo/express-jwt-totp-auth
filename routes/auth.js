const express = require('express');
const User = require('../models/User');
const _ = require('lodash');
const Joi = require('joi');
const speakeasy = require('speakeasy');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const APP_NAME = process.env['APP_NAME'] || 'Auth app';
const JWT_SECRET = process.env['JWT_SECRET'];
const TOTP_SECRET_LENGTH = process.env['TOTP_SECRET_LENGTH'];

const router = express.Router();

router.post('/registration', async (req, res)=> {
    try {
        // Validate data
        const validator = Joi.object({
            username: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
        });
        const { value, error } = validator.validate(req.body);
        if(error) {
            return res.status(400).json({
                details: error.details,
            }).end();
        }

        // Destructure validated data
        const { username, email, password } = value;

        // Check if user already exists
        const exists = await User.findOne({email});
        if(exists){
            return res.status(400).json({
                'details': 'User already exists!'
            }).end();
        }

        // Hash password with salt
        const hashedPassword = await bcrypt.hash(password, 8);

        // Generate totp credentials
        const secret = speakeasy.generateSecret({length: parseInt(TOTP_SECRET_LENGTH)});

        // TODO: Fix otpauthURL speakeasy function
        // const url = speakeasy.otpauthURL({ secret: secret.base32, label: `${APP_NAME}: ${email}` });
        const url = `otpauth://totp/ex-aut: ${email}?secret=${secret.base32}`;

        // Save processed user to database
        const user = new User({username, email, password: hashedPassword, secret: secret.base32});
        const savedUser = await user.save();
        return res.json({
            ..._.pick(savedUser,['username', 'email']),
            totpUrl: url
        });
    } catch (error) {
        // Handle server error
        return res.status(500).json({details: error});
    }
});

router.post('/login', async (req, res) => {
   try {
       // Validate request data
       const validator = Joi.object({
           email: Joi.string().email().required(),
           password: Joi.string().required(),
           totp: Joi.string().required()
       });
       const {value, error} = validator.validate(req.body);
       if (error) {
           return res.status(400).json({
               details: error.details
           }).end();
       }

       // Destructure validated data
       const {email, password, totp} = value;

       // Check if user exists
       const user = await User.findOne({email});
       if (!user) {
           return res.status(400).json({
               'details': 'User does not exists!'
           }).end();
       }

       // Compare passwords
       const passwordMatch = await bcrypt.compare(password, user.password);
       if (!passwordMatch) {
           return res.status(400).json({
               'details': 'Wrong email or password!'
           }).end();
       }

       // Verify totp
       const verified = speakeasy.totp.verify({
           secret: user.secret,
           encoding: 'base32',
           token: totp,
           window: 2
       });
       if (!verified) {
           return res.status(400).json({
               details: 'TOTP token mismatch!'
           }).end()
       }

       // Send jwt with user data
       return res.json({
           token: jwt.sign(_.pick(user, ['username', 'email']), JWT_SECRET)
       });
   } catch (error) {
       // Handle server error
       return res.status(500).json({details: error});
   }
});

module.exports = router;
