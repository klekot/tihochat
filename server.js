const express = require('express')
// const { ExpressPeerServer } = require("peer");
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const { ulid } = require('ulid')

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.get('/', (req, res) => {
    res.redirect(`/${ulid()}`)
})
app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).emit('user-connected', userId)

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId)
        })
    })
})
server.listen(3000)