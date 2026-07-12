/* 
  views/retiradas.ts
  Renderizador da tela de Retiradas de Sócios.
*/

import { formatarMoeda, formatarDataBR, obterBotaoVoltarHTML, UI, formatarAssinatura } from '../ui.ts';
import { retiradasMock, despesasMock, dadosDashboardMock, recalcularDadosDashboard, paginaAtual, assinarCriacao, assinarModificacao, configInicial } from '../state.ts';
import { Retirada, Despesa } from '../types.ts';

// Retorna uma tag HTML personalizada e colorida para identificar o sócio
export function obterBadgeSocio(socio?: string): string {
  const s = socio || 'Sócio A';
  let corBg = 'rgba(59, 130, 246, 0.15)'; // Sócio A - Azul
  let corTexto = 'rgb(59, 130, 246)';
  
  if (s === 'Sócio B') {
    corBg = 'rgba(34, 197, 94, 0.15)'; // Sócio B - Verde
    corTexto = 'rgb(34, 197, 94)';
  } else if (s === 'Outro') {
    corBg = 'rgba(168, 85, 247, 0.15)'; // Outro - Roxo
    corTexto = 'rgb(168, 85, 247)';
  }
  
  return `<span style="display: inline-block; padding: 2px 6px; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 600; background: ${corBg}; color: ${corTexto}; margin-right: 8px;">${s}</span>`;
}

