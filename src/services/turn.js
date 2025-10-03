const crypto = require('crypto');

function getTURNCredentials(name, secret) {
    const unixTimeStamp = Math.floor(Date.now() / 1000) + 3600; // valid for 1 hour
    const username = `${unixTimeStamp}:${name}`;
    const hmac = crypto.createHmac("sha1", secret);
    hmac.update(username);
    const password = hmac.digest("base64");
    return { username, password };
}

module.exports = getTURNCredentials;
