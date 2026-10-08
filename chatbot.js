let historicoMensagens = [];
let userRole = null; 
let filtroAtual = 'todos'; 

// Base de registros simulada na memória
let bancoDeDadosItens = [
    { id: 1024, tipo: "perdido", item: "Estojo escolar azul", local: "Bloco A - Sala 12", desc: "Contém canetas e lapiseira" },
    { id: 4891, tipo: "achado", item: "Garrafa térmica preta", local: "Pátio Central", desc: "Marca Kouda com adesivo do CEEP" }
];

window.addEventListener('DOMContentLoaded', () => {
    renderizarTabela();
});

// FUNÇÃO DE LOGIN ADAPTADA PARA LOCALHOST
async function autenticarUsuario(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;
    
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const dados = await response.json();

        if (response.ok) {
            userRole = dados.role;
            aplicarPermissoesDeAcesso();
            
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            document.getElementById('form-login').reset();
        } else {
            alert(dados.erro || 'Falha ao autenticar.');
        }

    } catch (error) {
        console.error("Erro interno detalhado capturado:", error);
        alert("Erro de Inicialização: O site não encontrou o servidor na porta 3000. Certifique-se de usar o mesmo domínio na barra de endereço.");
    }
}

function aplicarPermissoesDeAcesso() {
    const botaoCadastrarMenu = document.getElementById('aba-menu-cadastrar');
    const badgeUsuario = document.getElementById('user-badge');

    if (userRole === 'admin') {
        if (botaoCadastrarMenu) botaoCadastrarMenu.style.display = 'flex';
        if (badgeUsuario) {
            badgeUsuario.innerText = '🛡️ Administrador';
            badgeUsuario.style.color = '#7209B7';
        }
    } else {
        if (botaoCadastrarMenu) botaoCadastrarMenu.style.display = 'none';
        if (badgeUsuario) {
            badgeUsuario.innerText = '🎓 Aluno / Usuário';
            badgeUsuario.style.color = '#A0A0AB';
        }
        mudarAbaPadrao('inicio');
    }
    
    renderizarTabela();
}

function fazerLogout() {
    userRole = null;
    historicoMensagens = [];
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
}

// FLUXO DO ASSISTENTE VIRTUAL
async function enviarMensagem() {
    const input = document.getElementById('input-message');
    const texto = input.value.trim();
    if (!texto) return;

    input.value = '';
    adicionarMensagemNaTela(texto, 'user');
    historicoMensagens.push({ role: 'user', content: texto });

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ historicoMensagens: historicoMensagens })
        });

        const dados = await response.json();
        const respostaIA = dados.respostaDaIA;

        adicionarMensagemNaTela(respostaIA, 'assistant');
        historicoMensagens.push({ role: 'assistant', content: respostaIA });

        if (dados.itemRegistrado) {
            bancoDeDadosItens.unshift(dados.itemRegistrado);
            renderizarTabela();
        }

    } catch (error) {
        console.error("Erro ao falar com a IA:", error);
        adicionarMensagemNaTela("Erro de conexão com o servidor do CEEP.", 'assistant');
    }
}

function adicionarMensagemNaTela(texto, remetente) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.classList.add('message', remetente);
    div.innerText = texto;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// CADASTRO MANUAL
function cadastrarItemManual(event) {
    event.preventDefault();
    const novoItem = {
        id: Math.floor(Math.random() * 10000),
        tipo: document.getElementById('form-tipo').value,
        item: document.getElementById('form-item').value,
        local: document.getElementById('form-local').value,
        desc: document.getElementById('form-desc').value || "Nenhuma observação adicional"
    };

    bancoDeDadosItens.unshift(novoItem);
    renderizarTabela();
    document.getElementById('form-cadastro').reset();
    alert(`Sucesso! Objeto registrado sob o protocolo #${novoItem.id}`);
}