export function abrirModalCadastroRetirada(): void {
  const dataHoje = new Date().toISOString().split('T')[0];
  UI.abrirModal(
    "Registrar Retirada de Sócio",
    `
      <div style="margin-bottom: var(--spacing-sm); padding: var(--spacing-sm); background: rgba(239, 68, 68, 0.1); border-left: 3px solid var(--color-danger); border-radius: var(--radius-sm);">
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">
          <strong>Aviso:</strong> A retirada reduz o saldo disponível livre de sócio da assistência. Certifique-se de que há saldo suficiente no caixa.
        </p>
      </div>
      <form id="form-cadastro-retirada" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="input-retirada-valor">Valor da Retirada (R$)</label>
          <input type="number" id="input-retirada-valor" class="input-field" placeholder="0.00" step="0.01" min="0.01" required />
          <p class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">Máximo livre hoje: ${formatarMoeda(dadosDashboardMock.disponivelRetirada)}</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-retirada-socio">Sócio Beneficiário</label>
          <select id="input-retirada-socio" class="input-field" required style="height: 2.75rem; background-color: var(--bg-input); color: var(--text-primary); cursor: pointer;">
            <option value="Sócio A">Sócio A</option>
            <option value="Sócio B">Sócio B</option>
            <option value="Outro">Outro / Diversos</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-retirada-forma-pagamento">Origem do Recurso / Forma de Pagamento</label>
          <select id="input-retirada-forma-pagamento" class="input-field" required style="height: 2.75rem; background-color: var(--bg-input); color: var(--text-primary); cursor: pointer;">
            <option value="Conta PagBank">🏦 Conta PagBank (Saldo Bancário)</option>
            <option value="Dinheiro do Caixa">💵 Dinheiro do Caixa (Físico / Gaveta)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-retirada-observacao">Observação / Destinatário</label>
          <input type="text" id="input-retirada-observacao" class="input-field" placeholder="Ex: Retirada pró-labore" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="input-retirada-data">Data da Retirada</label>
          <input type="date" id="input-retirada-data" class="input-field" value="${dataHoje}" required />
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-cadastro-retirada') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const valorInput = document.getElementById('input-retirada-valor') as HTMLInputElement;
      const observacaoInput = document.getElementById('input-retirada-observacao') as HTMLInputElement;
      const socioInput = document.getElementById('input-retirada-socio') as HTMLSelectElement;
      const formaPagamentoInput = document.getElementById('input-retirada-forma-pagamento') as HTMLSelectElement;
      const dataInput = document.getElementById('input-retirada-data') as HTMLInputElement;

      const valor = parseFloat(valorInput.value) || 0;
      const observacao = observacaoInput.value.trim();
      const socio = socioInput.value;
      const formaPagamento = formaPagamentoInput ? formaPagamentoInput.value : 'Conta PagBank';
      const data = dataInput.value || dataHoje;

      if (valor > dadosDashboardMock.disponivelRetirada) {
        UI.mostrarToast('Alerta: Retirada excede o saldo disponível livre para retirada!', 'danger');
      }

      const novoId = `R-${301 + retiradasMock.length}`;

      const novaRetirada: Retirada = {
        id: novoId,
        valor,
        data,
        observacao,
        socio,
        formaPagamento
      };
      
      assinarCriacao(novaRetirada);
      retiradasMock.push(novaRetirada);

      localStorage.setItem('gestor_retiradas', JSON.stringify(retiradasMock));
      recalcularDadosDashboard();
      UI.mostrarToast('Retirada registrada com sucesso!', 'success');
      
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        renderizarRetiradas(mainContent);
      }
    },
    'Salvar Retirada'
  );
}
(window as any).abrirModalCadastroRetirada = abrirModalCadastroRetirada;

export function abrirModalEditarRetirada(id: string): void {
  const item = retiradasMock.find(r => r.id === id);
  if (!item) {
    UI.mostrarToast('Retirada não encontrada.', 'danger');
    return;
  }

  UI.abrirModal(
    "Editar Retirada de Sócio",
    `
      <form id="form-editar-retirada" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="edit-retirada-valor">Valor da Retirada (R$)</label>
          <input type="number" id="edit-retirada-valor" class="input-field" value="${item.valor}" placeholder="0.00" step="0.01" min="0.01" required />
          <p class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">Máximo livre hoje (com saldo anterior): ${formatarMoeda(dadosDashboardMock.disponivelRetirada + item.valor)}</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-retirada-socio">Sócio Beneficiário</label>
          <select id="edit-retirada-socio" class="input-field" required style="height: 2.75rem; background-color: var(--bg-input); color: var(--text-primary); cursor: pointer;">
            <option value="Sócio A" ${item.socio === 'Sócio A' ? 'selected' : ''}>Sócio A</option>
            <option value="Sócio B" ${item.socio === 'Sócio B' ? 'selected' : ''}>Sócio B</option>
            <option value="Outro" ${item.socio === 'Outro' ? 'selected' : ''}>Outro / Diversos</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-retirada-forma-pagamento">Origem do Recurso / Forma de Pagamento</label>
          <select id="edit-retirada-forma-pagamento" class="input-field" required style="height: 2.75rem; background-color: var(--bg-input); color: var(--text-primary); cursor: pointer;">
            <option value="Conta PagBank" ${item.formaPagamento === 'Conta PagBank' ? 'selected' : ''}>🏦 Conta PagBank (Saldo Bancário)</option>
            <option value="Dinheiro do Caixa" ${item.formaPagamento === 'Dinheiro do Caixa' ? 'selected' : ''}>💵 Dinheiro do Caixa (Físico / Gaveta)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-retirada-observacao">Observação / Destinatário</label>
          <input type="text" id="edit-retirada-observacao" class="input-field" value="${item.observacao}" placeholder="Ex: Retirada pró-labore" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-retirada-data">Data da Retirada</label>
          <input type="date" id="edit-retirada-data" class="input-field" value="${item.data}" required />
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-editar-retirada') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const valorInput = document.getElementById('edit-retirada-valor') as HTMLInputElement;
      const observacaoInput = document.getElementById('edit-retirada-observacao') as HTMLInputElement;
      const socioInput = document.getElementById('edit-retirada-socio') as HTMLSelectElement;
      const formaPagamentoInput = document.getElementById('edit-retirada-forma-pagamento') as HTMLSelectElement;
      const dataInput = document.getElementById('edit-retirada-data') as HTMLInputElement;

      const valor = parseFloat(valorInput.value) || 0;
      const observacao = observacaoInput.value.trim();
      const socio = socioInput.value;
      const formaPagamento = formaPagamentoInput ? formaPagamentoInput.value : 'Conta PagBank';
      const data = dataInput.value || item.data;

      if (valor > (dadosDashboardMock.disponivelRetirada + item.valor)) {
        UI.mostrarToast('Alerta: Retirada excede o saldo disponível livre para retirada!', 'danger');
      }

      item.valor = valor;
      item.observacao = observacao;
      item.socio = socio;
      item.formaPagamento = formaPagamento;
      item.data = data;
      
      assinarModificacao(item);

      localStorage.setItem('gestor_retiradas', JSON.stringify(retiradasMock));
      recalcularDadosDashboard();
      UI.mostrarToast('Retirada actualizada com sucesso!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent && paginaAtual === 'retiradas') {
        renderizarRetiradas(mainContent);
      }
    },
    'Salvar Alterações'
  );
}
(window as any).abrirModalEditarRetirada = abrirModalEditarRetirada;

