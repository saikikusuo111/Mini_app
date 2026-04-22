from pathlib import Path
import sqlite3


def run():
    project_root = Path(__file__).resolve().parents[2]
    db_dir = project_root / 'db'
    db_dir.mkdir(parents=True, exist_ok=True)

    db_path = db_dir / 'vesy.sqlite3'
    migration_path = db_dir / 'migrations' / '001_init.sql'

    sql = migration_path.read_text(encoding='utf-8')

    conn = sqlite3.connect(str(db_path))
    try:
        conn.executescript(sql)
        conn.commit()
    finally:
        conn.close()

    print(f'Initialized SQLite DB at: {db_path}')


if __name__ == '__main__':
    run()
