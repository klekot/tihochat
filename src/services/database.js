const mysql = require('mysql');
const config = require('config');

class DatabaseService {
    constructor() {
        this.connection = null;
        this.isConnected = false;
        this.connectionConfig = {
            host: config.get('db.host'),
            user: config.get('db.user'),
            password: config.get('db.password'),
            database: config.get('db.database')
        };
    }

    async connect() {
        if (this.isConnected && this.connection) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this.connection = mysql.createConnection(this.connectionConfig);
            this.connection.connect((err) => {
                if (err) {
                    this.isConnected = false;
                    reject(err);
                } else {
                    this.isConnected = true;
                    resolve();
                }
            });
        });
    }

    async query(sql, params = []) {
        if (!this.isConnected || !this.connection) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.connection.query(sql, params, (err, result, fields) => {
                if (err) {
                    // If connection is lost, mark as disconnected
                    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
                        this.isConnected = false;
                        this.connection = null;
                    }
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async getUserByLogin(login, password) {
        const sql = 'SELECT * FROM users WHERE login = ? AND password = PASSWORD(?)';
        return await this.query(sql, [login, password]);
    }

    async getUserById(userId) {
        const sql = 'SELECT * FROM users WHERE user_id = ?';
        return await this.query(sql, [userId]);
    }

    async createUser(name, login, password) {
        const sql = 'INSERT INTO users (name, login, password) VALUES (?, ?, PASSWORD(?))';
        return await this.query(sql, [name, login, password]);
    }

    async updateUser(userId, updateData) {
        const fields = [];
        const values = [];
        
        if (updateData.name) {
            fields.push('name = ?');
            values.push(updateData.name);
        }
        if (updateData.login) {
            fields.push('login = ?');
            values.push(updateData.login);
        }
        if (updateData.password) {
            fields.push('password = PASSWORD(?)');
            values.push(updateData.password);
        }
        if (updateData.avatar) {
            fields.push('avatar = ?');
            values.push(updateData.avatar);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(userId);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
        return await this.query(sql, values);
    }

    async getInviteByKey(inviteKey) {
        const sql = 'SELECT * FROM invites WHERE invite_key = ?';
        return await this.query(sql, [inviteKey]);
    }

    async updateInviteUser(inviteKey, userId) {
        const sql = 'UPDATE invites SET user_id = ? WHERE invite_key = ?';
        return await this.query(sql, [userId, inviteKey]);
    }

    async updateInviteUserById(inviteId, userId) {
        const sql = 'UPDATE invites SET user_id = ? WHERE invite_id = ?';
        return await this.query(sql, [userId, inviteId]);
    }

    close() {
        return new Promise((resolve, reject) => {
            if (!this.connection || !this.isConnected) {
                resolve();
                return;
            }

            this.connection.end((err) => {
                this.isConnected = false;
                this.connection = null;
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = new DatabaseService();
