let https = require("https");

const config = require("config");
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const app = express();
const { readFileSync } = require("fs");
const httpsServer = https.createServer({
    key: readFileSync(config.get('ssl.key')),
    cert: readFileSync(config.get('ssl.cert'))
}, app);
const { ulid } = require('ulid');
const { Server } = require("socket.io");
const io = new Server(httpsServer, {
    cors: {
        origin: '*'
    }
});
let mysql = require('mysql');
let con = mysql.createConnection({
    host: config.get('db.host'),
    user: config.get('db.user'),
    password: config.get('db.password'),
    database: config.get('db.database')
});

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

const authenticateSession = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
};

app.set('view engine', 'ejs');
app.use(express.static('public'));
// Parse request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Configure sessions
app.use(session({
    secret: config.get('session.secret'),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));
// Optionally use onReady() to get a promise that resolves when store is ready.
sessionStore.onReady().then(() => {
    // MySQL session store ready for use.
    console.log('MySQLStore ready');
}).catch(error => {
    // Something went wrong.
    console.error(error);
});
app.use("/",express.static("./node_modules/bootstrap/dist/"));

///////////START OF ROUTES///////////
app.get('/', (req, res) => {
    if (!req.session.user) {
        res.render('index');
    } else {
        res.redirect(`/room/${ulid()}`);
    }
});

app.get('/room/:room/:invite', (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        if (req.params.room && req.params.invite) {
            res.redirect(`/registration?room=${req.params.room}&invite=${req.params.invite}`);
        } else {
            res.redirect('/');
        }
    } else {
        res.render('room', { roomId: req.params.room, currentUser: req.session.user.name });
    }
});
app.get('/room/:room', authenticateSession, (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        res.redirect('/');
    } else {
        res.render('room', { roomId: req.params.room, currentUser: req.session.user.name });
    }
});

// Invite checking out
app.get('/invite', (req, res) => {
    let {query} = req;
    res.render('invite', {success: query.success});
});
app.post('/invite', (req, res) => {
    const { invite } = req.body;
    con.connect(async function(err) {
        let sql = `SELECT * FROM invites WHERE invite_key='${invite}'`;
        con.query(sql, function (err, result, fields) {
            if (result && result.length) {
                let json =  JSON.parse(JSON.stringify(result));
                let person = json[0].person;
                if (json[0].user_id) { // already linked to user
                    sql = `SELECT * FROM users WHERE user_id='${json[0].user_id}'`;
                    con.query(sql, function (err, result, fields) {
                        let json = JSON.parse(JSON.stringify(result));
                        res.redirect(`/login?success=1&user_name=${json[0].name}&user_login=${json[0].login}`);
                    });
                } else {
                    res.redirect(`/registration?person=${person}&invite=${invite}`);
                }
            } else {
                res.redirect(`/invite?success=0`);
            }
        });
    });
});

