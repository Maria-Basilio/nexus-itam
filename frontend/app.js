// Endereço da API FastAPI
const API = "http://127.0.0.1:8000";

let grafico;
let softwaresCache = [];
let licencasCache = [];
let fornecedoresCache = [];
let modalType = null;
let editingSoftwareId = null;
let editingLicenseId = null;
let graficoCustos;

// FUNÇÃO DE COMUNICAÇÃO COM A API

async function api(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    if (!response.ok) {
        let detail = `Erro ${response.status}`;

        try {
            const body = await response.json();
            detail = body.detail || detail;
        } catch {}

        throw new Error(detail);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}


// FUNÇÕES AUXILIARES

// Formatação de valores monetários
const moeda = value =>
    Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

// Formatação de datas
const dataBR = value =>
    value
        ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR")
        : "—";

// Proteção para exibição de dados recebidos da API
const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));

// Status de atualização dos softwares
function statusSoftware(status) {
    const statuses = {
        atualizado: {
            texto: "Atualizado",
            classe: "ok"
        },

        desatualizado: {
            texto: "Desatualizado",
            classe: "desatualizado"
        },

        verificacao_necessaria: {
            texto: "Verificação necessária",
            classe: "warning"
        },

        sem_versao_recomendada: {
            texto: "Sem versão recomendada",
            classe: "neutral"
        }
    };

    const resultado =
        statuses[status] || statuses.verificacao_necessaria;

    return `
        <span class="tag ${resultado.classe}">
            ${resultado.texto}
        </span>
    `;
}


// NOTIFICAÇÕES


function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}


// NAVEGAÇÃO ENTRE PÁGINAS

function navigate(page) {
    document.querySelectorAll(".page-view").forEach(view => {
        view.classList.toggle(
            "active",
            view.id === `page-${page}`
        );
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === page
        );
    });

    const active = document.querySelector(
        `.nav-link[data-page="${page}"]`
    );

    document.getElementById("breadcrumbCurrent").textContent =
        active ? active.textContent.trim() : "Visão geral";

    // Fecha o menu no celular
    document.getElementById("sidebar").classList.remove("open");

    // Atualiza os dados da página selecionada
    if (page === "softwares") carregarSoftwares();

    if (page === "licencas") carregarLicencas();

    if (page === "fornecedores") carregarFornecedores();
}


// Eventos de navegação
document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        navigate(button.dataset.page);
    });
});


// Menu mobile
document.getElementById("mobileMenu").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
});


// Botão de atualização
document.getElementById("refreshButton").addEventListener(
    "click",
    atualizarTudo
);


// DASHBOARD

