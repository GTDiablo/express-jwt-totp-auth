const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env['JWT_SECRET'];
const TOKEN_HEADER_NAME = process.env['TOKEN_HEADER_NAME'];

const jwtRequired = (req, res, next) => {
    try {
        // Get token from headers
        const token = req.get(TOKEN_HEADER_NAME);

        // Verify and decode token
        req.user = jwt.verify(token, JWT_SECRET);

        next();
    } catch (error) {
        // Handle error: missing or invalid token
        return res.status(403).json({
            details: 'Missing or invalid token!'
        });
    }
}

module.exports = jwtRequired;
