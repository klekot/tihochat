const express = require('express');
const router = express.Router();
const { ulid } = require('ulid');
const { authenticateSession } = require('../middleware/auth');

// Home route
router.get('/', (req, res) => {
    if (!req.session.user) {
        res.render('index');
    } else {
        res.redirect(`/room/${ulid()}`);
    }
});

// Room routes
router.get('/room/:room/:invite', (req, res) => {
    if (!req.session.user) {
        if (req.params.room && req.params.invite) {
            res.redirect(`/registration?room=${req.params.room}&invite=${req.params.invite}`);
        } else {
            res.redirect('/');
        }
    } else {
        res.render('room', { 
            roomId: req.params.room, 
            currentUser: req.session.user 
        });
    }
});

router.get('/room/:room', authenticateSession, (req, res) => {
    res.render('room', { 
        roomId: req.params.room, 
        currentUser: req.session.user 
    });
});

module.exports = router;
