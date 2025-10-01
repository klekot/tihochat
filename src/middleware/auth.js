const authenticateSession = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
};

const handleError = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).render('error_pages/500.ejs', { 
        message: 'Oops! Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

const validateInput = (req, res, next) => {
    // Basic input validation middleware
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return '';
        return str.trim().substring(0, 255); // Limit length
    };

    if (req.body) {
        for (const key in req.body) {
            if (req.body[key] === null || req.body[key] === undefined) {
                req.body[key] = '';
            } else if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        }
    }
    next();
};

module.exports = {
    authenticateSession,
    handleError,
    validateInput
};
