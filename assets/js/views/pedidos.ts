/* 
  views/pedidos.ts
  Renderizador da tela de Pedidos de Compra & Lista de Reposição.
*/

import { formatarDataBR, obterBotaoVoltarHTML, UI, formatarAssinatura } from '../ui.ts';
import { pedidosCompraMock, salvarPedidosCompra, paginaAtual, assinarCriacao, assinarModificacao } from '../state.ts';
import { PedidoCompra } from '../types.ts';

export const filtroPedidos = {
  status: 'todos', // 'todos' | 'Aberto' | 'Pedido' | 'Recebido'
  busca: ''
};
(window as any).filtroPedidos = filtroPedidos;

export function atualizarFiltroPedidos(status: string): void {
  filtroPedidos.status = status;
  const mainContent = document.getElementById('main-content');
  if (mainContent && paginaAtual === 'pedidos') {
    renderizarPedidos(mainContent);
  }
}
(window as any).atualizarFiltroPedidos = atualizarFiltroPedidos;

export function atualizarBuscaPedidos(texto: string): void {
  filtroPedidos.busca = texto.toLowerCase().trim();
  const mainContent = document.getElementById('main-content');
  if (mainContent && paginaAtual === 'pedidos') {
    renderizarPedidos(mainContent);
  }
}
(window as any).atualizarBuscaPedidos = atualizarBuscaPedidos;

export function abrirModalCadastroPedido(): void {
  UI.abrirModal(
    "Adicionar Item de Compra / Pedido",
    `
      <form id="form-cadastro-pedido" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="input-pedido-produto">Nome do Produto / Item</label>
          <input type="text" id="input-pedido-produto" class="input-field" placeholder="Ex: Película 3D iPhone 13, Conector Tipo-C" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="input-pedido-qtd">Quantidade Estimada</label>
          <input type="number" id="input-pedido-qtd" class="input-field" value="1" min="1" step="1" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="select-pedido-status">Status Inicial</label>
          <select id="select-pedido-status" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;">
            <option value="Aberto">Em Aberto (Planejado)</option>
            <option value="Pedido">Pedido Feito (Encomenda)</option>
            <option value="Recebido">Recebido (Em Estoque)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-pedido-obs">Observação / Nota</label>
          <input type="text" id="input-pedido-obs" class="input-field" placeholder="Ex: Fornecedor SP, urgência média" />
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-cadastro-pedido') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const produtoInput = document.getElementById('input-pedido-produto') as HTMLInputElement;
      const qtdInput = document.getElementById('input-pedido-qtd') as HTMLInputElement;
      const statusSelect = document.getElementById('select-pedido-status') as HTMLSelectElement;
      const obsInput = document.getElementById('input-pedido-obs') as HTMLInputElement;

      const produto = produtoInput.value.trim();
      const quantidadeEstimada = parseInt(qtdInput.value) || 1;
      const status = statusSelect.value as PedidoCompra['status'];
      const observacao = obsInput.value.trim();
      const dataHoje = new Date().toISOString().split('T')[0];

      const novoId = `P-${101 + pedidosCompraMock.length + Date.now().toString().slice(-3)}`;

      const novoPedido: PedidoCompra = {
        id: novoId,
        produto,
        quantidadeEstimada,
        status,
        data: dataHoje,
        observacao
      };

      assinarCriacao(novoPedido);
      pedidosCompraMock.unshift(novoPedido); // Coloca no topo
      salvarPedidosCompra();

      UI.mostrarToast('Item adicionado à lista de compras!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        if (paginaAtual === 'pedidos') {
          renderizarPedidos(mainContent);
        } else {
          // @ts-ignore
          const navegarPara = (window as any).navegarPara;
          if (typeof navegarPara === 'function') {
            navegarPara('pedidos');
          }
        }
      }
    },
    'Adicionar Item'
  );
}
(window as any).abrirModalCadastroPedido = abrirModalCadastroPedido;

export function abrirModalEditarPedido(id: string): void {
  const item = pedidosCompraMock.find(p => p.id === id);
  if (!item) {
    UI.mostrarToast('Pedido não encontrado.', 'danger');
    return;
  }

  UI.abrirModal(
    "Editar Item de Compra",
    `
      <form id="form-editar-pedido" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="edit-pedido-produto">Nome do Produto</label>
          <input type="text" id="edit-pedido-produto" class="input-field" value="${item.produto}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-pedido-qtd">Quantidade Estimada</label>
          <input type="number" id="edit-pedido-qtd" class="input-field" value="${item.quantidadeEstimada}" min="1" step="1" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-pedido-status">Status</label>
          <select id="edit-pedido-status" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;">
            <option value="Aberto" ${item.status === 'Aberto' ? 'selected' : ''}>Em Aberto (Planejado)</option>
            <option value="Pedido" ${item.status === 'Pedido' ? 'selected' : ''}>Pedido Feito (Encomenda)</option>
            <option value="Recebido" ${item.status === 'Recebido' ? 'selected' : ''}>Recebido (Em Estoque)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-pedido-obs">Observação / Nota</label>
          <input type="text" id="edit-pedido-obs" class="input-field" value="${item.observacao || ''}" placeholder="Ex: Fornecedor SP, urgência média" />
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-editar-pedido') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const produtoInput = document.getElementById('edit-pedido-produto') as HTMLInputElement;
      const qtdInput = document.getElementById('edit-pedido-qtd') as HTMLInputElement;
      const statusSelect = document.getElementById('edit-pedido-status') as HTMLSelectElement;
      const obsInput = document.getElementById('edit-pedido-obs') as HTMLInputElement;

      item.produto = produtoInput.value.trim();
      item.quantidadeEstimada = parseInt(qtdInput.value) || 1;
      item.status = statusSelect.value as PedidoCompra['status'];
      item.observacao = obsInput.value.trim();

      assinarModificacao(item);
      salvarPedidosCompra();

      UI.mostrarToast('Item de compra atualizado!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent && paginaAtual === 'pedidos') {
        renderizarPedidos(mainContent);
      }
    },
    'Salvar Alterações'
  );
}
(window as any).abrirModalEditarPedido = abrirModalEditarPedido;

