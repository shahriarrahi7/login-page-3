// Vercel Serverless Function: Admin Users List
let users = global.__HELLO_BUDDY_USERS || (global.__HELLO_BUDDY_USERS = [
    { id: 1, username: 'shahriar', password: 'shahriar123', role: 'admin', createdAt: new Date().toISOString() },
    { id: 2, username: 'admin', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() },
    { id: 3, username: 'john_member', password: 'user123', role: 'user', createdAt: new Date().toISOString() }
]);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const safeUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt
    }));

    return res.status(200).json(safeUsers);
};