async function carregarDashboard() {
    const data = await api("/dashboard");

    // Indicadores principais
    const cards = [
    [
        "Softwares cadastrados",
        data.total_softwares,
        "▣",
        "neutral",
        "Itens no inventário"
    ],
    [
        "Fornecedores",
        data.total_fornecedores,
        "◇",
        "neutral",
        "Parceiros cadastrados"
    ],
    [
        "Licenças vencidas",
        data.licencas_vencidas,
        "!",
        "danger",
        "Exigem regularização"
    ],
    [
        "Vencem em 30 dias",
        data.licencas_vencendo_30d,
        "◷",
        "warning",
        "Acompanhe os prazos"
    ],
    [
        "Softwares desatualizados",
        data.desatualizados,
        "↗",
        "warning",
        "Requerem atualização"
    ],
    [
        "Custo anual total",
        moeda(data.custo_anual_total),
        "R$",
        "success",
        "Soma das licenças"
    ],
    [
        "Licenças cadastradas",
        data.total_licencas,
        "▤",
        "neutral",
        `${data.total_licencas_contratadas} unidades contratadas`
    ],
    [
        "Licenças ativas",
        data.licencas_ativas,
        "✓",
        "success",
        "Ainda dentro do prazo"
    ],
    [
        "Vencem em 7 dias",
        data.licencas_vencendo_7d,
        "⏳",
        "warning",
        "Precisam de atenção imediata"
    ]
];

    document.getElementById("cards").innerHTML = cards.map(
        ([label, value, icon, style, note]) => `
            <article class="metric-card ${style}">
                <div class="metric-top">
                    <span>${label}</span>
                    <span class="metric-icon">${icon}</span>
                </div>

                <div class="metric-value">
                    ${value}
                </div>

                <div class="metric-note">
                    ${note}
                </div>
            </article>
        `
    ).join("");


    // GRÁFICO DE SOFTWARES POR FORNECEDOR
   
    const suppliers = data.softwares_por_fornecedor || [];

    const canvas = document.getElementById("grafico");
    const chartEmpty = document.getElementById("chartEmpty");

    chartEmpty.hidden = suppliers.length > 0;
    canvas.style.display = suppliers.length ? "block" : "none";

    if (grafico) {
        grafico.destroy();
    }

    if (suppliers.length && window.Chart) {
        grafico = new Chart(canvas, {
            type: "bar",

            data: {
                labels: suppliers.map(item => item.nome),

                datasets: [{
                    data: suppliers.map(item => item.total),
                    backgroundColor: [
                        "#5874ed",
                        "#8a77e8",
                        "#53b8a0",
                        "#e6b35c",
                        "#77a8dd",
                        "#d98ca7"
                    ],
                    borderRadius: 6,
                    maxBarThickness: 34
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: "#1d2b47",
                        padding: 10,
                        displayColors: false
                    }
                },

                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: "#8994a7",
                            font: {
                                size: 10
                            }
                        }
                    },

                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: "#a0a9b8",
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            color: "#f0f2f6"
                        },
                        border: {
                            display: false
                        }
                    }
                }
            }
        });
    }

  
    // GRÁFICO DE CUSTO ANUAL POR FORNECEDOR

    const custos = data.custo_por_fornecedor || [];

    const canvasCustos = document.getElementById("graficoCustos");
    const emptyCustos = document.getElementById("chartCustosEmpty");

    const fornecedoresComCusto = custos.filter(
        item => Number(item.custo) > 0
    );

    emptyCustos.hidden = fornecedoresComCusto.length > 0;

    canvasCustos.style.display =
        fornecedoresComCusto.length ? "block" : "none";

    if (graficoCustos) {
        graficoCustos.destroy();
    }

    if (fornecedoresComCusto.length && window.Chart) {
        graficoCustos = new Chart(canvasCustos, {
            type: "bar",

            data: {
                labels: fornecedoresComCusto.map(item => item.nome),

                datasets: [{
                    label: "Custo anual",
                    data: fornecedoresComCusto.map(item => Number(item.custo)),
                    backgroundColor: [
                        "#53b8a0",
                        "#5874ed",
                        "#8a77e8",
                        "#e6b35c",
                        "#77a8dd",
                        "#d98ca7"
                    ],
                    borderRadius: 6,
                    maxBarThickness: 34
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: "#1d2b47",
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: context => moeda(context.raw)
                        }
                    }
                },

                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: "#8994a7",
                            font: {
                                size: 10
                            }
                        }
                    },

                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: "#a0a9b8",
                            callback: value => moeda(value)
                        },
                        grid: {
                            color: "#f0f2f6"
                        }
                    }
                }
            }
        });
    }
}

// CENTRAL DE ALERTAS


async function carregarAlertas() {
    const alerts = await api("/dashboard/alertas");

    document.getElementById("alertCount").textContent =
        alerts.length;

    document.getElementById("alertas").innerHTML = alerts.length
        ? alerts.slice(0, 5).map(item => `
            <div class="alert-item ${item.nivel}">
                <span class="alert-dot"></span>

                <div>
                    <strong>
                        ${escapeHTML(item.software)}
                    </strong>

                    <p>
                        ${
                            item.dias_restantes < 0
                                ? `Vencida há ${Math.abs(item.dias_restantes)} dia(s)`
                                : `Vence em ${item.dias_restantes} dia(s)`
                        }

                        · ${dataBR(item.data_vencimento)}
                    </p>
                </div>
            </div>
        `).join("")
        : `
            <div class="empty-state compact">
                Nenhuma licença precisa de atenção agora.
            </div>
        `;
}


