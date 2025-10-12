/**
 * Script para a página de Consulta de Horários.
 * Versão: 2.3.9 (Adiciona workaround para linha 078)
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

// --- 2. VARIÁVEIS DE ESTADO ---
let nomeTerminalSelecionado = '';
let terminalSelecionadoLinhas = [];
let jsonLinhasConsultadas = [];

// --- 3. LÓGICA PRINCIPAL (API E UI) ---

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
        
        // *** INÍCIO DA SOLUÇÃO TEMPORÁRIA ***
        if (posto.includes('Parangaba')) {
            if (!result.some(l => l.numero == 172)) result.push({ numero: 172, numeroNome: "172 - Antônio Bezerra/Lagoa/Parangaba" });
            if (!result.some(l => l.numero == 1390)) result.push({ numero: 1390, numeroNome: "1390 - Parangaba/João Pessoa/Centro/ED" });
            if (!result.some(l => l.numero == 373)) result.push({ numero: 373, numeroNome: "373 - José Walter/Parangaba" });
        }
        
        if (posto.includes('Antônio Bezerra')) {
            if (!result.some(l => l.numero == 172)) result.push({ numero: 172, numeroNome: "172 - Antônio Bezerra/Lagoa/Parangaba" });
            if (!result.some(l => l.numero == 130)) result.push({ numero: 130, numeroNome: "130 - CONJ. ALVORADA / BEZERRA DE MENEZES" });
        }
        
        if (posto.includes('Siqueira')) {
            if (!result.some(l => l.numero == 397)) result.push({ numero: 397, numeroNome: "397 - Cj Ceará/Paupina" });
            // ADIÇÃO DA LINHA 078
            if (!result.some(l => l.numero == '078')) {
                console.warn("Workaround: Adicionando manualmente a linha 078.");
                result.push({ numero: '078', numeroNome: "078 - Canindezinho/Sofredini" });
            }
        }

        if (posto.includes('Jose de Alencar')) {
            if (!result.some(l => l.numero == 1390)) result.push({ numero: 1390, numeroNome: "1390 - Parangaba/João Pessoa/Centro/ED" });
        }

        result.sort((a, b) => {
            const numA = parseInt(String(a.numero).replace(/\D/g, ''), 10);
            const numB = parseInt(String(b.numero).replace(/\D/g, ''), 10);
            return numA - numB;
        });
        // *** FIM DA SOLUÇÃO TEMPORÁRIA ***

        if (result.length > 0) {
            terminalSelecionadoLinhas = result;
            renderizarChecklist();
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
    restoreTableInputs();
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
    
    const tipoDaPassagem = dadosTabela.tipo; // Usando a propriedade 'tipo' que descobrimos

    if (!horarioReal) {
        tr.classList.remove('horario-atrasado', 'horario-adiantado');
        return;
    }
    
    if (tipoDaPassagem === 4 || tipoDaPassagem === 7) { 
        const [hPrevisto, mPrevisto] = horarioPrevisto.split(':').map(Number);
        const [hReal, mReal] = horarioReal.split(':').map(Number);
        
        const minutosPrevisto = hPrevisto * 60 + mPrevisto;
        const minutosReal = hReal * 60 + mReal;

        const diferenca = minutosReal - minutosPrevisto;

        tr.classList.remove('horario-atrasado', 'horario-adiantado');

        if (diferenca > 10) {
            tr.classList.add('horario-atrasado');
        } else if (diferenca < -10) {
            tr.classList.add('horario-adiantado');
        }
    }
}

// --- 5. GERENCIAMENTO DO TEMA ---
function applyTheme(theme) {
    body.classList.toggle('dark-theme', theme === 'dark');
    themeSwitch.checked = (theme === 'dark');
}

function getCurrentTheme() {
    return body.classList.contains('dark-theme') ? 'dark' : 'light';
}

// --- 6. PERSISTÊNCIA DE DADOS (LocalStorage) ---
function saveData() {
    try {
        const inputsData = { veiculos: {}, horarios: {} };
        document.querySelectorAll('.veiculo-input').forEach(input => {
            if (input.value) inputsData.veiculos[input.dataset.rowId] = input.value;
        });
        document.querySelectorAll('.real-time-input').forEach(input => {
            if (input.value) inputsData.horarios[input.dataset.rowId] = input.value;
        });
        const dataToSave = {
            terminal: terminalSelect.value,
            theme: getCurrentTheme(),
            inputs: inputsData
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
    }
}

function restoreData() {
    const savedDataJSON = localStorage.getItem(STORAGE_KEY);
    if (!savedDataJSON) return;
    try {
        const savedData = JSON.parse(savedDataJSON);
        applyTheme(savedData.theme || 'light');
        if (savedData.terminal) {
            terminalSelect.value = savedData.terminal;
        }
    } catch (error) {
        console.error('Erro ao restaurar dados:', error);
    }
}

function restoreTableInputs() {
    const savedDataJSON = localStorage.getItem(STORAGE_KEY);
    if (!savedDataJSON) return;
    try {
        const savedData = JSON.parse(savedDataJSON).inputs;
        if (!savedData) return;
        for (const [id, value] of Object.entries(savedData.veiculos || {})) {
            const input = document.querySelector(`.veiculo-input[data-row-id="${id}"]`);
            if (input) input.value = value;
        }
        for (const [id, value] of Object.entries(savedData.horarios || {})) {
            const input = document.querySelector(`.real-time-input[data-row-id="${id}"]`);
            if (input) {
                input.value = value;
                input.dispatchEvent(new Event('change'));
            }
        }
    } catch (error) {
        console.error('Erro ao restaurar inputs da tabela:', error);
    }
}

function limparDados() {
    if (confirm('Tem certeza que deseja limpar todos os dados salvos?')) {
        window.removeEventListener('beforeunload', saveData);
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

// --- 7. NAVEGAÇÃO E EVENT LISTENERS ---
function voltarParaLinhas() {
    voltarLinhasBtn.classList.add('disabled');
    tableDiv.style.display = 'none';
    tableDiv.innerHTML = '';
    checkListDiv.style.display = 'block';
    jsonLinhasConsultadas = [];
}

function voltarParaTerminais() {
    voltarTerminaisBtn.classList.add('disabled');
    voltarLinhasBtn.classList.add('disabled');
    checkListDiv.style.display = 'none';
    checkListDiv.innerHTML = '';
    tableDiv.style.display = 'none';
    tableDiv.innerHTML = '';
    selectDiv.style.display = 'block';
    terminalSelect.selectedIndex = 0;
}

// --- 8. INICIALIZAÇÃO ---
async function main() {
    themeSwitch.addEventListener('change', () => applyTheme(themeSwitch.checked ? 'dark' : 'light'));
    terminalSelect.addEventListener('change', (event) => {
        if (event.target.selectedIndex > 0) {
            nomeTerminalSelecionado = event.target.options[event.target.selectedIndex].text;
            carregarChecklistDoTerminal(event.target.value);
        }
    });
    window.addEventListener('beforeunload', saveData);
    voltarLinhasBtn.addEventListener('click', voltarParaLinhas);
    voltarTerminaisBtn.addEventListener('click', voltarParaTerminais);
    
    toggleLoader(true);
    await carregarTerminais();
    restoreData();
    if (terminalSelect.selectedIndex > 0) {
        nomeTerminalSelecionado = terminalSelect.options[terminalSelect.selectedIndex].text;
        await carregarChecklistDoTerminal(terminalSelect.value);
    }
    toggleLoader(false);
}

document.addEventListener('DOMContentLoaded', main);
