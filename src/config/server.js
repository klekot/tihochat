const https = require('https');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const config = require('config');

const app = express();

// Database connection for session store
const mysql = require('mysql');
const con = mysql.createConnection({
    host: config.get('db.host'),
    user: config.get('db.user'),
    password: config.get('db.password'),
    database: config.get('db.database')
});

// Session store configuration
const sessionStoreOptions = {
    host: config.get('db.host'),
    user: config.get('db.user'),
    password: config.get('db.password'),
    database: config.get('db.database'),
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
    createDatabaseTable: true,
    endConnectionOnClose: false,
    disableTouch: false,
    charset: 'utf8mb4_bin',
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

const sessionStore = new MySQLStore(sessionStoreOptions, con);

// HTTPS server setup
const httpsServer = https.createServer({
    key: fs.readFileSync(config.get('ssl.key')),
    cert: fs.readFileSync(config.get('ssl.cert'))
}, app);

// Socket.IO setup
const io = new Server(httpsServer, {
    cors: {
        origin: '*'
    }
});

// Express configuration
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('uploads'));
app.use('/', express.static('./node_modules/bootstrap/dist/'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: config.get('session.secret'),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

// Session store ready handler
sessionStore.onReady().then(() => {
    console.log('MySQLStore ready');
}).catch(error => {
    console.error('MySQLStore error:', error);
});

module.exports = { app, httpsServer, io, sessionStore };
