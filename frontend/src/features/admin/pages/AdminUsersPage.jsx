import { useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';

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
            <div className="flex items-center gap-2">
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

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:max-w-md">
            <Input
              icon={Search}
              placeholder="Search user by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            {['all', 'patient', 'caregiver', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition cursor-pointer ${
                  roleFilter === role
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {role === 'all' ? 'All Roles' : `${role}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Current Role</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Assigned Caregiver</th>
                  <th className="pb-3 font-semibold">Joined Date</th>
                  <th className="pb-3 font-semibold text-right">Role Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="patient">Patient</option>
                        <option value="caregiver">Caregiver</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5">
                      <Badge variant={user.status === 'Active' ? 'success' : 'warning'} size="xs">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-slate-600 font-medium">{user.assignedCaregiver}</td>
                    <td className="py-3.5 text-slate-400">{user.joined}</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                          user.status === 'Active'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {user.status === 'Active' ? 'Suspend' : 'Activate'}
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