// FORNECEDORES


async function carregarFornecedores() {
    fornecedoresCache = await api("/fornecedores");

    // Atualiza filtro de fornecedores
    const select = document.getElementById("filtroFornecedor");
    const selected = select.value;

    select.innerHTML = `
        <option value="">Todos os fornecedores</option>
    ` + fornecedoresCache.map(item => `
        <option value="${item.id}">
            ${escapeHTML(item.nome)}
        </option>
    `).join("");

    select.value = selected;


    // Exibe os fornecedores em cards
    document.getElementById("listaFornecedores").innerHTML =
        fornecedoresCache.length
            ? fornecedoresCache.map(item => `
                <article class="supplier-card">
                    <div class="supplier-symbol">
                        ${escapeHTML(item.nome.slice(0, 1).toUpperCase())}
                    </div>

                    <div>
                        <strong>
                            ${escapeHTML(item.nome)}
                        </strong>

                        <p>
                            ${escapeHTML(item.email_contato || "Sem e-mail de contato")}
                        </p>

                        ${
                            item.site
                                ? `<a href="${escapeHTML(item.site)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.site)}</a>`
                                : '<span class="metric-note">Site não informado</span>'
                        }
                    </div>
                </article>
            `).join("")
            : `
                <div class="empty-state">
                    <strong>Nenhum fornecedor cadastrado</strong>

                    <p>
                        Adicione um fornecedor para começar
                        a organizar seu inventário.
                    </p>
                </div>
            `;
}


// INVENTÁRIO DE SOFTWARES

async function carregarSoftwares() {
    const params = new URLSearchParams();

    const search = document.getElementById("busca").value.trim();
    const supplier = document.getElementById("filtroFornecedor").value;
    const outdated = document.getElementById("filtroDesatualizado").value;

    if (search) {
        params.set("busca", search);
    }

    if (supplier) {
        params.set("fornecedor_id", supplier);
    }

    if (outdated !== "") {
        params.set("desatualizado", outdated);
    }

    softwaresCache = await api(
        `/softwares?${params.toString()}`
    );

    renderSoftwares();
}


// Renderiza a tabela de softwares
function renderSoftwares() {
    const rows = softwaresCache;

    document.getElementById("tabelaSoftwares").innerHTML =
        rows.length
            ? rows.map(item => `
                <tr>
                    <td class="cell-main">
                        ${escapeHTML(item.nome)}
                    </td>

                    <td>
                        ${escapeHTML(item.fornecedor)}
                    </td>

                    <td>
                        ${escapeHTML(item.categoria || "—")}
                    </td>

                    <td>
                        ${escapeHTML(item.versao_instalada)}
                    </td>

                    <td>
                        ${escapeHTML(item.versao_recomendada)}
                    </td>

                    <td>
                        ${statusSoftware(item.status_atualizacao)}
                    </td>

                    <td>
                        <div class="action-group">
                            <button
                                class="action-button"
                                data-edit-software="${item.id}"
                            >
                                Editar
                            </button>

                            <button
                                class="action-button danger"
                                data-delete-software="${item.id}"
                            >
                                Excluir
                            </button>
                        </div>
                    </td>
                </tr>
            `).join("")
            : `
                <tr>
                    <td colspan="7">
                        <div class="empty-state compact">
                            Nenhum software encontrado.
                        </div>
                    </td>
                </tr>
            `;


    document.getElementById("softwareCount").textContent =
        `${rows.length} software(s) encontrado(s)`;


    // Atualiza a tabela resumida do dashboard
    document.getElementById("recentSoftwares").innerHTML =
        rows.slice(0, 5).map(item => `
            <tr>
                <td class="cell-main">
                    ${escapeHTML(item.nome)}
                </td>

                <td>
                    ${escapeHTML(item.fornecedor)}
                </td>

                <td>
                    ${escapeHTML(item.versao_instalada)}
                </td>

                <td>
                    ${escapeHTML(item.versao_recomendada)}
                </td>

                <td>
                    ${statusSoftware(item.status_atualizacao)}
                </td>
            </tr>
        `).join("")
        || `
            <tr>
                <td colspan="5" class="empty-state compact">
                    Nenhum software cadastrado.
                </td>
            </tr>
        `;
}

// LICENÇAS


async function carregarLicencas() {
    licencasCache = await api("/licencas");

    const status = document.getElementById("filtroStatusLicenca").value;

    const search = document.getElementById("buscaLicenca").value
        .trim()
        .toLowerCase();

    const rows = licencasCache.filter(item =>
        (!status || item.status === status) &&
        (!search || item.software.toLowerCase().includes(search))
    );

    document.getElementById("tabelaLicencas").innerHTML =
        rows.length
            ? rows.map(item => `
                <tr>
                    <td class="cell-main">
                        ${escapeHTML(item.software)}
                    </td>

                    <td>
                        ${escapeHTML(item.fornecedor)}
                    </td>

                    <td>
                        ${escapeHTML(item.tipo)}
                    </td>

                    <td>
                        ${item.quantidade}
                    </td>

                    <td>
                        ${moeda(item.custo_anual)}
                    </td>

                    <td>
                        ${dataBR(item.data_vencimento)}
                    </td>

                    <td>
                        <span class="tag ${escapeHTML(item.status)}">
                            ${
                                item.status === "ativa"
                                    ? "Ativa"
                                    : item.status === "vencendo"
                                        ? "Vencendo"
                                        : "Vencida"
                            }
                        </span>
                    </td>

                    <td>
                        <div class="action-group">
                            <button
                                class="action-button"
                                data-edit-license="${item.id}">
                                Editar
                            </button>

                            <button
                                class="action-button danger"
                                data-delete-license="${item.id}">
                                Excluir
                            </button>
                        </div>
                    </td>
                </tr>
            `).join("")
            : `
                <tr>
                    <td colspan="8">
                        <div class="empty-state compact">
                            Nenhuma licença encontrada.
                        </div>
                    </td>
                </tr>
            `;

    document.getElementById("licenseCount").textContent =
        `${rows.length} licença(s) encontrada(s)`;
}

// INTELIGÊNCIA NEXUS — OLLAMA

async function gerarRecomendacoes() {
    const button = document.getElementById("btnIA");
    const box = document.getElementById("recomendacoes");

    button.disabled = true;
    button.textContent = "Analisando...";

    box.innerHTML = `
        <div class="empty-state">
            <span class="empty-icon">✧</span>

            <strong>Analisando seu ambiente</strong>

            <p>
                A IA local pode levar alguns instantes para responder.
            </p>
        </div>
    `;

    try {
        // Solicita recomendações ao backend.
        // O backend utiliza o Ollama e o modelo Llama 3.2.
        const result = await api("/dashboard/recomendacoes");

        document.getElementById("aiSource").textContent =
            result.fonte === "ia_local"
                ? "GERADO PELO OLLAMA"
                : "MOTOR DE REGRAS";

        box.innerHTML =
            result.recomendacoes.length
                ? result.recomendacoes.map(item => `
                    <article class="recommendation ${escapeHTML(item.prioridade)}">
                        <div class="rec-top">
                            <strong>
                                ${escapeHTML(item.software)}
                            </strong>

                            <span class="rec-priority ${escapeHTML(item.prioridade)}">
                                Prioridade ${escapeHTML(item.prioridade)}
                            </span>
                        </div>

                        <p>
                            ${escapeHTML(item.recomendacao)}
                        </p>
                    </article>
                `).join("")
                : `
                    <div class="empty-state">
                        <span class="empty-icon">✓</span>

                        <strong>
                            Ambiente sem recomendações pendentes
                        </strong>

                        <p>
                            Não foram identificados pontos que exijam
                            atenção neste momento.
                        </p>
                    </div>
                `;

    } catch (error) {
        box.innerHTML = `
            <div class="empty-state">
                <strong>Não foi possível gerar a análise</strong>

                <p>
                    ${escapeHTML(error.message)}.
                    Verifique se a API e o Ollama estão disponíveis.
                </p>
            </div>
        `;

        document.getElementById("aiSource").textContent =
            "FALHA NA ANÁLISE";

    } finally {
        button.disabled = false;
        button.textContent = "✧ Gerar análise";
    }
}


// CONFIGURAÇÃO DOS FORMULÁRIOS

const forms = {
    software: {
        title: "Cadastrar software",
        endpoint: "/softwares",

        fields: [
            ["nome", "Nome do software", "text", true],
            ["fornecedor_id", "Fornecedor", "select", true],
            ["categoria", "Categoria", "text", false],
            ["versao_instalada", "Versão instalada", "text", true],
            ["versao_recomendada", "Versão recomendada", "text", true]
        ]
    },

    licenca: {
        title: "Cadastrar licença",
        endpoint: "/licencas",

        fields: [
            ["software_id", "Software", "select", true],
            ["tipo", "Tipo de licença", "text", true],
            ["quantidade", "Quantidade", "number", true],
            ["custo_anual", "Custo anual (R$)", "number", true],
            ["data_inicio", "Data de início", "date", true],
            ["data_vencimento", "Data de vencimento", "date", true]
        ]
    },

    fornecedor: {
        title: "Cadastrar fornecedor",
        endpoint: "/fornecedores",

        fields: [
            ["nome", "Nome do fornecedor", "text", true],
            ["site", "Site", "url", false],
            ["email_contato", "E-mail de contato", "email", false]
        ]
    }
};


// ABRIR MODAL — CADASTRO E EDIÇÃO


function openModal(type, entity = null) {
    modalType = type;

    editingSoftwareId =
        type === "software" && entity ? entity.id : null;

    editingLicenseId =
        type === "licenca" && entity ? entity.id : null;

    const isEditing = entity !== null;
    const config = forms[type];

    document.getElementById("modalTitle").textContent =
        isEditing
            ? type === "software"
                ? "Editar software"
                : "Editar licença"
            : config.title;

    document.getElementById("formError").textContent = "";

    const fields = config.fields.map(
        ([name, label, inputType, required]) => {

            let control;

            const currentValue = entity
                ? entity[name] ?? ""
                : "";

            if (inputType === "select") {
                const options =
                    name === "fornecedor_id"
                        ? fornecedoresCache.map(item => [
                            item.id,
                            item.nome
                        ])
                        : softwaresCache.map(item => [
                            item.id,
                            item.nome
                        ]);

                // Na edição de licença, seleciona o software vinculado.
                control = `
                    <select name="${name}" ${required ? "required" : ""}>
                        <option value="">Selecione</option>

                        ${options.map(([value, text]) => `
                            <option
                                value="${value}"
                                ${String(value) === String(currentValue) ? "selected" : ""}
                            >
                                ${escapeHTML(text)}
                            </option>
                        `).join("")}
                    </select>
                `;

            } else {
                const defaultDate =
                    !isEditing &&
                    (name === "data_inicio" || name === "data_vencimento")
                        ? new Date().toISOString().slice(0, 10)
                        : currentValue;

                control = `
                    <input
                        name="${name}"
                        type="${inputType}"
                        value="${escapeHTML(defaultDate)}"
                        ${required ? "required" : ""}
                        ${
                            inputType === "number"
                                ? `min="${name === "quantidade" ? 1 : 0}"
                                   step="${name === "quantidade" ? 1 : "0.01"}"`
                                : ""
                        }
                    >
                `;
            }

            return `
                <div class="field ${name === "nome" || name === "tipo" ? "full" : ""}">
                    <label>
                        ${label}${required ? " *" : ""}
                    </label>

                    ${control}
                </div>
            `;
        }
    ).join("");

    document.getElementById("formFields").innerHTML = fields;

    document.getElementById("saveEntity").textContent =
        isEditing ? "Salvar alterações" : "Salvar cadastro";

    document.getElementById("modalBackdrop").hidden = false;
}

// FECHAR MODAL


function closeModal() {
    document.getElementById("modalBackdrop").hidden = true;

    document.getElementById("entityForm").reset();

    document.getElementById("formError").textContent = "";

    modalType = null;
    editingSoftwareId = null;
    editingLicenseId = null;

    document.getElementById("saveEntity").textContent =
        "Salvar cadastro";
}


// ABRIR MODAIS PELOS BOTÕES

document.querySelectorAll("[data-open-modal]").forEach(button => {
    button.addEventListener("click", async () => {
        const type = button.dataset.openModal;

        try {
            if (type === "software" && fornecedoresCache.length === 0) {
                await carregarFornecedores();
            }

            if (type === "licenca" && softwaresCache.length === 0) {
                await carregarSoftwares();
            }

            openModal(type);

        } catch (error) {
            showToast(error.message, "error");
        }
    });
});



// EVENTOS DE FECHAMENTO DO MODAL

document.getElementById("closeModal").addEventListener("click", closeModal);

document.getElementById("cancelModal").addEventListener("click", closeModal);

document.getElementById("modalBackdrop").addEventListener("click", event => {
    if (event.target.id === "modalBackdrop") {
        closeModal();
    }
});


// CADASTRAR E EDITAR REGISTROS


document.getElementById("entityForm").addEventListener("submit", async event => {
    event.preventDefault();

    const button = document.getElementById("saveEntity");
    const errorBox = document.getElementById("formError");

    const savedType = modalType;

    // Identifica qual entidade está sendo editada.
    const isEditingSoftware = editingSoftwareId !== null;
    const isEditingLicense = editingLicenseId !== null;

    const isEditing = isEditingSoftware || isEditingLicense;

    const config = forms[savedType];

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    // Conversão dos campos numéricos.
    if (data.fornecedor_id) {
        data.fornecedor_id = Number(data.fornecedor_id);
    }

    if (data.software_id) {
        data.software_id = Number(data.software_id);
    }

    if (data.quantidade) {
        data.quantidade = Number(data.quantidade);
    }

    if (data.custo_anual !== undefined) {
        data.custo_anual = Number(data.custo_anual);
    }

    // Define endpoint e método conforme a operação.
    let endpoint = config.endpoint;
    let method = "POST";

    if (isEditingSoftware) {
        endpoint = `/softwares/${editingSoftwareId}`;
        method = "PUT";

    } else if (isEditingLicense) {
        endpoint = `/licencas/${editingLicenseId}`;
        method = "PUT";
    }

    button.disabled = true;

    button.textContent = isEditing
        ? "Salvando alterações..."
        : "Salvando...";

    errorBox.textContent = "";

    try {
        await api(endpoint, {
            method,
            body: JSON.stringify(data)
        });

        closeModal();

        let mensagem;

        if (isEditingSoftware) {
            mensagem = "Software atualizado com sucesso!";
        } else if (isEditingLicense) {
            mensagem = "Licença atualizada com sucesso!";
        } else {
            mensagem = "Cadastro realizado com sucesso!";
        }

        showToast(mensagem, "success");

        await atualizarTudo();

        navigate(
            savedType === "software"
                ? "softwares"
                : savedType === "licenca"
                    ? "licencas"
                    : "fornecedores"
        );

    } catch (error) {
        errorBox.textContent = error.message;

    } finally {
        button.disabled = false;

        if (document.getElementById("modalBackdrop").hidden) {
            button.textContent = "Salvar cadastro";
        } else {
            button.textContent = isEditing
                ? "Salvar alterações"
                : "Salvar cadastro";
        }
    }
});


// EDITAR E EXCLUIR SOFTWARES

document.getElementById("tabelaSoftwares").addEventListener("click", async event => {

    // EDITAR
    const editButton = event.target.closest("[data-edit-software]");

    if (editButton) {
        const id = Number(editButton.dataset.editSoftware);

        const software = softwaresCache.find(item => item.id === id);

        if (!software) {
            showToast("Software não encontrado.", "error");
            return;
        }

        openModal("software", software);
        return;
    }

    // EXCLUIR
    const deleteButton = event.target.closest("[data-delete-software]");

    if (deleteButton) {
        const id = Number(deleteButton.dataset.deleteSoftware);

        const confirmado = confirm(
            "Tem certeza de que deseja excluir este software? As licenças vinculadas também serão excluídas."
        );

        if (!confirmado) return;

        try {
            await api(`/softwares/${id}`, {
                method: "DELETE"
            });

            showToast("Software excluído com sucesso!", "success");

            await atualizarTudo();

        } catch (error) {
            showToast(error.message, "error");
        }
    }
});


// EDITAR E EXCLUIR LICENÇAS

document.getElementById("tabelaLicencas").addEventListener("click", async event => {

    // EDITAR LICENÇA
    const editButton = event.target.closest("[data-edit-license]");

    if (editButton) {
        const id = Number(editButton.dataset.editLicense);

        const licenca = licencasCache.find(item => item.id === id);

        if (!licenca) {
            showToast("Licença não encontrada.", "error");
            return;
        }

        openModal("licenca", licenca);
        return;
    }

    // EXCLUIR LICENÇA
    const deleteButton = event.target.closest("[data-delete-license]");

    if (deleteButton) {
        const id = Number(deleteButton.dataset.deleteLicense);

        const confirmado = confirm(
            "Tem certeza de que deseja excluir esta licença? Essa ação não poderá ser desfeita."
        );

        if (!confirmado) return;

        try {
            await api(`/licencas/${id}`, {
                method: "DELETE"
            });

            showToast("Licença excluída com sucesso!", "success");

            await atualizarTudo();

        } catch (error) {
            showToast(error.message, "error");
        }
    }
});


// FILTROS E PESQUISAS

document.getElementById("btnFiltrar").addEventListener("click", () => {
    carregarSoftwares().catch(error => {
        showToast(error.message, "error");
    });
});

document.getElementById("busca").addEventListener("keydown", event => {
    if (event.key === "Enter") {
        carregarSoftwares().catch(error => {
            showToast(error.message, "error");
        });
    }
});

document.getElementById("filtroStatusLicenca").addEventListener("change", () => {
    carregarLicencas().catch(error => {
        showToast(error.message, "error");
    });
});

document.getElementById("buscaLicenca").addEventListener("input", () => {
    carregarLicencas().catch(error => {
        showToast(error.message, "error");
    });
});


// PESQUISA DE FORNECEDORES

document.getElementById("buscaFornecedor").addEventListener("input", event => {
    const termo = event.target.value.toLowerCase();

    document.querySelectorAll(".supplier-card").forEach(card => {
        const conteudo = card.textContent.toLowerCase();

        card.style.display = conteudo.includes(termo)
            ? ""
            : "none";
    });
});


// INTELIGÊNCIA ARTIFICIAL

document.getElementById("btnIA").addEventListener("click", gerarRecomendacoes);


// ATUALIZAÇÃO GERAL

async function atualizarTudo() {
    try {
        await Promise.all([
            carregarDashboard(),
            carregarAlertas(),
            carregarFornecedores(),
            carregarSoftwares(),
            carregarLicencas()
        ]);

    } catch (error) {
        showToast(error.message, "error");
    }
}


// DATA ATUAL

document.getElementById("todayLabel").textContent =
    new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });


// INICIALIZAÇÃO DO NEXUS ITAM

atualizarTudo();