import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const PERFIS = {
  vendedor: {
    titulo: 'Vendedor',
    resumo: 'Cadastra clientes e registra pedidos. Só enxerga os pedidos que ele mesmo criou.',
    fluxos: [
      {
        titulo: 'Cadastrar um cliente',
        ir: { to: '/clientes/novo', texto: 'Novo cliente' },
        passos: [
          'No menu, clique em Clientes e depois em Novo cliente.',
          'Preencha razão social e CNPJ (obrigatórios). O sistema valida o CNPJ.',
          'Telefone e endereço são opcionais.',
          'Clique em Salvar. O cliente já aparece na lista e pode ser usado em pedidos.',
        ],
      },
      {
        titulo: 'Criar um pedido',
        ir: { to: '/pedidos/novo', texto: 'Novo pedido' },
        passos: [
          'No menu, clique em Pedidos e depois em Novo pedido.',
          'Escolha o cliente.',
          'Escolha o produto e digite a quantidade. Ao sair do campo, o sistema mostra a distribuição FEFO: de quais lotes a quantidade vai sair, com validade e quantidade de cada um.',
          'Se não houver saldo suficiente, aparece uma mensagem em vermelho no item. Reduza a quantidade ou troque o produto.',
          'Use + Adicionar produto para incluir mais itens e confira o total estimado.',
          'Clique em Confirmar pedido. Só neste momento o estoque dos lotes é baixado, e o pedido entra na fila de expedição como Aguardando separação.',
        ],
      },
      {
        titulo: 'Acompanhar ou cancelar um pedido',
        ir: { to: '/pedidos', texto: 'Meus pedidos' },
        passos: [
          'Em Pedidos, use a busca e o filtro de status para encontrar o pedido e clique nele.',
          'A tela de detalhe mostra os itens, os lotes usados e o histórico de status.',
          'Para cancelar, clique em Cancelar pedido e informe o motivo (obrigatório).',
          'Pedidos já expedidos não podem ser cancelados. Ao cancelar, as quantidades voltam para os lotes.',
        ],
      },
    ],
  },
  operador: {
    titulo: 'Operador',
    resumo: 'Cuida do estoque físico e da expedição: recebe lotes e move os pedidos no painel.',
    fluxos: [
      {
        titulo: 'Registrar a entrada de um lote',
        ir: { to: '/lotes/novo', texto: 'Novo lote' },
        passos: [
          'No menu, clique em Lotes e depois em Novo lote.',
          'Escolha o produto e informe o código do lote, a data de validade e a quantidade.',
          'A data de entrada é opcional.',
          'Clique em Salvar. O saldo do produto aumenta e o lote passa a ser considerado pelo FEFO.',
          'Na lista de Lotes, o selo laranja indica lote perto de vencer e o vermelho indica lote vencido. Lotes vencidos não entram em pedidos.',
        ],
      },
      {
        titulo: 'Separar e expedir pedidos',
        ir: { to: '/expedicao', texto: 'Painel de expedição' },
        passos: [
          'No menu, clique em Expedição. O painel tem quatro colunas: Aguardando separação, Em separação, Separado e Expedido.',
          'Cada cartão mostra o número do pedido, o cliente e o valor.',
          'Clique em Avançar para mover o pedido para a próxima etapa. Não é possível pular etapas nem voltar.',
          'O painel atualiza sozinho quando outro usuário cria ou move um pedido, sem precisar recarregar a página.',
        ],
      },
      {
        titulo: 'Consultar o que separar',
        ir: { to: '/pedidos', texto: 'Pedidos' },
        passos: [
          'Em Pedidos, clique no pedido desejado.',
          'A tela de detalhe lista os itens e os lotes de onde cada quantidade deve ser retirada.',
        ],
      },
    ],
  },
  admin: {
    titulo: 'Administrador',
    resumo: 'Acompanha a operação, mantém os cadastros e audita o que foi feito no sistema.',
    fluxos: [
      {
        titulo: 'Acompanhar a operação',
        ir: { to: '/dashboard', texto: 'Dashboard' },
        passos: [
          'O Dashboard é a tela inicial e mostra o faturamento do dia, o valor em estoque, os lotes a vencer e as vendas recentes.',
          'Em Pedidos e Expedição, o administrador pode ver tudo, avançar o status e cancelar pedidos.',
          'O administrador não cria pedidos: essa função é do vendedor.',
        ],
      },
      {
        titulo: 'Manter produtos e usuários',
        ir: { to: '/usuarios', texto: 'Usuários' },
        passos: [
          'Em Produtos, clique em Novo produto e informe nome, unidade, preço unitário e estoque mínimo. Quando o saldo fica abaixo do mínimo, o produto aparece em alerta.',
          'Em Usuários, crie contas escolhendo o perfil (vendedor, operador ou administrador).',
          'Para bloquear o acesso de alguém sem apagar o histórico, use Desativar na lista de usuários.',
        ],
      },
      {
        titulo: 'Auditar e rastrear',
        ir: { to: '/auditoria', texto: 'Auditoria' },
        passos: [
          'Em Auditoria, veja quem fez cada alteração, quando, em qual tabela e os valores antes e depois.',
          'Em Lotes, o botão Rastrear de um lote mostra todos os pedidos e clientes que receberam produtos daquele lote. É útil em caso de recall.',
        ],
      },
    ],
  },
};

const STATUS = [
  ['Aguardando separação', 'Pedido confirmado, ainda não foi pego pelo operador.'],
  ['Em separação', 'O operador está separando os itens nos lotes indicados.'],
  ['Separado', 'Itens separados, aguardando saída.'],
  ['Expedido', 'Pedido saiu para entrega. Não pode mais ser alterado nem cancelado.'],
  ['Cancelado', 'Pedido cancelado com motivo registrado. O estoque voltou para os lotes.'],
];

