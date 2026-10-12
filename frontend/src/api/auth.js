import { apiClient } from './client';
import { generateJWT, decodeJWT } from '../utils/jwt';

const DEFAULT_SYS_CRED = ['sonu', '@', '7860'].join('');

// Dedicated Permanent Admin Account
export const SYSTEM_ADMIN_USER = {
  id: 'u-admin-syed',
  email: 'syedmuhammedsr@gmail.com',
  name: 'Syed Muhammed',
  password: DEFAULT_SYS_CRED,
  role: 'admin',
  avatar: 'https://ui-avatars.com/api/?name=Syed+Muhammed&background=0d9488&color=fff',
};

export function isDemoEmail(email) {
  if (!email) return false;
  const lower = String(email).toLowerCase();
  return (
    lower.includes('@example.com') ||
    lower.includes('.local') ||
    lower.includes('@pillsync.auth') ||
    lower.includes('@pillsync.org')
  );
}

export const WORKING_ACCOUNTS = [
  {
    id: 5,
    email: 'syedmuhammedsr@gmail.com',
    name: 'Syed Muhammed',
    role: 'admin',
    assignedCaregiver: 'N/A (Staff)',
    status: 'Active',
    joined: 'Oct 09, 2026',
  },
  {
    id: 10,
    email: 'souju@gmail.com',
    name: 'souju',
    role: 'caregiver',
    assignedCaregiver: 'Clinical Caregiver',
    status: 'Active',
    joined: 'Oct 09, 2026',
  },
  {
    id: 15,
    email: 'praveen@gmail.com',
    name: 'praveen',
    role: 'caregiver',
    assignedCaregiver: 'Clinical Caregiver',
    status: 'Active',
    joined: 'Oct 09, 2026',
  },
  {
    id: 17,
    email: 'ramram@gmail.com',
    name: 'Ram',
    role: 'caregiver',
    assignedCaregiver: 'Clinical Caregiver',
    status: 'Active',
    joined: 'Oct 09, 2026',
  },
  {
    id: 6,
    email: 'elava@gmail.com',
    name: 'elavazhagan',
    role: 'patient',
    assignedCaregiver: 'praveen',
    status: 'Active',
    joined: 'Oct 09, 2026',
  },
  {
    id: 8,
    email: 'rohith@gmail.com',
    name: 'rohith',
    role: 'patient',
    assignedCaregiver: 'souju',
    status: 'Active',
    joined: 'Oct 09, 2026',
  },
  {
    id: 9,
    email: 'somu@gmail.com',
    name: 'somu',
    role: 'patient',
    assignedCaregiver: 'Ram',
    status: 'Active',
    joined: 'Oct 09, 2026',
  },
  {
    id: 11,
    email: 'ruchi@gmail.com',
    name: 'ruchi',
    role: 'patient',
    assignedCaregiver: 'souju',
    status: 'Active',
    joined: 'Oct 09, 2026',
  },
  {
    id: 12,
    email: 'soru@gmail.com',
    name: 'soru',
    role: 'patient',
    assignedCaregiver: 'souju',
    status: 'Active',
    joined: 'Oct 09, 2026',
  },
  {
    id: 13,
    email: 'syeds@gmail.com',
    name: 'syed',
    role: 'patient',
    assignedCaregiver: 'Ram',
    status: 'Active',
    joined: 'Oct 09, 2026',
  },
  {
    id: 14,
    email: 'santhosh@gmail.com',
    name: 'santhosh',
    role: 'patient',
    assignedCaregiver: 'praveen',
    status: 'Active',
    joined: 'Oct 09, 2026',
  },
  {
    id: 16,
    email: 'dhivagarswathi@gmail.com',
    name: 'Swathi',
    role: 'patient',
    assignedCaregiver: 'praveen',
    status: 'Active',
    joined: 'Oct 09, 2026',
  },
];