export function alterarStatusPedido(id: string, novoStatus: 'Aberto' | 'Pedido' | 'Recebido'): void {
  const item = pedidosCompraMock.find(p => p.id === id);
  if (!item) return;

  item.status = novoStatus;
  assinarModificacao(item);
  salvarPedidosCompra();

  let msg = '';
  if (novoStatus === 'Aberto') msg = `Item '${item.produto}' voltou para Em Aberto.`;
  if (novoStatus === 'Pedido') msg = `Item '${item.produto}' marcado como Pedido Realizado!`;
  if (novoStatus === 'Recebido') msg = `Item '${item.produto}' marcado como Recebido/Estoque!`;

  UI.mostrarToast(msg, 'success');

  const mainContent = document.getElementById('main-content');
  if (mainContent && paginaAtual === 'pedidos') {
    renderizarPedidos(mainContent);
  }
}
(window as any).alterarStatusPedido = alterarStatusPedido;

export function excluirPedido(id: string): void {
  UI.abrirModal(
    "Excluir Item de Compra",
    `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%; box-sizing: border-box;">
        <p style="color: var(--color-danger); font-weight: 500; font-size: 0.95rem; margin: 0;">Tem certeza que deseja excluir este item da lista?</p>
        <p class="text-muted" style="font-size: 0.8rem; margin: 0; line-height: 1.4;">Esta ação removerá permanentemente o produto da sua lista de reposição.</p>
      </div>
    `,
    () => {
      const index = pedidosCompraMock.findIndex(p => p.id === id);
      if (index !== -1) {
        pedidosCompraMock.splice(index, 1);
        salvarPedidosCompra();
        UI.mostrarToast('Item excluído com sucesso!', 'success');
        
        const mainContent = document.getElementById('main-content');
        if (mainContent && paginaAtual === 'pedidos') {
          renderizarPedidos(mainContent);
        }
      }
    },
    'Excluir'
  );
}
(window as any).excluirPedido = excluirPedido;

