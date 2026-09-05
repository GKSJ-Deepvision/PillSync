import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { formatDate, titleCase } from '../../utils/format.js';

const ROLE_TONES = { ADMIN: 'danger', CAREGIVER: 'brand', PATIENT: 'neutral' };

export default function UserTable({ users, onToggle }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="py-2 pr-4">
              Name
            </th>
            <th scope="col" className="py-2 pr-4">
              Email
            </th>
            <th scope="col" className="py-2 pr-4">
              Role
            </th>
            <th scope="col" className="py-2 pr-4">
              Joined
            </th>
            <th scope="col" className="py-2 pr-4">
              Status
            </th>
            <th scope="col" className="py-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="py-2 pr-4 font-medium text-slate-800">{user.full_name}</td>
              <td className="py-2 pr-4 text-slate-600">{user.email}</td>
              <td className="py-2 pr-4">
                <Badge tone={ROLE_TONES[user.role]}>{titleCase(user.role)}</Badge>
              </td>
              <td className="py-2 pr-4 text-slate-600">{formatDate(user.date_joined)}</td>
              <td className="py-2 pr-4">
                <Badge tone={user.is_active ? 'success' : 'neutral'}>
                  {user.is_active ? 'Active' : 'Deactivated'}
                </Badge>
              </td>
              <td className="py-2">
                <Button
                  size="sm"
                  variant={user.is_active ? 'secondary' : 'primary'}
                  onClick={() => onToggle(user)}
                >
                  {user.is_active ? 'Deactivate' : 'Reactivate'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
