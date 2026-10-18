// Vercel Serverless Function: Login
// Role is STRICTLY determined by what the user selected during registration.
// No auto-detection based on username keywords.
// Password is verified against the registered password.

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

    const { username, password, clientUsers } = req.body || {};

    if (!username || !username.trim()) {
        return res.status(400).json({ message: 'Please enter your username or email.' });
    }

    if (!password) {
        return res.status(400).json({ message: 'Please enter your password.' });
    }

    // Sync client-registered users if serverless function restarted in cold state
    if (Array.isArray(clientUsers)) {
        clientUsers.forEach(cu => {
            if (cu && cu.username) {
                const exists = users.find(u => u.username.toLowerCase() === cu.username.toLowerCase());
                if (!exists) {
                    users.push({
                        id: users.length + 1,
                        username: cu.username,
                        password: cu.password,
                        role: (cu.role && cu.role.toLowerCase() === 'admin') ? 'admin' : 'user',
                        createdAt: cu.createdAt || new Date().toISOString()
                    });
                } else if (cu.password && cu.password !== exists.password) {
                    // Update password if changed
                    exists.password = cu.password;
                }
            }
        });
    }

    const trimmedUsername = username.trim();
    const lowerUsername = trimmedUsername.toLowerCase();

    // 1. Find user in registered users
    const foundUser = users.find(u => u.username.toLowerCase() === lowerUsername);

    if (!foundUser) {
        return res.status(404).json({
            message: 'User not found. Please create an account first by clicking "Create Account".'
        });
    }

    // 2. Strict password verification
    if (foundUser.password !== password) {
        return res.status(401).json({
            message: 'Incorrect password. Please enter the password you registered with.'
        });
    }

    // 3. Strict role resolution — ONLY what was chosen at registration
    const userRole = (foundUser.role && foundUser.role.toLowerCase() === 'admin') ? 'admin' : 'user';

    return res.status(200).json({
        message: 'Login successful! Welcome back.',
        username: foundUser.username,
        role: userRole,
        token: 'hb_session_' + Date.now()
    });
};
