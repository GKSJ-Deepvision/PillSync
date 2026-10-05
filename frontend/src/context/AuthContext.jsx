import React, { createContext, useContext, useState } from "react";
import { loginUser, registerUser } from "../services/api";

const AuthContext = createContext();

const MOCK_PATIENT = {
  id: "usr-101",
  name: "Alex Morgan",
  email: "alex.patient@pillsync.com",
  role: "patient",
  avatar:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  caregiver: "Dr. Sarah Jenkins",
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("pillsync_user");
    return savedUser ? JSON.parse(savedUser) : MOCK_PATIENT;
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("pillsync_token") || "dummy-jwt-token-xyz",
  );

  const [viewMode, setViewMode] = useState(() => {
    const savedUser = localStorage.getItem("pillsync_user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        return u.role || "patient";
      } catch (e) {
        return "patient";
      }
    }
    return "patient";
  });

  const saveAuthSession = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setViewMode(userData.role || "patient");
    localStorage.setItem("pillsync_user", JSON.stringify(userData));
    localStorage.setItem("pillsync_token", authToken);
  };

  const login = (userData, authToken = "dummy-jwt-token-xyz") => {
    saveAuthSession(userData, authToken);
  };

  const loginWithApi = async (email, password) => {
    try {
      const data = await loginUser({ email, password });
      const userData = {
        id: data.user.id,
        name: data.user.name || data.user.username,
        email: data.user.email,
        role: data.user.role,
        avatar:
          data.user.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      };
      saveAuthSession(userData, data.token);
      return { success: true, user: userData };
    } catch (err) {
      console.warn(
        "API connection failed, attempting fallback login",
        err.message,
      );
      throw err;
    }
  };

  const registerWithApi = async (name, email, password, role) => {
    const data = await registerUser({ name, email, password, role });
    const userData = {
      id: data.user.id,
      name: data.user.name || data.user.username,
      email: data.user.email,
      role: data.user.role,
      avatar:
        data.user.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    };
    saveAuthSession(userData, data.token);
    return { success: true, user: userData };
  };

  const switchRole = (newMode) => {
    // Admins can switch anywhere, Caregivers can switch to patient or caregiver, Patients stay patient
    if (user?.role === "admin") {
      setViewMode(newMode);
    } else if (user?.role === "caregiver") {
      if (newMode === "patient" || newMode === "caregiver") {
        setViewMode(newMode);
      }
    } else {
      setViewMode("patient");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setViewMode("patient");
    localStorage.removeItem("pillsync_user");
    localStorage.removeItem("pillsync_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        viewMode,
        setViewMode,
        login,
        loginWithApi,
        registerWithApi,
        logout,
        switchRole,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
