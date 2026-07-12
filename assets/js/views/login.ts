/* 
  views/login.ts
  Renderizador da tela de Login e Cadastro de Usuários.
  Usa criptografia local via SHA-256 (Web Crypto API) para segurança da senha.
*/

import { UI } from '../ui.ts';
import { 
  usuariosMock, 
  definirUsuarioLogado, 
  registrarUsuario,
  hashSenha
} from '../state.ts';
import { Usuario } from '../types.ts';

// Estado local da view de login
let modoCadastro = false;

export function renderizarLogin(container: HTMLElement): void {
  // Verifica se não há usuários cadastrados no sistema
  const semUsuarios = usuariosMock.length === 0;
  
  // Se não houver nenhum usuário cadastrado, força a exibição da tela de cadastro de forma inteligente
  if (semUsuarios && !modoCadastro) {
    modoCadastro = true;
  }

  const pageElement = document.createElement('div');
  pageElement.className = 'login-page-container fade-in';
  pageElement.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 10px);
    width: 100%;
    padding: var(--spacing-md);
    background-color: var(--bg-app);
  `;

  // HTML da tela de Login / Cadastro
  pageElement.innerHTML = `
    <div class="login-card" style="
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    ">
      
      <!-- Cabeçalho do Card -->
      <div style="text-align: center; display: flex; flex-direction: column; gap: var(--spacing-xs);">
        <div style="
          font-size: 2.25rem;
          margin-bottom: var(--spacing-xs);
          display: flex;
          align-items: center;
          justify-content: center;
        ">📱</div>
        <h2 style="
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        ">
          ${modoCadastro ? 'Criar Nova Conta' : 'Gestor da Loja'}
        </h2>
        <p class="text-muted" style="font-size: 0.85rem;">
          ${modoCadastro 
            ? 'Cadastre-se para registrar e auditar suas movimentações financeiras com segurança' 
            : 'Controle operacional e financeiro seguro para sua assistência técnica'}
        </p>
      </div>

      <!-- Alerta Informativo se não houver usuários cadastrados -->
      ${semUsuarios ? `
        <div style="
          background-color: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          font-size: 0.8rem;
          color: var(--color-primary);
          display: flex;
          gap: var(--spacing-sm);
          align-items: flex-start;
          text-align: left;
        ">
          <span style="font-size: 1.15rem; line-height: 1;">💡</span>
          <div>
            <strong>Primeiro Acesso!</strong><br/>
            Crie sua conta administrativa principal de forma local e segura para começar a gerenciar sua loja.
          </div>
        </div>
      ` : ''}

      <!-- Formulário Operacional -->
      <form id="form-auth" style="display: flex; flex-direction: column; gap: var(--spacing-md);" onsubmit="event.preventDefault();">
        
        ${modoCadastro ? `
          <!-- Campo Nome Completo (Somente no Cadastro) -->
          <div class="form-group">
            <label class="form-label" for="auth-nome">Nome Completo</label>
            <input type="text" id="auth-nome" class="input-field" placeholder="Ex: João Silva" required style="height: 2.75rem;" />
          </div>
        ` : ''}

        <!-- Campo Nome de Usuário (Username) -->
        <div class="form-group">
          <label class="form-label" for="auth-username">Nome de Usuário (Login)</label>
          <input type="text" id="auth-username" class="input-field" placeholder="Ex: joao.silva" required style="height: 2.75rem;" autocomplete="username" />
        </div>

        <!-- Campo Senha -->
        <div class="form-group">
          <label class="form-label" for="auth-password">Senha de Acesso</label>
          <input type="password" id="auth-password" class="input-field" placeholder="Sua senha secreta" required style="height: 2.75rem;" autocomplete="current-password" />
        </div>

        ${modoCadastro ? `
          <!-- Campo Confirmar Senha (Somente no Cadastro) -->
          <div class="form-group">
            <label class="form-label" for="auth-confirm-password">Confirmar Senha</label>
            <input type="password" id="auth-confirm-password" class="input-field" placeholder="Digite a senha novamente" required style="height: 2.75rem;" autocomplete="new-password" />
          </div>
        ` : ''}

        <button type="submit" id="btn-submit-auth" class="btn btn-primary" style="height: 2.75rem; font-weight: 600; width: 100%; margin-top: var(--spacing-xs);">
          ${modoCadastro ? 'Criar Minha Conta' : 'Acessar o Sistema'}
        </button>
      </form>

      <!-- Rodapé / Toggle de Modo -->
      ${!semUsuarios ? `
        <div style="text-align: center; font-size: 0.85rem; margin-top: var(--spacing-xs);">
          <span class="text-muted">
            ${modoCadastro ? 'Já possui uma conta?' : 'Ainda não possui conta?'}
          </span>
          <button id="btn-toggle-modo" style="
            background: none;
            border: none;
            color: var(--color-primary);
            font-weight: 600;
            cursor: pointer;
            padding: 0;
            margin-left: 4px;
            text-decoration: underline;
          ">
            ${modoCadastro ? 'Fazer Login' : 'Cadastre-se'}
          </button>
        </div>
      ` : ''}
    </div>
  `;

  // Vincula ouvintes de eventos para o formulário e botões
  const form = pageElement.querySelector('#form-auth') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const usernameInput = pageElement.querySelector('#auth-username') as HTMLInputElement;
      const passwordInput = pageElement.querySelector('#auth-password') as HTMLInputElement;
      
      const username = usernameInput.value.trim().toLowerCase();
      const password = passwordInput.value;

      if (!username || !password) {
        UI.mostrarToast('Por favor, preencha todos os campos.', 'danger');
        return;
      }

      const btnSubmit = pageElement.querySelector('#btn-submit-auth') as HTMLButtonElement;
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerText = modoCadastro ? 'Criando...' : 'Acessando...';
      }

      try {
        if (modoCadastro) {
          const nomeInput = pageElement.querySelector('#auth-nome') as HTMLInputElement;
          const confirmPasswordInput = pageElement.querySelector('#auth-confirm-password') as HTMLInputElement;
          
          const nome = nomeInput.value.trim();
          const confirmPassword = confirmPasswordInput.value;

          if (!nome) {
            UI.mostrarToast('Por favor, insira o seu nome completo.', 'danger');
            resetSubmitButton();
            return;
          }

          if (password !== confirmPassword) {
            UI.mostrarToast('As senhas digitadas não coincidem!', 'danger');
            resetSubmitButton();
            return;
          }

          if (password.length < 4) {
            UI.mostrarToast('A senha deve conter no mínimo 4 caracteres.', 'danger');
            resetSubmitButton();
            return;
          }

          // Verifica se o usuário já existe
          const usuarioExistente = usuariosMock.find(u => u.username === username);
          if (usuarioExistente) {
            UI.mostrarToast('Este nome de usuário já está sendo utilizado.', 'danger');
            resetSubmitButton();
            return;
          }

          // Criptografa a senha usando SHA-256 antes de salvar localmente
          const senhaHash = await hashSenha(password);
          
          const novoUsuario: Usuario = {
            username,
            nome,
            senhaHash
          };

          // Salva no estado e LocalStorage
          registrarUsuario(novoUsuario);
          definirUsuarioLogado(novoUsuario);

          UI.mostrarToast(`Conta criada com sucesso! Bem-vindo, ${nome}!`, 'success');
          
          // Entra no sistema
          modoCadastro = false;
          const nav = (window as any).navegarPara;
          if (typeof nav === 'function') {
            nav('dashboard');
          }

        } else {
          // Processo de Login
          const usuario = usuariosMock.find(u => u.username === username);
          if (!usuario) {
            UI.mostrarToast('Nome de usuário não encontrado.', 'danger');
            resetSubmitButton();
            return;
          }

          const hashDigitado = await hashSenha(password);
          if (usuario.senhaHash !== hashDigitado) {
            UI.mostrarToast('Senha incorreta! Tente novamente.', 'danger');
            resetSubmitButton();
            return;
          }

          // Define como usuário ativo logado
          definirUsuarioLogado(usuario);
          UI.mostrarToast(`Bem-vindo de volta, ${usuario.nome}!`, 'success');

          const nav = (window as any).navegarPara;
          if (typeof nav === 'function') {
            nav('dashboard');
          }
        }
      } catch (err) {
        console.error(err);
        UI.mostrarToast('Ocorreu um erro no processamento das credenciais.', 'danger');
        resetSubmitButton();
      }

      function resetSubmitButton(): void {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerText = modoCadastro ? 'Criar Minha Conta' : 'Acessar o Sistema';
        }
      }
    });
  }

  // Ouvinte de clique para alternar modo (Login / Cadastro)
  const btnToggleModo = pageElement.querySelector('#btn-toggle-modo');
  if (btnToggleModo) {
    btnToggleModo.addEventListener('click', () => {
      modoCadastro = !modoCadastro;
      renderizarLogin(container);
    });
  }

  // Injeta o card na tela
  container.innerHTML = '';
  container.appendChild(pageElement);
}
