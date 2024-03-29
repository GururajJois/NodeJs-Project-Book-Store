const express = require('express');

const { check, body } = require('express-validator');

const authController = require('../controllers/auth');

const router = express.Router();

const User = require('../models/user');

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email address.')
            .normalizeEmail(),
        body('password', 'Password has to be valid.')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin
);

router.post('/signup', [
    check('email').isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, { req }) => {
            // if (value === 'test@test.com') {
            //     throw new Error('This email address if forbidden.');
            // }
            // return true;
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('Email already exisits, Please pick a different one.')
                    }
                })
        }).normalizeEmail(), body('password', 'Please enter a password with only number and text with minimun lenght of 5').isLength({ min: 5 }).isAlphanumeric().trim(),
    body('confirmPassword').trim().custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Passwords don't match");
        }
        return true;
    })
]
    , authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
