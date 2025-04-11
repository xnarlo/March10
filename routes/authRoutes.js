const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Show login form at /login
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/'); // Already logged in
    }
    res.render('login', { error: null });
});

// Handle login POST
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM user_accounts WHERE username = ? AND password = ?';

    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('DB Error:', err);
            return res.render('login', { error: 'Database error' });
        }

        if (results.length > 0) {
            const user = results[0];
            req.session.user = {
                id: user.id,
                username: user.username,
                full_name: user.full_name
            };
            res.redirect('/');
        } else {
            res.render('login', { error: 'Invalid username or password' });
        }
    });
});

// Logout at /logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
