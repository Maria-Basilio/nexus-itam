# Nexus ITAM - Gestão de Softwares

**Sistema inteligente de gerenciamento de ativos de software e licenças.**

O Nexus ITAM é uma aplicação desenvolvida para centralizar o gerenciamento de softwares, fornecedores e licenças de uma organização. A proposta é facilitar o controle do inventário, acompanhar vencimentos, identificar softwares desatualizados e visualizar os custos relacionados aos ativos de software.

O sistema também conta com uma integração com inteligência artificial local, utilizando Ollama, para gerar recomendações e apoiar a tomada de decisões.

## Funcionalidades

### Dashboard
- Visualização de indicadores gerais do inventário.
- Quantidade de softwares e fornecedores cadastrados.
- Acompanhamento de licenças ativas, vencidas e próximas do vencimento.
- Identificação de softwares desatualizados.
- Visualização dos custos anuais.
- Gráficos de softwares por fornecedor e custos por fornecedor.

### Gerenciamento de softwares
- Cadastro de softwares.
- Associação de softwares aos fornecedores.
- Registro de versões instaladas e recomendadas.
- Identificação de softwares desatualizados.
- Edição e exclusão de registros.

### Gerenciamento de fornecedores
- Cadastro de fornecedores.
- Registro de informações de contato.
- Consulta, edição e exclusão de fornecedores.

### Gerenciamento de licenças
- Cadastro de licenças.
- Controle de quantidade e custos anuais.
- Registro de datas de início e vencimento.
- Identificação de licenças vencidas, ativas e próximas do vencimento.
- Edição e exclusão de registros.

### Inteligência artificial
- Integração com Ollama para execução de IA local.
- Geração de recomendações para auxiliar na gestão de ativos de software.
- Análise de informações para apoiar decisões administrativas.

## Tecnologias utilizadas

| Tecnologia | Aplicação |
|---|---|
| HTML5 | Estrutura da interface |
| CSS3 | Estilização e responsividade |
| JavaScript | Interatividade e integração com a API |
| Chart.js | Visualização de dados em gráficos |
| Python | Desenvolvimento do backend |
| FastAPI | Construção da API REST |
| SQLite | Banco de dados |
| Ollama | Execução local de inteligência artificial |

## Estrutura do projeto

```text
gestao-softwares/
│
├── backend/
│   ├── routers/
│   │   ├── dashboard.py
│   │   ├── fornecedores.py
│   │   ├── licencas.py
│   │   └── softwares.py
│   ├── database.py
│   ├── schemas.py
│   └── ...
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
│
├── .gitignore
└── README.md
```

*Observação: a estrutura acima representa a organização principal do projeto; arquivos adicionais podem existir nas pastas.*

## Como executar o projeto

### 1. Clonar o repositório

```bash
git clone URL_DO_REPOSITORIO
cd gestao-softwares
```

### 2. Configurar o ambiente virtual

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Instalar as dependências

```bash
pip install -r requirements.txt
```

### 4. Iniciar o backend

```bash
uvicorn main:app --reload
```

A API ficará disponível em:

```text
http://127.0.0.1:8000
```

A documentação interativa pode ser acessada em:

```text
http://127.0.0.1:8000/docs
```

### 5. Iniciar o frontend

Com o backend em execução, abra a pasta `frontend` utilizando uma extensão como Live Server no VS Code.

O frontend está configurado para consumir a API local em `http://127.0.0.1:8000`.

### 6. Configurar a inteligência artificial local

Instale o Ollama e disponibilize o modelo utilizado pelo projeto:

```bash
ollama pull llama3.2
```

Inicie o Ollama antes de utilizar as funcionalidades de inteligência artificial.

## Objetivo do projeto

O Nexus ITAM busca simplificar o gerenciamento de ativos de software, oferecendo uma visão centralizada sobre inventário, fornecedores, licenças, custos e atualizações.

Além do controle operacional, a aplicação utiliza inteligência artificial local para transformar os dados cadastrados em recomendações que podem auxiliar na identificação de riscos e oportunidades de melhoria.

**Nexus ITAM**  
*Mais controle, inteligência e eficiência na gestão de ativos de software.*