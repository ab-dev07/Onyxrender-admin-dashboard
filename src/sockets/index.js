// sockets/index.js
const { chatSocket } = require("./chat.socket");

exports.connectSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("socket connected:", socket.id);

        // Pass down socket instance
        chatSocket(io, socket);

        socket.on("disconnect", (reason) => {
            console.log("disconnected:", socket.id, reason);
        });
    });
};
