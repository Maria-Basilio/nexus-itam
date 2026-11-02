
import sqlite3
from typing import Optional

from fastapi import APIRouter, HTTPException

from ..database import get_conn
from ..schemas import LicencaIn


router = APIRouter(prefix="/licencas", tags=["Licenças"])

# LISTAR LICENÇAS

@router.get("")
def listar(status: Optional[str] = None):
    """
    Status possíveis:
    vencida | vencendo | ativa
    """

    sql = """
        SELECT
            l.*,
            s.nome AS software,
            f.nome AS fornecedor,
            CAST(
                julianday(l.data_vencimento) - julianday('now')
                AS INTEGER
            ) AS dias_restantes
        FROM licencas l
        JOIN softwares s ON s.id = l.software_id
        JOIN fornecedores f ON f.id = s.fornecedor_id
        ORDER BY l.data_vencimento
    """

    conn = get_conn()

    try:
        rows = [
            dict(row)
            for row in conn.execute(sql).fetchall()
        ]

    finally:
        conn.close()

    # Classifica automaticamente o vencimento.
    for item in rows:
        dias = item["dias_restantes"]

        if dias < 0:
            item["status"] = "vencida"
        elif dias <= 30:
            item["status"] = "vencendo"
        else:
            item["status"] = "ativa"

    # Filtro opcional por status.
    if status:
        rows = [
            item for item in rows
            if item["status"] == status
        ]

    return rows


# CADASTRAR LICENÇA

@router.post("", status_code=201)
def criar(licenca: LicencaIn):

    conn = get_conn()

    try:
        cur = conn.execute(
            """
            INSERT INTO licencas (
                software_id,
                tipo,
                quantidade,
                custo_anual,
                data_inicio,
                data_vencimento
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                licenca.software_id,
                licenca.tipo,
                licenca.quantidade,
                licenca.custo_anual,
                licenca.data_inicio,
                licenca.data_vencimento
            )
        )

        conn.commit()

        return {
            "id": cur.lastrowid,
            **licenca.model_dump()
        }

    except sqlite3.IntegrityError:
        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail="Software informado não existe."
        )

    finally:
        conn.close()


# EDITAR LICENÇA

@router.put("/{licenca_id}")
def atualizar(licenca_id: int, licenca: LicencaIn):

    conn = get_conn()

    try:
        # Verifica se a licença existe.
        existente = conn.execute(
            "SELECT id FROM licencas WHERE id = ?",
            (licenca_id,)
        ).fetchone()

        if not existente:
            raise HTTPException(
                status_code=404,
                detail="Licença não encontrada."
            )

        # Atualiza os dados da licença.
        conn.execute(
            """
            UPDATE licencas
            SET
                software_id = ?,
                tipo = ?,
                quantidade = ?,
                custo_anual = ?,
                data_inicio = ?,
                data_vencimento = ?
            WHERE id = ?
            """,
            (
                licenca.software_id,
                licenca.tipo,
                licenca.quantidade,
                licenca.custo_anual,
                licenca.data_inicio,
                licenca.data_vencimento,
                licenca_id
            )
        )

        conn.commit()

        return {
            "mensagem": "Licença atualizada com sucesso!",
            "id": licenca_id,
            **licenca.model_dump()
        }

    except sqlite3.IntegrityError:
        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail="Software informado não existe."
        )

    finally:
        conn.close()


# EXCLUIR LICENÇA

@router.delete("/{licenca_id}")
def excluir(licenca_id: int):

    conn = get_conn()

    try:
        cur = conn.execute(
            "DELETE FROM licencas WHERE id = ?",
            (licenca_id,)
        )

        if cur.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Licença não encontrada."
            )

        conn.commit()

        return {
            "mensagem": "Licença excluída com sucesso!",
            "id": licenca_id
        }

    finally:
        conn.close()