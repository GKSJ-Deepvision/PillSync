import { useCallback, useState } from 'react';

import api from '../api/client.js';
import Alert from '../components/common/Alert.jsx';
import Card from '../components/common/Card.jsx';
import Input from '../components/common/Input.jsx';
import Spinner from '../components/common/Spinner.jsx';
import UserTable from '../features/admin/UserTable.jsx';
import { useApi, useMutation } from '../hooks/useApi.js';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(
    () =>
      api
        .get('/admin/users/', { params: { search: search || undefined } })
        .then((response) => response.data),
    [search]
  );
  const users = useApi(fetchUsers);

  const toggleActive = useCallback(
    ({ id, active }) => api.post(`/admin/users/${id}/${active ? 'deactivate' : 'activate'}/`),
    []
  );
  const toggle = useMutation(toggleActive);

  async function handleToggle(user) {
    const result = await toggle.submit({ id: user.id, active: user.is_active });
    if (result.ok) users.reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">User management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Accounts are deactivated, never deleted - medication history has to outlive the account.
        </p>
      </div>

      {users.error && <Alert tone="error">{users.error.message}</Alert>}
      {toggle.error && <Alert tone="error">{toggle.error.message}</Alert>}

      <Card
        title={`Users (${users.data?.count ?? 0})`}
        actions={
          <Input
            label="Search"
            placeholder="Name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-56"
          />
        }
      >
        {users.loading ? (
          <Spinner label="Loading users" />
        ) : (
          <UserTable users={users.data?.results ?? []} onToggle={handleToggle} />
        )}
      </Card>
    </div>
  );
}
