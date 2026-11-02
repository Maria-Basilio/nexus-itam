
from fastapi import APIRouter
from ..database import get_conn
from ..services.ia import gerar_recomendacoes

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def indicadores():
    conn = get_conn()

    try:
        q = lambda sql: conn.execute(sql).fetchone()[0]

        dados = {
            # Indicadores gerais
            "total_softwares": q(
                "SELECT COUNT(*) FROM softwares"
            ),
            "total_fornecedores": q(
                "SELECT COUNT(*) FROM fornecedores"
            ),

            # Indicadores de licenças
            "total_licencas": q(
                "SELECT COUNT(*) FROM licencas"
            ),
            "total_licencas_contratadas": q(
                "SELECT COALESCE(SUM(quantidade), 0) FROM licencas"
            ),
            "licencas_ativas": q(
                "SELECT COUNT(*) FROM licencas "
                "WHERE data_vencimento >= date('now')"
            ),
            "licencas_vencidas": q(
                "SELECT COUNT(*) FROM licencas "
                "WHERE data_vencimento < date('now')"
            ),
            "licencas_vencendo_30d": q(
                "SELECT COUNT(*) FROM licencas "
                "WHERE data_vencimento BETWEEN date('now') "
                "AND date('now', '+30 days')"
            ),
            "licencas_vencendo_7d": q(
                "SELECT COUNT(*) FROM licencas "
                "WHERE data_vencimento BETWEEN date('now') "
                "AND date('now', '+7 days')"
            ),

            # Indicadores financeiros
            "custo_anual_total": q(
                "SELECT COALESCE(SUM(custo_anual), 0) FROM licencas"
            ),

            # Softwares desatualizados
            "desatualizados": q(
                "SELECT COUNT(*) FROM softwares "
                "WHERE versao_instalada <> versao_recomendada"
            ),
        }

        # Softwares cadastrados por fornecedor
        por_fornecedor = conn.execute("""
            SELECT
                f.nome,
                COUNT(s.id) AS total
            FROM fornecedores f
            LEFT JOIN softwares s ON s.fornecedor_id = f.id
            GROUP BY f.id
            ORDER BY total DESC
        """).fetchall()

        dados["softwares_por_fornecedor"] = [
            dict(r) for r in por_fornecedor
        ]

        # Custo anual por fornecedor
        custo_forn = conn.execute("""
            SELECT
                f.nome,
                COALESCE(SUM(l.custo_anual), 0) AS custo
            FROM fornecedores f
            LEFT JOIN softwares s ON s.fornecedor_id = f.id
            LEFT JOIN licencas l ON l.software_id = s.id
            GROUP BY f.id
            ORDER BY custo DESC
        """).fetchall()

        dados["custo_por_fornecedor"] = [
            dict(r) for r in custo_forn
        ]

        # Custo anual por software
        custo_software = conn.execute("""
            SELECT
                s.id,
                s.nome,
                f.nome AS fornecedor,
                COALESCE(SUM(l.custo_anual), 0) AS custo_anual,
                COALESCE(SUM(l.quantidade), 0) AS quantidade_licencas
            FROM softwares s
            LEFT JOIN fornecedores f ON f.id = s.fornecedor_id
            LEFT JOIN licencas l ON l.software_id = s.id
            GROUP BY s.id
            ORDER BY custo_anual DESC
        """).fetchall()

        dados["custo_por_software"] = [
            dict(r) for r in custo_software
        ]

        return dados

    finally:
        conn.close()


@router.get("/alertas")
def alertas():
    """Retorna licenças vencidas ou vencendo em até 30 dias."""

    conn = get_conn()

    try:
        rows = conn.execute("""
            SELECT
                l.id,
                s.nome AS software,
                l.data_vencimento,
                CAST(
                    julianday(l.data_vencimento) - julianday('now')
                    AS INTEGER
                ) AS dias_restantes
            FROM licencas l
            JOIN softwares s ON s.id = l.software_id
            WHERE l.data_vencimento <= date('now', '+30 days')
            ORDER BY l.data_vencimento
        """).fetchall()

        return [
            {
                **dict(r),
                "nivel": (
                    "critico"
                    if r["dias_restantes"] < 0
                    else "atencao"
                )
            }
            for r in rows
        ]

    finally:
        conn.close()


@router.get("/recomendacoes")
def recomendacoes():
    return gerar_recomendacoes()