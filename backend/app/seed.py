from datetime import date, timedelta
from .database import get_conn, init_db


def seed():
    init_db()
    conn = get_conn()
    if conn.execute("SELECT COUNT(*) FROM fornecedores").fetchone()[0] > 0:
        conn.close()
        return

    hoje = date.today()
    d = lambda dias: (hoje + timedelta(days=dias)).isoformat()

    conn.execute("INSERT INTO fornecedores (nome, site, email_contato) VALUES ('IBM', 'https://www.ibm.com', 'suporte@ibm.com')")
    conn.execute("INSERT INTO fornecedores (nome, site, email_contato) VALUES ('Microsoft', 'https://www.microsoft.com', 'suporte@microsoft.com')")
    conn.execute("INSERT INTO fornecedores (nome, site, email_contato) VALUES ('Red Hat', 'https://www.redhat.com', 'suporte@redhat.com')")

    softwares = [
        ("IBM Db2", 1, "Banco de dados", "11.1", "12.1"),
        ("IBM WebSphere", 1, "Middleware", "9.0.5", "9.0.5"),
        ("IBM Cognos Analytics", 1, "BI", "11.1.7", "12.0"),
        ("IBM SPSS Statistics", 1, "Analytics", "28.0", "30.0"),
        ("IBM Maximo", 1, "Gestão de ativos", "7.6", "9.0"),
        ("Windows Server", 2, "Sistema operacional", "2019", "2022"),
        ("Red Hat Enterprise Linux", 3, "Sistema operacional", "9.4", "9.4"),
    ]
    conn.executemany(
        "INSERT INTO softwares (nome, fornecedor_id, categoria, versao_instalada, versao_recomendada) VALUES (?,?,?,?,?)",
        softwares,
    )

    licencas = [
        (1, "Assinatura", 10, 45000, d(-300), d(20)),
        (2, "Por usuário", 50, 30000, d(-100), d(265)),
        (3, "Assinatura", 25, 28000, d(-340), d(-5)),
        (4, "Perpétua", 5, 12000, d(-700), d(10)),
        (5, "Assinatura", 15, 60000, d(-200), d(165)),
        (6, "Por núcleo", 8, 22000, d(-50), d(315)),
        (7, "Assinatura", 20, 18000, d(-10), d(355)),
    ]
    conn.executemany(
        "INSERT INTO licencas (software_id, tipo, quantidade, custo_anual, data_inicio, data_vencimento) VALUES (?,?,?,?,?,?)",
        licencas,
    )
    conn.commit()
    conn.close()