const express = require('express');
const router = express.Router();
const db = require('../services/database');
const { validateInput } = require('../middleware/auth');

// Invite routes
router.get('/invite', (req, res) => {
    const { query } = req;
    res.render('invite', { success: query.success });
});

router.post('/invite', validateInput, async (req, res) => {
    try {
        const { invite } = req.body;
        
        if (!invite) {
            return res.redirect('/invite?success=0');
        }

        const invites = await db.getInviteByKey(invite);
        
        if (invites && invites.length > 0) {
            const inviteData = invites[0];
            
            if (inviteData.user_id) {
                // Invite already linked to user
                const users = await db.getUserById(inviteData.user_id);
                if (users && users.length > 0) {
                    res.redirect(`/login?success=1&user_name=${users[0].name}&user_login=${users[0].login}`);
                } else {
                    res.redirect('/invite?success=0');
                }
            } else {
                res.redirect(`/registration?person=${inviteData.person}&invite=${invite}`);
            }
        } else {
            res.redirect('/invite?success=0');
        }
    } catch (error) {
        console.error('Invite processing error:', error);
        res.redirect('/invite?success=0');
    }
});

module.exports = router;
