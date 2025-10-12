/**
 * Script para a página de Consulta de Horários.
 * Versão: 4.0.2 (Correções de inicialização e eventos)
 * Data: 12/10/2025
 */

// --- 1. SELETORES DE ELEMENTOS E CONSTANTES ---
const body = document.body;
const loader = document.getElementById('loader');
const terminalSelect = document.getElementById('terminal');
const themeSwitch = document.getElementById('themeSwitch');
const tableDiv = document.getElementById('table_div');
const checkListDiv = document.getElementById('check_list');
const selectDiv = document.getElementById('select_div');
const voltarLinhasBtn = document.getElementById('voltar_linhas');
const voltarTerminaisBtn = document.getElementById('voltar_terminais');

const STORAGE_KEY = 'dados_consulta_horarios';

// --- NOVA ESTRUTURA PARA LINHAS DE FIM DE SEMANA ---
const LINHAS_DE_FIM_DE_SEMANA = {
    "Parangaba": [
        { codigo: '172', nome: "172 - Antônio Bezerra/Lagoa/Parangaba" },
        { codigo: '1390', nome: "1390 - Parangaba/João Pessoa/Centro/ED" },
        { codigo: '373', nome: "373 - José Walter/Parangaba" }
    ],
    "Antônio Bezerra": [
        { codigo: '172', nome: "172 - Antônio Bezerra/Lagoa/Parangaba" },
        { codigo: '130', nome: "130 - CONJ. ALVORADA / BEZERRA DE MENEZES" }
    ],
    "Siqueira": [
        { codigo: '397', nome: "397 - Cj Ceará/Paupina" },
        { codigo: '078', nome: "078 - Siqueira/Mucuripe/ED" },
        { codigo: '355', nome: "355 - Siqueira/José Bastos/Centro/ED" }
    ],
    "Jose de Alencar": [
        { codigo: '1390', nome: "1390 - Parangaba/João Pessoa/Centro/ED" },
        { codigo: '157', nome: "157 - Rota a Confirmar" }
    ]
};

// --- 2. VARIÁVEIS DE ESTADO ---
let nomeTerminalSelecionado = '';
let terminalSelecionadoLinhas = [];
let jsonLinhasConsultadas = [];

// --- 3. LÓGICA PRINCIPAL (API E UI) ---

function isWeekend() {
    const today = new Date();
    const day = today.getDay(); // 0 para Domingo, 6 para Sábado
    return day === 0 || day === 6;
}

function toggleLoader(show) {
    loader.style.display = show ? 'flex' : 'none';
}

async function carregarTerminais() {
    try {
        const response = await fetch("https://api-lyart-chi.vercel.app/postos/");
        if (!response.ok) throw new Error('Falha ao buscar postos.');
        const result = await response.json();
        while (terminalSelect.options.length > 1) terminalSelect.remove(1);
        for (const posto of result) {
            terminalSelect.innerHTML += `<option value="${posto}">${posto}</option>`;
        }
        terminalSelect.disabled = false;
    } catch (error) {
        console.error(error);
        alert('Não foi possível carregar a lista de terminais.');
    }
}

