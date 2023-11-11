const Joi = require('joi');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const UserDto = require("../dto/user");
const JWTService = require('../services/JWTService');
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;
const RefreshToken = require("../models/token");

const authController =
{
    async register(req, res, next) {
        // 1. validate user info
        const userRegisterSchema = Joi.object(
            {
                username: Joi.string().min(5).max(30).required(),
                name: Joi.string().max(30).required(),
                email: Joi.string().email().required(),
                password: Joi.string().pattern(passwordPattern).required(),
                confirmPassword: Joi.ref('password')

            }
        );
        const { error } = userRegisterSchema.validate(req.body);
        // 2. if error in validation -> return error via middleware
        if (error) {
            return next(error);
        }
        // 3. if email or username already resgisterd -> error

        const { username, name, email, password } = req.body;
        try {
            const emailInUse = await User.exists({ email });
            const usernameInUse = await User.exists({ username });

            if (emailInUse) {
                const error = {
                    status: 409,
                    message: "Email already registered, use another email"
                }
                return next(error);
            }

            if (usernameInUse) {
                const error = {
                    status: 409,
                    message: "Username not available, use another username"
                }
                return next(error);
            }


        }
        catch (error) {
            return next(error);
        }
        // 4. if no error then hash tha passowrd and submit data into database 
        const hashedPassword = await bcrypt.hash(password, 10);
        let accessToken;
        let refreshToken;
        let user;
        try {
            const UserToRegister = new User({
                username,
                name,
                email,
                password: hashedPassword

            });
            user = await UserToRegister.save();
            // token generation
            accessToken = JWTService.signAccessToken({ _id: user._id }, '30m');
            refreshToken = JWTService.signRefreshToken({ _id: user._id }, '60m');
        }
        catch (error) {
            return next(error);
        }

        await JWTService.storeRefreshToken(refreshToken, user._id);
        // send cookies
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httponly: true
        });

        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httponly: true
        });
        // 5. send response
        const USERDTO = new UserDto(user);
        return res.status(201).json({ user: USERDTO, auth: true });
    },
    async login(req, res, next) {
        // 1. validate user info
        const userLoginSchema = Joi.object(
            {
                username: Joi.string().min(5).max(30).required(),
                password: Joi.string().required(),
            }
        );
        const { error } = userLoginSchema.validate(req.body);
        // 2. if error in validation -> return error via middleware
        if (error) {
            return next(error);
        }
        const { username, password } = req.body;
        // 3. match username and password
        let user;
        try {
            user = await User.findOne({ username });
            if (!user) {
                const error =
                {
                    status: 401,
                    message: "Invalid Username!"
                }
                return next(error);
            }
            const matchPassword = await bcrypt.compare(password, user.password);
            if (!matchPassword) {
                const error =
                {
                    status: 401,
                    message: "Invalid Password!"
                }
                return next(error);
            }
        }
        catch (error) {
            return next(error);
        }
        // token generation
        const accessToken = JWTService.signAccessToken({ _id: user._id }, '30m');
        const refreshToken = JWTService.signRefreshToken({ _id: user._id }, '60m');
        // update token
        try {
            await RefreshToken.updateOne({ _id: user._id }, { token: refreshToken }, { upsert: true });

        }
        catch (error) {
            console.log(error);
        }
        // send cookies
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httponly: true
        });

        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httponly: true
        });
        const USERDTO = new UserDto(user);
        // 4. send response
        return res.status(200).json({ user: USERDTO, auth: true });

    },
    async logout(req, res, next) {
        console.log(req);
        // 1. refreshToken delete
        const { refreshToken } = req.cookies;

        try {
            await RefreshToken.deleteOne({ token: refreshToken });
        }
        catch (error) {
            return next(error);
        }
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        // 2. response
        return res.status(200).json({ user: null, auth: false });
    },
    async refresh(req, res, next) {
        // 1. generat refresh token from cookie
        const originalRefreshToken = req.cookies.refreshToken;
        let _id;
        try {
            _id = JWTService.verifyRefreshToken(originalRefreshToken);
        }
        catch (e) {
            const error = {
                status: 401,
                message: "Unauthorized"
            }
            return next(error);
        }
        // 2. verify refresh token
        try {
            const match = RefreshToken.findOne({ _id, token: originalRefreshToken });
            if (!match) {
                const error = {
                    status: 401,
                    message: "Unauthorized"
                }
                return next(error);
            }
        }
        catch (error) {
            return next(error);
        }
        // 3. generate new tokens
        const accessToken = JWTService.signAccessToken({ _id }, '30m');
        const refreshToken = JWTService.signRefreshToken({ _id }, '60m');
        // 4. update db, retune response
         // update token
        try {
            await RefreshToken.updateOne({ _id }, { token: refreshToken });
        }
        catch (error) {
            console.log(error);
        }
        // send cookies
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httponly: true
        });

        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httponly: true
        });
        user = await User.findOne({_id});
        const USERDTO = new UserDto(user);
        // 4. send response
        return res.status(200).json({ user: USERDTO, auth: true });
    }
};

module.exports = authController;