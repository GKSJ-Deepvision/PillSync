import React, { createContext, useContext, useState } from "react";
import { loginUser, registerUser } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("pillsync_user");
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("pillsync_token") || null,
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

  const loginWithApi = async (email, password, role) => {
    try {
      const data = await loginUser({ email, password, role });
      const backendUser = data.user || {};
      const userData = {
        id: backendUser.id || `usr-${Date.now()}`,
        name: backendUser.name || backendUser.username || email.split("@")[0],
        email: backendUser.email || email,
        role: backendUser.role || role || "patient",
        avatar:
          backendUser.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      };
      saveAuthSession(
        userData,
        data.access || data.token || "jwt-session-token",
      );
      return { success: true, user: userData };
    } catch (err) {
      console.warn("API login failed:", err.message);
      throw err;
    }
  };

  const registerWithApi = async (name, email, password, role) => {
    const data = await registerUser({ name, email, password, role });
    const backendUser = data.user || {};
    const userData = {
      id: backendUser.id || `usr-${Date.now()}`,
      name:
        name || backendUser.name || backendUser.username || email.split("@")[0],
      email: backendUser.email || email,
      role: role || backendUser.role || "patient",
      avatar:
        backendUser.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    };
    saveAuthSession(userData, data.access || data.token || "jwt-session-token");
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