// Registration route
app.get('/registration', (req, res) => {
    let {query} = req;
    if (!query.room) {
        res.render('registration', {person: query.person, invite: query.invite});
    } else {
        con.connect(async function(err) {
            // checking out is invite exists
            let sql = `SELECT * FROM invites WHERE invite_key='${query.invite}'`;
            con.query(sql, function (err, result, fields) {
                if (result && result.length) {
                    let json = JSON.parse(JSON.stringify(result));
                    let name = json[0].person;
                    console.log('name is: ' + name);
                    let login = 'user_' + Date.now();
                    let password = config.get('default.password');
                    let sql = `INSERT INTO users (name, login, password) VALUES ('${name}', '${login}', PASSWORD('${password}'))`;
                    console.log('inserted');
                    con.query(sql, function (err, result, fields) {
                        let sql = `SELECT * FROM users WHERE login='${login}' AND password = PASSWORD('${password}')`;
                        con.query(sql, function (err, result, fields) {
                            if (result && result.length) {
                                let json = JSON.parse(JSON.stringify(result));
                                let sql = `UPDATE invites SET user_id=${json[0].user_id} WHERE invite_key=${query.invite} `;
                                con.query(sql, function (err, result, fields) {
                                    // Store user information in session (excluding password)
                                    req.session.user = {
                                        id: json[0].user_id,
                                        login: json[0].login,
                                        name: json[0].name
                                    };
                                    res.redirect(`/room/${query.room}`);
                                });
                            } else {
                                // Something wrong, just registered user didn't get a record in the users table
                                res.status(500).render('error_pages/500.ejs');
                            }
                        });
                    });
                } else {
                    res.redirect(`/invite?success=0`);
                }
            });
        });
    }
});
app.post('/registration', (req, res) => {
    const { invite, name, login, password } = req.body;

    con.connect(async function(err) {
        // checking out is invite exists
        let sql = `SELECT * FROM invites WHERE invite_key='${invite}'`;
        con.query(sql, function (err, result, fields) {
            if (result && result.length) {
                let sql = `INSERT INTO users (name, login, password) VALUES ('${name}', '${login}', PASSWORD('${password}'))`;
                con.query(sql, function (err, result, fields) {
                    let sql = `SELECT * FROM users WHERE login='${login}' AND password = PASSWORD('${password}')`;
                    con.query(sql, function (err, result, fields) {
                        if (result && result.length) {
                            let json = JSON.parse(JSON.stringify(result));
                            let sql = `UPDATE invites SET user_id=${json[0].user_id} WHERE invite_key=${invite} `;
                            con.query(sql, function (err, result, fields) {
                                // Store user information in session (excluding password)
                                req.session.user = {
                                    id: json[0].user_id,
                                    login: json[0].login,
                                    name: json[0].name
                                };
                                res.redirect(`/room/${ulid()}`);
                            });
                        } else {
                            // Something wrong, just registered user didn't get a record in the users table
                            res.status(500).render('error_pages/500.ejs');
                        }
                    });
                });
            } else {
                res.redirect(`/invite?success=0`);
            }
        });
    });
});

// Login route
app.get('/login', (req, res) => {
    let {query} = req;
    res.render('login', {success: query.success, user_name: query.user_name, user_login: query.user_login});
});
app.post('/login', (req, res) => {
    const { login, password } = req.body;
    // Find user
    con.connect(async function(err) {
        let sql = `SELECT * FROM users WHERE login='${login}' AND password = PASSWORD('${password}')`;
        console.log(sql);
        con.query(sql, function (err, result, fields) {
            if (result && result.length === 1) {
                let json = JSON.parse(JSON.stringify(result));
                // Store user information in session (excluding password)
                req.session.user = {
                    id: json[0].user_id,
                    login: json[0].login,
                    name: json[0].name
                };
                res.redirect(`/room/${ulid()}`);
            } else {
                res.redirect(`/login?success=0`);
            }
        });
    });
});

// Protected route
app.get('/profile', authenticateSession, (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        res.redirect('/');
    } else {
        res.render('profile', { sessionUser: req.session.user });
    }
});

// Logout route
app.get('/logout', authenticateSession, (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        res.redirect('/');
    } else {
        res.render('logout', { sessionUser: req.session.user });
    }
});
app.post('/logout', (req, res) => {
    sessionStore.close().then(() => {
        // Successfully closed the MySQL session store.
        console.log('MySQLStore closed');
    }).catch(error => {
        // Something went wrong.
        console.error(error);
    });
    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            res.status(500).render('error_pages/500.ejs', { message: 'Logout failed' });
        } else {
            res.redirect(`/`);
        }
    });
});

///////////END OF ROUTES/////////////

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId, userName) => {
        socket.join(roomId);
        setTimeout(()=>{
            socket.to(roomId).emit("user-connected", userId);
        }, 1000);
        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName);
        });
    });
});

httpsServer.listen(process.env.PORT || 30000);