export function renderizarPedidos(container: HTMLElement): void {
  const pageElement = document.createElement('div');
  pageElement.className = 'page-container fade-in';

  // Métricas
  let totalAberto = 0;
  let totalPedido = 0;
  let totalRecebido = 0;

  pedidosCompraMock.forEach(p => {
    if (p.status === 'Aberto') totalAberto++;
    else if (p.status === 'Pedido') totalPedido++;
    else if (p.status === 'Recebido') totalRecebido++;
  });

  // Filtrar
  const pedidosFiltrados = pedidosCompraMock.filter(item => {
    const statusBate = filtroPedidos.status === 'todos' || item.status === filtroPedidos.status;
    const buscaBate = !filtroPedidos.busca || 
      item.produto.toLowerCase().includes(filtroPedidos.busca) || 
      (item.observacao && item.observacao.toLowerCase().includes(filtroPedidos.busca));
    return statusBate && buscaBate;
  });

  let listItemsHTML = '';
  pedidosFiltrados.forEach(item => {
    // Definindo estilo de badge do status
    let badgeHTML = '';
    let actionButtonHTML = '';

    if (item.status === 'Aberto') {
      badgeHTML = `<span class="badge" style="background: rgba(168, 85, 247, 0.12); color: rgb(192, 132, 252); border: 1px solid rgba(168, 85, 247, 0.2);">Em Aberto</span>`;
      actionButtonHTML = `
        <button class="btn" onclick="alterarStatusPedido('${item.id}', 'Pedido')" style="background: rgba(168, 85, 247, 0.15); color: #e9d5ff; font-size: 0.72rem; padding: 4px 8px; border: 1px solid rgba(168, 85, 247, 0.3); cursor: pointer; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 4px;">
          <span>📦</span> Pedir
        </button>
      `;
    } else if (item.status === 'Pedido') {
      badgeHTML = `<span class="badge" style="background: rgba(234, 179, 8, 0.12); color: rgb(250, 204, 21); border: 1px solid rgba(234, 179, 8, 0.2);">Pedido Feito</span>`;
      actionButtonHTML = `
        <button class="btn" onclick="alterarStatusPedido('${item.id}', 'Recebido')" style="background: rgba(34, 197, 94, 0.15); color: #bbf7d0; font-size: 0.72rem; padding: 4px 8px; border: 1px solid rgba(34, 197, 94, 0.3); cursor: pointer; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 4px;">
          <span>✅</span> Recebido
        </button>
      `;
    } else {
      badgeHTML = `<span class="badge badge-success">Recebido</span>`;
      actionButtonHTML = `
        <button class="btn" onclick="alterarStatusPedido('${item.id}', 'Aberto')" style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); font-size: 0.72rem; padding: 4px 8px; border: 1px solid rgba(255, 255, 255, 0.1); cursor: pointer; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 4px;">
          <span>🔄</span> Reabrir
        </button>
      `;
    }

    listItemsHTML += `
      <div class="list-item" style="padding: var(--spacing-sm) var(--spacing-md); gap: var(--spacing-sm); align-items: center; background-color: ${item.status === 'Recebido' ? 'rgba(34, 197, 94, 0.02)' : 'var(--bg-secondary)'}; border-color: ${item.status === 'Recebido' ? 'rgba(34, 197, 94, 0.15)' : 'var(--border-color)'}; opacity: ${item.status === 'Recebido' ? '0.85' : '1'};">
        <div style="min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: var(--spacing-xs); flex-wrap: wrap;">
            ${badgeHTML}
            <h4 class="font-highlight" style="font-size: 0.95rem; margin: 0; color: var(--text-primary); font-weight: 600;">${item.produto}</h4>
            <span style="font-family: var(--font-mono); font-size: 0.8rem; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); padding: 1px 6px; border-radius: 4px; font-weight: bold; color: var(--text-secondary);">
              Qtd: ${item.quantidadeEstimada}
            </span>
          </div>
          ${item.observacao ? `<p class="text-muted" style="font-size: 0.78rem; margin: 2px 0 0 0; font-style: italic;">Obs: ${item.observacao}</p>` : ''}
          <p class="text-muted" style="font-size: 0.7rem; margin: 2px 0 0 0;">
            Data: ${formatarDataBR(item.data)}${formatarAssinatura(item)}
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: var(--spacing-sm); flex-shrink: 0;">
          <!-- Botão de Ação Rápida de Status -->
          <div style="display: flex; align-items: center;">
            ${actionButtonHTML}
          </div>
          
          <!-- Botões de Edição/Exclusão -->
          <div style="display: flex; align-items: center; gap: 4px; border-left: 1px solid var(--border-color); padding-left: var(--spacing-xs);">
            <button onclick="abrirModalEditarPedido('${item.id}')" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: background-color var(--transition-fast);" onmouseenter="this.style.backgroundColor='rgba(59, 130, 246, 0.15)'" onmouseleave="this.style.backgroundColor='transparent'" title="Editar item">
              <svg style="width: 0.85rem; height: 0.85rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </button>
            <button onclick="excluirPedido('${item.id}')" style="background: none; border: none; color: var(--color-danger); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: background-color var(--transition-fast);" onmouseenter="this.style.backgroundColor='rgba(255, 69, 58, 0.15)'" onmouseleave="this.style.backgroundColor='transparent'" title="Remover da lista">
              <svg style="width: 0.85rem; height: 0.85rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  if (pedidosFiltrados.length === 0) {
    listItemsHTML = `
      <div style="text-align: center; padding: var(--spacing-xl) var(--spacing-md); color: var(--text-muted); font-size: 0.85rem; background: var(--bg-tertiary); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
        Nenhum item de reposição encontrado para esta seleção.
      </div>
    `;
  }

  pageElement.innerHTML = `
    <div class="page-header" style="display: flex; align-items: center; justify-content: flex-start; gap: var(--spacing-xs);">
      ${obterBotaoVoltarHTML()}
      <div>
        <h2 class="page-title">Lista de Pedidos & Compras</h2>
        <p class="page-subtitle">Controle de pedidos de peças, estoque e insumos de reposição</p>
      </div>
    </div>

    <!-- Painel de Métricas Rápidas -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
      <div class="card" style="padding: var(--spacing-sm); display: flex; flex-direction: column; gap: 2px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); align-items: center; text-align: center;">
        <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; background: rgb(192, 132, 252); border-radius: 50%;"></span>
          Em Aberto
        </span>
        <span style="font-size: 1.25rem; font-weight: bold; font-family: var(--font-mono); color: rgb(192, 132, 252);">${totalAberto}</span>
      </div>
      <div class="card" style="padding: var(--spacing-sm); display: flex; flex-direction: column; gap: 2px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); align-items: center; text-align: center;">
        <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; background: rgb(250, 204, 21); border-radius: 50%;"></span>
          Pedidos Feitos
        </span>
        <span style="font-size: 1.25rem; font-weight: bold; font-family: var(--font-mono); color: rgb(250, 204, 21);">${totalPedido}</span>
      </div>
      <div class="card" style="padding: var(--spacing-sm); display: flex; flex-direction: column; gap: 2px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); align-items: center; text-align: center;">
        <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; background: var(--color-success); border-radius: 50%;"></span>
          Recebidos
        </span>
        <span style="font-size: 1.25rem; font-weight: bold; font-family: var(--font-mono); color: var(--color-success);">${totalRecebido}</span>
      </div>
    </div>

    <!-- Filtros de Busca e Status -->
    <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
      
      <!-- Campo de Busca de Produto -->
      <div style="position: relative; width: 100%;">
        <input type="text" id="input-buscar-pedidos" class="input-field" placeholder="Buscar produto ou observação..." value="${filtroPedidos.busca}" oninput="atualizarBuscaPedidos(this.value)" style="padding-left: 2.25rem; height: 2.25rem; font-size: 0.85rem;" />
        <svg style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); width: 0.9rem; height: 0.9rem; color: var(--text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-sm); flex-wrap: wrap;">
        <!-- Tabs de Status -->
        <div style="display: flex; gap: 4px; overflow-x: auto; padding-bottom: 2px; flex-shrink: 0;">
          <button class="btn ${filtroPedidos.status === 'todos' ? 'btn-primary' : 'btn-secondary'}" onclick="atualizarFiltroPedidos('todos')" style="font-size: 0.72rem; padding: 4px 10px; height: 1.85rem; border-radius: var(--radius-sm); white-space: nowrap;">
            Todos (${pedidosCompraMock.length})
          </button>
          <button class="btn ${filtroPedidos.status === 'Aberto' ? 'btn-primary' : 'btn-secondary'}" onclick="atualizarFiltroPedidos('Aberto')" style="font-size: 0.72rem; padding: 4px 10px; height: 1.85rem; border-radius: var(--radius-sm); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
            <span style="width: 5px; height: 5px; background: ${filtroPedidos.status === 'Aberto' ? '#fff' : 'rgb(192, 132, 252)'}; border-radius: 50%;"></span>
            Em Aberto (${totalAberto})
          </button>
          <button class="btn ${filtroPedidos.status === 'Pedido' ? 'btn-primary' : 'btn-secondary'}" onclick="atualizarFiltroPedidos('Pedido')" style="font-size: 0.72rem; padding: 4px 10px; height: 1.85rem; border-radius: var(--radius-sm); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
            <span style="width: 5px; height: 5px; background: ${filtroPedidos.status === 'Pedido' ? '#fff' : 'rgb(250, 204, 21)'}; border-radius: 50%;"></span>
            Pedidos (${totalPedido})
          </button>
          <button class="btn ${filtroPedidos.status === 'Recebido' ? 'btn-primary' : 'btn-secondary'}" onclick="atualizarFiltroPedidos('Recebido')" style="font-size: 0.72rem; padding: 4px 10px; height: 1.85rem; border-radius: var(--radius-sm); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
            <span style="width: 5px; height: 5px; background: ${filtroPedidos.status === 'Recebido' ? '#fff' : 'var(--color-success)'}; border-radius: 50%;"></span>
            Recebidos (${totalRecebido})
          </button>
        </div>

        <!-- Botão Adicionar -->
        <button class="btn btn-primary" onclick="abrirModalCadastroPedido()" style="font-size: 0.72rem; padding: 0 var(--spacing-sm); height: 1.85rem; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 4px;">
          <svg style="width: 0.85rem; height: 0.85rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Adicionar Item
        </button>
      </div>
    </div>

    <!-- Lista de Itens -->
    <div class="list-container">
      ${listItemsHTML}
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(pageElement);
}
(window as any).renderizarPedidos = renderizarPedidos;
