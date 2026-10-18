// Vercel Serverless Function: Register
let users = global.__HELLO_BUDDY_USERS || (global.__HELLO_BUDDY_USERS = [
    { id: 1, username: 'shahriar', password: 'shahriar123', role: 'admin', createdAt: new Date().toISOString() },
    { id: 2, username: 'admin', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() },
    { id: 3, username: 'john_member', password: 'user123', role: 'user', createdAt: new Date().toISOString() }
]);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { username, password, confirmPassword, role } = req.body || {};

    if (!username || !username.trim()) {
        return res.status(400).json({ message: 'Username or email is required.' });
    }

    if (username.trim().length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const trimmedUsername = username.trim();
    const existing = users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    if (existing) {
        return res.status(400).json({ message: 'This username or email is already registered.' });
    }

    // Role is explicitly determined by the registration choice!
    const registeredRole = (role && role.trim().toLowerCase() === 'admin') ? 'admin' : 'user';

    const newUser = {
        id: users.length + 1,
        username: trimmedUsername,
        password: password,
        role: registeredRole,
        createdAt: new Date().toISOString()
    };
    users.unshift(newUser);

    return res.status(200).json({
        message: `Registration successful as ${registeredRole.toUpperCase()}! Welcome to Hello Buddy.`,
        username: newUser.username,
        role: newUser.role
    });
};
