#!/usr/bin/env python3
"""シンプルなToDoリストCLIアプリ"""

import json
import sys
from pathlib import Path

DATA_FILE = Path.home() / ".todo_list.json"


def load_todos():
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text())
    return []


def save_todos(todos):
    DATA_FILE.write_text(json.dumps(todos, ensure_ascii=False, indent=2))


def add(title):
    todos = load_todos()
    todos.append({"id": len(todos) + 1, "title": title, "done": False})
    save_todos(todos)
    print(f"追加しました: {title}")


def list_todos():
    todos = load_todos()
    if not todos:
        print("ToDoはありません。")
        return
    for t in todos:
        mark = "✓" if t["done"] else "○"
        print(f"  [{mark}] {t['id']}. {t['title']}")


def done(todo_id):
    todos = load_todos()
    for t in todos:
        if t["id"] == todo_id:
            t["done"] = True
            save_todos(todos)
            print(f"完了しました: {t['title']}")
            return
    print(f"ID {todo_id} が見つかりません。")


def delete(todo_id):
    todos = load_todos()
    new_todos = [t for t in todos if t["id"] != todo_id]
    if len(new_todos) == len(todos):
        print(f"ID {todo_id} が見つかりません。")
        return
    save_todos(new_todos)
    print(f"ID {todo_id} を削除しました。")


USAGE = """使い方:
  python todo.py add <タスク名>    タスクを追加
  python todo.py list              一覧表示
  python todo.py done <ID>         完了にする
  python todo.py delete <ID>       削除する
"""


def main():
    args = sys.argv[1:]
    if not args:
        print(USAGE)
        return

    cmd = args[0]
    if cmd == "add" and len(args) >= 2:
        add(" ".join(args[1:]))
    elif cmd == "list":
        list_todos()
    elif cmd == "done" and len(args) == 2:
        done(int(args[1]))
    elif cmd == "delete" and len(args) == 2:
        delete(int(args[1]))
    else:
        print(USAGE)


if __name__ == "__main__":
    main()