async function carregarChecklistDoTerminal(posto) {
    toggleLoader(true);
    try {
        const url = `https://api-lyart-chi.vercel.app/linhasDoPosto/${encodeURIComponent(posto.trim())}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Falha ao buscar linhas do posto.');
        
        let result = await response.json();
        
        if (isWeekend()) {
            const nomeCurtoTerminal = Object.keys(LINHAS_DE_FIM_DE_SEMANA).find(key => posto.includes(key));
            if (nomeCurtoTerminal) {
                const linhasFds = LINHAS_DE_FIM_DE_SEMANA[nomeCurtoTerminal];
                linhasFds.forEach(linhaFds => {
                    if (!result.some(linhaApi => linhaApi.numero == linhaFds.codigo)) {
                        result.push({ numero: linhaFds.codigo, numeroNome: linhaFds.nome });
                    }
                });
            }
        }

        result.sort((a, b) => {
            const numA = parseInt(String(a.numero).replace(/\D/g, ''), 10);
            const numB = parseInt(String(b.numero).replace(/\D/g, ''), 10);
            return numA - numB;
        });

        if (result.length > 0) {
            terminalSelecionadoLinhas = result;
            renderizarChecklist();
        } else {
             alert(`Nenhuma linha encontrada para o terminal "${posto}" na data de hoje.`);
        }
    } catch (error) {
        console.error(error);
    } finally {
        toggleLoader(false);
    }
}

function renderizarChecklist() {
    voltarTerminaisBtn.classList.remove('disabled');
    selectDiv.style.display = 'none';
    checkListDiv.style.display = 'block';
    let checklistContent = '';
    for (const linha of terminalSelecionadoLinhas) {
        checklistContent += `
        <div class="form-check">
            <input type="checkbox" class="form-check-input list-checkbox" id="${linha.numero}" value="${linha.numero}">
            <label for="${linha.numero}" class="form-check-label">${linha.numeroNome}</label>
        </div>`;
    }
    checkListDiv.innerHTML = `
        <div id="session-checklist">
            ${checklistContent}
            <button type="button" id="consultar" class="btn btn-primary mt-3">Consultar</button>
        </div>
    `;
    document.getElementById('consultar').addEventListener('click', handleConsultarClick);
}

async function handleConsultarClick() {
    const linhasSelecionadas = Array.from(document.querySelectorAll('.list-checkbox:checked')).map(cb => cb.value);
    if (linhasSelecionadas.length < 1) {
        alert("Selecione pelo menos uma linha.");
        return;
    }

    toggleLoader(true);
    checkListDiv.style.display = 'none';
    jsonLinhasConsultadas = [];

    const data = new Date().toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"}).split(',')[0];
    const [dia, mes, ano] = data.split('/');
    const dataFormatada = `${ano}${mes}${dia}`;

    for (const linha of linhasSelecionadas) {
        try {
            const response = await fetch(`https://api-lyart-chi.vercel.app/ProgramacaoNormal/${linha}?data=${dataFormatada}`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const jsonTemporario = await response.json();
            if (jsonTemporario.Message) {
                console.warn(`Programação para a linha ${linha} não encontrada.`);
                continue;
            }
            organizarDadosDaLinha(jsonTemporario, jsonLinhasConsultadas);
        } catch (error) {
            console.error(`Erro ao buscar dados para a linha ${linha}:`, error);
        }
    }

    renderizarTabela(jsonLinhasConsultadas);
    // restoreTableInputs(); // Esta função não existe no código, comentei para evitar erros.
    toggleLoader(false);
}

function organizarDadosDaLinha(jsonTemporario, all_json_programacao) {
    if (!jsonTemporario.quadro || !jsonTemporario.quadro.tabelas) return;
    for (const tabela of jsonTemporario.quadro.tabelas) {
        if (!tabela.trechos) continue;
        for (const trecho of tabela.trechos) {
            if (nomeTerminalSelecionado.toLowerCase().includes(trecho.inicio.postoControle.toLowerCase().trim())) {
                all_json_programacao.push({
                    'id': `${jsonTemporario.codigoLinha}-${tabela.numero}-${trecho.inicio.horario}`,
                    'linha': jsonTemporario.codigoLinha,
                    'empresa': trecho.empresa,
                    'tabela': `${tabela.numero} ${trecho.inicio.descricao.slice(0,1)}`,
                    'horario': trecho.inicio.horario.slice(-8, -3),
                    'dadosTabela': tabela, 
                });
            }
        }
    }
}