// RENDERIZAR TABELA COM SUPORTE A FILTROS, REMOÇÃO E MUDANÇA DE STATUS
function renderizarTabela() {
    const corpoTabela = document.getElementById('lista-itens-corpo');
    if (!corpoTabela) return;
    corpoTabela.innerHTML = '';

    const itensFiltrados = bancoDeDadosItens.filter(item => {
        if (filtroAtual === 'todos') return true;
        return item.tipo === filtroAtual;
    });

    itensFiltrados.forEach(registro => {
        const tr = document.createElement('tr');
        
        // Ajusta dinamicamente o texto do botão com base no status do item
        const textoBotaoStatus = registro.tipo === 'perdido' ? '🔄 Marcar como Achado' : '🔄 Marcar como Perdido';

        tr.innerHTML = `
            <td>#${registro.id}</td>
            <td><span class="badge ${registro.tipo}">${registro.tipo}</span></td>
            <td><strong>${registro.item}</strong></td>
            <td>${registro.local}</td>
            <td style="color: var(--text-muted); font-size: 0.9rem;">${registro.desc}</td>
            <td class="coluna-acao-item">
                <div class="acoes-admin-container" style="display: ${userRole === 'admin' ? 'flex' : 'none'};">
                    <button class="btn-status" onclick="alternarStatusObjeto(${registro.id})">${textoBotaoStatus}</button>
                    <button class="btn-remover" onclick="removerObjeto(${registro.id})">Remover</button>
                </div>
            </td>
        `;
        corpoTabela.appendChild(tr);
    });

    const cabecalhoAcao = document.querySelector('.coluna-acao-admin');
    if (cabecalhoAcao) {
        if (userRole === 'admin') {
            cabecalhoAcao.classList.remove('ocultar-coluna');
        } else {
            cabecalhoAcao.classList.add('ocultar-coluna');
            document.querySelectorAll('.coluna-acao-item').forEach(td => td.classList.add('ocultar-coluna'));
        }
    }
}

// CLASSIFICAÇÃO / FILTROS
function filtrarItens(tipoFiltro, evento) {
    filtroAtual = tipoFiltro;
    document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('active'));
    evento.target.classList.add('active');
    renderizarTabela();
}

// ALTERNAR STATUS DO PROTOCOLO (Perdido <-> Achado)
function alternarStatusObjeto(idProtocolo) {
    if (userRole !== 'admin') {
        alert("Ação não autorizada!");
        return;
    }

    const itemEncontrado = bancoDeDadosItens.find(item => item.id === idProtocolo);

    if (itemEncontrado) {
        const statusAntigo = itemEncontrado.tipo;
        itemEncontrado.tipo = itemEncontrado.tipo === 'perdido' ? 'achado' : 'perdido';
        
        renderizarTabela(); // Atualiza a tabela na tela imediatamente
        alert(`O protocolo #${idProtocolo} foi alterado de "${statusAntigo}" para "${itemEncontrado.tipo}" com sucesso.`);
    }
}

// REMOVER REGISTRO
function removerObjeto(idProtocolo) {
    if (userRole !== 'admin') {
        alert("Ação não autorizada!");
        return;
    }

    const confirmar = confirm(`Tem certeza que deseja remover permanentemente o objeto #${idProtocolo}?`);
    if (confirmar) {
        bancoDeDadosItens = bancoDeDadosItens.filter(item => item.id !== idProtocolo);
        renderizarTabela();
        alert(`O item #${idProtocolo} foi excluído do sistema.`);
    }
}

function mudarAba(nomeAba, evento) {
    document.querySelectorAll('.btn-aba').forEach(btn => btn.classList.remove('active'));
    const botaoClicado = evento.target.closest('.btn-aba');
    if (botaoClicado) botaoClicado.classList.add('active');

    document.querySelectorAll('.aba-conteudo').forEach(aba => aba.classList.remove('active'));
    const abaAlvo = document.getElementById(`aba-${nomeAba}`);
    if (abaAlvo) abaAlvo.classList.add('active');
}

function mudarAbaPadrao(nomeAba) {
    document.querySelectorAll('.btn-aba').forEach(btn => btn.classList.remove('active'));
    const primeiroBotao = document.querySelector('.btn-aba:nth-child(1)');
    if (primeiroBotao) primeiroBotao.classList.add('active');
    
    document.querySelectorAll('.aba-conteudo').forEach(aba => aba.classList.remove('active'));
    const abaAlvo = document.getElementById(`aba-${nomeAba}`);
    if (abaAlvo) abaAlvo.classList.add('active');
}

