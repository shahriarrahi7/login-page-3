// Vercel Serverless Function: Login
let users = global.__HELLO_BUDDY_USERS || (global.__HELLO_BUDDY_USERS = [
    { id: 1, username: 'shahriar', role: 'admin', createdAt: new Date().toISOString() },
    { id: 2, username: 'john_member', role: 'user', createdAt: new Date().toISOString() }
]);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { username, password } = req.body || {};

    if (!username || !username.trim()) {
        return res.status(400).json({ message: 'Please enter your username.' });
    }

    if (!password) {
        return res.status(400).json({ message: 'Please enter your password.' });
    }

    const trimmedUsername = username.trim();
    const foundUser = users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());

    const detectedRole = foundUser
        ? foundUser.role
        : (trimmedUsername.toLowerCase().includes('admin') ? 'admin' : 'user');

    return res.status(200).json({
        message: 'Login successful! Welcome back.',
        username: trimmedUsername,
        role: detectedRole,
        token: 'hb_session_' + Date.now()
    });
};
