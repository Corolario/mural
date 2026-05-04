#!/usr/bin/env python3
"""
Gerenciamento de usuários do Mural de Recados.

Uso:
  python manage_users.py create <username> <password>
  python manage_users.py list
  python manage_users.py passwd <username> <new_password>
  python manage_users.py delete <username>

Via Docker:
  docker compose exec backend python manage_users.py create admin minhasenha
  docker compose exec backend python manage_users.py list
  docker compose exec backend python manage_users.py passwd admin novasenha
  docker compose exec backend python manage_users.py delete admin
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, Base, engine
from app.models import User
from app.auth import hash_password

Base.metadata.create_all(bind=engine)


def create_user(username: str, password: str):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            print(f"Erro: usuário '{username}' já existe.")
            sys.exit(1)
        user = User(username=username, hashed_password=hash_password(password))
        db.add(user)
        db.commit()
        print(f"Usuário '{username}' criado com sucesso.")
    finally:
        db.close()


def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.id).all()
        if not users:
            print("Nenhum usuário cadastrado.")
            return
        print(f"{'ID':<6} {'Usuário':<20} {'Criado em'}")
        print("-" * 50)
        for u in users:
            created = u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "-"
            print(f"{u.id:<6} {u.username:<20} {created}")
    finally:
        db.close()


def change_password(username: str, new_password: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"Erro: usuário '{username}' não encontrado.")
            sys.exit(1)
        user.hashed_password = hash_password(new_password)
        db.commit()
        print(f"Senha do usuário '{username}' atualizada.")
    finally:
        db.close()


def delete_user(username: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"Erro: usuário '{username}' não encontrado.")
            sys.exit(1)
        db.delete(user)
        db.commit()
        print(f"Usuário '{username}' removido (e todos os seus recados).")
    finally:
        db.close()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    if command == "create":
        if len(sys.argv) != 4:
            print("Uso: python manage_users.py create <username> <password>")
            sys.exit(1)
        create_user(sys.argv[2], sys.argv[3])

    elif command == "list":
        list_users()

    elif command == "passwd":
        if len(sys.argv) != 4:
            print("Uso: python manage_users.py passwd <username> <new_password>")
            sys.exit(1)
        change_password(sys.argv[2], sys.argv[3])

    elif command == "delete":
        if len(sys.argv) != 3:
            print("Uso: python manage_users.py delete <username>")
            sys.exit(1)
        delete_user(sys.argv[2])

    else:
        print(f"Comando desconhecido: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
