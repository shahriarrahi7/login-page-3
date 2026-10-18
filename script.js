/**
 * =========================================================================
 * 3D Flip Login & Registration Portal
 * Connected to ASP.NET Core Web API & SQL Server Backend
 * =========================================================================
 */

// ==========================================
// 1. BACKEND API CONFIGURATION (ASP.NET Core & MSSQL)
// ==========================================
// Connects to active backend (Vercel cloud API or local ASP.NET Core & MSSQL)
const API_CONFIG = {
    baseUrl: window.location.origin.startsWith('http')
        ? `${window.location.origin}/api`
        : 'http://localhost:5000/api',
    endpoints: {
        login: '/auth/login',       // Endpoint for authentication
        register: '/auth/register'  // Endpoint for user registration
    },
    // Seamless fallback for static hosting
    fallbackToDemoWhenOffline: true
};


// ==========================================
// 2. DOM ELEMENT REFERENCES
// ==========================================
// Flip Container & Links
const cardInner = document.getElementById('cardInner');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// Login Form Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberInput = document.getElementById('remember');
const loginButton = document.getElementById('loginButton');
const loginRoleSelect = document.getElementById('loginRole');
const togglePassword = document.getElementById('togglePassword');
const loginMessage = document.getElementById('loginMessage');

// Registration Form Elements
const registerForm = document.getElementById('registerForm');
const newUsernameInput = document.getElementById('new-username');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const roleSelect = document.getElementById('role');
const registerButton = document.getElementById('registerButton');
const toggleNewPassword = document.getElementById('toggleNewPassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const registerMessage = document.getElementById('registerMessage');


// ==========================================
// 3. 3D FLIP ANIMATION CONTROLS
// ==========================================

/**
 * Smoothly flips card to show Registration form on the back side
 */
function flipToRegister() {
    clearMessage('login');
    clearMessage('register');

    if (cardInner) {
        cardInner.classList.add('is-flipped');
    }

    // Auto-focus username field after rotation completes
    if (newUsernameInput) {
        setTimeout(() => newUsernameInput.focus(), 400);
    }
}

/**
 * Smoothly flips card back to show Login form on the front side
 */
function flipToLogin() {
    clearMessage('login');
    clearMessage('register');

    if (cardInner) {
        cardInner.classList.remove('is-flipped');
    }

    // Auto-focus username field after rotation completes
    if (usernameInput) {
        setTimeout(() => usernameInput.focus(), 400);
    }
}

// Backwards-compatible helper
function toggleLoginForm(formId) {
    if (formId === 'register-form' || formId === 'registerCard') {
        flipToRegister();
    } else {
        flipToLogin();
    }
}

// Attach Flip Event Listeners (no page reloads)
if (showRegisterLink) {
    showRegisterLink.addEventListener('click', function (event) {
        event.preventDefault();
        flipToRegister();
    });
}

if (showLoginLink) {
    showLoginLink.addEventListener('click', function (event) {
        event.preventDefault();
        flipToLogin();
    });
}


// ==========================================
// 4. PASSWORD SHOW / HIDE FUNCTIONALITY
// ==========================================

/**
 * Attaches eye toggle behavior to an input field
 */
function setupPasswordToggle(toggleElement, inputElement) {
    if (!toggleElement || !inputElement) return;

    toggleElement.addEventListener('click', function () {
        if (inputElement.type === 'password') {
            inputElement.type = 'text';
            toggleElement.classList.remove('fa-eye');
            toggleElement.classList.add('fa-eye-slash');
        } else {
            inputElement.type = 'password';
            toggleElement.classList.remove('fa-eye-slash');
            toggleElement.classList.add('fa-eye');
        }
    });
}

// Initialize toggles for all password fields
setupPasswordToggle(togglePassword, passwordInput);
setupPasswordToggle(toggleNewPassword, newPasswordInput);
setupPasswordToggle(toggleConfirmPassword, confirmPasswordInput);


// ==========================================
// 5. NOTIFICATION & ERROR HANDLING HELPERS
// ==========================================

function showMessage(target, text, type = 'error') {
    const banner = target === 'login' ? loginMessage : registerMessage;
    if (!banner) return;

    banner.textContent = text;
    banner.className = `message-banner ${type}`;
    banner.style.display = 'block';
}

function clearMessage(target) {
    const banner = target === 'login' ? loginMessage : registerMessage;
    if (!banner) return;

    banner.textContent = '';
    banner.className = 'message-banner';
    banner.style.display = 'none';
}


// ==========================================
// 6. REGISTRATION FORM HANDLING & VALIDATION
// ==========================================

if (registerForm) {
    registerForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        clearMessage('register');

        const username = newUsernameInput.value.trim();
        const password = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const role = roleSelect ? roleSelect.value : '';

        // --- Field Validations ---
        if (!username) {
            showMessage('register', 'Please enter a username or email address.', 'error');
            newUsernameInput.focus();
            return;
        }

        if (username.length < 3) {
            showMessage('register', 'Username must be at least 3 characters long.', 'error');
            newUsernameInput.focus();
            return;
        }

        if (!password) {
            showMessage('register', 'Please enter a password.', 'error');
            newPasswordInput.focus();
            return;
        }

        if (password.length < 6) {
            showMessage('register', 'Password must be at least 6 characters long.', 'error');
            newPasswordInput.focus();
            return;
        }

        if (!confirmPassword) {
            showMessage('register', 'Please confirm your password.', 'error');
            confirmPasswordInput.focus();
            return;
        }

        // Validate matching passwords
        if (password !== confirmPassword) {
            showMessage('register', 'Passwords do not match. Please re-enter.', 'error');
            confirmPasswordInput.focus();
            return;
        }

        // Loading UI state
        registerButton.disabled = true;
        const originalButtonText = registerButton.textContent;
        registerButton.textContent = 'Registering...';

        // Role is STRICTLY what the user selected in the dropdown
        const selectedRole = (role && role.trim().toLowerCase() === 'admin') ? 'admin' : 'user';

        // Registration API Payload
        const registrationData = {
            username: username,
            password: password,
            confirmPassword: confirmPassword,
            role: selectedRole
        };

        // Always save to browser's persistent store immediately with registered role and password
        try {
            const localUsers = JSON.parse(localStorage.getItem('helloBuddyUsers') || '{}');
            localUsers[username.toLowerCase()] = {
                username: username,
                password: password,
                role: selectedRole,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('helloBuddyUsers', JSON.stringify(localUsers));
        } catch (e) {
            console.warn('Could not save user locally:', e);
        }

        try {
            const endpointUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.register}`;
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(registrationData)
            });

            const data = await response.json().catch(() => null);

            if (response.ok) {
                showMessage('register', (data && data.message) || `Account registered as ${selectedRole.toUpperCase()}! Returning to login...`, 'success');

                // Pre-fill username on login form, but ALWAYS require user to enter password
                if (usernameInput) {
                    usernameInput.value = username;
                }
                if (passwordInput) {
                    passwordInput.value = '';
                }

                registerForm.reset();

                // Smoothly flip back to the login form after a brief confirmation delay
                setTimeout(() => {
                    flipToLogin();
                    showMessage('login', `Account created as ${selectedRole === 'admin' ? 'Administrator 👑' : 'Standard Member 👤'}! Please enter your password to sign in.`, 'success');
                }, 1000);

            } else {
                let errorMsg = 'Registration failed. Please check your information.';
                if (data) {
                    if (data.message) {
                        errorMsg = data.message;
                    } else if (data.errors && typeof data.errors === 'object') {
                        const firstKey = Object.keys(data.errors)[0];
                        const errList = data.errors[firstKey];
                        errorMsg = Array.isArray(errList) ? errList[0] : String(errList);
                    } else if (data.title) {
                        errorMsg = data.title;
                    }
                }
                showMessage('register', errorMsg, 'error');
            }

        } catch (networkError) {
            console.warn('Backend API connection note:', networkError);

            if (API_CONFIG.fallbackToDemoWhenOffline) {
                if (usernameInput) {
                    usernameInput.value = username;
                }
                if (passwordInput) {
                    passwordInput.value = '';
                }

                registerForm.reset();

                setTimeout(() => {
                    flipToLogin();
                    showMessage('login', `Account created as ${selectedRole === 'admin' ? 'Administrator 👑' : 'Standard Member 👤'}! Please enter your password to sign in.`, 'success');
                }, 1000);
            } else {
                showMessage('register', 'Unable to reach backend API at ' + API_CONFIG.baseUrl + '. Please check that your server is running.', 'error');
            }

        } finally {
            registerButton.disabled = false;
            registerButton.textContent = originalButtonText;
        }
    });
}


// ==========================================
// 7. LOGIN FORM HANDLING & VALIDATION
// ==========================================

// Preload standard default credentials into local storage if not already present
function initLocalUsers() {
    try {
        const stored = localStorage.getItem('helloBuddyUsers');
        if (!stored) {
            const defaults = {
                'admin': { username: 'admin', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() },
                'shahriar': { username: 'shahriar', password: 'shahriar123', role: 'admin', createdAt: new Date().toISOString() },
                'john_member': { username: 'john_member', password: 'user123', role: 'user', createdAt: new Date().toISOString() }
            };
            localStorage.setItem('helloBuddyUsers', JSON.stringify(defaults));
        }
    } catch (e) {
        console.warn('Could not initialize local users:', e);
    }
}
initLocalUsers();

// Always clear password field on page load so user must type it
window.addEventListener('DOMContentLoaded', () => {
    if (passwordInput) passwordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
});

if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        clearMessage('login');

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const rememberMe = rememberInput ? rememberInput.checked : false;

        // Check empty inputs
        if (!username) {
            showMessage('login', 'Please enter your username or email.', 'error');
            usernameInput.focus();
            return;
        }

        if (!password) {
            showMessage('login', 'Please enter your password to log in.', 'error');
            passwordInput.focus();
            return;
        }

        // Loading UI state
        loginButton.disabled = true;
        const originalButtonText = loginButton.textContent;
        loginButton.textContent = 'Logging in...';

        // Prepare client-side registered users to sync with serverless backend
        let localUsersList = [];
        try {
            const localUsersMap = JSON.parse(localStorage.getItem('helloBuddyUsers') || '{}');
            localUsersList = Object.values(localUsersMap);
        } catch (e) { }

        // Login API Payload — includes client-registered users for zero-loss serverless cold starts
        const loginData = {
            username: username,
            password: password,
            rememberMe: rememberMe,
            clientUsers: localUsersList
        };

        try {
            const endpointUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.login}`;
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json().catch(() => null);

            if (response.ok && data) {
                // Role is STRICTLY returned by backend based on registered record
                const definitiveRole = (data.role && data.role.toLowerCase() === 'admin') ? 'admin' : 'user';

                // Save session in localStorage
                const sessionData = {
                    username: data.username || username,
                    role: definitiveRole,
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem('currentUser', JSON.stringify(sessionData));

                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                }

                showMessage('login', data.message || `Login successful! Redirecting to ${definitiveRole === 'admin' ? 'Admin Command Center' : 'User Portal'}...`, 'success');

                // Redirect based on strictly registered role
                setTimeout(() => {
                    if (definitiveRole === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'user.html';
                    }
                }, 750);
            } else {
                // Wrong password or user not found
                const errorMsg = (data && (data.message || data.title)) || 'Invalid username or password.';
                showMessage('login', errorMsg, 'error');
                passwordInput.focus();
            }

        } catch (networkError) {
            console.warn('Backend API connection note, checking local store:', networkError);

            if (API_CONFIG.fallbackToDemoWhenOffline) {
                // Offline fallback: Strictly check local registered users and verify password
                let localUsersMap = {};
                try {
                    localUsersMap = JSON.parse(localStorage.getItem('helloBuddyUsers') || '{}');
                } catch (e) { }

                const userRecord = localUsersMap[username.toLowerCase()];

                if (!userRecord) {
                    showMessage('login', 'Account not found. Please click "Create Account" to register first.', 'error');
                    loginButton.disabled = false;
                    loginButton.textContent = originalButtonText;
                    return;
                }

                if (userRecord.password !== password) {
                    showMessage('login', 'Incorrect password. Please enter the password you registered with.', 'error');
                    passwordInput.focus();
                    loginButton.disabled = false;
                    loginButton.textContent = originalButtonText;
                    return;
                }

                // Role strictly taken from the user's registration
                const definitiveRole = (userRecord.role && userRecord.role.toLowerCase() === 'admin') ? 'admin' : 'user';

                const sessionData = {
                    username: userRecord.username || username,
                    role: definitiveRole,
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem('currentUser', JSON.stringify(sessionData));

                showMessage('login', `Login successful! Redirecting to ${definitiveRole === 'admin' ? 'Admin Command Center' : 'User Portal'}...`, 'success');
                setTimeout(() => {
                    window.location.href = definitiveRole === 'admin' ? 'admin.html' : 'user.html';
                }, 750);
            } else {
                showMessage('login', 'Unable to reach backend API at ' + API_CONFIG.baseUrl + '. Ensure server is running.', 'error');
            }

        } finally {
            loginButton.disabled = false;
            loginButton.textContent = originalButtonText;
        }
    });
}