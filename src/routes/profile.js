const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ulid } = require('ulid');
const db = require('../services/database');
const { authenticateSession, validateInput } = require('../middleware/auth');
const { handleFileUpload, createSessionUser } = require('../utils/fileUtils');

const upload = multer({ dest: 'tmp/' });

// Profile routes
router.get('/profile', authenticateSession, (req, res) => {
    const { query } = req;
    res.render('profile', { 
        sessionUser: req.session.user, 
        roomId: query.roomId || query.room_id
    });
});

router.post('/profile', authenticateSession, upload.single('avatar'), handleFileUpload, validateInput, async (req, res) => {
    try {
        const { user_id, room_id, name, login, password } = req.body;
        
        if (!user_id || !name || !login) {
            return res.status(400).render('error_pages/500.ejs', { message: 'Missing required fields' });
        }

        const updateData = {
            name,
            login
        };

        if (password) {
            updateData.password = password;
        }

        if (req.uploadedAvatar) {
            updateData.avatar = req.uploadedAvatar;
        }

        await db.updateUser(user_id, updateData);
        
        const updatedUsers = await db.getUserById(user_id);
        
        if (updatedUsers && updatedUsers.length === 1) {
            req.session.user = createSessionUser(updatedUsers[0]);
            if (room_id) {
                res.redirect(`/room/${room_id}`);
            } else {
                res.redirect('/');
            }
        } else {
            res.status(500).render('error_pages/500.ejs');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).render('error_pages/500.ejs');
    }
});

module.exports = router;
