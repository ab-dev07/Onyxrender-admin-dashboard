const jwt = require("jsonwebtoken");
const { User } = require("../models/users");
const cookie = require("cookie");

const authenticateSocket = async (socket, next) => {
    try {
        const cookies = cookie.parse(socket.handshake.headers.cookie || "");
        const token = cookies.token;
        if (!token) {
            return next(new Error("No token provided"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!decoded) {
            return next(new Error("Invalid token"));
        }

        const user = await User.findById(decoded._id);
        if (!user) {
            return next(new Error("User not found"));
        }

        // Attach user to socket
        socket.user = user;
        next();
    } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication error"));
    }
};

module.exports = { authenticateSocket };
