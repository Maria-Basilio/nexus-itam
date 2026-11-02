CREATE TABLE IF NOT EXISTS fornecedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- id é gerado automaticamente e é único para cada fornecedor
    nome TEXT NOT NULL UNIQUE, -- not null garante que o nome do fornecedor seja obrigatório e unique garante que não haja fornecedores com o mesmo nome
    site TEXT,
    email_contato TEXT
);

CREATE TABLE IF NOT EXISTS softwares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    fornecedor_id INTEGER NOT NULL,
    categoria TEXT,
    versao_instalada TEXT NOT NULL,
    versao_recomendada TEXT NOT NULL,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS licencas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    software_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    custo_anual REAL NOT NULL DEFAULT 0,
    data_inicio TEXT NOT NULL,
    data_vencimento TEXT NOT NULL,
    FOREIGN KEY (software_id) REFERENCES softwares(id) ON DELETE CASCADE -- foreign key para garantir que a licença esteja associada a um software existente, e se o software for deletado, a licença também será deletada
);

