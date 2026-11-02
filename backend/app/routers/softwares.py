
import sqlite3
from typing import Optional

from fastapi import APIRouter, HTTPException
from packaging.version import Version, InvalidVersion

from ..database import get_conn
from ..schemas import SoftwareIn


router = APIRouter(prefix="/softwares", tags=["Softwares"])


def classificar_atualizacao(instalada: Optional[str], recomendada: Optional[str]) -> str:
    """
    Classifica a situação da versão instalada do software.

    Possíveis resultados:
    - atualizado
    - desatualizado
    - verificacao_necessaria
    - sem_versao_recomendada
    """

    if not recomendada or not recomendada.strip():
        return "sem_versao_recomendada"

    if not instalada or not instalada.strip():
        return "verificacao_necessaria"

    try:
        versao_instalada = Version(instalada.strip())
        versao_recomendada = Version(recomendada.strip())

        if versao_instalada < versao_recomendada:
            return "desatualizado"

        if versao_instalada == versao_recomendada:
            return "atualizado"

        # A versão instalada é superior à recomendada.
        # É necessário conferir se a recomendação ainda é válida.
        return "verificacao_necessaria"

    except InvalidVersion:
        return "verificacao_necessaria"


def esta_desatualizado(instalada: Optional[str], recomendada: Optional[str]) -> bool:
    """
    Mantém compatibilidade com filtros e partes do sistema
    que utilizam o campo booleano desatualizado.
    """
    return classificar_atualizacao(instalada, recomendada) == "desatualizado"


@router.get("")
def listar(
    fornecedor_id: Optional[int] = None,
    categoria: Optional[str] = None,
    busca: Optional[str] = None,
    desatualizado: Optional[bool] = None,
):
    sql = """
        SELECT s.*, f.nome AS fornecedor
        FROM softwares s
        JOIN fornecedores f ON f.id = s.fornecedor_id
        WHERE 1=1
    """

    params = []

    if fornecedor_id:
        sql += " AND s.fornecedor_id = ?"
        params.append(fornecedor_id)

    if categoria:
        sql += " AND s.categoria = ?"
        params.append(categoria)

    if busca:
        sql += " AND s.nome LIKE ?"
        params.append(f"%{busca}%")

    sql += " ORDER BY s.nome"

    conn = get_conn()

    try:
        rows = [
            dict(row)
            for row in conn.execute(sql, params).fetchall()
        ]
    finally:
        conn.close()

    for software in rows:
        status = classificar_atualizacao(
            software.get("versao_instalada"),
            software.get("versao_recomendada"),
        )

        software["status_atualizacao"] = status
        software["desatualizado"] = status == "desatualizado"

    if desatualizado is not None:
        rows = [
            software
            for software in rows
            if software["desatualizado"] == desatualizado
        ]

    return rows


@router.post("", status_code=201)
def criar(s: SoftwareIn):
    conn = get_conn()

    try:
        cur = conn.execute(
            """
            INSERT INTO softwares (
                nome,
                fornecedor_id,
                categoria,
                versao_instalada,
                versao_recomendada
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                s.nome,
                s.fornecedor_id,
                s.categoria,
                s.versao_instalada,
                s.versao_recomendada,
            ),
        )

        conn.commit()

        return {
            "id": cur.lastrowid,
            **s.model_dump(),
        }

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Fornecedor inexistente",
        )

    finally:
        conn.close()


@router.put("/{id}")
def atualizar(id: int, s: SoftwareIn):
    conn = get_conn()

    try:
        cur = conn.execute(
            """
            UPDATE softwares
            SET nome = ?,
                fornecedor_id = ?,
                categoria = ?,
                versao_instalada = ?,
                versao_recomendada = ?
            WHERE id = ?
            """,
            (
                s.nome,
                s.fornecedor_id,
                s.categoria,
                s.versao_instalada,
                s.versao_recomendada,
                id,
            ),
        )

        conn.commit()

        if cur.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Software não encontrado",
            )

        return {
            "id": id,
            **s.model_dump(),
        }

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Fornecedor inexistente",
        )

    finally:
        conn.close()


@router.delete("/{id}", status_code=204)
def remover(id: int):
    conn = get_conn()

    try:
        cur = conn.execute(
            "DELETE FROM softwares WHERE id = ?",
            (id,),
        )

        conn.commit()

        if cur.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Software não encontrado",
            )

    finally:
        conn.close()