export function excluirRetirada(id: string): void {
  UI.abrirModal(
    "Excluir Retirada",
    `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%; box-sizing: border-box;">
        <p style="color: var(--color-danger); font-weight: 500; font-size: 0.95rem; margin: 0;">Tem certeza que deseja excluir esta retirada?</p>
        <p class="text-muted" style="font-size: 0.8rem; margin: 0; line-height: 1.4;">Esta ação é permanente e atualizará o saldo disponível para retirada.</p>
      </div>
    `,
    () => {
      const index = retiradasMock.findIndex(r => r.id === id);
      if (index !== -1) {
        retiradasMock.splice(index, 1);
        localStorage.setItem('gestor_retiradas', JSON.stringify(retiradasMock));
        recalcularDadosDashboard();
        UI.mostrarToast('Retirada excluída com sucesso!', 'success');
        
        const mainContent = document.getElementById('main-content');
        if (mainContent && paginaAtual === 'retiradas') {
          renderizarRetiradas(mainContent);
        }
      }
    },
    'Excluir'
  );
}
(window as any).excluirRetirada = excluirRetirada;

export function renderizarRetiradas(container: HTMLElement): void {
  recalcularDadosDashboard(); // Garante o recálculo preciso antes de carregar a tela

  const pageElement = document.createElement('div');
  pageElement.className = 'page-container fade-in';

  // Lógica de cálculo dinâmico das retiradas de cada sócio
  let totalSocioA = 0;
  let totalSocioB = 0;
  let totalOutro = 0;

  retiradasMock.forEach(r => {
    const s = r.socio || 'Sócio A';
    if (s === 'Sócio A') totalSocioA += r.valor;
    else if (s === 'Sócio B') totalSocioB += r.valor;
    else totalOutro += r.valor;
  });

  const totalRetiradasGeral = totalSocioA + totalSocioB + totalOutro;
  const pctA = totalRetiradasGeral > 0 ? (totalSocioA / totalRetiradasGeral) * 100 : 0;
  const pctB = totalRetiradasGeral > 0 ? (totalSocioB / totalRetiradasGeral) * 100 : 0;
  const pctOutro = totalRetiradasGeral > 0 ? (totalOutro / totalRetiradasGeral) * 100 : 0;

  // Paridade de sócios para 50/50
  const diferencaParidade = Math.abs(totalSocioA - totalSocioB);
  let textoParidade = '';
  if (totalSocioA === 0 && totalSocioB === 0) {
    textoParidade = 'Sem retiradas dos sócios este mês.';
  } else if (totalSocioA === totalSocioB) {
    textoParidade = '⚖️ <strong>Retiradas perfeitamente equilibradas (50% / 50%)!</strong>';
  } else {
    const socioAtras = totalSocioA < totalSocioB ? 'Sócio A' : 'Sócio B';
    textoParidade = `⚖️ Para igualar, o <strong>${socioAtras}</strong> pode retirar mais <strong>${formatarMoeda(diferencaParidade)}</strong>.`;
  }

  let listItemsHTML = '';
  retiradasMock.forEach(item => {
    listItemsHTML += `
      <div class="list-item" style="padding: var(--spacing-xs) var(--spacing-sm); gap: var(--spacing-xs); align-items: center;">
        <div style="min-width: 0; flex: 1;">
          <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
            ${obterBadgeSocio(item.socio)}
            <h4 class="font-highlight" style="font-size: 0.85rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.observacao}</h4>
            ${item.formaPagamento ? `<span style="font-size: 0.62rem; color: ${item.formaPagamento === 'Dinheiro do Caixa' ? '#f59e0b' : '#3b82f6'}; background: ${item.formaPagamento === 'Dinheiro do Caixa' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)'}; border: 1px solid ${item.formaPagamento === 'Dinheiro do Caixa' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}; border-radius: var(--radius-sm); padding: 1px 4px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; margin-left: 6px;">${item.formaPagamento === 'Dinheiro do Caixa' ? '💵 Caixa Físico' : '🏦 PagBank'}</span>` : ''}
          </div>
          <p class="text-muted" style="font-size: 0.7rem; margin-top: 2px;">
            Data: ${formatarDataBR(item.data)}${formatarAssinatura(item)}
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: var(--spacing-sm); flex-shrink: 0;">
          <span style="font-family: var(--font-mono); font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">
            ${formatarMoeda(item.valor)}
          </span>
          <div style="display: flex; align-items: center; gap: 4px;">
            <button onclick="abrirModalEditarRetirada('${item.id}')" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: background-color var(--transition-fast);" onmouseenter="this.style.backgroundColor='rgba(59, 130, 246, 0.15)'" onmouseleave="this.style.backgroundColor='transparent'" title="Editar retirada">
              <svg style="width: 0.8rem; height: 0.8rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </button>
            <button onclick="excluirRetirada('${item.id}')" style="background: none; border: none; color: var(--color-danger); cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: background-color var(--transition-fast);" onmouseenter="this.style.backgroundColor='rgba(255, 69, 58, 0.15)'" onmouseleave="this.style.backgroundColor='transparent'" title="Excluir retirada">
              <svg style="width: 0.8rem; height: 0.8rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  });
    const lucroVendas = dadosDashboardMock.lucroVendas || 0;
    const lucroManutencoes = dadosDashboardMock.lucroManutencoes || 0;
    const totalLucro = lucroVendas + lucroManutencoes;
    const pctLoja = totalLucro > 0 ? (lucroVendas / totalLucro) * 100 : 50;
    const pctServicos = totalLucro > 0 ? (lucroManutencoes / totalLucro) * 100 : 50;

    pageElement.innerHTML = `
    <div class="page-header" style="display: flex; align-items: center; justify-content: flex-start; gap: var(--spacing-xs);">
      ${obterBotaoVoltarHTML()}
      <div>
        <h2 class="page-title">Área dos Sócios (Retiradas)</h2>
        <p class="page-subtitle">Acompanhe saldos disponíveis para saques, paridade 50/50 e histórico de retiradas</p>
      </div>
    </div>

    <!-- Bloco de Saldos Individuais Disponíveis -->
    <div style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); width: 100%; box-sizing: border-box; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 240px; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); padding: 12px var(--spacing-md); border-radius: var(--radius-md); box-sizing: border-box;">
        <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #93c5fd; font-weight: 600; display: block; margin-bottom: 2px;">Saldo Disponível (Sócio A)</span>
        <div style="font-size: 1.6rem; font-weight: bold; color: #60a5fa; font-family: var(--font-mono);">${formatarMoeda(dadosDashboardMock.disponivelSocioA || 0)}</div>
        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Total retirado este mês: <strong>${formatarMoeda(totalSocioA)}</strong></div>
      </div>
      <div style="flex: 1; min-width: 240px; background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.2); padding: 12px var(--spacing-md); border-radius: var(--radius-md); box-sizing: border-box;">
        <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #86efac; font-weight: 600; display: block; margin-bottom: 2px;">Saldo Disponível (Sócio B)</span>
        <div style="font-size: 1.6rem; font-weight: bold; color: #4ade80; font-family: var(--font-mono);">${formatarMoeda(dadosDashboardMock.disponivelSocioB || 0)}</div>
        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Total retirado este mês: <strong>${formatarMoeda(totalSocioB)}</strong></div>
      </div>
    </div>

    <!-- Painel de Estatísticas e Provisão de Compras -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-sm); margin-bottom: var(--spacing-xs); box-sizing: border-box; width: 100%;">
      
      <!-- Card Retiradas Consolidadas (Mais Compacto) -->
      <div class="metric-card" style="border: 1px solid var(--border-color); background: var(--bg-tertiary); display: flex; flex-direction: column; justify-content: space-between; padding: var(--spacing-sm) var(--spacing-md); box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
          <div>
            <span class="metric-title" style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">Resumo de Retiradas do Mês</span>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-top: 2px; font-family: var(--font-mono);">
              ${formatarMoeda(totalRetiradasGeral)}
            </div>
          </div>
          <div style="background: rgba(59, 130, 246, 0.1); color: var(--color-primary); width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem;">
            💸
          </div>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--spacing-xs); display: flex; align-items: center; gap: 4px; line-height: 1.3;">
          <span>Livre p/ Retirada Hoje: <strong style="color: var(--color-success);">${formatarMoeda(dadosDashboardMock.disponivelRetirada)}</strong></span>
        </div>
      </div>

      <!-- Card Composição do Pool Livre (Loja vs. Manutenção) com barra colorida -->
      <div class="metric-card" style="border: 1px solid var(--border-color); background: var(--bg-tertiary); padding: var(--spacing-sm) var(--spacing-md); display: flex; flex-direction: column; gap: 6px; box-sizing: border-box;">
        <span class="metric-title" style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; margin-bottom: 2px;">Origem do Pool Livre</span>
        
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <!-- Barra de Cores Segmentada -->
          <div style="height: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; width: 100%; display: flex; margin: 4px 0;">
            <div style="height: 100%; width: ${pctLoja}%; background: rgb(59, 130, 246); transition: width 0.3s ease;" title="Vendas Loja: ${pctLoja.toFixed(0)}%"></div>
            <div style="height: 100%; width: ${pctServicos}%; background: rgb(168, 85, 247); transition: width 0.3s ease;" title="Lucro Serviços: ${pctServicos.toFixed(0)}%"></div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 2px; font-size: 0.72rem; line-height: 1.3;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #93c5fd; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: rgb(59, 130, 246); display: inline-block;"></span>
                Vendas Loja (${pctLoja.toFixed(0)}%):
              </span>
              <span style="font-family: var(--font-mono); font-weight: 600; color: var(--text-primary);">${formatarMoeda(lucroVendas)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #e9d5ff; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: rgb(168, 85, 247); display: inline-block;"></span>
                Manutenções (${pctServicos.toFixed(0)}%):
              </span>
              <span style="font-family: var(--font-mono); font-weight: 600; color: var(--text-primary);">${formatarMoeda(lucroManutencoes)}</span>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 2px; padding-top: 4px; border-top: 1px dashed rgba(255, 255, 255, 0.08); font-size: 0.68rem; color: var(--text-muted); line-height: 1.2;">
          Os lucros de manutenção e vendas balcão são divididos 50% para cada sócio.
        </div>
      </div>

      <!-- Card Distribuição por Sócio (Mais Compacto com Paridade) -->
      <div class="metric-card" style="border: 1px solid var(--border-color); background: var(--bg-tertiary); padding: var(--spacing-sm) var(--spacing-md); display: flex; flex-direction: column; gap: 6px; box-sizing: border-box;">
        <span class="metric-title" style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; margin-bottom: 2px;">Distribuição por Sócio</span>
        
        <!-- Sócio A -->
        <div style="background: rgba(255,255,255,0.01); padding: 4px 8px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.03);">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 2px;">
            <span style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: rgb(59, 130, 246); display: inline-block;"></span>
              Sócio A
            </span>
            <span style="font-family: var(--font-mono); font-weight: 600; font-size: 0.75rem;">Retirou: ${formatarMoeda(totalSocioA)} <span style="color: var(--text-muted); font-size: 0.65rem;">(${pctA.toFixed(0)}%)</span></span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px;">
            <span>Disponível p/ Saque:</span>
            <strong style="color: #60a5fa; font-family: var(--font-mono);">${formatarMoeda(dadosDashboardMock.disponivelSocioA || 0)}</strong>
          </div>
          <div style="height: 4px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; width: 100%;">
            <div style="height: 100%; width: ${pctA}%; background: rgb(59, 130, 246); border-radius: 3px;"></div>
          </div>
        </div>

        <!-- Sócio B -->
        <div style="background: rgba(255,255,255,0.01); padding: 4px 8px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.03); margin-top: 4px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 2px;">
            <span style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: rgb(34, 197, 94); display: inline-block;"></span>
              Sócio B
            </span>
            <span style="font-family: var(--font-mono); font-weight: 600; font-size: 0.75rem;">Retirou: ${formatarMoeda(totalSocioB)} <span style="color: var(--text-muted); font-size: 0.65rem;">(${pctB.toFixed(0)}%)</span></span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px;">
            <span>Disponível p/ Saque:</span>
            <strong style="color: #4ade80; font-family: var(--font-mono);">${formatarMoeda(dadosDashboardMock.disponivelSocioB || 0)}</strong>
          </div>
          <div style="height: 4px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; width: 100%;">
            <div style="height: 100%; width: ${pctB}%; background: rgb(34, 197, 94); border-radius: 3px;"></div>
          </div>
        </div>

        <!-- Paridade helper -->
        <div style="margin-top: 2px; padding-top: 4px; border-top: 1px dashed rgba(255, 255, 255, 0.08); font-size: 0.7rem; color: var(--text-muted); line-height: 1.3;">
          ${textoParidade}
        </div>
      </div>
    </div>

    <!-- Banner de Planejamento de Compras Quinzenais -->
    ${configInicial.compraReposicaoAtiva ? `
      <div style="margin-bottom: var(--spacing-sm); padding: var(--spacing-sm); background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--spacing-xs); box-sizing: border-box; width: 100%;">
        <div style="display: flex; align-items: center; gap: var(--spacing-xs); flex: 1; min-width: 250px;">
          <span style="font-size: 1.5rem;">📦</span>
          <div>
            <h4 style="font-size: 0.85rem; font-weight: 600; color: #e9d5ff; margin: 0;">Fundo Quinzenal de Compras Seguro</h4>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0; line-height: 1.3;">
              Para garantir fôlego na reposição quinzenal das mercadorias da assistência, <strong>${formatarMoeda(configInicial.compraReposicaoValor)}</strong> estão blindados no caixa para as segundas-feiras.
            </p>
          </div>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
          <div>
            <span style="display: block; font-size: 0.7rem; color: var(--text-muted);">Próxima Compra:</span>
            <span style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; color: #e9d5ff;">${configInicial.compraReposicaoProximaData.split('-').reverse().join('/')}</span>
          </div>
          <button class="btn" style="background: rgba(168, 85, 247, 0.2); color: #f3e8ff; font-size: 0.7rem; padding: 4px 8px; border: 1px solid rgba(168, 85, 247, 0.4); cursor: pointer; border-radius: var(--radius-sm); transition: all var(--transition-fast);" onmouseover="this.style.backgroundColor='rgba(168, 85, 247, 0.35)'" onmouseout="this.style.backgroundColor='rgba(168, 85, 247, 0.2)'" onclick="abrirModalRegistrarCompraReal()">
            Registrar Compra Efetuada
          </button>
        </div>
      </div>
    ` : ''}

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm); margin-top: var(--spacing-sm); flex-wrap: wrap; gap: var(--spacing-xs);">
      <div style="display: flex; align-items: baseline; gap: var(--spacing-xs); flex-wrap: wrap;">
        <h3 style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary); margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">Histórico de Retiradas</h3>
        <span style="font-size: 0.8rem; color: var(--text-muted);">— Soma Total: <strong style="color: var(--color-primary); font-family: var(--font-mono); font-size: 0.85rem;">${formatarMoeda(totalRetiradasGeral)}</strong></span>
      </div>
      <button class="btn btn-primary" onclick="abrirModalCadastroRetirada()" style="font-size: 0.75rem; padding: 4px var(--spacing-sm); height: 2rem;">
        <svg style="width: 0.9rem; height: 0.9rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Registrar Retirada
      </button>
    </div>

    <div class="list-container">
      ${listItemsHTML || `
        <div style="text-align: center; padding: var(--spacing-lg); color: var(--text-muted); background: rgba(0,0,0,0.1); border-radius: var(--radius-sm); border: 1px dashed var(--border-color);">
          Nenhuma retirada registrada ainda.
        </div>
      `}
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(pageElement);
}

