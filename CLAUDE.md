# FoodFlow ERP

Projeto da disciplina de Desenvolvimento de Plataformas Web (UNIFOR). Sistema web para distribuidoras de alimentos: pedidos com validação de saldo por lote (FEFO), painel de expedição e controle de estoque.

O documento de requisitos está em `docs/requisitos.pdf` e é a referência do projeto. Quando o código implementar um requisito, siga o ID do documento (RF, RN, RNF, CA). A seção "Decisões que corrigem o documento", mais abaixo, tem prioridade sobre o PDF.

## Quem está programando

Sou o Dimitri, responsável pelo back-end da equipe. Preciso entender e saber explicar tudo na apresentação. Sou iniciante em terminal, pastas e configuração: sempre diga exatamente qual comando rodar, em qual pasta, e o que devo ver na tela se deu certo.

## Como trabalhar comigo (obrigatório)

Tenho só hoje para terminar o MVP inteiro. Trabalhe em blocos grandes, sem parar a cada arquivo.

1. No início de cada bloco, mostre um plano curto (lista de arquivos e o que cada um faz) e espere eu aprovar uma única vez. Depois disso, execute o bloco inteiro sem pedir confirmação a cada passo.
2. Você mesmo roda os comandos necessários (instalar dependências, recriar o banco, subir o servidor, testar as rotas com curl ou com o script de testes) e corrige os erros sozinho. Só me chame quando precisar de algo que só eu posso fazer (por exemplo, colar a URL do banco no `.env`).
3. Quando eu precisar fazer algo no computador, diga exatamente o comando, em qual pasta e o que devo ver na tela se deu certo.
4. Ao terminar cada bloco, me dê um resumo curto: o que foi feito, como eu vejo funcionando e os 2 ou 3 conceitos principais do bloco.
5. Mantenha o arquivo `GUIA_DE_DEFESA.md` na raiz (está no `.gitignore`), acrescentando a cada bloco:
   - o que cada arquivo faz, em uma ou duas frases;
   - o caminho completo de uma requisição (rota → middleware → controller → service → model → banco → resposta);
   - as decisões técnicas e a alternativa descartada em cada uma;
   - um resumo de 3 a 4 frases do jeito que eu falaria para o professor;
   - perguntas prováveis do professor, com respostas curtas.
   Escreva em português simples, como explicação para um colega de turma.
6. Não faça commits. No fim de cada bloco, sugira a mensagem de commit (curta, em português, no imperativo: "adiciona rota de login").
7. Quando eu disser "me testa", faça perguntas sobre o código, uma por vez, sem dar a resposta, e corrija o que eu errar.

## Estilo de código

O código deve ser limpo, legível e consistente, seguindo os padrões abaixo.

- Comentários só onde a regra não fica clara lendo o código (por exemplo, por que o lock usa `FOR UPDATE` ou por que os produtos são travados em ordem de id). Nada de comentário que repete o que a linha faz, nada de JSDoc em toda função, nada de banners como `// ===== ROTAS =====`.
- Sem emojis em código, logs, commits ou README.
- Sem `console.log` decorativo ou mensagens como "Server is running! 🚀". Um log simples ao subir o servidor basta.
- Nomes de domínio em português, consistentes com o banco: `pedido`, `lote`, `idProduto`, `criarPedido`, `listarLotes`. Termos técnicos padrão continuam em inglês (`req`, `res`, `router`, `next`, `middleware`).
- camelCase no JavaScript, snake_case no banco.
- Sem abstração desnecessária: funções exportadas de módulos simples, sem classes genéricas, sem arquivo `utils.js` gigante, sem padrões que um estudante não saberia justificar.
- Funções curtas e arquivos com uma responsabilidade clara. Legibilidade acima de esperteza.
- Nada de validação duplicada "por precaução" no mesmo fluxo nem `try/catch` em toda função: erros sobem para o middleware de erros.
- Mensagens para o usuário em português, curtas: "CNPJ inválido", "Saldo insuficiente para Arroz 5kg".
- README direto: o que é, requisitos, como instalar, como rodar, usuários de teste. Sem tom de propaganda.
- Não deixe TODO, código comentado, arquivos de exemplo ou dependências sem uso.

## Stack

Back-end (`backend/`): Node.js LTS, Express, `pg` com SQL escrito à mão e consultas parametrizadas (sem ORM, para eu conseguir explicar cada consulta), `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`, `socket.io`, `express-rate-limit` na rota de login, `nodemon` em desenvolvimento.

Front-end (`frontend/`): React com Vite, React Router, Bootstrap, axios, socket.io-client.

Banco: PostgreSQL. `backend/db/schema.sql` cria as tabelas, `backend/db/seed.sql` insere dados de demonstração, e `backend/db/setup.js` executa os dois pelo Node (não depender de `psql` instalado). Script `npm run db:reset`.

## Estrutura do back-end

