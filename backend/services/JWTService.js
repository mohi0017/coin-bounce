const jwt = require("jsonwebtoken");
const JWT_TOKENS = require('../config/index')
const ACCESS_TOKEN_SECRET = JWT_TOKENS.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = JWT_TOKENS.REFRESH_TOKEN_SECRET;
const RefreshToken = require('../models/token');

class JWTService {
    // sign acces token
    static signAccessToken(payload, expiryTime) {
        return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: expiryTime });
    }
    // sign refresh token
    static signRefreshToken(payload, expiryTime) {
        return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: expiryTime });
    }
    // verify access token
    static verifyAccessToken(token) {
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    }
    // verify refresh token
    static verifyRefreshToken(token) {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    }
    // store refresh token
    static async storeRefreshToken(token, userId) {
        try {
            const newToken = new RefreshToken({
                token,
                userId
            });
            await newToken.save();

        }
        catch (error) {
            console.log(error);
        }

    }

};

module.exports = JWTService;