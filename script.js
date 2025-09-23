var messejana = [4,26,51,52,53,55,56,68,82,84,315,328,600,613,614,616,617,618,619,620,621,622,626,628,629,630,631,632,634,635,636,637,639,640,641,642,643,644,645,646,647,648,650,652,653,655,656,657,662,663,665,667,668,681,682,685,686,697,699,815,1203,1815]
var siqueira = [27,30,49,50,51,52,55,56,63,65,73,78,84,87,97,99,300,325,326,329,330,332,334,335,336,337,338,342,345,346,355,360,361,362,366,370,376,378,380,381,382,383,384,386,388,392,393,397,398,400,1310,1355];
var papicu = [4,16,21,27,28,30,31,32,34,35,36,38,41,42,44,45,48,50,51,52,53,55,56,66,68,69,76,86,87,89,92,96,222,627,680,804,806,810,813,814,815,820,823,825,831,832,835,840,841,860,901,903,913,920,1815];
var lagoa = [25,34,35,36,40,43,67,69,85,304,308,322,323,332,350,356,358,394,411,421,1211,1212];
var antorio_bezerra = [15,24,26,28,34,35,42,51,52,55,56,57,58,71,72,74,79,81,82,86,88,91,92,97,120,122,130,172,200,205,206,210,211,212,213,214,215,216,217,220,222,225,244,389,855,1074];
var conjunto_ceara = [15,36,43,45,76,81,83,96,322,327,345,357,367,368,385,1385];
var parangaba = [29,38,40,41,44,48,60,63,66,70,72,77,80,89,91,95,172,244,301,306,307,309,311,312,313,315,317,319,321,328,339,340,344,347,349,352,353,359,361,362,369,371,372,373,375,377,379,390,391,395,396,399,401,403,456,466,513,1210,1320,1390];
var coracao_jesus = [22,501,600,601,602,603,604,609,610,611,612,613,633,649,650,660,666,701,702,816];
var jose_alencar = [11,12,14,57,111,112,114,115,200,220,303,305,308,310,314,316,331,333,350,360,371,374,385,387,389,401,403,404,405,406,407,411,421,502,605,606,665,670,901,906];
var terminal_selecionado = [];
var nome_terminal_selecionado = '';
var todas_linhas = '';
var linhas_selecionadas = [];
var data = '';
var hora = '';
var tema_escuro = ver_tema() ?? false;
var json_temporario = '';
var json_linhas_selecionadas = [];
var terminal = document.getElementById('terminal');
var check_list = document.getElementById('check_list');
var select_div = document.getElementById('select_div');
var table_div = document.getElementById('table_div');
var flexSwitchCheckDefault = document.getElementById('flexSwitchCheckDefault');
var menu = document.getElementById('menu');
var body = document.querySelector('body');
var voltar_linhas = document.getElementById('voltar_linhas');
var voltar_terminais = document.getElementById('voltar_terminais');
var loader = document.getElementById('loader');

// Variável declarada no escopo global para evitar o ReferenceError
var updateInterval = null;

// Funções do seu código, adaptadas para a nossa interface
async function consultar_linhas(){
    if(tema_escuro=='true'){
        funcao_tema_escuro();
        flexSwitchCheckDefault.checked = true;
    }else{
        funcao_tema_claro();
        flexSwitchCheckDefault.checked = false;
    }
    try {
        const request = await fetch('https://api-lyart-chi.vercel.app/linhas/');
        if(request.ok){
            todas_linhas = await request.json();
            terminal.disabled = false;
        }else{
            throw new Error("Requisição Falhou: "+ request.status);
        }
    } catch (error) {
        console.log(error);
    }
}

terminal.addEventListener('change',function(){
    let options = terminal.getElementsByTagName('option');
    for(let option of options){
        if(option.selected==true){
            nome_terminal_selecionado = option.textContent;
        }
    }
    const posto = terminal.value;
    linhasDoPostoSelecionado(posto);
});

