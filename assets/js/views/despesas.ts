/* 
  views/despesas.ts
  Renderizador da tela de Despesas & Gastos.
*/

import { formatarMoeda, formatarDataBR, obterBotaoVoltarHTML, UI, formatarAssinatura } from '../ui.ts';
import { despesasMock, recalcularDadosDashboard, paginaAtual, assinarCriacao, assinarModificacao } from '../state.ts';
import { Despesa } from '../types.ts';

export const filtroDespesas = {
  tipo: 'todos' // 'todos' | 'Fixa' | 'Pontual'
};
(window as any).filtroDespesas = filtroDespesas;

export function atualizarFiltroDespesas(tipo: string): void {
  filtroDespesas.tipo = tipo;
  const mainContent = document.getElementById('main-content');
  if (mainContent && paginaAtual === 'despesas') {
    renderizarDespesas(mainContent);
  }
}
(window as any).atualizarFiltroDespesas = atualizarFiltroDespesas;

export function abrirModalCadastroDespesa(): void {
  const dataHoje = new Date().toISOString().split('T')[0];
  UI.abrirModal(
    "Lançar Nova Despesa",
    `
      <form id="form-cadastro-despesa" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="input-despesa-descricao">Descrição da Despesa</label>
          <input type="text" id="input-despesa-descricao" class="input-field" placeholder="Ex: Conta de Internet" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="select-despesa-tipo">Tipo de Despesa</label>
          <select id="select-despesa-tipo" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;">
            <option value="Fixa">Despesa Fixa (Recorrente/Mensal)</option>
            <option value="Pontual">Gasto Pontual (Eventual/Único)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="select-despesa-categoria">Categoria</label>
          <select id="select-despesa-categoria" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;">
            <option value="Mercadoria">Mercadoria</option>
            <option value="Infraestrutura">Infraestrutura</option>
            <option value="Marketing">Marketing</option>
            <option value="Pessoal">Pessoal</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-despesa-valor">Valor (R$)</label>
          <input type="number" id="input-despesa-valor" class="input-field" placeholder="0.00" step="0.01" min="0.01" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="select-despesa-paga">Status do Pagamento</label>
          <select id="select-despesa-paga" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;">
            <option value="true">Pago</option>
            <option value="false">Pendente</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-despesa-vencimento">Data de Vencimento</label>
          <input type="date" id="input-despesa-vencimento" class="input-field" value="${dataHoje}" required />
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-cadastro-despesa') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const descricaoInput = document.getElementById('input-despesa-descricao') as HTMLInputElement;
      const tipoSelect = document.getElementById('select-despesa-tipo') as HTMLSelectElement;
      const categoriaSelect = document.getElementById('select-despesa-categoria') as HTMLSelectElement;
      const valorInput = document.getElementById('input-despesa-valor') as HTMLInputElement;
      const pagaSelect = document.getElementById('select-despesa-paga') as HTMLSelectElement;
      const vencimentoInput = document.getElementById('input-despesa-vencimento') as HTMLInputElement;

      const descricao = descricaoInput.value.trim();
      const tipo = tipoSelect.value as Despesa['tipo'];
      const categoria = categoriaSelect.value as Despesa['categoria'];
      const valor = parseFloat(valorInput.value) || 0;
      const paga = pagaSelect.value === 'true';
      const dataVencimento = vencimentoInput.value || dataHoje;

      const novoId = `D-${201 + despesasMock.length}`;

      const novaDespesa: Despesa = {
        id: novoId,
        descricao,
        tipo,
        categoria,
        valor,
        paga,
        dataVencimento
      };
      
      assinarCriacao(novaDespesa);
      despesasMock.push(novaDespesa);

      localStorage.setItem('gestor_despesas', JSON.stringify(despesasMock));
      recalcularDadosDashboard();
      UI.mostrarToast('Despesa lançada com sucesso!', 'success');
      
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        renderizarDespesas(mainContent);
      }
    },
    'Lançar Despesa'
  );
}
(window as any).abrirModalCadastroDespesa = abrirModalCadastroDespesa;

export function abrirModalEditarDespesa(id: string): void {
  const item = despesasMock.find(d => d.id === id);
  if (!item) {
    UI.mostrarToast('Despesa não encontrada.', 'danger');
    return;
  }

  UI.abrirModal(
    "Editar Despesa",
    `
      <form id="form-editar-despesa" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="edit-despesa-descricao">Descrição da Despesa</label>
          <input type="text" id="edit-despesa-descricao" class="input-field" value="${item.descricao}" placeholder="Ex: Conta de Internet" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-despesa-tipo">Tipo de Despesa</label>
          <select id="edit-despesa-tipo" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;">
            <option value="Fixa" ${item.tipo === 'Fixa' ? 'selected' : ''}>Despesa Fixa (Recorrente/Mensal)</option>
            <option value="Pontual" ${item.tipo === 'Pontual' ? 'selected' : ''}>Gasto Pontual (Eventual/Único)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-despesa-categoria">Categoria</label>
          <select id="edit-despesa-categoria" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;">
            <option value="Mercadoria" ${item.categoria === 'Mercadoria' ? 'selected' : ''}>Mercadoria</option>
            <option value="Infraestrutura" ${item.categoria === 'Infraestrutura' ? 'selected' : ''}>Infraestrutura</option>
            <option value="Marketing" ${item.categoria === 'Marketing' ? 'selected' : ''}>Marketing</option>
            <option value="Pessoal" ${item.categoria === 'Pessoal' ? 'selected' : ''}>Pessoal</option>
            <option value="Outros" ${item.categoria === 'Outros' ? 'selected' : ''}>Outros</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-despesa-valor">Valor (R$)</label>
          <input type="number" id="edit-despesa-valor" class="input-field" value="${item.valor}" placeholder="0.00" step="0.01" min="0.01" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-despesa-paga">Status do Pagamento</label>
          <select id="edit-despesa-paga" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;">
            <option value="true" ${item.paga ? 'selected' : ''}>Pago</option>
            <option value="false" ${!item.paga ? 'selected' : ''}>Pendente</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-despesa-vencimento">Data de Vencimento</label>
          <input type="date" id="edit-despesa-vencimento" class="input-field" value="${item.dataVencimento}" required />
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-editar-despesa') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const descricaoInput = document.getElementById('edit-despesa-descricao') as HTMLInputElement;
      const tipoSelect = document.getElementById('edit-despesa-tipo') as HTMLSelectElement;
      const categoriaSelect = document.getElementById('edit-despesa-categoria') as HTMLSelectElement;
      const valorInput = document.getElementById('edit-despesa-valor') as HTMLInputElement;
      const pagaSelect = document.getElementById('edit-despesa-paga') as HTMLSelectElement;
      const vencimentoInput = document.getElementById('edit-despesa-vencimento') as HTMLInputElement;

      item.descricao = descricaoInput.value.trim();
      item.tipo = tipoSelect.value as Despesa['tipo'];
      item.categoria = categoriaSelect.value as Despesa['categoria'];
      item.valor = parseFloat(valorInput.value) || 0;
      item.paga = pagaSelect.value === 'true';
      item.dataVencimento = vencimentoInput.value || item.dataVencimento;
      
      assinarModificacao(item);

      localStorage.setItem('gestor_despesas', JSON.stringify(despesasMock));
      recalcularDadosDashboard();
      UI.mostrarToast('Despesa atualizada com sucesso!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent && paginaAtual === 'despesas') {
        renderizarDespesas(mainContent);
      }
    },
    'Salvar Alterações'
  );
}
(window as any).abrirModalEditarDespesa = abrirModalEditarDespesa;

