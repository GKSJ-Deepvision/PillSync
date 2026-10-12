import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/useAuth';
import { apiClient } from '../../../api/client';
import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';

import { Plus, Search, Shield, UserCheck, RefreshCw } from 'lucide-react';
import { isDemoEmail, WORKING_ACCOUNTS } from '../../../api/auth';
import './AdminUsersPage.css';

const DEFAULT_CLINICIANS = ['souju', 'praveen', 'Ram'];

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState(() => {
    const mergedMap = new Map();
    WORKING_ACCOUNTS.forEach((wa) => mergedMap.set(wa.email.toLowerCase(), wa));
    try {
      const raw = localStorage.getItem('pillsync_registered_users');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed
            .filter((u) => !isDemoEmail(u.email))
            .forEach((u) => {
              const key = u.email.toLowerCase();
              mergedMap.set(key, { ...mergedMap.get(key), ...u });
            });
        }
      }
    } catch (e) {
      console.error(e);
    }
    return Array.from(mergedMap.values());
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'patient',
  });
  const [toastMsg, setToastMsg] = useState('');

  // Fetch real database users on mount
  const fetchBackendUsers = async () => {
    try {
      const res = await apiClient.get('/auth/users/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const backendUsers = res.data.filter((u) => !isDemoEmail(u.email));

        setUsers((prev) => {
          const mergedMap = new Map();
          WORKING_ACCOUNTS.forEach((wa) => mergedMap.set(wa.email.toLowerCase(), wa));
          prev
            .filter((p) => !isDemoEmail(p.email))
            .forEach((u) => {
              const key = u.email.toLowerCase();
              mergedMap.set(key, { ...mergedMap.get(key), ...u });
            });
          backendUsers.forEach((u) => {
            const key = u.email.toLowerCase();
            mergedMap.set(key, { ...mergedMap.get(key), ...u });
          });
          const merged = Array.from(mergedMap.values());
          try {
            localStorage.setItem('pillsync_registered_users', JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
          return merged;
        });

        // Also update pillsync_assigned_patients so caregiver portal stays updated
        try {
          const rawPatients = localStorage.getItem('pillsync_assigned_patients');
          let currentPatients = rawPatients ? JSON.parse(rawPatients) : [];
          if (!Array.isArray(currentPatients)) currentPatients = [];
          currentPatients = currentPatients.filter((p) => !isDemoEmail(p.email));

          const serverPatients = backendUsers.filter(
            (u) =>
              (u.role || '').toLowerCase() === 'patient' && u.assignedCaregiver !== 'Unassigned'
          );

          let updatedPatients = [...currentPatients];
          let changed = false;

          for (const sp of serverPatients) {
            const exists = updatedPatients.some(
              (p) =>
                String(p.id) === String(sp.id) ||
                (p.email && sp.email && p.email.toLowerCase() === sp.email.toLowerCase()) ||
                (p.name && sp.name && p.name.toLowerCase() === sp.name.toLowerCase())
            );
            if (!exists) {
              updatedPatients.push({
                id: sp.id,
                name: sp.name,
                email: sp.email,
                condition: 'General Monitoring',
                age: 48,
                gender: 'Patient',
                adherence: 95,
                prescriptionsCount: 1,
                phone: '+1 555-0190',
                lastTaken: 'Today',
                assignedCaregiver: sp.assignedCaregiver || 'souju',
              });
              changed = true;
            }
          }

          if (changed) {
            localStorage.setItem('pillsync_assigned_patients', JSON.stringify(updatedPatients));
          }
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      console.warn('Backend user fetch fallback to local storage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendUsers();
  }, []);

  const saveUsersList = (updatedList) => {
    setUsers(updatedList);
    try {
      localStorage.setItem('pillsync_registered_users', JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }
  };

  // Extract all available caregivers (from database and defaults)
  const caregiverOptions = Array.from(
    new Set([
      ...DEFAULT_CLINICIANS,
      ...users.filter((u) => u.role === 'caregiver').map((u) => u.name),
      'Unassigned',
    ])
  ).filter(Boolean);

  const handleRoleChange = async (userId, newRole) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    saveUsersList(updated);

    try {
      await apiClient.patch(`/auth/users/${userId}/`, { role: newRole });
    } catch (e) {
      console.warn('Backend patch error:', e);
    }

    setToastMsg(`User role updated to ${newRole}`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleToggleStatus = async (userId) => {
    const target = users.find((u) => u.id === userId);
    const newStatus = target?.status === 'Active' ? 'Suspended' : 'Active';
    const updated = users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u));
    saveUsersList(updated);

    try {
      await apiClient.patch(`/auth/users/${userId}/`, { status: newStatus });
    } catch (e) {
      console.warn('Backend patch error:', e);
    }

    setToastMsg(`User status updated to ${newStatus}`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleAssignCaregiver = async (userId, caregiverName) => {
    const updated = users.map((u) =>
      u.id === userId ? { ...u, assignedCaregiver: caregiverName } : u
    );
    saveUsersList(updated);

    try {
      await apiClient.patch(`/auth/users/${userId}/`, { assignedCaregiver: caregiverName });
    } catch (e) {
      console.warn('Backend patch error:', e);
    }

    // Sync with pillsync_assigned_patients
    try {
      const targetUser = users.find((u) => u.id === userId);
      if (targetUser && targetUser.role === 'patient') {
        const rawPatients = localStorage.getItem('pillsync_assigned_patients');
        let currentPatients = rawPatients ? JSON.parse(rawPatients) : [];
        if (!Array.isArray(currentPatients)) currentPatients = [];

        if (caregiverName === 'Unassigned') {
          currentPatients = currentPatients.filter(
            (p) =>
              String(p.id) !== String(targetUser.id) &&
              p.email?.toLowerCase() !== targetUser.email?.toLowerCase() &&
              p.name?.toLowerCase() !== targetUser.name?.toLowerCase()
          );
        } else {
          const existingIdx = currentPatients.findIndex(
            (p) =>
              String(p.id) === String(targetUser.id) ||
              (targetUser.email && p.email?.toLowerCase() === targetUser.email.toLowerCase()) ||
              p.name?.toLowerCase() === targetUser.name?.toLowerCase()
          );
          if (existingIdx >= 0) {
            currentPatients[existingIdx].assignedCaregiver = caregiverName;
          } else {
            currentPatients.unshift({
              id: targetUser.id,
              name: targetUser.name,
              email: targetUser.email,
              condition: 'General Monitoring',
              age: 52,
              gender: 'Female',
              adherence: 94,
              prescriptionsCount: 2,
              phone: '+1 555-0199',
              lastTaken: 'Today',
              assignedCaregiver: caregiverName,
            });
          }
        }
        localStorage.setItem('pillsync_assigned_patients', JSON.stringify(currentPatients));
      }
    } catch (e) {
      console.error(e);
    }

    setToastMsg(`Assigned to ${caregiverName}`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;

    const emailTrim = newUser.email.trim().toLowerCase();
    const nameTrim = newUser.name.trim();
    const assignedCaregiver = newUser.role === 'patient' ? 'souju' : 'System Admin';

    let created = {
      id: `u-${Date.now()}`,
      name: nameTrim,
      email: emailTrim,
      role: newUser.role,
      status: 'Active',
      assignedCaregiver,
      joined: 'Today',
    };

    try {
      const res = await apiClient.post('/auth/users/', {
        name: nameTrim,
        email: emailTrim,
        role: newUser.role,
        assignedCaregiver,
      });
      if (res.data?.id) {
        created = {
          ...created,
          id: res.data.id,
          joined: res.data.joined || 'Today',
        };
      }
    } catch (err) {
      console.warn('Backend user creation error:', err);
    }

    const updated = [created, ...users.filter((u) => u.email.toLowerCase() !== emailTrim)];
    saveUsersList(updated);

    // Sync new patient into assigned patients roster
    if (created.role === 'patient') {
      try {
        const rawPatients = localStorage.getItem('pillsync_assigned_patients');
        let currentPatients = rawPatients ? JSON.parse(rawPatients) : [];
        if (!Array.isArray(currentPatients)) currentPatients = [];
        currentPatients.unshift({
          id: created.id,
          name: created.name,
          email: created.email,
          condition: 'General Monitoring',
          age: 48,
          gender: 'Female',
          adherence: 92,
          prescriptionsCount: 1,
          phone: '+1 555-0190',
          lastTaken: 'Today',
          assignedCaregiver: created.assignedCaregiver,
        });
        localStorage.setItem('pillsync_assigned_patients', JSON.stringify(currentPatients));
      } catch (err) {
        console.error(err);
      }
    }

    setIsInviteModalOpen(false);
    setNewUser({ name: '', email: '', role: 'patient' });
    setToastMsg(`Invited ${created.name} (${created.role}) successfully!`);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.assignedCaregiver?.toLowerCase().includes(searchQuery.toLowerCase());
    if (roleFilter === 'all') return matchesSearch;
    return matchesSearch && u.role === roleFilter;
  });

  return (
    <Layout>
      <div className="admin-users-container">
        {/* Header */}
        <div className="admin-users-header">
          <div>
            <div className="admin-users-title-row">
              <h1 className="admin-users-title">User Directory &amp; Access Control</h1>
              <Badge variant="primary" size="sm">
                {users.length} Registered Live
              </Badge>
              {isLoading && (
                <Badge variant="gray" size="sm" className="animate-pulse">
                  Syncing Database...
                </Badge>
              )}
            </div>
            <p className="admin-users-subtitle">
              Central identity registry: Monitor all users registered via public portals, assign
              caregivers, and manage roles
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBackendUsers}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition cursor-pointer"
              title="Refresh users from server"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              Invite New User
            </Button>
          </div>
        </div>

        {/* Toolbar with Search and Filter Chips */}
        <div className="admin-toolbar">
          <div className="admin-search-wrapper">
            <Search className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search user by name, email, or assigned caregiver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>

          <div className="admin-filter-bar">
            {['all', 'patient', 'caregiver', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`admin-filter-chip ${
                  roleFilter === role ? 'admin-filter-chip-active' : 'admin-filter-chip-inactive'
                }`}
              >
                {role === 'all'
                  ? `All Users (${users.length})`
                  : `${role.charAt(0).toUpperCase() + role.slice(1)}s (${
                      users.filter((u) => u.role === role).length
                    })`}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-card">
          <div className="overflow-x-auto">
            <table className="users-table">
              <thead>
                <tr className="users-table-head">
                  <th>User Details</th>
                  <th>System Role</th>
                  <th>Status</th>
                  <th>Assigned Caregiver</th>
                  <th>Joined Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="users-table-row">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="user-avatar-sm">
                            {u.role === 'admin' ? (
                              <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                                <Shield className="h-4 w-4" />
                              </div>
                            ) : u.role === 'caregiver' ? (
                              <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                <UserCheck className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                {u.name ? u.name.slice(0, 2).toUpperCase() : 'PT'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="user-table-name font-bold text-slate-900">{u.name}</p>
                              {currentUser?.email?.toLowerCase() === u.email?.toLowerCase() && (
                                <Badge variant="primary" size="xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="user-table-email text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        >
                          <option value="patient">Patient</option>
                          <option value="caregiver">Caregiver</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <Badge variant={u.status === 'Active' ? 'success' : 'warning'} size="xs">
                          {u.status || 'Active'}
                        </Badge>
                      </td>
                      <td>
                        {u.role === 'patient' ? (
                          <select
                            value={u.assignedCaregiver || 'Caregiver Clinician'}
                            onChange={(e) => handleAssignCaregiver(u.id, e.target.value)}
                            className="rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-xs font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                            title="Assign caregiver to patient"
                          >
                            {caregiverOptions.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">N/A (Staff)</span>
                        )}
                      </td>
                      <td className="text-xs text-slate-500">{u.joined || 'Recent'}</td>
                      <td className="text-right">
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                            u.status === 'Active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50'
                          }`}
                        >
                          {u.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Invite User Modal */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Invite New User</h3>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Robert Vance"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. robert.vance@clinic.org"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Access Role *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                  >
                    <option value="patient">Patient (Prescription &amp; Reminders)</option>
                    <option value="caregiver">Caregiver (Clinical Care Team)</option>
                    <option value="admin">System Admin (Full Permissions)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
