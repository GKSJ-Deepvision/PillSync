import { useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import RoleBadge from '../../components/RoleBadge';
import Input from '../../components/Input';
import { MOCK_USERS } from '../../data/mockData';
import { Search, Edit, Power, Eye } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(''); // 'view' | 'disable' | 'edit'

  const handleAction = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
    setModalOpen(true);
  };

  const handleDisableToggle = () => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === selectedUser.id) {
          const nextStatus = u.status === 'Active' ? 'Disabled' : 'Active';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
    setModalOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'All' || u.role.toLowerCase() === roleFilter.toLowerCase();

    const matchesStatus =
      statusFilter === 'All' || u.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in" data-testid="user-management-page">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">User Management</h1>
        <p className="text-xs text-slate-450 mt-0.5 font-medium">Review active, pending, or disabled platform members registry.</p>
      </div>

      {/* Filter Options */}
      <Card className="!p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:flex-1">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm transition-all focus:outline-none focus:border-rose-500 focus:ring focus:ring-rose-100 focus:ring-opacity-40"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-40 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 focus:ring focus:ring-rose-100 focus:ring-opacity-40 bg-white text-slate-700"
          >
            <option value="All">All Roles</option>
            <option value="Patient">Patient</option>
            <option value="Caregiver">Caregiver</option>
            <option value="Admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 focus:ring focus:ring-rose-100 focus:ring-opacity-40 bg-white text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>
      </Card>

      {/* User grid lists */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          title="No Users Registry Found"
          description="Modify filters or matching name parameters."
        />
      ) : (
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-55/30 transition-colors">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full border object-cover shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-400 font-medium">{u.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        u.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-500">
                      {u.phone}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          variant="outline"
                          className="!py-1.5 !px-2.5 text-xs font-semibold flex items-center gap-1"
                          onClick={() => handleAction(u, 'view')}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          className="!py-1.5 !px-2.5 text-xs font-semibold flex items-center gap-1 hover:bg-slate-50"
                          onClick={() => handleAction(u, 'edit')}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          className={`!py-1.5 !px-2.5 text-xs font-bold border border-transparent ${
                            u.status === 'Active'
                              ? 'text-red-655 hover:bg-red-50 hover:border-red-150'
                              : 'text-emerald-700 hover:bg-emerald-50 hover:border-emerald-150'
                          }`}
                          onClick={() => handleAction(u, 'disable')}
                          aria-label="Toggle user status"
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Action overlay Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        title={
          modalType === 'view'
            ? 'User Registration Card'
            : modalType === 'disable'
            ? `${selectedUser?.status === 'Active' ? 'Disable' : 'Enable'} Account Warning`
            : 'Edit User Account'
        }
        footer={
          modalType === 'disable' ? (
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                variant={selectedUser?.status === 'Active' ? 'danger' : 'primary'}
                onClick={handleDisableToggle}
              >
                Confirm Action
              </Button>
            </>
          ) : modalType === 'edit' ? (
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => {
                alert('User editing is a placeholder for Milestone 1.');
                setModalOpen(false);
              }}>Save Changes</Button>
            </>
          ) : null
        }
      >
        {selectedUser && modalType === 'view' && (
          <div className="space-y-4" data-testid="user-details-modal">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <img src={selectedUser.avatar} alt={selectedUser.name} className="h-14 w-14 rounded-full border object-cover" />
              <div>
                <h3 className="text-sm font-bold text-slate-805">{selectedUser.name}</h3>
                <RoleBadge role={selectedUser.role} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-slate-400 block">EMAIL ADDRESS</span>
                <span className="text-slate-700 font-bold block mt-0.5">{selectedUser.email}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 block">PHONE NUMBER</span>
                <span className="text-slate-700 font-bold block mt-0.5">{selectedUser.phone}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 block">DATE OF BIRTH</span>
                <span className="text-slate-700 font-bold block mt-0.5">{selectedUser.dob || 'Not provided'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 block">ACCOUNT STATUS</span>
                <span className="text-slate-705 font-bold block mt-0.5">{selectedUser.status}</span>
              </div>
            </div>
          </div>
        )}

        {selectedUser && modalType === 'disable' && (
          <div className="space-y-3" data-testid="user-disable-modal">
            <p className="text-xs text-slate-550 leading-relaxed">
              Are you sure you want to change the status of <span className="font-bold text-slate-800">{selectedUser.name}</span>'s account to <span className="font-bold text-slate-800">{selectedUser.status === 'Active' ? 'Disabled' : 'Active'}</span>?
            </p>
            {selectedUser.status === 'Active' ? (
              <p className="text-[10px] text-red-500 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100 leading-snug">
                Warning: Disabling this user will temporarily restrict their ability to authenticate or sync medication records.
              </p>
            ) : (
              <p className="text-[10px] text-emerald-600 font-medium bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 leading-snug">
                Info: Re-enabling this user restores dashboard synchronization features.
              </p>
            )}
          </div>
        )}

        {selectedUser && modalType === 'edit' && (
          <div className="space-y-4" data-testid="user-edit-modal">
            <Input label="Full Name" defaultValue={selectedUser.name} required />
            <Input label="Phone Number" defaultValue={selectedUser.phone} />
            <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed">
              * Email address and Role modifications require backend synchronization approvals.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