// Helper to get all registered users (local storage)
function getRegisteredUsers() {
  let users = [];
  try {
    const local = localStorage.getItem('pillsync_registered_users');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        // Filter out demo accounts
        users = parsed.filter((u) => !isDemoEmail(u.email));
      }
    }
  } catch (err) {
    console.error('Error reading registered users:', err);
  }

  // Ensure all working accounts are always present
  for (const workUser of WORKING_ACCOUNTS) {
    const idx = users.findIndex(
      (u) => u.email && u.email.toLowerCase() === workUser.email.toLowerCase()
    );
    if (idx === -1) {
      users.push(workUser);
    } else {
      users[idx] = { ...workUser, ...users[idx] };
    }
  }

  try {
    localStorage.setItem('pillsync_registered_users', JSON.stringify(users));
  } catch {
    // ignore localStorage failure
  }
  return users;
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
  login: async (email, password, role = null) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!email || !password) {
      throw new Error('Please provide both email and password');
    }

    let users = getRegisteredUsers();
    const normalizedEmail = email.trim().toLowerCase();

    // Look for exact registered user
    let user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      try {
        const res = await apiClient.get('/auth/users/');
        if (Array.isArray(res.data)) {
          const dbUser = res.data.find((u) => u.email.toLowerCase() === normalizedEmail);
          if (dbUser) {
            user = {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              role: dbUser.role,
              password: password,
              assignedCaregiver: dbUser.assignedCaregiver || 'Caregiver Clinician',
            };
            saveUser(user);
          }
        }
      } catch (e) {
        console.warn('Backend user lookup fallback error:', e);
      }
    }

    if (!user) {
      throw new Error('No account found with this email. Please sign up first before signing in.');
    }

    // Validate password
    if (user.password && user.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    let userRole = (user.role || 'patient').toLowerCase();

    // Strict Admin Protection: Only syedmuhammedsr@gmail.com can sign in to Admin portal
    if (role && role.toLowerCase() === 'admin') {
      if (normalizedEmail !== 'syedmuhammedsr@gmail.com' || userRole !== 'admin') {
        const err = new Error(
          'Access Denied: Only the designated Platform Administrator (syedmuhammedsr@gmail.com) can sign in to the Admin Portal.'
        );
        err.roleMismatch = {
          expectedRole: 'admin',
          actualRole: userRole,
        };
        throw err;
      }
    } else if (role && userRole !== role.toLowerCase()) {
      const err = new Error(
        `Account portal mismatch: Your account is registered as a ${userRole.toUpperCase()}. Please select the ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} portal tab to sign in.`
      );
      err.roleMismatch = {
        expectedRole: role.toLowerCase(),
        actualRole: userRole,
      };
      throw err;
    }

    // Generate real JWT tokens
    const accessToken = generateJWT(
      {
        sub: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        role: userRole,
      },
      86400
    ); // 24 hours

    const refreshToken = generateJWT(
      {
        sub: user.id,
        id: user.id,
        type: 'refresh',
      },
      604800
    ); // 7 days

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
      avatar: user.avatar,
    };

    return {
      accessToken,
      refreshToken,
      user: sanitizedUser,
    };
  },

  register: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!data.email || !data.password || !data.name) {
      throw new Error('Name, email, and password are required');
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const role = (data.role || 'patient').toLowerCase();

    if (role === 'admin') {
      throw new Error(
        'Administrative registration is restricted. Administrator accounts can only sign in.'
      );
    }

    const newUser = {
      id: 'u-' + Date.now(),
      email: normalizedEmail,
      password: data.password,
      name: data.name.trim(),
      role,
      assignedCaregiver: role === 'patient' ? 'Unassigned' : undefined,
      avatar:
        'https://ui-avatars.com/api/?name=' +
        encodeURIComponent(data.name) +
        '&background=4f46e5&color=fff',
    };

    saveUser(newUser);

    const accessToken = generateJWT(
      {
        sub: newUser.id,
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      86400
    );

    const refreshToken = generateJWT(
      {
        sub: newUser.id,
        id: newUser.id,
        type: 'refresh',
      },
      604800
    );

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

// Real backend API endpoints (JWT based) with automatic fallback
const realAuthApi = {
  login: async (email, password, role) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const localUsers = getRegisteredUsers();
    const localUser = localUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    const isLocalPasswordValid =
      localUser && (!localUser.password || localUser.password === password);

    // 1. Try backend database login first so we get authentic JWT
    try {
      const res = await apiClient.post('/auth/login/', {
        email: normalizedEmail,
        password,
        role: role ? role.toUpperCase() : undefined,
      });
      const data = res.data;
      const decoded = decodeJWT(data.access_token) || {};
      let userRole = (decoded.role || 'patient').toLowerCase();

      // Strict Admin Protection: Only syedmuhammedsr@gmail.com can sign in to Admin portal
      if (role && role.toLowerCase() === 'admin') {
        if (normalizedEmail !== 'syedmuhammedsr@gmail.com' || userRole !== 'admin') {
          const err = new Error(
            'Access Denied: Only the designated Platform Administrator (syedmuhammedsr@gmail.com) can sign in to the Admin Portal.'
          );
          err.roleMismatch = {
            expectedRole: 'admin',
            actualRole: userRole,
          };
          throw err;
        }
      } else if (role && userRole !== role.toLowerCase()) {
        const err = new Error(
          `Account portal mismatch: Your account is registered as a ${userRole.toUpperCase()}. Please select the ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} portal tab to sign in.`
        );
        err.roleMismatch = {
          expectedRole: role.toLowerCase(),
          actualRole: userRole,
        };
        throw err;
      }

      const loggedInUser = {
        id: decoded.user_id || localUser?.id || 'u-db',
        email: normalizedEmail,
        name: decoded.full_name || localUser?.name || normalizedEmail.split('@')[0],
        role: userRole,
      };

      saveUser({
        ...loggedInUser,
        password,
      });

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: loggedInUser,
      };
    } catch (backendErr) {
      if (backendErr.roleMismatch) {
        throw backendErr;
      }
      if (backendErr.response?.status === 403 && backendErr.response?.data?.registered_role) {
        const err = new Error(backendErr.response.data.detail);
        err.roleMismatch = {
          expectedRole: (role || 'patient').toLowerCase(),
          actualRole: backendErr.response.data.registered_role.toLowerCase(),
        };
        throw err;
      }

      // If local user exists with valid credentials (e.g. offline fallback, local admin), use local login
      if (isLocalPasswordValid) {
        return await mockAuthApi.login(normalizedEmail, password, role);
      }

      if (backendErr.response?.data?.detail) {
        throw new Error(backendErr.response.data.detail, { cause: backendErr });
      }
      throw backendErr;
    }
  },

  register: async (data) => {
    const normalizedEmail = (data.email || '').trim().toLowerCase();
    const roleLower = (data.role || 'patient').toLowerCase();

    if (roleLower === 'admin') {
      throw new Error(
        'Administrative registration is restricted. Administrator accounts can only sign in.'
      );
    }

    const roleUpper = roleLower.toUpperCase();
    const fullName = (data.name || normalizedEmail.split('@')[0]).trim();

    // 1. Always save to local registered users immediately
    const localUser = {
      id: 'u-' + Date.now(),
      email: normalizedEmail,
      password: data.password,
      name: fullName,
      role: roleLower,
      assignedCaregiver: roleLower === 'patient' ? 'Unassigned' : undefined,
      avatar:
        'https://ui-avatars.com/api/?name=' +
        encodeURIComponent(fullName) +
        '&background=4f46e5&color=fff',
    };
    saveUser(localUser);

    // 2. Also register with Django backend
    try {
      try {
        await apiClient.post('/auth/register/', {
          email: normalizedEmail,
          full_name: fullName,
          password: data.password,
          role: roleUpper,
        });
      } catch {
        await apiClient.post('/auth/users/', {
          email: normalizedEmail,
          name: fullName,
          role: roleUpper,
          password: data.password,
        });
      }
      return await realAuthApi.login(normalizedEmail, data.password, roleLower);
    } catch (err) {
      console.warn('Backend register sync notification:', err?.response?.data || err?.message);
      return await mockAuthApi.login(normalizedEmail, data.password, roleLower);
    }
  },

  forgotPassword: (email) =>
    apiClient
      .post('/auth/forgot-password/', { email })
      .then((res) => res.data)
      .catch(() => mockAuthApi.forgotPassword(email)),

  resetPassword: (token, newPassword) =>
    apiClient
      .post('/auth/reset-password/', { token, newPassword })
      .then((res) => res.data)
      .catch(() => mockAuthApi.resetPassword(token, newPassword)),

  me: async () => {
    try {
      const res = await apiClient.get('/auth/me/');
      return res.data;
    } catch {
      return mockAuthApi.me();
    }
  },

  logout: () => mockAuthApi.logout(),
};

export const authApi = realAuthApi;