async function linhasDoPostoSelecionado(posto) {
    try {
        const url = `https://api-lyart-chi.vercel.app/linhasDoPosto/${encodeURIComponent(posto.trim())}`;
        const responseLinhasDoPosto = await fetch(url);
        const resultLinhasDoPosto = await responseLinhasDoPosto.json();
        if(resultLinhasDoPosto.length>0){
            terminal_selecionado = resultLinhasDoPosto;
            escrever_checklist();
        }
    } catch (error) {
        console.log(error);
    }
}

async function consultarPostos() {
    try {
        if(tema_escuro=='true'){
            funcao_tema_escuro();
            flexSwitchCheckDefault.checked = true;
        }else{
            funcao_tema_claro();
            flexSwitchCheckDefault.checked = false;
        }
        const response = await fetch("https://api-lyart-chi.vercel.app/postos/");
        const result = await response.json();
        if(result.length>0){
            terminal.disabled = false;
            for(let posto of result){
                terminal.innerHTML += `<option>${posto}</option>`;
            }
        }
    } catch (error) {
        console.log(error);
    }
}

consultarPostos();

function selecionar_terminal(todas_linhas,opcao){
    for(let linha of window[opcao]){
        for(let row of todas_linhas){
            if(row.numero === linha){
                terminal_selecionado.push({'numero':row.numero,'numeroNome':row.numeroNome});
            }
        }
    }
}

function escrever_checklist(){
    voltar_terminais.classList.remove('disabled');
    select_div.style.display = 'none';
    check_list.style.display = 'block';
    if (document.getElementById('session-checklist')) {
        document.getElementById('session-checklist').remove();
    }
    let session_checklist = document.createElement('div');
    session_checklist.setAttribute('id','session-checklist');
    for(let linha_terminal of terminal_selecionado){
        session_checklist.innerHTML += `
        <div class="form-check">
        <input type="checkbox" class="form-check-input list-checkbox" id="${linha_terminal.numero}" value="${linha_terminal.numero}">
        <label for="${linha_terminal.numero}" class="form-check-label">${linha_terminal.numeroNome}</label>
        </div>
        `;
    }
    if(ver_tema()=='true'){
        session_checklist.innerHTML += "<input type='button' id='consultar' class='btn btn-secondary' value='Consultar'>"
    }else{
        session_checklist.innerHTML += "<input type='button' id='consultar' class='btn btn-success' value='Consultar'>"
    }
    check_list.appendChild(session_checklist);
    adicionar_event_botao();
}

function adicionar_event_botao(){
    let consultar = document.getElementById('consultar');
    consultar.addEventListener('click',function(){
        check_list.style.display = 'none';
        ativar_loader();
        linhas_selecionadas = [];
        let check_items = document.getElementsByClassName('list-checkbox');
        for(let check_item of check_items){
            if(check_item.checked === true){
                linhas_selecionadas.push(check_item.value);
            }
        }
        consultar_linhas_selecionadas();
    });
}

