import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import RotaProtegida from './components/RotaProtegida.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import EsqueciSenha from './pages/EsqueciSenha.jsx';
import RedefinirSenha from './pages/RedefinirSenha.jsx';
import ClientesList from './pages/clientes/ClientesList.jsx';
import ClienteForm from './pages/clientes/ClienteForm.jsx';
import ProdutosList from './pages/produtos/ProdutosList.jsx';
import ProdutoForm from './pages/produtos/ProdutoForm.jsx';
import LotesList from './pages/lotes/LotesList.jsx';
import LoteForm from './pages/lotes/LoteForm.jsx';
import LoteRastreio from './pages/lotes/LoteRastreio.jsx';
import PedidosList from './pages/pedidos/PedidosList.jsx';
import PedidoForm from './pages/pedidos/PedidoForm.jsx';
import PedidoDetalhe from './pages/pedidos/PedidoDetalhe.jsx';
import Expedicao from './pages/expedicao/Expedicao.jsx';
import UsuariosList from './pages/usuarios/UsuariosList.jsx';
import UsuarioForm from './pages/usuarios/UsuarioForm.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import Auditoria from './pages/auditoria/Auditoria.jsx';

function RedirecaoInicial() {
  const { perfil } = useAuth();
  return <Navigate to={perfil === 'admin' ? '/dashboard' : '/pedidos'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route
            path="/"
            element={
              <RotaProtegida>
                <Layout />
              </RotaProtegida>
            }
          >
            <Route index element={<RedirecaoInicial />} />
            <Route
              path="clientes"
              element={
                <RotaProtegida perfisPermitidos={['admin', 'vendedor']}>
                  <ClientesList />
                </RotaProtegida>
              }
            />
            <Route
              path="clientes/novo"
              element={
                <RotaProtegida perfisPermitidos={['admin', 'vendedor']}>
                  <ClienteForm />
                </RotaProtegida>
              }
            />
            <Route
              path="clientes/:id/editar"
              element={
                <RotaProtegida perfisPermitidos={['admin', 'vendedor']}>
                  <ClienteForm />
                </RotaProtegida>
              }
            />
            <Route path="produtos" element={<RotaProtegida><ProdutosList /></RotaProtegida>} />
            <Route
              path="produtos/novo"
              element={
                <RotaProtegida perfisPermitidos={['admin']}>
                  <ProdutoForm />
                </RotaProtegida>
              }
            />
            <Route
              path="produtos/:id/editar"
              element={
                <RotaProtegida perfisPermitidos={['admin']}>
                  <ProdutoForm />
                </RotaProtegida>
              }
            />
            <Route
              path="lotes"
              element={
                <RotaProtegida perfisPermitidos={['admin', 'operador']}>
                  <LotesList />
                </RotaProtegida>
              }
            />
            <Route
              path="lotes/novo"
              element={
                <RotaProtegida perfisPermitidos={['admin', 'operador']}>
                  <LoteForm />
                </RotaProtegida>
              }
            />
            <Route
              path="pedidos"
              element={
                <RotaProtegida perfisPermitidos={['admin', 'vendedor', 'operador']}>
                  <PedidosList />
                </RotaProtegida>
              }
            />
            <Route
              path="pedidos/novo"
              element={
                <RotaProtegida perfisPermitidos={['vendedor']}>
                  <PedidoForm />
                </RotaProtegida>
              }
            />
            <Route
              path="pedidos/:id"
              element={
                <RotaProtegida perfisPermitidos={['admin', 'vendedor', 'operador']}>
                  <PedidoDetalhe />
                </RotaProtegida>
              }
            />
            <Route
              path="expedicao"
              element={
                <RotaProtegida perfisPermitidos={['admin', 'operador']}>
                  <Expedicao />
                </RotaProtegida>
              }
            />
            <Route
              path="usuarios"
              element={
                <RotaProtegida perfisPermitidos={['admin']}>
                  <UsuariosList />
                </RotaProtegida>
              }
            />
            <Route
              path="usuarios/novo"
              element={
                <RotaProtegida perfisPermitidos={['admin']}>
                  <UsuarioForm />
                </RotaProtegida>
              }
            />
            <Route
              path="usuarios/:id/editar"
              element={
                <RotaProtegida perfisPermitidos={['admin']}>
                  <UsuarioForm />
                </RotaProtegida>
              }
            />
            <Route
              path="dashboard"
              element={
                <RotaProtegida perfisPermitidos={['admin']}>
                  <Dashboard />
                </RotaProtegida>
              }
            />
            <Route
              path="lotes/:id/rastreio"
              element={
                <RotaProtegida perfisPermitidos={['admin']}>
                  <LoteRastreio />
                </RotaProtegida>
              }
            />
            <Route
              path="auditoria"
              element={
                <RotaProtegida perfisPermitidos={['admin']}>
                  <Auditoria />
                </RotaProtegida>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
