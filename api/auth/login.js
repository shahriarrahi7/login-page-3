// Vercel Serverless Function: Login
// NOTE: Serverless functions are stateless — global memory resets on cold starts.
// Admin usernames are hardcoded here as a reliable source of truth.
// Registered users via /api/auth/register also share the same global store
// within the same warm instance, but the ADMIN_USERNAMES list guarantees
// admin users always get the correct role.

const ADMIN_USERNAMES = ['shahriar', 'admin', 'administrator'];

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

    const { username, password, role } = req.body || {};

    if (!username || !username.trim()) {
        return res.status(400).json({ message: 'Please enter your username.' });
    }

    if (!password) {
        return res.status(400).json({ message: 'Please enter your password.' });
    }

    const trimmedUsername = username.trim();
    const lowerUsername = trimmedUsername.toLowerCase();

    // 1. Check in-memory registered users first
    const foundUser = users.find(u => u.username.toLowerCase() === lowerUsername);

    // 2. Check hardcoded admin list, requested role, or admin substring
    const isHardcodedAdmin = ADMIN_USERNAMES.includes(lowerUsername) || lowerUsername.includes('admin');
    const isExplicitAdmin = role && role.toLowerCase() === 'admin';

    // 3. Determine role — admin privileges respected
    let detectedRole = 'user';
    if (isExplicitAdmin || isHardcodedAdmin || (foundUser && foundUser.role === 'admin')) {
        detectedRole = 'admin';
    } else if (foundUser) {
        detectedRole = foundUser.role || 'user';
    }

    return res.status(200).json({
        message: 'Login successful! Welcome back.',
        username: trimmedUsername,
        role: detectedRole,
        token: 'hb_session_' + Date.now()
    });
};
