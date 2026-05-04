# Mural de Recados

Aplicação full-stack de mural de recados (sticky notes) com cards arrastáveis, redimensionáveis e com cores que desbotam com o tempo.

## Funcionalidades

- **Autenticação JWT** — Login com tokens seguros (PyJWT + bcrypt). Usuários gerenciados via CLI
- **CRUD de recados** — Criar, editar e excluir recados com título, conteúdo e cor
- **Drag & drop** — Cards arrastáveis e redimensionáveis com React Grid Layout
- **Posições persistentes** — Posição e tamanho dos cards salvos no banco de dados
- **Cores que desbotam** — Cards recentes têm cores vibrantes; a cada dia a cor desvanece, atingindo o tom mais fraco após 8 dias
- **5 cores disponíveis** — Amarelo, rosa, azul, verde e roxo

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, Vite 6, react-grid-layout, axios |
| Backend | FastAPI 0.115, SQLAlchemy 2.0, Pydantic v2 |
| Banco de dados | SQLite (WAL mode) |
| Autenticação | PyJWT 2.10, bcrypt 4.3 |
| Infraestrutura | Docker Compose, nginx 1.27 |

## Estrutura do Projeto

```
mural/
├── compose.yml              # Orquestração dos containers
├── .env.example             # Variáveis de ambiente (modelo)
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py          # App FastAPI + CORS + startup
│       ├── database.py      # SQLAlchemy engine + session
│       ├── models.py        # Modelos User e Note
│       ├── schemas.py       # Schemas Pydantic (validação)
│       ├── auth.py          # JWT + hash de senha
│       └── routes/
│           ├── auth.py      # POST /api/auth/register, /api/auth/login
│           └── notes.py     # CRUD + PATCH posição
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.jsx          # Roteamento (login/registro/board)
        ├── api.js           # Axios com interceptor JWT
        └── components/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── Board.jsx    # Grid layout com drag/resize
            ├── NoteCard.jsx # Card com cor que desvanece
            └── NoteModal.jsx
```

## Deploy com Docker Compose

### 1. Clonar o repositório

```bash
git clone https://github.com/corolario/mural.git
cd mural
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e defina um `JWT_SECRET` seguro:

```bash
# Gerar uma chave segura
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Cole o valor gerado no `.env`:

```env
JWT_SECRET=<cole_a_chave_gerada_aqui>
JWT_EXPIRATION_HOURS=1
DATABASE_URL=sqlite:///./data/mural.db
CORS_ORIGINS=http://localhost:3000
```

### 3. Subir os containers

```bash
docker compose up --build -d
```

Isso irá:
- Construir a imagem do backend (Python 3.13)
- Construir a imagem do frontend (Node 22 → nginx 1.27)
- Criar o banco SQLite automaticamente no primeiro acesso
- Expor o frontend em `http://localhost:3000`
- Expor a API em `http://localhost:8000`

### 4. Criar o primeiro usuário

O registro pela web está desabilitado. Os usuários são gerenciados via CLI dentro do container backend:

```bash
docker compose exec backend python manage_users.py create admin minhasenha
```

### 5. Acessar a aplicação

Abra `http://localhost:3000` no navegador e faça login com o usuário criado.

### 6. Comandos úteis

```bash
# Ver logs dos containers
docker compose logs -f

# Parar os containers
docker compose down

# Reconstruir após alterações
docker compose up --build -d

# Ver status dos containers
docker compose ps
```

## Gerenciamento de Usuários

O registro pela interface web foi removido. Todos os usuários são gerenciados via script CLI executado dentro do container backend.

### Criar usuário

```bash
docker compose exec backend python manage_users.py create <usuario> <senha>
```

Exemplo:
```bash
docker compose exec backend python manage_users.py create joao senha123
```

### Listar usuários

```bash
docker compose exec backend python manage_users.py list
```

Saída:
```
ID     Usuário              Criado em
--------------------------------------------------
1      admin                2026-04-29 10:15
2      joao                 2026-04-29 11:30
```

### Alterar senha

```bash
docker compose exec backend python manage_users.py passwd <usuario> <nova_senha>
```

### Remover usuário

Remove o usuário e **todos os recados** associados (via cascade no banco):

```bash
docker compose exec backend python manage_users.py delete <usuario>
```

## Deploy em produção

Para ambiente de produção, ajuste:

1. **JWT_SECRET** — Use uma chave de pelo menos 64 caracteres gerada aleatoriamente
2. **CORS_ORIGINS** — Altere para o domínio real (ex: `https://mural.seudominio.com`)
3. **HTTPS** — Configure um reverse proxy (Traefik, Caddy ou nginx externo) com certificado SSL
4. **Backup** — O banco SQLite fica em `./data/mural.db`. Faça backup periódico deste arquivo

## API Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/notes` | Listar recados |
| POST | `/api/notes` | Criar recado |
| PUT | `/api/notes/:id` | Editar recado |
| PATCH | `/api/notes/:id/position` | Atualizar posição/tamanho |
| DELETE | `/api/notes/:id` | Excluir recado |
| GET | `/api/health` | Health check |

> O endpoint de registro foi removido. Use `manage_users.py` para criar usuários.

## Algoritmo de Desvanecimento de Cor

As cores dos cards são calculadas em HSL com base na idade do recado:

```
Dia 0: hsl(hue, 100%, 50%)  → cor vibrante
Dia 4: hsl(hue, 60%, 65%)   → cor intermediária
Dia 8: hsl(hue, 20%, 80%)   → cor pálida (tom mais fraco)
```

A saturação vai de 100% a 20% e a luminosidade de 50% a 80% ao longo de 8 dias.
