import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import http from '../../api/http.js';
import Paginacao from '../../components/Paginacao.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

const PERFIL_LABEL = { admin: 'Administrador', vendedor: 'Vendedor', operador: 'Operador' };

export default function UsuariosList() {
  const [dados, setDados] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [erro, setErro] = useState('');
  const limite = 20;
  const { registrarReconexao } = useAuth();

  const carregar = useCallback(async () => {
    const params = { pagina, limite };
    if (busca) params.busca = busca;
    const { data } = await http.get('/api/usuarios', { params });
    setDados(data.dados);
    setTotal(data.total);
  }, [pagina, busca]);

  useEffect(() => {
    carregar();
    return registrarReconexao(carregar);
  }, [carregar, registrarReconexao]);

  async function toggleAtivo(usuario) {
    setErro('');
    try {
      await http.patch(`/api/usuarios/${usuario.id_usuario}/status`, { ativo: !usuario.ativo });
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro ?? 'Erro ao alterar status');
    }
  }

  function pesquisar(e) {
    e.preventDefault();
    setPagina(1);
    setBusca(buscaInput);
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 fw-bold mb-0">Usuários</h2>
        <Link to="/usuarios/novo" className="btn btn-primary btn-sm">Novo usuário</Link>
      </div>

      {erro && <div className="alert alert-danger">{erro}</div>}

      <form className="d-flex gap-2 mb-3" onSubmit={pesquisar}>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Buscar por nome ou e-mail"
          value={buscaInput}
          onChange={(e) => setBuscaInput(e.target.value)}
        />
        <button type="submit" className="btn btn-outline-primary btn-sm">Buscar</button>
        {busca && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => { setBusca(''); setBuscaInput(''); setPagina(1); }}
          >
            Limpar
          </button>
        )}
      </form>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Situação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                dados.map((u) => (
                  <tr key={u.id_usuario}>
                    <td>{u.nome}</td>
                    <td>{u.email}</td>
                    <td>{PERFIL_LABEL[u.perfil] ?? u.perfil}</td>
                    <td>
                      <span className={`badge ${u.ativo ? 'bg-success' : 'bg-secondary'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="d-flex gap-1">
                      <Link to={`/usuarios/${u.id_usuario}/editar`} className="btn btn-outline-primary btn-sm">
                        Editar
                      </Link>
                      <button
                        className={`btn btn-sm ${u.ativo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => toggleAtivo(u)}
                      >
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer d-flex justify-content-between align-items-center bg-white">
          <span className="text-muted small">{total} registro(s)</span>
          <Paginacao pagina={pagina} limite={limite} total={total} onChange={setPagina} />
        </div>
      </div>
    </div>
  );
}
