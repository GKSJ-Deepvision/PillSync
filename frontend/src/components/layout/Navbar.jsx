import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import { logout, selectUser } from '../../store/authSlice.js';
import { initials, titleCase } from '../../utils/format.js';
import Button from '../common/Button.jsx';

export default function Navbar() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleLogout() {
    await dispatch(logout());
    navigate('/login', { replace: true });
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-brand-800">
          <span aria-hidden="true" className="text-xl">
            💊
          </span>
          PillSync
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{user.full_name}</p>
              <p className="text-xs text-slate-500">{titleCase(user.role)}</p>
            </div>
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm
                font-semibold text-brand-800"
            >
              {initials(user.full_name)}
            </span>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
