import { useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';

import { Plus, Search } from 'lucide-react';
import './AdminUsersPage.css';

const INITIAL_USERS = [
  {
    id: 'u1',
    name: 'Ibrahim Kadri',
    email: 'patient@example.com',
    role: 'patient',
    status: 'Active',
    assignedCaregiver: 'Dr. Oliver Mitchell',
    joined: 'Jan 12, 2026',
  },
  {
    id: 'u2',
    name: 'Dr. Oliver Mitchell',
    email: 'caregiver@example.com',
    role: 'caregiver',
    status: 'Active',
    assignedCaregiver: 'N/A (Caregiver)',
    joined: 'Dec 05, 2025',
  },
  {
    id: 'u3',
    name: 'Sarah Jenkins',
    email: 'admin@example.com',
    role: 'admin',
    status: 'Active',
    assignedCaregiver: 'System Admin',
    joined: 'Nov 01, 2025',
  },
  {
    id: 'u4',
    name: 'Sarah Connor',
    email: 'sarah.connor@example.com',
    role: 'patient',
    status: 'Active',
    assignedCaregiver: 'Dr. Oliver Mitchell',
    joined: 'Feb 03, 2026',
  },
  {
    id: 'u5',
    name: 'Michael Chang',
    email: 'michael.c@example.com',
    role: 'patient',
    status: 'Active',
    assignedCaregiver: 'Dr. Oliver Mitchell',
    joined: 'Feb 15, 2026',
  },
  {
    id: 'u6',
    name: 'Dr. Emily Watson',
    email: 'emily.w@clinic.com',
    role: 'caregiver',
    status: 'Pending Review',
    assignedCaregiver: 'N/A (Caregiver)',
    joined: 'Aug 28, 2026',
  },
];

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState(() => {
    let list = [...INITIAL_USERS];
    if (currentUser?.email) {
      const existsIndex = list.findIndex(
        (u) => u.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (existsIndex >= 0) {
        list[existsIndex] = {
          ...list[existsIndex],
          name: currentUser.name || list[existsIndex].name,
          role: currentUser.role || list[existsIndex].role,
        };
      } else {
        list.unshift({
          id: currentUser.id || 'current-u',
          name: currentUser.name || 'Current User',
          email: currentUser.email,
          role: currentUser.role || 'patient',
          status: 'Active',
          assignedCaregiver:
            currentUser.role === 'patient' ? 'Dr. Oliver Mitchell' : 'System Admin',
          joined: 'Today (Live)',
        });
      }
    }
    return list;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const handleRoleChange = (userId, newRole) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    alert('User role updated to ' + newRole);
  };

  const handleToggleStatus = (userId) => {
    setUsers(
      users.map((u) =>
        u.id === userId ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u
      )
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
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
              <h1 className="admin-users-title">User Directory & Access Control</h1>
              <Badge variant="primary" size="sm">
                {users.length} Registered
              </Badge>
            </div>
            <p className="admin-users-subtitle">
              Manage system identity, role-based access control (RBAC), and clinical permissions
            </p>
          </div>

          <Button
            onClick={() =>
              alert(
                'Invite User Modal: Enter name, email, and assign role (Patient / Caregiver / Admin)'
              )
            }
            className="flex items-center gap-2 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Invite New User
          </Button>
        </div>

        {/* Toolbar with Search and Filter Chips */}
        <div className="admin-toolbar">
          <div className="admin-search-wrapper">
            <Search className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search user by name or email..."
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
                {role === 'all' ? 'All Roles' : `${role.charAt(0).toUpperCase() + role.slice(1)}s`}
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
                  <th>User</th>
                  <th>Current Role</th>
                  <th>Status</th>
                  <th>Assigned Caregiver</th>
                  <th>Joined Date</th>
                  <th className="text-right">Role Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="users-table-row">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
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
                        {u.status}
                      </Badge>
                    </td>
                    <td className="text-slate-600 font-medium">{u.assignedCaregiver}</td>
                    <td className="text-slate-400">{u.joined}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
