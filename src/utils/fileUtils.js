const fs = require('fs');
const path = require('path');

const handleFileUpload = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const avatar = req.file.originalname;
    const tempPath = req.file.path;
    const userDir = `./uploads/${req.session.user.id}`;
    
    // Create user directory if it doesn't exist
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }

    const targetPath = path.join(__dirname, '../..', userDir, avatar);
    const allowedExtensions = ['.png', '.jpg', '.jpeg'];

    if (allowedExtensions.includes(path.extname(avatar).toLowerCase())) {
        fs.rename(tempPath, targetPath, (err) => {
            if (err) {
                console.error('File upload error:', err);
                return res.status(500).json({ error: 'File upload failed' });
            }
            // Clean up temp file
            fs.unlink(tempPath, (err) => {
                if (err) console.error('Temp file cleanup error:', err);
            });
            req.uploadedAvatar = avatar;
            next();
        });
    } else {
        fs.unlink(tempPath, (err) => {
            if (err) console.error('Temp file cleanup error:', err);
        });
        return res.status(403).json({ error: 'Only .png, .jpg, .jpeg files are allowed!' });
    }
};

const generateAvatarUrl = (userId, avatar) => {
    return avatar ? `/${userId}/${avatar}` : '/default_avatar.jpg';
};

const createSessionUser = (userData) => {
    return {
        id: userData.user_id,
        login: userData.login,
        name: userData.name,
        avatar: userData.avatar
    };
};

module.exports = {
    handleFileUpload,
    generateAvatarUrl,
    createSessionUser
};
