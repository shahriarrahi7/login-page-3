// Vercel Serverless Function: Admin Users List
let users = global.__HELLO_BUDDY_USERS || (global.__HELLO_BUDDY_USERS = [
    { id: 1, username: 'shahriar', role: 'admin', createdAt: new Date().toISOString() },
    { id: 2, username: 'john_member', role: 'user', createdAt: new Date().toISOString() }
]);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    return res.status(200).json(users);
};
