#!/bin/bash
# =============================================================================
# Script de atualização/deploy de aplicação Docker a partir do ZIP remoto.
# Uso: ./deploy.sh <url-do-zip>
#
# Antes de usar em um novo projeto, ajuste as variáveis ENV_FILE e DB_FILE
# abaixo conforme o repositório-alvo.
# Este script deve ser colocado em um diretório acima do diretório do projeto.
# =============================================================================

# --- Configuração do projeto (alterar conforme o repositório) ---
# Caminho do arquivo .env de origem (relativo ao diretório onde o script roda).
# Será copiado para "<repo>/.env" durante o deploy.
ENV_FILE=".env.example"

# Caminho do banco de dados relativo à raiz do repositório.
# Ex: "data/vacation_manager.db", "db/app.sqlite", "storage/database.db".
DB_FILE="data/mural.db"

sudo -v

# --- Configurações de execução segura ---
set -euo pipefail
trap 'echo "Erro na linha $LINENO"; exit 1' ERR

# --- Validação de argumento ---
if [ -z "${1:-}" ]; then
    echo "Uso: $0 <url>"
    exit 1
fi

# --- Variáveis derivadas ---
url="$1"
# Extrai o nome do arquivo ZIP a partir da URL (tudo após a última barra)
zipfile=$(echo "$url" | sed 's#.*/##')
# Extrai o nome do repositório (5º campo da URL, separado por '/')
repo=$(echo "$url" | cut -d'/' -f5)

# Quebra o caminho do DB em diretório e nome de arquivo
db_basename=$(basename "$DB_FILE")
db_dir=$(dirname "$DB_FILE")

# --- Download ---
wget "$url"

# --- Extração ---
# Identifica o nome do diretório raiz dentro do ZIP.
# A listagem é capturada em duas etapas para evitar SIGPIPE no 'unzip',
# que com 'set -o pipefail' faria o script abortar.
zip_entries=$(unzip -Z1 "$zipfile")
dirname=$(printf '%s\n' "$zip_entries" | head -n1 | cut -d/ -f1)
# Descompacta o ZIP e remove o arquivo após a extração
unzip -o "$zipfile"
rm "$zipfile"

# --- Parada dos containers atuais ---
# Para os containers existentes (ignora erro caso não estejam rodando)
docker compose -f "$repo/compose.yml" down || true

# --- Backup do banco de dados ---
# Copia o banco para o diretório atual antes de remover o projeto antigo
# (ignora erro caso o banco ainda não exista, ex: primeira execução)
cp "$repo/$DB_FILE" "./$db_basename" || true

# --- Backup do .env ---
# Faz backup do .env atual como "env.<repo>" (ignora erro na primeira execução,
# quando o .env ainda não existe)
cp "$repo/.env" "./env.$repo" || true

# --- Substituição do código ---
# Remove o diretório antigo do projeto
sudo rm -rf "$repo"
# Renomeia o diretório extraído do ZIP para o nome do repositório
mv "$dirname" "$repo"

# --- Restauração do banco de dados ---
# Recria a pasta de dados e restaura o banco (ignora erro se não existir backup)
mkdir -p "$repo/$db_dir"
cp "./$db_basename" "$repo/$DB_FILE" || true
rm  "./$db_basename" || true

# --- Restauração do .env ---
# Se existir backup do deploy anterior, restaura ele.
# Caso contrário (primeira execução), usa o ENV_FILE como base inicial.
if [ -f "./env.$repo" ]; then
    cp "./env.$repo" "$repo/.env"
else
    cp "$ENV_FILE" "$repo/.env"
fi

# --- Rebuild ---
# Reconstrói as imagens Docker sem cache (garante versão limpa)
docker compose -f "$repo/compose.yml" build --no-cache
# Inicia os containers em modo detached (background)
docker compose -f "$repo/compose.yml" up -d

# --- Limpeza ---
# Remove imagens, containers e volumes não utilizados para liberar espaço
docker system prune -f
