CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario    SERIAL PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  senha_hash    VARCHAR(255) NOT NULL,
  perfil        VARCHAR(20) NOT NULL CHECK (perfil IN ('admin', 'vendedor', 'operador')),
  ativo         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id_cliente    SERIAL PRIMARY KEY,
  razao_social  VARCHAR(150) NOT NULL,
  cnpj          VARCHAR(14) NOT NULL UNIQUE,
  telefone      VARCHAR(20),
  endereco      TEXT,
  ativo         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produtos (
  id_produto     SERIAL PRIMARY KEY,
  nome           VARCHAR(150) NOT NULL,
  categoria      VARCHAR(100),
  unidade        VARCHAR(30) NOT NULL,
  preco_unitario NUMERIC(10, 2) NOT NULL CHECK (preco_unitario > 0),
  estoque_minimo NUMERIC(10, 3) NOT NULL DEFAULT 0,
  ativo          BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lotes (
  id_lote               SERIAL PRIMARY KEY,
  id_produto            INT NOT NULL REFERENCES produtos (id_produto),
  codigo_lote           VARCHAR(50) NOT NULL,
  data_validade         DATE NOT NULL,
  quantidade_disponivel NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (quantidade_disponivel >= 0),
  data_entrada          DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (id_produto, codigo_lote),
  CHECK (data_validade > data_entrada)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id_pedido            SERIAL PRIMARY KEY,
  id_cliente           INT NOT NULL REFERENCES clientes (id_cliente),
  id_usuario           INT NOT NULL REFERENCES usuarios (id_usuario),
  data_criacao         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status               VARCHAR(30) NOT NULL CHECK (
                         status IN ('aguardando_separacao', 'em_separacao', 'separado', 'expedido', 'cancelado')
                       ),
  valor_total          NUMERIC(10, 2),
  motivo_cancelamento  TEXT,
  data_cancelamento    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS itens_pedido (
  id_item        SERIAL PRIMARY KEY,
  id_pedido      INT NOT NULL REFERENCES pedidos (id_pedido),
  id_lote        INT NOT NULL REFERENCES lotes (id_lote),
  quantidade     NUMERIC(10, 3) NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS historico_status_pedido (
  id               SERIAL PRIMARY KEY,
  id_pedido        INT NOT NULL REFERENCES pedidos (id_pedido),
  status_anterior  VARCHAR(30),
  novo_status      VARCHAR(30) NOT NULL,
  id_usuario       INT NOT NULL REFERENCES usuarios (id_usuario),
  data_hora        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs_auditoria (
  id_log          SERIAL PRIMARY KEY,
  id_usuario      INT REFERENCES usuarios (id_usuario),
  acao            VARCHAR(20) NOT NULL,
  tabela_afetada  VARCHAR(50) NOT NULL,
  id_registro     INT,
  data_hora       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valor_anterior  JSONB,
  valor_novo      JSONB
);

CREATE INDEX IF NOT EXISTS idx_lotes_produto_validade   ON lotes (id_produto, data_validade);
CREATE INDEX IF NOT EXISTS idx_lotes_produto             ON lotes (id_produto);
CREATE INDEX IF NOT EXISTS idx_itens_pedido              ON itens_pedido (id_pedido);
CREATE INDEX IF NOT EXISTS idx_itens_lote                ON itens_pedido (id_lote);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente           ON pedidos (id_cliente);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario           ON pedidos (id_usuario);
CREATE INDEX IF NOT EXISTS idx_pedidos_status            ON pedidos (status);
CREATE INDEX IF NOT EXISTS idx_historico_pedido          ON historico_status_pedido (id_pedido);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario         ON logs_auditoria (id_usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela          ON logs_auditoria (tabela_afetada);
