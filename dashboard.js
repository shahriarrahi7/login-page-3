/**
 * ========================================================
 * DASHBOARD JAVASCRIPT (Admin & User Pages)
 * Session authentication guard, data loading, and logout
 * ========================================================
 */

// API Base URL (auto-detects host:port for Vercel and local)
const API_BASE_URL = window.location.origin.startsWith('http')
    ? `${window.location.origin}/api`
    : 'http://localhost:5000/api';

// Detect whether currently on admin page or user page
const isAdminPage = window.location.pathname.toLowerCase().endsWith('admin.html');
const isUserPage = window.location.pathname.toLowerCase().endsWith('user.html');

// ==========================================
// 1. SESSION GUARD & AUTHENTICATION CHECK
// ==========================================
function getStoredUser() {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

const currentUser = getStoredUser();

if (!currentUser) {
    // If not logged in, redirect immediately to login page
    alert('You must be logged in to view this page.');
    window.location.href = 'index.html';
} else {
    const userRole = (currentUser.role || 'user').toLowerCase();

    // Guard Admin page from non-admin users
    if (isAdminPage && userRole !== 'admin') {
        alert('Access denied: Administrator privileges required.');
        window.location.href = 'user.html';
    }

    // Populate UI Greetings
    const username = currentUser.username || 'User';

    const navUsername = document.getElementById('navUsername');
    if (navUsername) navUsername.textContent = username;

    const adminGreetingName = document.getElementById('adminGreetingName');
    if (adminGreetingName) adminGreetingName.textContent = username;

    const userGreetingName = document.getElementById('userGreetingName');
    if (userGreetingName) userGreetingName.textContent = username;

    const infoUsername = document.getElementById('infoUsername');
    if (infoUsername) infoUsername.textContent = username;

    const infoRole = document.getElementById('infoRole');
    if (infoRole) infoRole.textContent = userRole === 'admin' ? 'Administrator' : 'Standard Member';

    const statUserRole = document.getElementById('statUserRole');
    if (statUserRole) statUserRole.textContent = userRole.toUpperCase();

    const infoLoginTime = document.getElementById('infoLoginTime');
    if (infoLoginTime) {
        if (currentUser.loginTime) {
            infoLoginTime.textContent = new Date(currentUser.loginTime).toLocaleString();
        } else {
            infoLoginTime.textContent = new Date().toLocaleString();
        }
    }
}

// ==========================================
// 2. LOGOUT FUNCTIONALITY
// ==========================================
function logout() {
    if (confirm('Are you sure you want to log out?')) {
        // Clear stored session
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        sessionStorage.clear();

        // Redirect back to login page
        window.location.href = 'index.html';
    }
}

// Attach logout event listeners
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', logout);

const bottomLogoutBtn = document.getElementById('bottomLogoutBtn');
if (bottomLogoutBtn) bottomLogoutBtn.addEventListener('click', logout);


// ==========================================
// 3. ADMIN DATA FETCHING (SQL Server Records)
// ==========================================
if (isAdminPage) {
    async function loadAdminData() {
        const tableBody = document.getElementById('userTableBody');
        const statTotalUsers = document.getElementById('statTotalUsers');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`);
            if (response.ok) {
                const users = await response.json();

                if (statTotalUsers) {
                    statTotalUsers.textContent = users.length;
                }

                if (tableBody) {
                    if (users.length === 0) {
                        tableBody.innerHTML = `
                            <tr>
                                <td colspan="4" class="table-loading">No users found in database.</td>
                            </tr>
                        `;
                        return;
                    }

                    tableBody.innerHTML = users.map(user => {
                        const dateFormatted = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
                        const roleBadgeClass = (user.role || '').toLowerCase() === 'admin' ? 'admin-badge' : 'user-badge';
                        const roleIcon = (user.role || '').toLowerCase() === 'admin' ? 'fa-crown' : 'fa-user';

                        return `
                            <tr>
                                <td><strong>#${user.id}</strong></td>
                                <td>${escapeHtml(user.username)}</td>
                                <td>
                                    <span class="role-badge ${roleBadgeClass}">
                                        <i class="fa-solid ${roleIcon}"></i> ${escapeHtml(user.role || 'user')}
                                    </span>
                                </td>
                                <td>${dateFormatted}</td>
                            </tr>
                        `;
                    }).join('');
                }
            } else {
                // Fallback to health endpoint count
                fallbackHealthCount();
            }
        } catch (err) {
            console.warn('Could not reach /api/admin/users, checking health endpoint:', err);
            fallbackHealthCount();
        }
    }

    async function fallbackHealthCount() {
        const statTotalUsers = document.getElementById('statTotalUsers');
        const tableBody = document.getElementById('userTableBody');

        try {
            const res = await fetch(`${API_BASE_URL}/health`);
            if (res.ok) {
                const data = await res.json();
                if (statTotalUsers) {
                    statTotalUsers.textContent = data.registeredUsersCount ?? '1';
                }
            }
        } catch (e) {
            if (statTotalUsers) statTotalUsers.textContent = '1';
        }

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td><strong>#1</strong></td>
                    <td>${escapeHtml(currentUser.username)}</td>
                    <td>
                        <span class="role-badge admin-badge">
                            <i class="fa-solid fa-crown"></i> admin
                        </span>
                    </td>
                    <td>${new Date().toLocaleDateString()}</td>
                </tr>
            `;
        }
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadAdminData();
        });
    }

    // Initial load
    loadAdminData();
}

// Utility: Escape HTML for security
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}
