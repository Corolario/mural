# Mural de Recados

Aplicação full-stack de mural de recados (sticky notes) com cards arrastáveis, redimensionáveis e com cores que desbotam com o tempo.

## Funcionalidades

- **Autenticação JWT** — Registro e login com tokens seguros (PyJWT + bcrypt)
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

### 4. Acessar a aplicação

Abra `http://localhost:3000` no navegador.

### 5. Comandos úteis

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

## Deploy em produção

Para ambiente de produção, ajuste:

1. **JWT_SECRET** — Use uma chave de pelo menos 64 caracteres gerada aleatoriamente
2. **CORS_ORIGINS** — Altere para o domínio real (ex: `https://mural.seudominio.com`)
3. **HTTPS** — Configure um reverse proxy (Traefik, Caddy ou nginx externo) com certificado SSL
4. **Backup** — O banco SQLite fica em `./data/mural.db`. Faça backup periódico deste arquivo

## API Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| GET | `/api/notes` | Listar recados |
| POST | `/api/notes` | Criar recado |
| PUT | `/api/notes/:id` | Editar recado |
| PATCH | `/api/notes/:id/position` | Atualizar posição/tamanho |
| DELETE | `/api/notes/:id` | Excluir recado |
| GET | `/api/health` | Health check |

## Algoritmo de Desvanecimento de Cor

As cores dos cards são calculadas em HSL com base na idade do recado:

```
Dia 0: hsl(hue, 100%, 50%)  → cor vibrante
Dia 4: hsl(hue, 60%, 65%)   → cor intermediária
Dia 8: hsl(hue, 20%, 80%)   → cor pálida (tom mais fraco)
```

A saturação vai de 100% a 20% e a luminosidade de 50% a 80% ao longo de 8 dias.
