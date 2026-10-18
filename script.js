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

        // Registration API Payload
        const registrationData = {
            username: username,
            password: password,
            confirmPassword: confirmPassword,
            role: role || 'user'
        };

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
                // Success from backend - persist registered role locally as well
                const registeredRole = (role && role.trim()) ? role.trim().toLowerCase() : (username.toLowerCase().includes('admin') ? 'admin' : 'user');
                try {
                    const localUsers = JSON.parse(localStorage.getItem('helloBuddyUsers') || '{}');
                    localUsers[username.toLowerCase()] = { username: username, role: registeredRole };
                    localStorage.setItem('helloBuddyUsers', JSON.stringify(localUsers));
                } catch (e) {
                    console.warn('Could not save user locally:', e);
                }

                showMessage('register', (data && data.message) || 'Registration successful! Returning to login...', 'success');

                // Pre-fill username on login form for quick sign-in
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
                    showMessage('login', 'Account created successfully! Please sign in.', 'success');
                }, 1100);

            } else {
                // Backend validation or business error (e.g. duplicate username)
                let errorMsg = 'Registration failed. Please check your information.';
                if (data) {
                    if (data.message) {
                        errorMsg = data.message;
                    } else if (data.errors && typeof data.errors === 'object') {
                        // ASP.NET Core ModelState validation dictionary
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
                // Allows client-side testing of 3D flip animation even before running ASP.NET Core API
                showMessage('register', 'Registration successful! (Demo mode: API offline at ' + API_CONFIG.baseUrl + ')', 'success');

                if (usernameInput) {
                    usernameInput.value = username;
                }
                if (passwordInput) {
                    passwordInput.value = '';
                }

                registerForm.reset();

                setTimeout(() => {
                    flipToLogin();
                    showMessage('login', 'Account registered! You can now log in with: ' + username, 'success');
                }, 1100);
            } else {
                showMessage('register', 'Unable to reach backend API at ' + API_CONFIG.baseUrl + '. Please check that your ASP.NET Core project is running.', 'error');
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

if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        clearMessage('login');

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const rememberMe = rememberInput ? rememberInput.checked : false;

        // Check empty inputs
        if (!username) {
            showMessage('login', 'Please enter your username or email.', 'error');
            usernameInput.focus();
            return;
        }

        if (!password) {
            showMessage('login', 'Please enter your password.', 'error');
            passwordInput.focus();
            return;
        }

        // Loading UI state
        loginButton.disabled = true;
        const originalButtonText = loginButton.textContent;
        loginButton.textContent = 'Logging in...';

        const selectedRole = loginRoleSelect ? loginRoleSelect.value : '';

        // Login API Payload
        const loginData = {
            username: username,
            password: password,
            role: selectedRole,
            rememberMe: rememberMe
        };

        // Helper: Determine definitive role
        function resolveUserRole(backendRole) {
            // 1. If user explicitly chose Admin in the login dropdown
            if (selectedRole === 'admin') return 'admin';
            if (selectedRole === 'user') return 'user';

            // 2. If backend explicitly returned admin
            if (backendRole && backendRole.toLowerCase() === 'admin') return 'admin';

            // 3. If user previously registered as admin in this browser
            try {
                const localUsers = JSON.parse(localStorage.getItem('helloBuddyUsers') || '{}');
                const userRecord = localUsers[username.toLowerCase()];
                if (userRecord && userRecord.role === 'admin') return 'admin';
            } catch (e) { }

            // 4. Default admin usernames
            const lowerUser = username.toLowerCase();
            if (lowerUser === 'admin' || lowerUser === 'administrator' || lowerUser === 'shahriar' || lowerUser.includes('admin')) {
                return 'admin';
            }

            return (backendRole && backendRole.toLowerCase()) || 'user';
        }

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

            if (response.ok) {
                const definitiveRole = resolveUserRole(data ? data.role : null);

                // Save session in localStorage
                const sessionData = {
                    username: (data && data.username) ? data.username : username,
                    role: definitiveRole,
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem('currentUser', JSON.stringify(sessionData));

                if (data && data.token) {
                    localStorage.setItem('authToken', data.token);
                }

                showMessage('login', (data && data.message) || `Login successful! Redirecting to ${definitiveRole === 'admin' ? 'Admin Control Center' : 'User Portal'}...`, 'success');

                // Redirect based on definitive role
                setTimeout(() => {
                    if (definitiveRole === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'user.html';
                    }
                }, 750);
            } else {
                const errorMsg = (data && (data.message || data.title)) || 'Invalid username or password.';
                showMessage('login', errorMsg, 'error');
            }

        } catch (networkError) {
            console.warn('Backend API connection note:', networkError);

            if (API_CONFIG.fallbackToDemoWhenOffline) {
                const definitiveRole = resolveUserRole(null);
                const sessionData = {
                    username: username,
                    role: definitiveRole,
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem('currentUser', JSON.stringify(sessionData));

                showMessage('login', `Login successful! Redirecting to ${definitiveRole === 'admin' ? 'Admin Control Center' : 'User Portal'}...`, 'success');
                setTimeout(() => {
                    window.location.href = definitiveRole === 'admin' ? 'admin.html' : 'user.html';
                }, 750);
            } else {
                showMessage('login', 'Unable to reach backend API at ' + API_CONFIG.baseUrl + '. Ensure ASP.NET Core is running.', 'error');
            }

        } finally {
            loginButton.disabled = false;
            loginButton.textContent = originalButtonText;
        }
    });
}