// ===== CRIAR CONTA / ENTRAR =====
// Ele usa a tela de login que você já tem e adiciona o modo "Criar conta".
(function () {
    const API_REGISTRO = 'http://localhost:3000/api/registrar';

    function iniciarCadastroLogin() {
        const form = document.getElementById('form-login');
        const inputEmail = document.getElementById('login-email');
        const inputSenha = document.getElementById('login-senha');
        if (!form || !inputEmail || !inputSenha) return;

        const botaoEnviar = form.querySelector('button[type="submit"], button:not([type])');
        const titulo = document.querySelector('#login-screen h2');
        const textoBotaoOriginal = botaoEnviar ? botaoEnviar.textContent : 'Entrar';
        const tituloOriginal = titulo ? titulo.textContent : '';
        let modoCadastro = false;

        // Campo "Confirmar senha": copia o visual do campo de senha que já existe
        const blocoSenha = inputSenha.parentElement === form ? inputSenha : inputSenha.parentElement;
        const blocoConfirma = blocoSenha.cloneNode(true);
        const inputConfirma = blocoConfirma.tagName === 'INPUT' ? blocoConfirma : blocoConfirma.querySelector('input');
        inputConfirma.id = 'login-confirma-senha';
        inputConfirma.value = '';
        inputConfirma.placeholder = 'Repita a senha';
        const rotulo = blocoConfirma.querySelector ? blocoConfirma.querySelector('label') : null;
        if (rotulo) { rotulo.textContent = 'Confirmar senha'; rotulo.htmlFor = inputConfirma.id; }
        blocoConfirma.style.display = 'none';
        blocoSenha.insertAdjacentElement('afterend', blocoConfirma);

        // Mensagem de aviso e botão que alterna entre "Entrar" e "Criar conta"
        const aviso = document.createElement('div');
        aviso.style.cssText = 'min-height:1.2em; margin-top:12px; font-size:0.85rem; color:#EF5350;';
        const alternar = document.createElement('button');
        alternar.type = 'button';
        alternar.style.cssText = 'background:none; border:none; margin-top:14px; color:var(--bright-purple); cursor:pointer; font-size:0.9rem; text-decoration:underline;';
        form.appendChild(aviso);
        form.appendChild(alternar);

        function definirModo(cadastro) {
            modoCadastro = cadastro;
            blocoConfirma.style.display = cadastro ? '' : 'none';
            inputConfirma.required = cadastro; // campo escondido nunca pode bloquear o login
            inputConfirma.value = '';
            inputSenha.autocomplete = cadastro ? 'new-password' : 'current-password';
            if (botaoEnviar) botaoEnviar.textContent = cadastro ? 'Criar conta' : textoBotaoOriginal;
            if (titulo) titulo.textContent = cadastro ? 'Criar conta' : tituloOriginal;
            alternar.textContent = cadastro ? 'Já tenho conta. Entrar' : 'Não tem conta? Criar agora';
            aviso.textContent = '';
        }

        alternar.addEventListener('click', () => definirModo(!modoCadastro));

        // Fase de captura: no modo "Criar conta" interceptamos o envio antes do login original.
        // No modo "Entrar" não fazemos nada e o seu autenticarUsuario() roda normalmente.
        document.addEventListener('submit', async (event) => {
            if (event.target !== form || !modoCadastro) return;
            event.preventDefault();
            event.stopPropagation();

            const email = inputEmail.value.trim();
            const senha = inputSenha.value;

            if (senha.length < 6) { aviso.textContent = 'A senha deve ter pelo menos 6 caracteres.'; return; }
            if (senha !== inputConfirma.value) { aviso.textContent = 'As senhas não conferem.'; return; }

            aviso.textContent = 'Criando conta...';
            try {
                const resposta = await fetch(API_REGISTRO, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });
                const dados = await resposta.json();

                if (!resposta.ok) {
                    aviso.textContent = dados.erro || 'Não foi possível criar a conta.';
                    return;
                }

                definirModo(false);
                await autenticarUsuario({ preventDefault() {} }); // conta criada: já entra no sistema
            } catch (error) {
                console.error('Erro ao criar conta:', error);
                aviso.textContent = 'Não foi possível falar com o servidor (porta 3000).';
            }
        }, true);

        definirModo(false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarCadastroLogin);
    } else {
        iniciarCadastroLogin();
    }
})();