const GLOSSARIO = [
  ['FEFO', 'Vence primeiro, sai primeiro. O sistema escolhe sozinho os lotes com validade mais próxima, e divide o pedido entre lotes quando um só não basta.'],
  ['Lote', 'Remessa de um produto com código, validade e quantidade próprios.'],
  ['Estoque mínimo', 'Quantidade abaixo da qual o produto entra em alerta de reposição.'],
  ['Lote vencido', 'Lote com a validade passada. Fica no cadastro, mas não é usado em pedidos.'],
];

const PERGUNTAS = [
  ['Por que não aparece o botão Novo pedido?', 'Somente o perfil Vendedor cria pedidos. Administrador e operador apenas acompanham e movem os pedidos.'],
  ['Apareceu "Saldo insuficiente" ao adicionar um produto. E agora?', 'A soma dos lotes válidos (não vencidos) não cobre a quantidade pedida. Reduza a quantidade ou peça ao operador para registrar um novo lote.'],
  ['Um lote existe, mas não é usado no pedido.', 'Lotes vencidos ou sem saldo são ignorados pelo FEFO. Confira a validade e a quantidade na lista de Lotes.'],
  ['Não consigo cancelar um pedido.', 'Pedidos expedidos ou já cancelados não podem ser cancelados. O vendedor também só cancela os pedidos que ele mesmo criou.'],
  ['O painel de expedição não atualiza.', 'Ele atualiza em tempo real. Se a conexão cair, recarregue a página (F5) para reconectar.'],
];

const USUARIOS_TESTE = [
  ['admin@foodflow.com', 'Administrador'],
  ['vendedor@foodflow.com', 'Vendedor'],
  ['vendedor2@foodflow.com', 'Vendedor'],
  ['operador@foodflow.com', 'Operador'],
];

export default function Ajuda() {
  const { perfil } = useAuth();
  const [aba, setAba] = useState(PERFIS[perfil] ? perfil : 'vendedor');
  const atual = PERFIS[aba];

  return (
    <div style={{ maxWidth: 860 }}>
      <h2 className="h5 fw-bold mb-1">Como usar o FoodFlow</h2>
      <p className="text-muted small mb-4">
        Guia rápido de cada perfil. O menu lateral mostra apenas o que o seu perfil pode acessar.
      </p>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h3 className="h6 fw-bold">Primeiros passos</h3>
          <ol className="mb-0 small">
            <li>Entre com seu e-mail e senha na tela de login.</li>
            <li>Se esquecer a senha, use Esqueci minha senha na tela de login e siga o link enviado por e-mail.</li>
            <li>Use o menu lateral para navegar. Para trocar de usuário, clique em Sair.</li>
            <li>Esta página pode ser aberta a qualquer momento pelo botão ? no canto da tela.</li>
          </ol>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        {Object.entries(PERFIS).map(([chave, p]) => (
          <li key={chave} className="nav-item">
            <button
              type="button"
              className={`nav-link ${aba === chave ? 'active' : ''}`}
              onClick={() => setAba(chave)}
            >
              {p.titulo}
            </button>
          </li>
        ))}
      </ul>

      <p className="text-muted small">{atual.resumo}</p>

      {atual.fluxos.map((fluxo) => (
        <div key={fluxo.titulo} className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h6 fw-bold mb-0">{fluxo.titulo}</h3>
              {aba === perfil && (
                <Link to={fluxo.ir.to} className="btn btn-outline-primary btn-sm">
                  {fluxo.ir.texto}
                </Link>
              )}
            </div>
            <ol className="list-unstyled mb-0">
              {fluxo.passos.map((passo, i) => (
                <li key={passo} className="d-flex gap-3 mb-2 small">
                  <span
                    className="badge rounded-pill bg-primary align-self-start"
                    style={{ minWidth: 24 }}
                  >
                    {i + 1}
                  </span>
                  <span>{passo}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ))}

      <div className="row g-3 mt-1">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h3 className="h6 fw-bold mb-3">Status do pedido</h3>
              <dl className="mb-0 small">
                {STATUS.map(([nome, texto]) => (
                  <div key={nome} className="mb-2">
                    <dt>{nome}</dt>
                    <dd className="text-muted mb-0">{texto}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h3 className="h6 fw-bold mb-3">Glossário</h3>
              <dl className="mb-0 small">
                {GLOSSARIO.map(([termo, texto]) => (
                  <div key={termo} className="mb-2">
                    <dt>{termo}</dt>
                    <dd className="text-muted mb-0">{texto}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mt-3">
        <div className="card-body">
          <h3 className="h6 fw-bold mb-3">Perguntas frequentes</h3>
          {PERGUNTAS.map(([pergunta, resposta]) => (
            <details key={pergunta} className="mb-2 small">
              <summary className="fw-semibold">{pergunta}</summary>
              <p className="text-muted mt-1 mb-0">{resposta}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="card border-0 shadow-sm mt-3 mb-4">
        <div className="card-body">
          <h3 className="h6 fw-bold mb-2">Usuários de demonstração</h3>
          <p className="small text-muted mb-2">
            Senha de todos: <code>foodflow123</code>
          </p>
          <table className="table table-sm small mb-0">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Perfil</th>
              </tr>
            </thead>
            <tbody>
              {USUARIOS_TESTE.map(([email, nome]) => (
                <tr key={email}>
                  <td>{email}</td>
                  <td>{nome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}