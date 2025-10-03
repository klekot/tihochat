const { app, httpsServer, io, sessionStore } = require('./src/config/server');
const { handleError } = require('./src/middleware/auth');
const setupSocketIO = require('./src/services/socketService');

// Import routes
const authRoutes = require('./src/routes/auth');
const roomRoutes = require('./src/routes/room');
const inviteRoutes = require('./src/routes/invite');
const profileRoutes = require('./src/routes/profile');
const apiTurnRoutes = require('./src/routes/api/turn');

// Setup routes
app.use('/', authRoutes);
app.use('/', roomRoutes);
app.use('/', inviteRoutes);
app.use('/', profileRoutes);
app.use('/', apiTurnRoutes);

// Error handling middleware (must be last)
app.use(handleError);

// Setup Socket.IO
setupSocketIO(io);

// Start server
const PORT = process.env.PORT || 30000;
httpsServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    httpsServer.close(() => {
        sessionStore.close().then(() => {
            console.log('Session store closed');
            process.exit(0);
        }).catch(error => {
            console.error('Error closing session store:', error);
            process.exit(1);
        });
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    httpsServer.close(() => {
        sessionStore.close().then(() => {
            console.log('Session store closed');
            process.exit(0);
        }).catch(error => {
            console.error('Error closing session store:', error);
            process.exit(1);
        });
    });
});
