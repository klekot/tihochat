const express = require('express');
const router = express.Router();
const { ulid } = require('ulid');
const config = require('config');
const db = require('../services/database');
const { authenticateSession, validateInput } = require('../middleware/auth');
const { createSessionUser } = require('../utils/fileUtils');

// Login routes
router.get('/login', (req, res) => {
    const { query } = req;
    res.render('login', {
        success: query.success,
        user_name: query.user_name,
        user_login: query.user_login
    });
});

router.post('/login', validateInput, async (req, res) => {
    try {
        const { login, password } = req.body;
        
        if (!login || !password) {
            return res.redirect('/login?success=0');
        }

        const users = await db.getUserByLogin(login, password);
        
        if (users && users.length === 1) {
            req.session.user = createSessionUser(users[0]);
            res.redirect(`/room/${ulid()}`);
        } else {
            res.redirect('/login?success=0');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('error_pages/500.ejs');
    }
});

// Registration routes
router.get('/registration', async (req, res) => {
    try {
        const { query } = req;
        
        if (!query.room) {
            return res.render('registration', {
                person: query.person,
                invite: query.invite
            });
        }

        const invites = await db.getInviteByKey(query.invite);
        
        if (!invites || invites.length === 0) {
            return res.redirect('/invite?success=0');
        }

        const invite = invites[0];
        
        if (invite.user_id) {
            // Invite already used - get existing user
            const users = await db.getUserById(invite.user_id);
            if (users && users.length > 0) {
                req.session.user = createSessionUser(users[0]);
                res.redirect(`/room/${query.room}`);
            } else {
                res.status(500).render('error_pages/500.ejs');
            }
        } else {
            // Create new user with invite
            const name = invite.person;
            const login = 'user_' + Date.now();
            const password = config.get('default.password');
            
            await db.createUser(name, login, password);
            const newUsers = await db.getUserByLogin(login, password);
            
            if (newUsers && newUsers.length > 0) {
                await db.updateInviteUserById(invite.invite_id, newUsers[0].user_id);
                req.session.user = createSessionUser(newUsers[0]);
                res.redirect(`/room/${query.room}`);
            } else {
                res.status(500).render('error_pages/500.ejs');
            }
        }
    } catch (error) {
        console.error('Registration GET error:', error);
        res.status(500).render('error_pages/500.ejs');
    }
});

router.post('/registration', validateInput, async (req, res) => {
    try {
        const { invite, name, login, password } = req.body;
        
        if (!invite || !name || !login || !password) {
            return res.redirect('/invite?success=0');
        }

        const invites = await db.getInviteByKey(invite);
        
        if (!invites || invites.length === 0) {
            return res.redirect('/invite?success=0');
        }

        await db.createUser(name, login, password);
        const newUsers = await db.getUserByLogin(login, password);
        
        if (newUsers && newUsers.length > 0) {
            await db.updateInviteUser(invite, newUsers[0].user_id);
            req.session.user = createSessionUser(newUsers[0]);
            res.redirect(`/room/${ulid()}`);
        } else {
            res.status(500).render('error_pages/500.ejs');
        }
    } catch (error) {
        console.error('Registration POST error:', error);
        res.status(500).render('error_pages/500.ejs');
    }
});

// Logout routes
router.get('/logout', authenticateSession, (req, res) => {
    res.render('logout', { sessionUser: req.session.user });
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).render('error_pages/500.ejs', { message: 'Logout failed' });
        } else {
            res.redirect('/');
        }
    });
});

module.exports = router;
