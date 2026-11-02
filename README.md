# FoodFlow

Sistema web para distribuidoras de alimentos. Permite cadastrar clientes, produtos e lotes, registrar pedidos com seleção automática de lotes por FEFO (vence primeiro, sai primeiro), e acompanhar o fluxo de expedição em tempo real via painel Kanban.

Projeto da disciplina de Desenvolvimento de Plataformas Web — UNIFOR.

## Tecnologias

- **Backend:** Node.js LTS, Express, PostgreSQL (`pg` com SQL puro), `bcryptjs`, `jsonwebtoken`, `socket.io`
- **Frontend:** React com Vite, React Router, Bootstrap 5, axios, socket.io-client

## Requisitos

- Node.js 20 LTS ou superior
- Banco PostgreSQL acessível (testado com [Neon](https://neon.tech))

## Instalação

```bash
# backend
cd backend
npm install
cp .env.example .env
# editar .env: preencher DATABASE_URL, JWT_SECRET e CORS_ORIGIN

# frontend
cd ../frontend
npm install
```

## Configuração do banco

```bash
cd backend
npm run db:reset
```

Cria as tabelas e insere os dados de demonstração.

## Rodando

```bash
# terminal 1 — backend (porta 3001)
cd backend
npm run dev

# terminal 2 — frontend (porta 5173)
cd frontend
npm run dev
```

Acesse `http://localhost:5173`.

## Testes

```bash
cd backend
npm test
```

Roda a suite de 16 testes de aceitação. O banco é resetado antes e depois automaticamente.

## Usuários de teste

Senha de todos: `foodflow123`

| E-mail | Perfil |
|--------|--------|
| `admin@foodflow.com` | Administrador |
| `vendedor@foodflow.com` | Vendedor |
| `vendedor2@foodflow.com` | Vendedor |
| `operador@foodflow.com` | Operador |

## O que fica para a entrega final

RF7 (cancelamento de pedido), RF8 (relatórios), RF14–RF18 (dashboard, alertas, valor em estoque, exportação, recuperação de senha), documentação Swagger, backup automático e cobertura de testes automatizados.