```
backend/
  db/            schema.sql, seed.sql, setup.js
  src/
    server.js    sobe HTTP + Socket.IO
    app.js       Express, middlewares globais, rotas
    config/      conexão com o banco (Pool)
    routes/      um arquivo por recurso
    middlewares/ autenticar, permitirPerfis, tratarErros
    controllers/ lê a requisição, chama o service, responde
    services/    regras de negócio e transações (pedidos, estoque, auditoria)
    models/      funções com SQL; recebem o client da transação quando precisam
    validators/  validação de campos e CNPJ
    socket.js    inicializa e exporta o io
```

## Escopo da entrega de 03/11 (MVP)

Implementar: RF1, RF2, RF3, RF4, RF5 (seleção automática FEFO e divisão entre lotes), RF6, RF9, RF10, RF11, RF12, RF13, RF19, RF20. Também entra a gravação em `logs_auditoria` nas escritas (RN10) e o Socket.IO no painel de expedição, porque o critério do RF6 e o CA07 exigem atualização sem recarregar.

Fica para a entrega final (não implementar sem eu pedir): RF7, RF8, RF14 a RF18, backup, Swagger, cobertura de testes.

## Decisões que corrigem o documento

1. Não existe reserva temporária. Ao adicionar um item na tela, a API apenas verifica o saldo e devolve a prévia de quais lotes seriam usados (`GET /api/estoque/:idProduto` ou uma rota de prévia). A baixa nos lotes só acontece ao confirmar o pedido, dentro da transação (RN05).
2. Na confirmação, o saldo é conferido de novo dentro da transação com `SELECT ... FOR UPDATE` nos lotes de cada produto, travando os produtos em ordem crescente de id para evitar deadlock (RNF12, CA06).
3. Lote vencido: a data de hoje é calculada no fuso `America/Fortaleza`. Lote com `data_validade >= hoje` ainda é válido (RF12, RN12).
4. Desempate do FEFO: `ORDER BY data_validade, data_entrada, id_lote` (RN13).
5. Tabelas e campos além das sete do documento: `historico_status_pedido` (RF13); `clientes.ativo` e `produtos.ativo` (RN24); `pedidos.motivo_cancelamento` e `pedidos.data_cancelamento` já criados para a entrega final; `logs_auditoria.valor_anterior` e `valor_novo` em `jsonb`. `tokens_redefinicao_senha` fica para a entrega final.
6. Restrições no banco: `UNIQUE (id_produto, codigo_lote)`, `CHECK (quantidade_disponivel >= 0)`, `CHECK (data_validade > data_entrada)`, `UNIQUE` em `usuarios.email` e `clientes.cnpj`, `CHECK` em `perfil` e `status`, índices nas chaves estrangeiras e em `lotes(id_produto, data_validade)`.
7. "Próximo do vencimento" (RN21): variável de ambiente `DIAS_ALERTA_VENCIMENTO=30`, sem tela de configuração.
8. Valor em estoque (RN27): `quantidade_disponivel × produtos.preco_unitario` (lote não tem preço).
9. `PATCH /api/pedidos/:id/status`: Operador e Administrador. Só avança para o próximo status; retroceder é exclusivo do Administrador e vai para a auditoria (RN16).
10. Clientes: Vendedor e Administrador. Produtos: escrita só Administrador, leitura todos. Lotes: Operador e Administrador.
11. Pedidos: Vendedor vê só os que emitiu; Operador e Administrador veem todos (RN25).
12. Toda escrita relevante grava em `logs_auditoria` dentro da mesma transação da operação.

## Contrato da API

- Prefixo `/api`, sempre JSON.
- Erro: `{ "erro": "mensagem" }` com 400 (validação), 401 (sem token ou token inválido), 403 (perfil sem permissão), 404, 409 (conflito: CNPJ ou e-mail duplicado, saldo insuficiente, transição de status inválida), 500 (sem expor detalhes internos).
- Listagens: `?pagina=1&limite=20&busca=texto` + filtros específicos; resposta `{ dados, total, pagina, limite }`.
- Datas em ISO na API; formatação dd/mm/aaaa e R$ só no front.
- Eventos Socket.IO: `pedido:criado`, `pedido:status`, `estoque:atualizado`. O cliente só conecta enviando o JWT no handshake.

## Segurança

- JWT expira em 8 horas; payload só com `id` e `perfil`.
- Segredos e URL do banco no `.env` (no `.gitignore`); `.env.example` só com os nomes das variáveis.
- `senha_hash` nunca sai em resposta da API.
- CORS liberado só para a origem do front.
- Usuário inativo não autentica.

## Dados de demonstração (seed)

Usuários (senha `foodflow123`): `admin@foodflow.com`, `vendedor@foodflow.com`, `vendedor2@foodflow.com`, `operador@foodflow.com`.

O seed precisa permitir reproduzir os cenários de aceitação: um produto com lote L1 (validade 10/12/2026, 30 unidades) e L2 (validade 20/01/2027, 50 unidades); um produto com um lote vencido e outro vigente; um produto abaixo do estoque mínimo; alguns clientes com CNPJ válido; alguns pedidos em status diferentes para o painel.