export function abrirModalRegistrarCompraReal(): void {
  const dataHoje = new Date().toISOString().split('T')[0];
  const dataCompra = configInicial.compraReposicaoProximaData;
  
  UI.abrirModal(
    "Registrar Compra de Reposição Realizada",
    `
      <form id="form-registrar-compra-real" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div style="margin-bottom: var(--spacing-xs); padding: var(--spacing-sm); background: rgba(168, 85, 247, 0.1); border-left: 3px solid rgb(168, 85, 247); border-radius: var(--radius-sm);">
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">
            Ao registrar a compra efetuada, o valor gasto será computado como uma <strong>Despesa Paga</strong> do tipo <strong>Mercadoria</strong> e a data da próxima compra será prorrogada em <strong>14 dias</strong>.
          </p>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-compra-real-data">Data da Compra Efetuada</label>
          <input type="date" id="input-compra-real-data" class="input-field" value="${dataHoje}" required style="height: 2.75rem; background-color: var(--bg-input);" />
          <p class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">Planejamento original: ${dataCompra.split('-').reverse().join('/')}</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-compra-real-valor">Valor Real Gasto (R$)</label>
          <input type="number" id="input-compra-real-valor" class="input-field" value="${configInicial.compraReposicaoValor}" step="0.01" min="0.01" required style="height: 2.75rem; background-color: var(--bg-input);" />
          <p class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">Fundo blindado original: ${formatarMoeda(configInicial.compraReposicaoValor)}</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-compra-real-tipo">Frequência deste Lançamento</label>
          <select id="input-compra-real-tipo" class="input-field" style="height: 2.75rem; background-color: var(--bg-input); color: var(--text-primary); cursor: pointer;" required>
            <option value="quinzenal" selected>Quinzenal (Usa o valor cheio para previsão de compras)</option>
            <option value="mensal">Mensal (Será dividido por 2 no cálculo da previsão quinzenal)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-compra-real-desc">Descrição / Comentários</label>
          <input type="text" id="input-compra-real-desc" class="input-field" value="Compra de Reposição - Mercadorias e Insumos" required style="height: 2.75rem; background-color: var(--bg-input);" />
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-registrar-compra-real') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const inputData = document.getElementById('input-compra-real-data') as HTMLInputElement;
      const inputValor = document.getElementById('input-compra-real-valor') as HTMLInputElement;
      const inputTipo = document.getElementById('input-compra-real-tipo') as HTMLSelectElement;
      const inputDesc = document.getElementById('input-compra-real-desc') as HTMLInputElement;

      const dataEfetuada = inputData.value || dataHoje;
      const valorGasto = parseFloat(inputValor.value) || 0;
      const tipoCompra = (inputTipo ? inputTipo.value : 'quinzenal') as 'quinzenal' | 'mensal';
      const descricao = inputDesc.value.trim() || "Compra de Reposição - Mercadorias e Insumos";

      // 1. Adicionar uma nova despesa paga!
      const novoId = `D-${201 + despesasMock.length + Date.now().toString().slice(-4)}`;
      const novaDespesa: Despesa = {
        id: novoId,
        descricao,
        tipo: 'Pontual',
        categoria: 'Mercadoria',
        valor: valorGasto,
        paga: true,
        dataVencimento: dataEfetuada
      };
      
      assinarCriacao(novaDespesa);
      despesasMock.unshift(novaDespesa); // Coloca no início do histórico de despesas
      localStorage.setItem('gestor_despesas', JSON.stringify(despesasMock));

      // 1.5. Adicionar ao histórico de compras para a média móvel de previsão
      try {
        const dataObj = new Date(dataEfetuada + 'T12:00:00');
        const mesNome = dataObj.toLocaleDateString('pt-BR', { month: 'long' });
        const capitalMes = mesNome.charAt(0).toUpperCase() + mesNome.slice(1);
        const { historicoComprasMock, salvarHistoricoCompras } = (window as any);
        if (historicoComprasMock && salvarHistoricoCompras) {
          historicoComprasMock.unshift({
            id: `H-${Date.now()}`,
            mesOuData: capitalMes,
            valor: valorGasto,
            tipo: tipoCompra
          });
          salvarHistoricoCompras();
        }
      } catch (e) {
        console.error('Erro ao salvar no histórico de compras:', e);
      }

      // 2. Calcular a próxima segunda-feira quinzenal (14 dias após a data efetuada)
      const dataOriginalObj = new Date(dataEfetuada + 'T12:00:00');
      dataOriginalObj.setDate(dataOriginalObj.getDate() + 14); // Adiciona 14 dias (2 semanas)
      
      const proximaDataStr = dataOriginalObj.toISOString().split('T')[0];

      configInicial.compraReposicaoProximaData = proximaDataStr;
      localStorage.setItem('gestor_compra_reposicao_proxima_data', proximaDataStr);

      recalcularDadosDashboard();
      UI.mostrarToast(`Compra registrada! Lançado despesa de ${formatarMoeda(valorGasto)} e próxima compra agendada para ${proximaDataStr.split('-').reverse().join('/')}.`, 'success');

      // Atualiza a visualização atual
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        if (paginaAtual === 'retiradas') {
          renderizarRetiradas(mainContent);
        } else if (paginaAtual === 'dashboard') {
          // @ts-ignore
          const renderDashboard = (window as any).renderizarDashboard;
          if (typeof renderDashboard === 'function') {
            renderDashboard(mainContent, dadosDashboardMock);
          }
        } else if (paginaAtual === 'despesas') {
          // @ts-ignore
          const renderDespesas = (window as any).renderizarDespesas;
          if (typeof renderDespesas === 'function') {
            renderDespesas(mainContent);
          }
        }
      }
    },
    'Confirmar Lançamento'
  );
}
(window as any).abrirModalRegistrarCompraReal = abrirModalRegistrarCompraReal;
