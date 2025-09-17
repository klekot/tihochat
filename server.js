let inviteGlobal, inviteIdGlobal, personGlobal, userGlobal, nameGlobal, loginGlobal = ``;
let https = require("https");

const config = require("config");
const express = require('express');
const session = require('express-session');
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

app.set('view engine', 'ejs');
app.use(express.static('public'));
// Parse request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Configure sessions
app.use(session({
    secret: config.get('session.secret'),
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use("/",express.static("./node_modules/bootstrap/dist/"));

///////////START OF ROUTES///////////
app.get('/', (req, res) => {
    res.render('index');
});
app.get('/room/:room', (req, res) => {
    res.render('room', { roomId: req.params.room, currentUser: nameGlobal })
});

// Invite checking out
app.get('/invite', (req, res) => {
    let {query} = req;
    res.render('invite', {success: query.success});
});
app.post('/invite', (req, res) => {
    const { invite } = req.body;
    inviteGlobal = invite;
    let inviteValid = false;
    let person = 'Invited person';
    con.connect(async function(err) {
        if (err) {
            console.log(err.message);
        }
        let sql = `SELECT * FROM invites WHERE invite_key='${invite}'`;
        console.log(sql);
        con.query(sql, function (err, result, fields) {
            if (err) {
                console.log(err.message);
            }
            console.log(result);
            if (result && result.length) {
                let json =  JSON.parse(JSON.stringify(result));
                inviteValid = json[0].invite_key == invite;
                personGlobal = person = json[0].person;
                inviteIdGlobal = json[0].invite_id;
                if (inviteValid) {
                    if (json[0].user_id) { // already linked to user
                        sql = `SELECT * FROM users WHERE user_id='${json[0].user_id}'`;
                        console.log(sql);
                        con.query(sql, function (err, result, fields) {
                            if (err) {
                                console.log(err.message);
                            }
                            console.log(result);
                            let json = JSON.parse(JSON.stringify(result));
                            nameGlobal = json[0].name;
                            loginGlobal = json[0].login;
                        });

                        res.redirect(`/login`);
                    } else {
                        res.redirect(`/registration`);
                    }
                } else {
                    res.redirect(`/invite?success=0`);
                }
            } else {
                res.redirect(`/invite?success=0`);
            }
        });
    });
});

// Registration route
app.get('/registration', (req, res) => {
    res.render('registration', {person: personGlobal, inviteId: inviteIdGlobal});
});
app.post('/registration', (req, res) => {
    const { invite_id, name, login, password } = req.body;

    // Find user
    con.connect(async function(err) {
        // checking out is invite exists
        let sql = `SELECT * FROM invites WHERE invite_id='${invite_id}'`;
        console.log(sql);
        con.query(sql, function (err, result, fields) {
            if (result && result.length) {
                let sql = `INSERT INTO users (name, login, password) VALUES ('${name}', '${login}', PASSWORD('${password}'))`;
                console.log(sql);
                con.query(sql, function (err, result, fields) {});

                sql = `SELECT * FROM users WHERE login='${login}' AND password = PASSWORD('${password}')`;
                console.log(sql);
                con.query(sql, function (err, result, fields) {
                    if (err) {
                        console.log(err.message);
                    }
                    console.log(result);
                    if (result && result.length) {
                        userGlobal = JSON.parse(JSON.stringify(result));
                        nameGlobal = userGlobal.name;

                        sql = `UPDATE invites SET user_id=${userGlobal.user_id} WHERE invite_id=${invite_id}`;
                        con.query(sql, function (err, result, fields) { if (err) console.log(err.message); });

                        // Store user information in session (excluding password)
                        req.session.user = {
                            id: userGlobal.user_id,
                            login: userGlobal.login
                        };

                        res.redirect(`/room/${ulid()}`);
                    } else {
                        res.status(500).render('error_pages/500.ejs');
                    }
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
    res.render('login', {success: query.success, name: nameGlobal, login: loginGlobal});
});
app.post('/login', (req, res) => {
    const { login, password } = req.body;
    // Find user
    con.connect(async function(err) {
        if (err) {
            console.log(err.message);
        }
        let sql = `SELECT * FROM users WHERE login='${login}' AND password = PASSWORD('${password}')`;
        console.log(sql);
        con.query(sql, function (err, result, fields) {
            if (err) {
                console.log(err.message);
            }
            console.log(result);
            if (result && result.length === 1) {
                userGlobal = JSON.parse(JSON.stringify(result));
                nameGlobal = userGlobal.name;

                // Store user information in session (excluding password)
                req.session.user = {
                    id: userGlobal.user_id,
                    login: userGlobal.login
                };

                res.redirect(`/room/${ulid()}`);
            } else {
                res.redirect(`/login?success=0`);
            }
        });
    });
});

// Protected route
app.get('/profile', (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    res.json({ message: 'Profile accessed', user: req.session.user });
});

// Logout route
app.post('/logout', (req, res) => {
    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
});
///////////END OF ROUTES/////////////

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId, userName) => {
        socket.join(roomId);
        setTimeout(()=>{
            socket.to(roomId).emit("user-connected", userId);
        }, 1000)
        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName);
        });
    });
});

httpsServer.listen(process.env.PORT || 30000);