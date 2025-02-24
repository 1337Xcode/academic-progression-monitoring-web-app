const bcrypt = require('bcrypt');
const db = require('../config/dbConfig');

async function login(req, res) {
    const { username, password } = req.body;
    console.log('Login attempt:', username); // Add logging
    const connection = await db.connect();

    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            console.log('Invalid username'); // Add logging
            return res.status(401).send('Invalid username or password');
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            console.log('Invalid password'); // Add logging
            return res.status(401).send('Invalid username or password');
        }

        req.session.userId = user.user_id;
        req.session.role = user.role;

        if (user.role === 'ADMIN') {
            res.redirect('/admin/dashboard');
        } else if (user.role === 'STUDENT') {
            res.redirect('/student/profile');
        } else {
            res.status(401).send('Invalid user role');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal server error');
    } finally {
        connection.end();
    }
}

module.exports = { login };