async function consultar_linhas_selecionadas(){
    if(linhas_selecionadas.length<1){
        alert("Selecione pelo menos uma linha");
        check_list.style.display = 'block';
        desativar_loader();
        return;
    }
    
    json_linhas_selecionadas = [];
    
    for(let linha of linhas_selecionadas){
        dia_atual();
        try {
            const response = await fetch(`https://api-lyart-chi.vercel.app/ProgramacaoNormal/${linha}?data=${data}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro na requisição para a linha ${linha}: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const json_temporario = await response.json();
            
            if(json_temporario.Message){
                throw new Error(`Programação para a linha ${linha} não encontrada: ${json_temporario.Message}`);
            }
            
            organizar_json(json_temporario, json_linhas_selecionadas);

        } catch (error) {
            console.error(error);
            alert(`Erro ao buscar dados para a linha ${linha}: ${error.message}`);
        }
    }

    escrever_tabela(json_linhas_selecionadas);
    desativar_loader();
}

dia_atual = () =>{
    let date = new Date().toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"});
    hora = date.split(',')[1].trim();
    data = date.split('/')[2].split(',')[0] + date.split('/')[1] + date.split('/')[0];
}

function organizar_json(json_temporario, all_json_programacao){
    if(json_temporario.Message) return;

    // Adicionando verificações de segurança para evitar o erro
    if (!json_temporario.quadro || !json_temporario.quadro.tabelas) {
        console.error("Erro: A estrutura do JSON da API está incorreta ou vazia. Faltando 'quadro' ou 'tabelas'.");
        return;
    }

    for(let tabela=0;tabela<json_temporario.quadro.tabelas.length;tabela++){
        const trechos = json_temporario.quadro.tabelas[tabela].trechos;
        
        // Verificação adicional para garantir que 'trechos' existe antes de iterar
        if (!trechos) {
            continue; // Pula para a próxima tabela se 'trechos' não existir
        }

        for(let trecho=0;trecho<trechos.length;trecho++){
            let array_terminal_selecionado = nome_terminal_selecionado;
            let array_postoControle = trechos[trecho].inicio.postoControle;

            if(nome_terminal_selecionado.toLowerCase().includes(trechos[trecho].inicio.postoControle.toLowerCase().trim()) || comparar_posto(array_terminal_selecionado,array_postoControle)){
                const horario = trechos[trecho].inicio.horario.slice(trechos[trecho].inicio.horario.indexOf('T')+1, trechos[trecho].inicio.horario.length-3);
                const final_linha = trechos[trecho].fim.horario.slice(trechos[trecho].fim.horario.indexOf('T')+1, trechos[trecho].fim.horario.length-3);

                all_json_programacao.push({
                    'id': all_json_programacao.length, // ID único
                    'linha': json_temporario.codigoLinha,
                    'empresa': trechos[trecho].empresa,
                    'tabela': json_temporario.quadro.tabelas[tabela].numero + ' ' + trechos[trecho].inicio.descricao.slice(0,1),
                    'postoControle': trechos[trecho].inicio.postoControle,
                    'horario': horario,
                    'final_linha': final_linha,
                });
            }
        }
    }
}

function escrever_tabela(json_linhas_selecionadas){
    json_linhas_selecionadas.sort((a, b) => {
        const timeA = a.horario;
        const timeB = b.horario;
        return timeA.localeCompare(timeB);
    });

    voltar_linhas.classList.remove('disabled');
    table_div.style.display = 'block';
    
    if (document.getElementById('tabela')) {
        document.getElementById('tabela').remove();
    }

    // Criando um container responsivo para a tabela
    let tableContainer = document.createElement('div');
    tableContainer.style.overflowX = 'auto';
    table_div.appendChild(tableContainer);

    let tabela = document.createElement('table');
    tabela.classList.add('table');
    tabela.setAttribute('id','tabela');
    tableContainer.appendChild(tabela);
    
    let thead = tabela.createTHead();
    let th = thead.insertRow();
    
    // Lista de cabeçalhos sem a coluna 'Posto'
    let cabecalhos = ['Linha', 'Emp', 'Tab', 'Início', 'Carro', 'Horário Real'];
    cabecalhos.forEach((texto, index) => {
        let celula = th.insertCell();
        celula.innerText = texto;
        // Se a célula for a de "Posto", adicione a classe para escondê-la
        if (texto === 'Posto') {
            celula.classList.add('hide-posto');
        }
    });

    // Aplicando a classe para fixar o cabeçalho
    th.classList.add('sticky-header');
    
    // Corrigindo o estilo do cabeçalho quando o tema é escuro
    if(ver_tema()=='true'){
        tabela.classList.remove('table-light');
        tabela.classList.add('table-dark');
    } else {
        tabela.classList.remove('table-dark');
        tabela.classList.add('table-light');
    }

    let tbody = tabela.createTBody();
    const agora = new Date();
    
    for(let item of json_linhas_selecionadas){
        let tr = tbody.insertRow();
        tr.classList.add('horarios');
        tr.dataset.rowId = item.id;
        tr.dataset.linha = item.linha;
        tr.dataset.tabela = item.tabela;
        tr.dataset.scheduleTime = item.horario;
        
        if(ver_tema()=='false'){tr.classList.add('table-secondary');}
        
        tr.insertCell().innerText = item.linha;
        tr.insertCell().innerText = item.empresa;
        tr.insertCell().innerText = item.tabela;
        
        const scheduledTime = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), item.horario.split(':')[0], item.horario.split(':')[1], 0);
        
        // Lógica para exibir a bolinha vermelha
        let horarioCell = tr.insertCell();
        horarioCell.innerHTML = `${item.horario} <span class="passed-time-dot"></span>`;

        if (scheduledTime < agora) {
            horarioCell.querySelector('.passed-time-dot').style.display = 'inline-block';
        } else {
            horarioCell.querySelector('.passed-time-dot').style.display = 'none';
        }

        let carroCell = tr.insertCell();
        let realTimeCell = tr.insertCell();
        carroCell.innerHTML = `<input type="text" placeholder="Carro" class="veiculo-input" data-row-id="${item.id}" maxlength="5">`;
        realTimeCell.innerHTML = `<input type="time" class="real-time-input" data-row-id="${item.id}">`;

        const veiculoInput = carroCell.querySelector('.veiculo-input');
        const realTimeInput = realTimeCell.querySelector('.real-time-input');

        // Adiciona o evento de preenchimento automático
        veiculoInput.addEventListener('change', () => {
            const linha = tr.dataset.linha;
            const tabela = tr.dataset.tabela;
            const horario = tr.dataset.scheduleTime;
            const carro = veiculoInput.value;
            autoFillVehicle(linha, tabela, horario, carro);
        });

        realTimeInput.addEventListener('change', () => checkTime(item.id, item.horario));
    }

    table_div.style.display = 'block';
    ativar_popovers();
    rolar_pagina();
    
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    updateInterval = setInterval(() => {
        updatePassedTimes();
        scrollToNextTime();
    }, 30000);
}

// Nova função para preencher os campos automaticamente
function autoFillVehicle(linha, tabela, horarioPreenchido, carro) {
    // Busca todas as linhas da tabela
    const rows = document.querySelectorAll('#tabela tbody tr.horarios');

    // Converte o horário preenchido para um objeto de data para comparação
    const horarioPreenchidoDate = new Date(`1970-01-01T${horarioPreenchido}`);

    // Itera sobre cada linha
    rows.forEach(row => {
        const rowLinha = row.dataset.linha;
        const rowTabela = row.dataset.tabela;
        const rowHorario = row.dataset.scheduleTime;
        
        // Verifica se a linha tem a mesma linha e tabela
        if (rowLinha === linha && rowTabela === tabela) {
            const rowHorarioDate = new Date(`1970-01-01T${rowHorario}`);
            
            // Verifica se o horário da linha é posterior ao horário preenchido
            // E se o campo de carro ainda está vazio
            if (rowHorarioDate > horarioPreenchidoDate) {
                const veiculoInput = row.querySelector('.veiculo-input');
                if (veiculoInput && veiculoInput.value === '') {
                    veiculoInput.value = carro;
                }
            }
        }
    });
}

function rolar_pagina(){
    let rolar_para_linha = document.getElementsByClassName('marcado');
    if (rolar_para_linha.length > 0) {
        try{
            window.scrollTo(0,(rolar_para_linha[rolar_para_linha.length-1].offsetTop));
        }
        catch(error){
            console.log(error);
        }
    }
}

function ativar_popovers(){
    let popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    let popoverList = popoverTriggerList.map(function(popoverTriggerEl){
        return new bootstrap.Popover(popoverTriggerEl)
    })
}

function comparar_posto(array_terminal_selecionado,array_postoControle){
    let lista_postos = ['Antônio','Bezerra','Conjunto','Ceará','Lagoa','Messejana','Papicu','Parangaba','Siqueira'];
    let separacao1 = array_postoControle.split(' ');
    let separacao2 = array_terminal_selecionado.split(' ');
    for(let sep1 of separacao1){
        for(let sep2 of separacao2){
            if(sep1.length>0&&sep2.length>0){
                if(sep1==sep2){
                    for(let posto of lista_postos){
                        if(sep1==posto){
                            return true;
                        }
                    }
                }
            }
        }
    }
}

function ver_tema(){
    if(localStorage.getItem('dark_theme')==undefined){
        localStorage.setItem('dark_theme',false);
    }else{
        let tema = localStorage.getItem('dark_theme');
        return tema;
    }
}

function funcao_tema_escuro(){
    menu.classList.remove('navbar-light');
    menu.classList.remove('bg-light');
    menu.classList.add('navbar-dark');
    menu.classList.add('bg-dark');
    body.style.backgroundColor = 'black';
    check_list.classList.add('check_list_escuro');
    if(document.getElementById('consultar')!=undefined){
        document.getElementById('consultar').classList.remove('btn-success');
        document.getElementById('consultar').classList.add('btn-secondary');
    }
    const tabela = document.getElementById('tabela');
    if(tabela) {
        tabela.classList.remove('table-light');
        tabela.classList.add('table-dark');
    }
}

function funcao_tema_claro(){
    menu.classList.remove('navbar-dark');
    menu.classList.remove('bg-dark');
    menu.classList.add('navbar-light');
    menu.classList.add('bg-light');
    body.style.backgroundColor = 'white';
    check_list.classList.remove('check_list_escuro');
    if(document.getElementById('consultar')!=undefined){
        document.getElementById('consultar').classList.remove('btn-secondary');
        document.getElementById('consultar').classList.add('btn-success');
    }
    const tabela = document.getElementById('tabela');
    if(tabela) {
        tabela.classList.remove('table-dark');
        tabela.classList.add('table-light');
    }
}

function voltar_para_linhas(){
    voltar_linhas.classList.add('disabled');
    table_div.style.display = 'none';
    check_list.style.display = 'block';
    if(document.getElementById('tabela')) {
        document.getElementById('tabela').remove();
    }
    json_temporario = [];
    json_linhas_selecionadas = [];
    linhas_selecionadas = [];
}

voltar_linhas.addEventListener('click',voltar_para_linhas);

function voltar_para_terminais(){
    voltar_terminais.classList.add('disabled');
    voltar_linhas.classList.add('disabled');
    json_temporario = [];
    json_linhas_selecionadas = [];
    linhas_selecionadas = [];
    if(window.getComputedStyle(check_list).display == 'block'){
        check_list.style.display = 'none';
        select_div.style.display = 'block';
        if(document.getElementById('session-checklist')) {
            document.getElementById('session-checklist').remove();
        }
    }else if(window.getComputedStyle(table_div).display == 'block'){
        voltar_terminais.classList.add('disabled');
        check_list.style.display = 'none';
        table_div.style.display = 'none';
        if(document.getElementById('session-checklist')) {
             document.getElementById('session-checklist').remove();
        }
        if(document.getElementById('tabela')) {
             document.getElementById('tabela').remove();
        }
        select_div.style.display = 'block';
    }
}

voltar_terminais.addEventListener('click',voltar_para_terminais);

function ativar_loader(){
    loader.style.display = 'flex';
    loader.innerHTML = '<div class="lds-ring"><div id="loading"></div><div></div><div></div><div></div></div>';
    if(ver_tema()=='false'){
        document.getElementById('loading').setAttribute('style',`box-sizing: border-box; display: block; position: absolute; width: 64px; height: 64px; margin: 8px; border: 8px solid #000; border-radius: 50%; animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite; border-color: #000 transparent transparent transparent;`);
    }else{
        document.getElementById('loading').setAttribute('style',`box-sizing: border-box; display: block; position: absolute; width: 64px; height: 64px; margin: 8px; border: 8px solid #fff; border-radius: 50%; animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite; border-color: #fff transparent transparent transparent;`);
    }
}

function desativar_loader(){
    loader.innerHTML = '';
    loader.style.display = 'none';
}
