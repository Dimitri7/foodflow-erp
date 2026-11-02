import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const MENU = [
  { path: '/dashboard', label: 'Dashboard',  perfis: ['admin'] },
  { path: '/clientes',  label: 'Clientes',   perfis: ['admin', 'vendedor'] },
  { path: '/produtos',  label: 'Produtos',   perfis: ['admin', 'vendedor', 'operador'] },
  { path: '/lotes',     label: 'Lotes',      perfis: ['admin', 'operador'] },
  { path: '/pedidos',   label: 'Pedidos',    perfis: ['admin', 'vendedor', 'operador'] },
  { path: '/expedicao', label: 'Expedição',  perfis: ['admin', 'operador'] },
  { path: '/usuarios',  label: 'Usuários',   perfis: ['admin'] },
  { path: '/auditoria', label: 'Auditoria',  perfis: ['admin'] },
];

export default function Layout() {
  const { perfil, nome, logout } = useAuth();
  const navigate = useNavigate();

  function sair() {
    logout();
    navigate('/login');
  }

  const itens = MENU.filter((m) => m.perfis.includes(perfil));

  return (
    <div className="d-flex">
      <nav className="sidebar d-flex flex-column">
        <div className="brand">FoodFlow</div>
        <ul className="nav flex-column px-2 flex-grow-1">
          {itens.map((m) => (
            <li key={m.path} className="nav-item">
              <NavLink
                to={m.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {m.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="px-3 py-3 border-top border-secondary">
          <div className="text-white-50 small mb-2">{nome}</div>
          <button className="btn btn-outline-light btn-sm w-100" onClick={sair}>
            Sair
          </button>
        </div>
      </nav>
      <main className="content-area p-4">
        <Outlet />
      </main>
    </div>
  );
}
