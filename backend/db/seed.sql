-- Limpa para permitir re-execução
TRUNCATE logs_auditoria, historico_status_pedido, itens_pedido, pedidos, lotes, produtos, clientes, usuarios RESTART IDENTITY CASCADE;

-- Senha de todos os usuários: foodflow123
INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo) VALUES
  ('Administrador', 'admin@foodflow.com',
   '$2a$10$GNpcZQ7Ke..9cTVMUmrRwupq2sKL7azqzT/fFTWEV4MsibZe2bLhu', 'admin', true),
  ('João Vendedor', 'vendedor@foodflow.com',
   '$2a$10$GNpcZQ7Ke..9cTVMUmrRwupq2sKL7azqzT/fFTWEV4MsibZe2bLhu', 'vendedor', true),
  ('Maria Vendedora', 'vendedor2@foodflow.com',
   '$2a$10$GNpcZQ7Ke..9cTVMUmrRwupq2sKL7azqzT/fFTWEV4MsibZe2bLhu', 'vendedor', true),
  ('Carlos Operador', 'operador@foodflow.com',
   '$2a$10$GNpcZQ7Ke..9cTVMUmrRwupq2sKL7azqzT/fFTWEV4MsibZe2bLhu', 'operador', true),
  ('Inativo Teste', 'inativo@foodflow.com',
   '$2a$10$GNpcZQ7Ke..9cTVMUmrRwupq2sKL7azqzT/fFTWEV4MsibZe2bLhu', 'vendedor', false);

INSERT INTO clientes (razao_social, cnpj, telefone, endereco) VALUES
  ('Supermercado ABC Ltda', '11222333000181', '(85) 3000-1111', 'Rua das Flores, 100 - Fortaleza/CE'),
  ('Distribuidora XYZ Eireli', '22333444000181', '(85) 3000-2222', 'Av. Industrial, 500 - Fortaleza/CE'),
  ('Mercado Bom Preço ME', '33444555000181', '(85) 3000-3333', 'Rua do Comércio, 75 - Caucaia/CE');

INSERT INTO produtos (nome, categoria, unidade, preco_unitario, estoque_minimo) VALUES
  ('Arroz 5kg',  'Grãos',  'cx', 25.90, 20),
  ('Feijão 1kg', 'Grãos',  'cx',  8.50, 10),
  ('Óleo 900ml', 'Óleos',  'un',  7.20, 10);

-- Arroz 5kg: L1 vence antes → FEFO usa L1 primeiro (CA01/CA02)
-- Feijão 1kg: L3 vencido em 2024 → ignorado pelo FEFO (CA04)
-- Óleo 900ml: quantidade 2 < estoque_minimo 10 → alerta de estoque mínimo
INSERT INTO lotes (id_produto, codigo_lote, data_validade, data_entrada, quantidade_disponivel) VALUES
  (1, 'L1', '2026-12-10', '2026-10-01', 30),
  (1, 'L2', '2027-01-20', '2026-10-01', 50),
  (2, 'L3', '2024-01-01', '2023-06-01', 20),
  (2, 'L4', '2027-06-30', '2026-10-01', 25);

-- L5 com validade próxima (~20 dias) para demonstrar o badge de alerta no frontend
INSERT INTO lotes (id_produto, codigo_lote, data_validade, data_entrada, quantidade_disponivel) VALUES
  (3, 'L5', CURRENT_DATE + INTERVAL '20 days', '2026-10-01', 2);

-- Pedidos em status variados para o painel de expedição
-- Debita de L4 (Feijão): 5+3+2+5 = 15; quantidade_disponivel já em 25 (40-15)
INSERT INTO pedidos (id_cliente, id_usuario, status, valor_total) VALUES
  (1, 2, 'aguardando_separacao', 42.50),
  (2, 3, 'em_separacao',         25.50),
  (3, 2, 'separado',             17.00),
  (1, 2, 'expedido',             42.50);

INSERT INTO itens_pedido (id_pedido, id_lote, quantidade, preco_unitario) VALUES
  (1, 4, 5, 8.50),
  (2, 4, 3, 8.50),
  (3, 4, 2, 8.50),
  (4, 4, 5, 8.50);

INSERT INTO historico_status_pedido (id_pedido, status_anterior, novo_status, id_usuario) VALUES
  (1, NULL,                   'aguardando_separacao', 2),
  (2, NULL,                   'aguardando_separacao', 3),
  (2, 'aguardando_separacao', 'em_separacao',         4),
  (3, NULL,                   'aguardando_separacao', 2),
  (3, 'aguardando_separacao', 'em_separacao',         4),
  (3, 'em_separacao',         'separado',             4),
  (4, NULL,                   'aguardando_separacao', 2),
  (4, 'aguardando_separacao', 'em_separacao',         4),
  (4, 'em_separacao',         'separado',             4),
  (4, 'separado',             'expedido',             4);
