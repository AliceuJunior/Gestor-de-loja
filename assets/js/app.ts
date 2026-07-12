/* 
  app.ts
  Ponto de entrada principal do Gestor da Loja.
  Gerencia o motor de roteamento do SPA e a inicialização geral do sistema.
*/

import { UI } from './ui.ts';
import { 
  paginaAtual, 
  setPaginaAtual, 
  pilhaHistorico, 
  recalcularDadosDashboard, 
  dadosDashboardMock,
  usuarioLogado
} from './state.ts';

// Importa as views para garantir que seus métodos de ciclo de vida e ligações de janela (window) sejam registrados
import { renderizarDashboard } from './views/dashboard.ts';
import { renderizarManutencoes, abrirModalCadastroServico } from './views/manutencoes.ts';
import { renderizarDespesas, abrirModalCadastroDespesa } from './views/despesas.ts';
import { renderizarRetiradas, abrirModalCadastroRetirada } from './views/retiradas.ts';
import { renderizarVendas, abrirModalCadastroVenda } from './views/vendas.ts';
import { renderizarAjustes } from './views/ajustes.ts';
import { renderizarLogin } from './views/login.ts';
import { renderizarPedidos, abrirModalCadastroPedido } from './views/pedidos.ts';
import { renderizarAvisos, abrirModalCadastroAviso } from './views/avisos.ts';

