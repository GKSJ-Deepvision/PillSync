import { apiClient, USE_MOCK_API } from './client';
import { generateJWT, decodeJWT } from '../utils/jwt';

// Default initial accounts for 3 role-based personas
const INITIAL_USERS = [
  {
    id: 'u-patient-1',
    email: 'patient@example.com',
    name: 'Ibrahim Kadri',
    role: 'patient',
  },
  {
    id: 'u-caregiver-1',
    email: 'caregiver@example.com',
    name: 'Dr. Oliver Mitchell',
    role: 'caregiver',
  },
  {
    id: 'u-admin-1',
    email: 'admin@example.com',
    name: 'Sarah Jenkins',
    role: 'admin',
  },
];

function inferRoleFromEmail(email, fallbackRole) {
  if (fallbackRole) {
    return fallbackRole;
  }
  if (email.includes('admin')) {
    return 'admin';
  }
  if (email.includes('caregiver') || email.includes('doctor')) {
    return 'caregiver';
  }
  return 'patient';
}

// Helper to get all registered users (seeded + local storage)
function getRegisteredUsers() {
  try {
    const local = localStorage.getItem('pillsync_registered_users');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        // Merge with initial users, avoiding duplicate emails
        const emails = new Set(parsed.map((u) => u.email.toLowerCase()));
        const missingInitial = INITIAL_USERS.filter((u) => !emails.has(u.email.toLowerCase()));
        return [...missingInitial, ...parsed];
      }
    }
  } catch (err) {
    console.error('Error reading registered users:', err);
  }
  return INITIAL_USERS;
}

// Helper to save a new user into persistent storage
function saveUser(user) {
  try {
    const existing = getRegisteredUsers();
    const updated = existing.filter((u) => u.email.toLowerCase() !== user.email.toLowerCase());
    updated.push(user);
    localStorage.setItem('pillsync_registered_users', JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving registered user:', err);
  }
}

// Mock JWT Auth API
const mockAuthApi = {
  login: async (email, password, selectedRole = null) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!email || !password) {
      throw new Error('Please provide both email and password');
    }

    const users = getRegisteredUsers();
    const normalizedEmail = email.trim().toLowerCase();

    // Look for exact registered user
    let user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (user) {
      // Validate password if stored
      if (user.password && user.password !== password) {
        throw new Error('Incorrect password. Please try again.');
      }
      // If role was explicitly specified and matches, or update role if specified
      if (selectedRole && selectedRole !== user.role) {
        user = { ...user, role: selectedRole };
      }
    } else {
      // Fallback: If user enters an email that is not yet registered,
      // create a session with the selected role or default based on email/role
      const role = inferRoleFromEmail(normalizedEmail, selectedRole);
      const name = normalizedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'User';
      
      user = {
        id: 'u-' + Date.now(),
        email: normalizedEmail,
        password,
        name,
        role,
        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=4f46e5&color=fff',
      };

      saveUser(user);
    }

    // Generate real JWT tokens
    const accessToken = generateJWT({
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }, 86400); // 24 hours

    const refreshToken = generateJWT({
      sub: user.id,
      id: user.id,
      type: 'refresh',
    }, 604800); // 7 days

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };

    return {
      accessToken,
      refreshToken,
      user: sanitizedUser,
    };
  },

  register: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!data.email || !data.password || !data.name) {
      throw new Error('Name, email, and password are required');
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const role = data.role || 'patient';

    const newUser = {
      id: 'u-' + Date.now(),
      email: normalizedEmail,
      password: data.password,
      name: data.name.trim(),
      role,
      avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name) + '&background=4f46e5&color=fff',
    };

    saveUser(newUser);

    const accessToken = generateJWT({
      sub: newUser.id,
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    }, 86400);

    const refreshToken = generateJWT({
      sub: newUser.id,
      id: newUser.id,
      type: 'refresh',
    }, 604800);

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatar: newUser.avatar,
      },
    };
  },

  forgotPassword: async (email) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      message: 'Password reset instructions sent to ' + email,
    };
  },

  resetPassword: async (token, newPassword) => {
    if (!token || !newPassword) {
      throw new Error('Invalid reset password request');
    }

    return {
      success: true,
      message: 'Password reset successfully',
    };
  },

  me: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Not authenticated');

    const decoded = decodeJWT(token);
    if (!decoded) throw new Error('Invalid JWT token');

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }

    return {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'patient',
    };
  },

  logout: async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { message: 'Logged out successfully' };
  },
};

// Real backend API endpoints (JWT based)
const realAuthApi = {
  login: (email, password, role) =>
    apiClient.post('/auth/login', { email, password, role }).then((res) => res.data),

  register: (data) => apiClient.post('/auth/register', data).then((res) => res.data),

  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password', { email }).then((res) => res.data),

  resetPassword: (token, newPassword) =>
    apiClient.post('/auth/reset-password', { token, newPassword }).then((res) => res.data),

  me: () => apiClient.get('/auth/me').then((res) => res.data),

  logout: () => apiClient.post('/auth/logout').then((res) => res.data),
};

export const authApi = USE_MOCK_API ? mockAuthApi : realAuthApi;