function renderizarTabela(dados) {
    dados.sort((a, b) => a.horario.localeCompare(b.horario));
    voltarLinhasBtn.classList.remove('disabled');
    tableDiv.style.display = 'block';

    const tableRowsHTML = dados.map(item => {
        const dadosTabelaString = JSON.stringify(item.dadosTabela);
        return `
        <tr data-row-id="${item.id}" data-linha="${item.linha}" data-tabela="${item.tabela}" data-horario="${item.horario}" data-dados-tabela='${dadosTabelaString}'>
            <td>${item.linha}</td>
            <td>${item.empresa}</td>
            <td>${item.tabela}</td>
            <td>${item.horario}</td>
            <td><input type="text" id="carro-${item.id}" name="carro-${item.id}" placeholder="Carro" class="form-control veiculo-input" data-row-id="${item.id}" maxlength="5"></td>
            <td><input type="time" id="horario-${item.id}" name="horario-${item.id}" class="form-control real-time-input" data-row-id="${item.id}"></td>
        </tr>
    `}).join('');

    tableDiv.innerHTML = `
        <table class="table table-striped table-bordered" id="tabela">
            <thead>
                <tr>
                    <th>Linha</th>
                    <th>Emp</th>
                    <th>Tab</th>
                    <th>Início</th>
                    <th>Carro</th>
                    <th>Horário Real</th>
                </tr>
            </thead>
            <tbody>
                ${tableRowsHTML}
            </tbody>
        </table>
    `;
    document.querySelectorAll('.veiculo-input').forEach(input => input.addEventListener('change', handleVehicleChange));
    document.querySelectorAll('.real-time-input').forEach(input => input.addEventListener('change', handleTimeChange));
}

// --- 4. FUNÇÕES DE LÓGICA ---

function handleVehicleChange(event) {
    const input = event.target;
    const carro = input.value;
    if (!carro) return;
    
    const tr = input.closest('tr');
    const linha = tr.dataset.linha;
    const tabela = tr.dataset.tabela;
    const horario = tr.dataset.horario;

    autoFillVehicle(linha, tabela, horario, carro);
}

function autoFillVehicle(linha, tabela, horarioPreenchido, carro) {
    const rows = document.querySelectorAll('#tabela tbody tr');
    const horarioPreenchidoDate = new Date(`1970-01-01T${horarioPreenchido}`);

    rows.forEach(row => {
        if (row.dataset.linha === linha && row.dataset.tabela === tabela) {
            const rowHorarioDate = new Date(`1970-01-01T${row.dataset.horario}`);
            if (rowHorarioDate > horarioPreenchidoDate) {
                const veiculoInput = row.querySelector('.veiculo-input');
                if (veiculoInput && veiculoInput.value === '') {
                    veiculoInput.value = carro;
                }
            }
        }
    });
}

function handleTimeChange(event) {
    const input = event.target;
    const horarioReal = input.value;
    const tr = input.closest('tr');
    const horarioPrevisto = tr.dataset.horario;
    const dadosTabela = JSON.parse(tr.dataset.dadosTabela);

    // Adicione esta linha para investigar os dados no console do navegador (F12)
    console.log(dadosTabela); 

    tr.classList.remove('horario-atrasado', 'horario-adiantado');

    if (!horarioReal) {
        return;
    }
    
    // --- PONTO DE ATENÇÃO ---
    // Substitua 'tipo' pelo nome correto da propriedade que você encontrar no console.
    const tipoDaPassagem = dadosTabela.tipo; // <-- AJUSTE AQUI SE NECESSÁRIO

    if (tipoDaPassagem === 4 || tipoDaPassagem === 7) { 
        const [hPrevisto, mPrevisto] = horarioPrevisto.split(':').map(Number);
        const [hReal, mReal] = horarioReal.split(':').map(Number);
        
        const minutosPrevisto = hPrevisto * 60 + mPrevisto;
        const minutosReal = hReal * 60 + mReal;

        const diferenca = minutosReal - minutosPrevisto;

        if (diferenca > 0) {
            tr.classList.add('horario-atrasado');
        } else if (diferenca < 0) {
            tr.classList.add('horario-adiantado');
        }
    }
}

// --- 5. INICIALIZAÇÃO E EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Carrega a lista inicial de terminais quando a página abre
    carregarTerminais();

    // 2. Adiciona um ouvinte para o seletor de terminais.
    terminalSelect.addEventListener('change', (event) => {
        nomeTerminalSelecionado = event.target.options[event.target.selectedIndex].text;
        carregarChecklistDoTerminal(nomeTerminalSelecionado);
    });
});