// ==========================================================================
// Motor de Navegação SPA / Máquina de Roteamento
// ==========================================================================
export function navegarPara(page: string, registrarHistorico: boolean = true): void {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Garante que o scroll do conteúdo principal volte para o topo ao mudar de aba/página
  mainContent.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // Roteamento de Segurança: Redireciona para login se não estiver logado (Desativado temporariamente)
  /*
  if (!usuarioLogado && page !== 'login') {
    page = 'login';
    registrarHistorico = false;
  }
  */

  console.log(`SPA navegando para: ${page}`);

  // Registra a página atual na pilha de histórico antes de ir para a próxima
  if (registrarHistorico && page !== paginaAtual) {
    pilhaHistorico.push(paginaAtual);
  }

  // Atualiza a página atual ativa globalmente
  setPaginaAtual(page);

  // Exibição condicional do cabeçalho e menu de navegação com base na autenticação
  const header = document.querySelector('.app-header') as HTMLElement;
  const bottomNav = document.querySelector('.bottom-nav') as HTMLElement;

  if (page === 'login') {
    if (header) header.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
  } else {
    if (header) header.style.display = 'flex';
    if (bottomNav) bottomNav.style.display = '';
  }

  // 1. Atualizar o visual da barra de navegação (Bottom Nav)
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => {
    const pageAttr = item.getAttribute('data-page');
    if (pageAttr === page) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // 1.2. Atualizar o visual do menu lateral (Sidebar Nav)
  const sidebarNavItems = document.querySelectorAll('.sidebar-drawer .sidebar-nav-item');
  sidebarNavItems.forEach(item => {
    const pageAttr = item.getAttribute('data-page');
    if (pageAttr === page) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // 2. Renderizar a view correspondente
  switch (page) {
    case 'login':
      renderizarLogin(mainContent);
      break;
    case 'dashboard':
      renderizarDashboard(mainContent, dadosDashboardMock);
      break;
    case 'manutencoes':
      renderizarManutencoes(mainContent);
      break;
    case 'despesas':
      renderizarDespesas(mainContent);
      break;
    case 'retiradas':
      renderizarRetiradas(mainContent);
      break;
    case 'vendas':
      renderizarVendas(mainContent);
      break;
    case 'ajustes':
      renderizarAjustes(mainContent);
      break;
    case 'pedidos':
      renderizarPedidos(mainContent);
      break;
    case 'avisos':
      renderizarAvisos(mainContent);
      break;
    default:
      renderizarDashboard(mainContent, dadosDashboardMock);
  }
}


// Função de retrocesso na pilha de histórico
export function voltarPagina(): void {
  if (pilhaHistorico.length > 0) {
    const paginaAnterior = pilhaHistorico.pop();
    if (paginaAnterior) {
      navegarPara(paginaAnterior, false); // false evita reinscrever na pilha
    }
  } else {
    // Se a pilha estiver vazia por algum motivo, garante a volta para o Painel Principal
    navegarPara('dashboard', false);
  }
}

// Vincula as funções ao escopo global (window) para que as tags HTML possam dispará-las
(window as any).navegarPara = navegarPara;
(window as any).voltarPagina = voltarPagina;

// ==========================================================================
// Inicialização do SPA e Escuta de Eventos
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa o Gerenciador de UI Reutilizável (Toasts e Modais)
  UI.inicializar();
  UI.mostrarToast('Bem-vindo ao Gestor da Loja!', 'success');

  // Recalcular métricas iniciais a partir do mock
  recalcularDadosDashboard();

  // Inicializa de acordo com o estado de login
  if (usuarioLogado) {
    const display = document.getElementById('user-name-display');
    if (display) {
      display.textContent = usuarioLogado.nome;
    }
    navegarPara('dashboard', false);
  } else {
    navegarPara('login', false);
  }

  // Adiciona listeners para os itens da barra de navegação inferior
  const navButtons = document.querySelectorAll('.bottom-nav .nav-item');
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const page = button.getAttribute('data-page');
      if (page) {
        navegarPara(page);
      }
    });
  });

  // Botão de atalho rápido de configurações no cabeçalho
  const btnSettings = document.getElementById('btn-header-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      navegarPara('ajustes');
    });
  }

  // --- MENU LATERAL (SIDEBAR DRAWER) ---
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const btnToggle = document.getElementById('btn-sidebar-toggle');
  const btnClose = document.getElementById('btn-sidebar-close');

  const abrirSidebar = () => {
    if (sidebar && backdrop) {
      sidebar.classList.add('open');
      backdrop.classList.add('open');
    }
  };

  const fecharSidebar = () => {
    if (sidebar && backdrop) {
      sidebar.classList.remove('open');
      backdrop.classList.remove('open');
    }
  };

  if (btnToggle) btnToggle.addEventListener('click', abrirSidebar);
  if (btnClose) btnClose.addEventListener('click', fecharSidebar);
  if (backdrop) backdrop.addEventListener('click', fecharSidebar);

  // Navegar via links da Sidebar
  const sidebarItems = document.querySelectorAll('.sidebar-drawer .sidebar-nav-item');
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      if (page) {
        navegarPara(page);
        fecharSidebar();
      }
    });
  });

  // Botão central de ação rápida (+) - Agora direciona direto para adição contextual!
  const btnQuickAdd = document.getElementById('btn-quick-add');
  if (btnQuickAdd) {
    btnQuickAdd.addEventListener('click', () => {
      const page = paginaAtual;
      if (page === 'manutencoes') {
        abrirModalCadastroServico();
      } else if (page === 'despesas') {
        abrirModalCadastroDespesa();
      } else if (page === 'retiradas') {
        abrirModalCadastroRetirada();
      } else if (page === 'pedidos') {
        abrirModalCadastroPedido();
      } else if (page === 'avisos') {
        abrirModalCadastroAviso();
      } else if (page === 'vendas') {
        abrirModalCadastroVenda();
      } else {
        // Se estiver no Dashboard ou Ajustes, abre a seleção interativa como fallback inteligente
        UI.abrirModal(
          "Ações Rápidas",
          `
            <div style="display: flex; flex-direction: column; gap: var(--spacing-md); padding: var(--spacing-xs) 0;">
              <p class="text-muted" style="font-size: 0.85rem; margin-bottom: var(--spacing-xs);">
                Selecione o tipo de registro operacional que deseja lançar agora na assistência:
              </p>
              
              <button class="btn btn-secondary" onclick="UI.fecharModal(); abrirModalCadastroServico();" style="justify-content: flex-start; text-align: left; width: 100%; gap: var(--spacing-md); padding: var(--spacing-md); border-radius: var(--radius-md);">
                <span style="font-size: 1.25rem;">🔧</span>
                <div>
                  <strong style="display: block; color: var(--text-primary); font-size: 0.9rem;">Registrar Manutenção</strong>
                  <span class="text-muted" style="font-size: 0.75rem; font-weight: normal;">Cadastrar nova ordem de serviço e peças</span>
                </div>
              </button>

              <button class="btn btn-secondary" onclick="UI.fecharModal(); abrirModalCadastroDespesa();" style="justify-content: flex-start; text-align: left; width: 100%; gap: var(--spacing-md); padding: var(--spacing-md); border-radius: var(--radius-md);">
                <span style="font-size: 1.25rem;">💸</span>
                <div>
                  <strong style="display: block; color: var(--text-primary); font-size: 0.9rem;">Lançar Despesa</strong>
                  <span class="text-muted" style="font-size: 0.75rem; font-weight: normal;">Registrar custos fixos, variáveis ou de estoque</span>
                </div>
              </button>

              <button class="btn btn-secondary" onclick="UI.fecharModal(); abrirModalCadastroVenda();" style="justify-content: flex-start; text-align: left; width: 100%; gap: var(--spacing-md); padding: var(--spacing-md); border-radius: var(--radius-md);">
                <span style="font-size: 1.25rem;">💰</span>
                <div>
                  <strong style="display: block; color: var(--text-primary); font-size: 0.9rem;">Lançar Venda Diária</strong>
                  <span class="text-muted" style="font-size: 0.75rem; font-weight: normal;">Registrar faturamento diário (pix, crédito, débito, dinheiro)</span>
                </div>
              </button>

              <button class="btn btn-secondary" onclick="UI.fecharModal(); abrirModalCadastroRetirada();" style="justify-content: flex-start; text-align: left; width: 100%; gap: var(--spacing-md); padding: var(--spacing-md); border-radius: var(--radius-md);">
                <span style="font-size: 1.25rem;">🏧</span>
                <div>
                  <strong style="display: block; color: var(--text-primary); font-size: 0.9rem;">Retirada de Sócio</strong>
                  <span class="text-muted" style="font-size: 0.75rem; font-weight: normal;">Registrar retiradas de pró-labore do saldo livre</span>
                </div>
              </button>

              <button class="btn btn-secondary" onclick="UI.fecharModal(); abrirModalCadastroPedido();" style="justify-content: flex-start; text-align: left; width: 100%; gap: var(--spacing-md); padding: var(--spacing-md); border-radius: var(--radius-md);">
                <span style="font-size: 1.25rem;">📝</span>
                <div>
                  <strong style="display: block; color: var(--text-primary); font-size: 0.9rem;">Fazer Pedido / Item de Compra</strong>
                  <span class="text-muted" style="font-size: 0.75rem; font-weight: normal;">Inserir novo produto na lista de compras e reposição</span>
                </div>
              </button>
            </div>
          `
        );
      }
    });
  }
});
