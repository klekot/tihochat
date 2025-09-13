const { readFileSync } = require("fs");
const { createServer } = require("https");
const { Server } = require("socket.io");

const express = require('express');
const app = express();
const server = createServer({
    key: readFileSync("/etc/ssl/tihochat.ru/tihochat.ru.key"),
    cert: readFileSync("/etc/ssl/tihochat.ru/tihochat.ru.crt")
});
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});
const { ulid } = require('ulid');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.redirect(`/${ulid()}`)
});
app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room })
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId, userName) => {
        socket.join(roomId);
        setTimeout(()=>{
            socket.to(roomId).emit("user-connected", userId);
        }, 1000)
        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName);
        });
    });
});
server.listen(process.env.PORT || 30000);