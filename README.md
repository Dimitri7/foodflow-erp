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

Roda a suite de 27 testes de aceitação (inclui RF18). O banco é resetado antes e depois automaticamente.

## Usuários de teste

Senha de todos: `foodflow123`

| E-mail | Perfil |
|--------|--------|
| `admin@foodflow.com` | Administrador |
| `vendedor@foodflow.com` | Vendedor |
| `vendedor2@foodflow.com` | Vendedor |
| `operador@foodflow.com` | Operador |

## Recuperação de senha

Em desenvolvimento, o envio de e-mail usa o serviço Ethereal (conta de teste criada automaticamente). O link para visualizar o e-mail enviado aparece no terminal do servidor:

```
Visualize o e-mail: https://ethereal.email/message/...
```

Para produção, substitua as variáveis de e-mail no `.env` por um servidor SMTP real.

## Backup

```bash
cd backend
npm run backup          # cria backend/backups/backup_<data>.json
npm run restore         # restaura o backup mais recente
npm run restore -- backend/backups/backup_<data>.json  # restaura arquivo específico
```

Os 7 backups mais recentes são mantidos automaticamente. Para agendar backup diário às 02:00, defina `BACKUP_AUTOMATICO=true` no `.env`.

## Documentação da API

Com o servidor rodando, acesse `http://localhost:3001/api/docs` para a interface Swagger com todas as rotas, perfis e schemas.

## Lint

```bash
cd backend && npm run lint
cd frontend && npm run lint
```
