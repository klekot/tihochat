const { readFileSync } = require("fs");
// var http = require('http');
var https = require("https");
const { Server } = require("socket.io");

const express = require('express');
const app = express();
// const httpServer = http.createServer(app);
const httpsServer = https.createServer({
    // key: readFileSync("/etc/ssl/tihochat.ru/tihochat.ru.key"),
    // cert: readFileSync("/etc/ssl/tihochat.ru/tihochat.ru.crt")
    key: readFileSync("/Volumes/HIKVISION/Sites/tihochat/localhost+2-key.pem"),
    cert: readFileSync("/Volumes/HIKVISION/Sites/tihochat/localhost+2.pem")
}, app);
const io = new Server(httpsServer, {
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
// httpServer.listen(process.env.PORT || 30003);
httpsServer.listen(process.env.PORT || 30000);