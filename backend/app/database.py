import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "gestao.db"


def get_conn(): # abre conexão com o banco de dados SQLite e retorna o objeto de conexão
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row # permite acessar os resultados das consultas como dicionários, facilitando a manipulação dos dados
    conn.execute("PRAGMA foreign_keys = ON") 
    return conn


def init_db(): # le o arquivo schema.sql e executa os comandos SQL para criar as tabelas no banco de dados, caso elas ainda não existam
    schema = (BASE_DIR / "schema.sql").read_text()
    conn = get_conn()
    conn.executescript(schema)
    conn.commit()
    conn.close()