import sqlite3
from fastapi import APIRouter, HTTPException
from ..database import get_conn
from ..schemas import FornecedorIn

router = APIRouter(prefix="/fornecedores", tags=["Fornecedores"])


@router.get("")
def listar():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM fornecedores ORDER BY nome").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("", status_code=201)
def criar(f: FornecedorIn):
    conn = get_conn()
    try:
        cur = conn.execute(
            "INSERT INTO fornecedores (nome, site, email_contato) VALUES (?,?,?)",
            (f.nome, f.site, f.email_contato),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(409, "Fornecedor já cadastrado")
    finally:
        conn.close()
    return {"id": cur.lastrowid, **f.model_dump()}


@router.put("/{id}")
def atualizar(id: int, f: FornecedorIn):
    conn = get_conn()
    cur = conn.execute(
        "UPDATE fornecedores SET nome=?, site=?, email_contato=? WHERE id=?",
        (f.nome, f.site, f.email_contato, id),
    )
    conn.commit()
    conn.close()
    if cur.rowcount == 0:
        raise HTTPException(404, "Fornecedor não encontrado")
    return {"id": id, **f.model_dump()}


@router.delete("/{id}", status_code=204)
def remover(id: int):
    conn = get_conn()
    try:
        cur = conn.execute("DELETE FROM fornecedores WHERE id=?", (id,))
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(409, "Fornecedor possui softwares vinculados")
    finally:
        conn.close()
    if cur.rowcount == 0:
        raise HTTPException(404, "Fornecedor não encontrado")