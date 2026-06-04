import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'qi_copilot.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS saved_projects (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL UNIQUE,
            platform    TEXT    NOT NULL,
            org_url     TEXT    DEFAULT '',
            project     TEXT    DEFAULT '',
            username    TEXT    DEFAULT '',
            pat         TEXT    NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


init_db()
