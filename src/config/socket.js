const { Server } = require("socket.io")
const { connectSocket } = require("../sockets/index")
const { authenticateSocket } = require("../middlewares/socket.auth")

function initSocket(httpServer) {
    const io = new Server(httpServer, {
        path: "/socket.io", // default
        cors: {
            origin: process.env.CLIENT_BASE_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        },
        pingInterval: 25000,
        pingTimeout: 60000,
        maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
        allowEIO3: false,
        // perMessageDeflate: false // optional
    });

    io.use(authenticateSocket);
    connectSocket(io)

    return io;
}

module.exports = { initSocket }