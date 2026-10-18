// Vercel Serverless Function: Health Check
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const users = global.__HELLO_BUDDY_USERS || [];

    return res.status(200).json({
        status: 'Connected',
        platform: 'Hello Buddy Live Cloud (Vercel)',
        database: 'Cloud Session Store',
        registeredUsersCount: users.length
    });
};
