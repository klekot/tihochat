const express = require('express');
const router = express.Router();
const config = require('config');
const getTURNCredentials = require("../../services/turn.js");

const TURN_SECRET = config.get('turn.secret'); // must match coturn config

router.get("/api/turn", (req, res) => {
    const creds = getTURNCredentials("peerjs", TURN_SECRET);
    res.json({
        urls: [
            // 'stun:stun01.sipphone.com',
            // 'stun:stun.ekiga.net',
            // 'stun:stunserver.org',
            // 'stun:stun.softjoys.com',
            // 'stun:stun.voiparound.com',
            // 'stun:stun.voipbuster.com',
            // 'stun:stun.voipstunt.com',
            // 'stun:stun.voxgratia.org',
            // 'stun:stun.xten.com',
            'stun:stun.l.google.com:19302',
            "stun:turn.tihochat.ru:3478",
            "turn:turn.tihochat.ru:3478?transport=udp",
            "turns:turn.tihochat.ru:5349?transport=tcp",
        ],
        username: creds.username,
        credential: creds.password,
    });
});

module.exports = router;