export function excluirDespesa(id: string): void {
  UI.abrirModal(
    "Excluir Despesa",
    `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%; box-sizing: border-box;">
        <p style="color: var(--color-danger); font-weight: 500; font-size: 0.95rem; margin: 0;">Tem certeza que deseja excluir esta despesa?</p>
        <p class="text-muted" style="font-size: 0.8rem; margin: 0; line-height: 1.4;">Esta ação é permanente e atualizará o saldo e fluxo financeiro.</p>
      </div>
    `,
    () => {
      const index = despesasMock.findIndex(d => d.id === id);
      if (index !== -1) {
        despesasMock.splice(index, 1);
        localStorage.setItem('gestor_despesas', JSON.stringify(despesasMock));
        recalcularDadosDashboard();
        UI.mostrarToast('Despesa excluída com sucesso!', 'success');
        
        const mainContent = document.getElementById('main-content');
        if (mainContent && paginaAtual === 'despesas') {
          renderizarDespesas(mainContent);
        }
      }
    },
    'Excluir'
  );
}
(window as any).excluirDespesa = excluirDespesa;

export function renderizarDespesas(container: HTMLElement): void {
  const pageElement = document.createElement('div');
  pageElement.className = 'page-container fade-in';

  let totalGeral = 0;
  let totalFixas = 0;
  let totalPontuais = 0;

  despesasMock.forEach(item => {
    const valor = item.valor || 0;
    totalGeral += valor;
    if (item.tipo === 'Pontual') {
      totalPontuais += valor;
    } else {
      totalFixas += valor;
    }
  });

  let listItemsHTML = '';
  const despesasFiltradas = despesasMock.filter(item => {
    const itemTipo = item.tipo || 'Fixa';
    if (filtroDespesas.tipo !== 'todos' && itemTipo !== filtroDespesas.tipo) {
      return false;
    }
    return true;
  });

  despesasFiltradas.forEach(item => {
    const isFixa = (item.tipo || 'Fixa') === 'Fixa';
    listItemsHTML += `
      <div class="list-item">
        <div>
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <h4 class="font-highlight" style="font-size: 0.95rem; margin: 0;">${item.descricao}</h4>
            <span class="badge" style="font-size: 0.58rem; background: ${isFixa ? 'rgba(59, 130, 246, 0.12)' : 'rgba(234, 179, 8, 0.12)'}; color: ${isFixa ? 'var(--color-primary)' : '#eab308'}; border: 1px solid ${isFixa ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)'}; padding: 1px 6px; border-radius: 4px; font-weight: 500;">
              ${isFixa ? 'Fixa' : 'Pontual'}
            </span>
          </div>
          <p class="text-muted" style="font-size: 0.75rem; margin-top: 4px;">
            Categoria: <span style="color: var(--color-primary);">${item.categoria}</span> | Vencimento: ${formatarDataBR(item.dataVencimento)}${formatarAssinatura(item)}
          </p>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: var(--spacing-xs); flex-shrink: 0;">
          <span style="font-family: var(--font-mono); font-weight: 600; color: var(--text-primary);">
            ${formatarMoeda(item.valor)}
          </span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="badge ${item.paga ? 'badge-success' : 'badge-danger'}" style="font-size: 0.6rem;">
              ${item.paga ? 'Pago' : 'Pendente'}
            </span>
            <button onclick="abrirModalEditarDespesa('${item.id}')" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 3px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: background-color var(--transition-fast);" onmouseenter="this.style.backgroundColor='rgba(59, 130, 246, 0.15)'" onmouseleave="this.style.backgroundColor='transparent'" title="Editar despesa">
              <svg style="width: 0.85rem; height: 0.85rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </button>
            <button onclick="excluirDespesa('${item.id}')" style="background: none; border: none; color: var(--color-danger); cursor: pointer; padding: 3px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: background-color var(--transition-fast);" onmouseenter="this.style.backgroundColor='rgba(255, 69, 58, 0.15)'" onmouseleave="this.style.backgroundColor='transparent'" title="Excluir despesa">
              <svg style="width: 0.85rem; height: 0.85rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  if (despesasFiltradas.length === 0) {
    listItemsHTML = `
      <div style="text-align: center; padding: var(--spacing-xl) var(--spacing-md); color: var(--text-muted); font-size: 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        Nenhuma despesa ou gasto pontual cadastrado para esta seleção.
      </div>
    `;
  }

  pageElement.innerHTML = `
    <div class="page-header" style="display: flex; align-items: center; justify-content: flex-start; gap: var(--spacing-xs);">
      ${obterBotaoVoltarHTML()}
      <div>
        <h2 class="page-title">Despesas & Gastos</h2>
        <p class="page-subtitle">Controle de despesas fixas e gastos pontuais</p>
      </div>
    </div>

    <!-- Painel de Resumos por Tipo de Despesa -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
      <div class="card" style="padding: var(--spacing-sm); display: flex; flex-direction: column; gap: 2px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">Total Geral</span>
        <span style="font-size: 1.15rem; font-weight: bold; font-family: var(--font-mono); color: var(--text-primary);">${formatarMoeda(totalGeral)}</span>
      </div>
      <div class="card" style="padding: var(--spacing-sm); display: flex; flex-direction: column; gap: 2px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; background: var(--color-primary); border-radius: 50%;"></span>
          Despesas Fixas
        </span>
        <span style="font-size: 1.15rem; font-weight: bold; font-family: var(--font-mono); color: var(--color-primary);">${formatarMoeda(totalFixas)}</span>
      </div>
      <div class="card" style="padding: var(--spacing-sm); display: flex; flex-direction: column; gap: 2px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; background: #eab308; border-radius: 50%;"></span>
          Gastos Pontuais
        </span>
        <span style="font-size: 1.15rem; font-weight: bold; font-family: var(--font-mono); color: #eab308;">${formatarMoeda(totalPontuais)}</span>
      </div>
    </div>

    <!-- Botões de Filtro e Adição -->
    <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); flex-wrap: wrap;">
      <!-- Tabs de Filtro de Tipos -->
      <div style="display: flex; gap: 4px; overflow-x: auto; padding-bottom: 2px; flex-shrink: 0;">
        <button class="btn ${filtroDespesas.tipo === 'todos' ? 'btn-primary' : 'btn-secondary'}" onclick="atualizarFiltroDespesas('todos')" style="font-size: 0.72rem; padding: 6px 10px; height: 1.85rem; border-radius: var(--radius-sm); white-space: nowrap;">
          Todas (${despesasMock.length})
        </button>
        <button class="btn ${filtroDespesas.tipo === 'Fixa' ? 'btn-primary' : 'btn-secondary'}" onclick="atualizarFiltroDespesas('Fixa')" style="font-size: 0.72rem; padding: 6px 10px; height: 1.85rem; border-radius: var(--radius-sm); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
          <span style="width: 5px; height: 5px; background: ${filtroDespesas.tipo === 'Fixa' ? '#fff' : 'var(--color-primary)'}; border-radius: 50%;"></span>
          Fixas (${despesasMock.filter(d => (d.tipo || 'Fixa') === 'Fixa').length})
        </button>
        <button class="btn ${filtroDespesas.tipo === 'Pontual' ? 'btn-primary' : 'btn-secondary'}" onclick="atualizarFiltroDespesas('Pontual')" style="font-size: 0.72rem; padding: 6px 10px; height: 1.85rem; border-radius: var(--radius-sm); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
          <span style="width: 5px; height: 5px; background: ${filtroDespesas.tipo === 'Pontual' ? '#fff' : '#eab308'}; border-radius: 50%;"></span>
          Pontuais (${despesasMock.filter(d => d.tipo === 'Pontual').length})
        </button>
      </div>

      <!-- Botão Adicionar -->
      <button class="btn btn-primary" onclick="abrirModalCadastroDespesa()" style="font-size: 0.75rem; padding: 0 var(--spacing-sm); height: 1.85rem; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 4px;">
        <svg style="width: 0.85rem; height: 0.85rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Lançar Nova
      </button>
    </div>

    <div class="list-container">
      ${listItemsHTML}
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(pageElement);
}
