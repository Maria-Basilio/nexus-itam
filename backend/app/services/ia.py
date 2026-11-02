import json
import requests
from ..database import get_conn
from ..routers.softwares import esta_desatualizado

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:latest"


def coletar_dados():
    conn = get_conn()
    rows = conn.execute("""
        SELECT s.nome, f.nome AS fornecedor, s.versao_instalada, s.versao_recomendada,
               l.tipo, l.quantidade, l.custo_anual, l.data_vencimento,
               CAST(julianday(l.data_vencimento) - julianday('now') AS INTEGER) AS dias_restantes
        FROM softwares s
        JOIN fornecedores f ON f.id = s.fornecedor_id
        LEFT JOIN licencas l ON l.software_id = s.id
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def recomendacoes_por_regras(dados):
    recs = []

    for d in dados:
        pontos = 0
        motivos = []

        if esta_desatualizado(d["versao_instalada"], d["versao_recomendada"]):
            pontos += 2
            motivos.append(f"versão {d['versao_instalada']} desatualizada (recomendada: {d['versao_recomendada']})")

        dias = d["dias_restantes"]
        if dias is not None:
            if dias < 0:
                pontos += 5
                motivos.append(f"licença vencida há {abs(dias)} dias")
            elif dias <= 30:
                pontos += 3
                motivos.append(f"licença vence em {dias} dias")

        if not motivos:
            continue

        prioridade = "alta" if pontos >= 5 else "media" if pontos >= 3 else "baixa"
        recs.append({
            "prioridade": prioridade,
            "pontos": pontos,
            "software": d["nome"],
            "recomendacao": "Atenção: " + "; ".join(motivos) + ".",
        })

    custo_por_forn = {}
    for d in dados:
        if d["custo_anual"] is not None:
            custo_por_forn[d["fornecedor"]] = custo_por_forn.get(d["fornecedor"], 0) + d["custo_anual"]
    total = sum(custo_por_forn.values())
    for forn, custo in custo_por_forn.items():
        if total and custo / total > 0.6:
            recs.append({
                "prioridade": "baixa",
                "pontos": 1,
                "software": forn,
                "recomendacao": f"{forn} concentra {custo / total:.0%} do custo anual. Avalie negociar contrato corporativo ou alternativas.",
            })

    recs.sort(key=lambda r: r["pontos"], reverse=True)
    return recs


def recomendacoes_com_ia(dados, regras):
    """Pede ao Ollama um resumo executivo com base nos achados das regras."""
    prompt = f"""Você é um analista de gestão de ativos de software (ITAM).
Abaixo estão os achados de uma análise automática. Escreva de 3 a 5 recomendações
práticas e priorizadas em português, sem inventar dados que não estejam nos achados.

Responda APENAS com JSON neste formato:
{{"recomendacoes": [{{"prioridade": "alta|media|baixa", "software": "nome", "recomendacao": "texto curto e acionável"}}]}}

Achados:
{json.dumps(regras, ensure_ascii=False)}"""

    resp = requests.post(
        OLLAMA_URL,
        json={"model": OLLAMA_MODEL, "prompt": prompt, "format": "json", "stream": False},
        timeout=300,
    )
    resp.raise_for_status()
    return json.loads(resp.json()["response"])["recomendacoes"]


def gerar_recomendacoes():
    dados = coletar_dados()
    regras = recomendacoes_por_regras(dados)
    try:
        ia = recomendacoes_com_ia(dados, regras)
    except Exception as e:
        print("Falha na IA local:", e)
        ia = None
    return {
        "fonte": "ia_local" if ia else "regras",
        "recomendacoes": ia or regras,
    }