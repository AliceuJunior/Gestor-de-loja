/* 
  views/manutencoes.ts
  Renderizador da tela de Manutenções (Serviços Técnicos).
*/

import { formatarMoeda, formatarDataBR, obterBotaoVoltarHTML, UI, formatarAssinatura } from '../ui.ts';
import { manutencoesMock, recalcularDadosDashboard, paginaAtual, assinarCriacao, assinarModificacao } from '../state.ts';
import { Manutencao } from '../types.ts';

// Configurações e filtros locais
interface CardSettings {
  gastoPecas: string;
  gastoPecas_inicio?: string;
  gastoPecas_fim?: string;
  maoDeObra: string;
  maoDeObra_inicio?: string;
  maoDeObra_fim?: string;
  lucro: string;
  lucro_inicio?: string;
  lucro_fim?: string;
  faturamento: string;
  faturamento_inicio?: string;
  faturamento_fim?: string;
}

function obterCardSettings(): CardSettings {
  if ((window as any).cardSettingsTemp) {
    return (window as any).cardSettingsTemp;
  }
  const stored = localStorage.getItem('gestor_loja_card_defaults');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.gastoPecas && parsed.maoDeObra && parsed.lucro && parsed.faturamento) {
        return parsed;
      }
    } catch (e) {
      // Ignora erro
    }
  }
  return {
    gastoPecas: 'mes',
    maoDeObra: 'mes',
    lucro: 'mes',
    faturamento: 'mes'
  };
}

function salvarCardSettings(settings: CardSettings): void {
  localStorage.setItem('gestor_loja_card_defaults', JSON.stringify(settings));
}

function itemNaData(itemDataStr: string, periodo: string, dataInicio?: string, dataFim?: string): boolean {
  if (periodo === 'tudo') return true;

  const partes = itemDataStr.split('-');
  if (partes.length !== 3) return true;
  const anoItem = parseInt(partes[0]);
  const mesItem = parseInt(partes[1]) - 1; // 0-indexed
  const diaItem = parseInt(partes[2]);
  const itemDate = new Date(anoItem, mesItem, diaItem);

  const hoje = new Date();
  const anoHoje = hoje.getFullYear();
  const mesHoje = hoje.getMonth();
  const diaHoje = hoje.getDate();
  const hojeDate = new Date(anoHoje, mesHoje, diaHoje);

  if (periodo === 'hoje') {
    return anoItem === anoHoje && mesItem === mesHoje && diaItem === diaHoje;
  }
  if (periodo === 'semana') {
    const seteDiasAtras = new Date(anoHoje, mesHoje, diaHoje - 7);
    return itemDate >= seteDiasAtras && itemDate <= hojeDate;
  }
  if (periodo === 'mes') {
    return anoItem === anoHoje && mesItem === mesHoje;
  }
  if (periodo === 'ano') {
    return anoItem === anoHoje;
  }
  if (periodo === 'last30') {
    const trintaDiasAtras = new Date(anoHoje, mesHoje, diaHoje - 30);
    return itemDate >= trintaDiasAtras && itemDate <= hojeDate;
  }
  if (periodo === 'personalizado') {
    if (dataInicio) {
      const pI = dataInicio.split('-');
      if (pI.length === 3) {
        const dateI = new Date(parseInt(pI[0]), parseInt(pI[1]) - 1, parseInt(pI[2]));
        if (itemDate < dateI) return false;
      }
    }
    if (dataFim) {
      const pF = dataFim.split('-');
      if (pF.length === 3) {
        const dateF = new Date(parseInt(pF[0]), parseInt(pF[1]) - 1, parseInt(pF[2]));
        if (itemDate > dateF) return false;
      }
    }
    return true;
  }
  return true;
}

function obterRotuloPeriodo(periodo: string, dataInicio?: string, dataFim?: string): string {
  switch (periodo) {
    case 'tudo': return 'Tudo';
    case 'hoje': return 'Hoje';
    case 'semana': return 'Últimos 7 dias';
    case 'mes': return 'Este Mês';
    case 'ano': return 'Este Ano';
    case 'last30': return 'Últimos 30 dias';
    case 'personalizado': {
      if (dataInicio && dataFim) {
        return `${formatarDataBR(dataInicio)} a ${formatarDataBR(dataFim)}`;
      } else if (dataInicio) {
        return `A partir de ${formatarDataBR(dataInicio)}`;
      } else if (dataFim) {
        return `Até ${formatarDataBR(dataFim)}`;
      }
      return 'Customizado';
    }
    default: return 'Este Mês';
  }
}

export function abrirModalFiltroCard(cardId: 'gastoPecas' | 'maoDeObra' | 'lucro' | 'faturamento', cardLabel: string): void {
  const settings = obterCardSettings();
  const currentPeriod = settings[cardId];

  UI.abrirModal(
    `Filtro: ${cardLabel}`,
    `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-md); width: 100%; box-sizing: border-box;">
        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.4;">
          Selecione o período para calcular o card <strong>${cardLabel}</strong>:
        </p>
        
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" for="select-periodo-card">Período de Tempo</label>
          <select id="select-periodo-card" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;" onchange="
            const divDatas = document.getElementById('div-datas-personalizadas');
            if (divDatas) {
              if (this.value === 'personalizado') {
                divDatas.style.display = 'flex';
              } else {
                divDatas.style.display = 'none';
              }
            }
          ">
            <option value="mes" ${currentPeriod === 'mes' ? 'selected' : ''}>Este Mês</option>
            <option value="last30" ${currentPeriod === 'last30' ? 'selected' : ''}>Últimos 30 Dias</option>
            <option value="semana" ${currentPeriod === 'semana' ? 'selected' : ''}>Últimos 7 Dias</option>
            <option value="hoje" ${currentPeriod === 'hoje' ? 'selected' : ''}>Hoje</option>
            <option value="ano" ${currentPeriod === 'ano' ? 'selected' : ''}>Este Ano</option>
            <option value="tudo" ${currentPeriod === 'tudo' ? 'selected' : ''}>Todos os Registros</option>
            <option value="personalizado" ${currentPeriod === 'personalizado' ? 'selected' : ''}>Customizado (Personalizável)</option>
          </select>
        </div>

        <div id="div-datas-personalizadas" style="display: ${currentPeriod === 'personalizado' ? 'flex' : 'none'}; gap: var(--spacing-sm); width: 100%; box-sizing: border-box;">
          <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <label class="form-label" for="input-card-inicio">Data Inicial</label>
            <input type="date" id="input-card-inicio" class="input-field" value="${(settings as any)[cardId + '_inicio'] || ''}" />
          </div>
          <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <label class="form-label" for="input-card-fim">Data Final</label>
            <input type="date" id="input-card-fim" class="input-field" value="${(settings as any)[cardId + '_fim'] || ''}" />
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
          <input type="checkbox" id="check-salvar-padrao" style="width: 16px; height: 16px; cursor: pointer;" checked />
          <label for="check-salvar-padrao" style="color: var(--text-muted); font-size: 0.85rem; cursor: pointer; user-select: none;">
            Salvar como padrão inicial para este card
          </label>
        </div>
      </div>
    `,
    () => {
      const selectPeriodo = document.getElementById('select-periodo-card') as HTMLSelectElement;
      const inputInicio = document.getElementById('input-card-inicio') as HTMLInputElement;
      const inputFim = document.getElementById('input-card-fim') as HTMLInputElement;
      const checkSalvar = document.getElementById('check-salvar-padrao') as HTMLInputElement;

      if (selectPeriodo) {
        const novoPeriodo = selectPeriodo.value;
        const dataInicio = inputInicio ? inputInicio.value : '';
        const dataFim = inputFim ? inputFim.value : '';

        const novasSettings = {
          ...settings,
          [cardId]: novoPeriodo,
          [`${cardId}_inicio`]: dataInicio,
          [`${cardId}_fim`]: dataFim
        };

        const rotuloFormatado = obterRotuloPeriodo(novoPeriodo, dataInicio, dataFim);

        if (checkSalvar && checkSalvar.checked) {
          salvarCardSettings(novasSettings);
          (window as any).cardSettingsTemp = novasSettings;
          UI.mostrarToast(`Filtro padrão de "${cardLabel}" salvo como "${rotuloFormatado}"!`, 'success');
        } else {
          (window as any).cardSettingsTemp = novasSettings;
          UI.mostrarToast(`Filtro de "${cardLabel}" alterado para "${rotuloFormatado}"!`, 'info');
        }

        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          renderizarManutencoes(mainContent);
        }
      }
    },
    'Aplicar Filtro'
  );
}
(window as any).abrirModalFiltroCard = abrirModalFiltroCard;

export function obterListItemsHTMLFiltrado(): string {
  let divisaoFiltradas = [...manutencoesMock];

  const filtro = (window as any).filtroManutencoes || { busca: '', ordenacao: 'data_desc', statusPagamento: 'todos', statusPeca: 'todos' };

  // Aplicar busca por texto
  if (filtro.busca && filtro.busca.trim() !== '') {
    const buscaLower = filtro.busca.toLowerCase().trim();
    divisaoFiltradas = divisaoFiltradas.filter(item => {
      const osStr = item.os === 'S/N' ? 'Sem OS' : 'OS #' + item.os;
      const marcaStr = item.marca ? item.marca.toLowerCase() : '';
      return item.cliente.toLowerCase().includes(buscaLower) ||
             item.modelo.toLowerCase().includes(buscaLower) ||
             marcaStr.includes(buscaLower) ||
             item.os.toLowerCase().includes(buscaLower) ||
             osStr.toLowerCase().includes(buscaLower) ||
             item.situacao.toLowerCase().includes(buscaLower) ||
             item.cor.toLowerCase().includes(buscaLower);
    });
  }

  // Aplicar filtro de status de pagamento
  if (filtro.statusPagamento === 'pagos') {
    divisaoFiltradas = divisaoFiltradas.filter(item => item.pagoPeloCliente);
  } else if (filtro.statusPagamento === 'pendentes') {
    divisaoFiltradas = divisaoFiltradas.filter(item => !item.pagoPeloCliente);
  }

  // Aplicar filtro de status de peça
  if (filtro.statusPeca === 'pagos') {
    divisaoFiltradas = divisaoFiltradas.filter(item => item.pecaPaga);
  } else if (filtro.statusPeca === 'pendentes') {
    divisaoFiltradas = divisaoFiltradas.filter(item => !item.pecaPaga);
  }

  // Aplicar ordenação
  divisaoFiltradas.sort((a, b) => {
    switch (filtro.ordenacao) {
      case 'data_desc':
        return b.data.localeCompare(a.data);
      case 'data_asc':
        return a.data.localeCompare(b.data);
      case 'os_asc': {
        const numA = parseInt(a.os) || 0;
        const numB = parseInt(b.os) || 0;
        return numA - numB;
      }
      case 'os_desc': {
        const numA = parseInt(a.os) || 0;
        const numB = parseInt(b.os) || 0;
        return numB - numA;
      }
      case 'valor_desc':
        return b.valorCobrado - a.valorCobrado;
      case 'valor_asc':
        return a.valorCobrado - b.valorCobrado;
      case 'lucro_desc': {
        const maoDeObraA = a.valorCobrado - (a.valorPeca * 2);
        const lucroA = a.valorPeca + maoDeObraA;
        const maoDeObraB = b.valorCobrado - (b.valorPeca * 2);
        const lucroB = b.valorPeca + maoDeObraB;
        return lucroB - lucroA;
      }
      default:
        return b.data.localeCompare(a.data);
    }
  });

  if (divisaoFiltradas.length === 0) {
    return '';
  }

  let html = '';
  divisaoFiltradas.forEach(item => {
    const maoDeObraCalculada = item.valorCobrado - (item.valorPeca * 2);
    const lucroCalculado = item.valorPeca + maoDeObraCalculada;

    html += `
      <div class="list-item expandable-item" onclick="this.classList.toggle('expanded')" style="display: flex; flex-direction: column; align-items: stretch; gap: var(--spacing-xs); padding: var(--spacing-md);">
        
        <!-- CABEÇALHO COMPACTO (Sempre Visível) -->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: var(--spacing-sm);">
          <div style="display: flex; align-items: center; gap: var(--spacing-xs); min-width: 0; flex: 1;">
            <span style="font-family: var(--font-mono); font-size: 0.7rem; background-color: var(--color-primary-dark); color: var(--color-primary); border: 1px solid rgba(59, 130, 246, 0.3); padding: 2px 6px; border-radius: var(--radius-sm); font-weight: bold; flex-shrink: 0;">
              ${item.os === 'S/N' ? 'Sem OS' : 'OS #' + item.os}
            </span>
            <h4 class="font-highlight" style="font-size: 0.95rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${item.marca ? `<span style="color: var(--color-primary); font-weight: 500;">${item.marca}</span> ` : ''}${item.modelo}
            </h4>
          </div>
          
          <div style="display: flex; align-items: center; gap: var(--spacing-sm); flex-shrink: 0;">
            <span class="badge badge-success" style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: bold;">
              ${formatarMoeda(item.valorCobrado)}
            </span>
            <!-- Ícone Chevron indicador de expansão -->
            <svg class="chevron-icon" style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>

        <!-- LINHA DE SUBTÍTULO RÁPIDA (Sempre Visível) -->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: var(--spacing-xs); font-size: 0.8rem; color: var(--text-muted);">
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px;">
            👤 ${item.cliente}${formatarAssinatura(item)}
          </span>
          <span>
            📅 ${formatarDataBR(item.data)}
          </span>
        </div>

        <!-- CONTEÚDO EXPANSÍVEL (Oculto até clicar) -->
        <div class="expandable-content" style="display: flex; flex-direction: column; gap: var(--spacing-sm); pointer-events: none;">
          
          <!-- Detalhes Físicos -->
          <div style="display: flex; gap: var(--spacing-xs); flex-wrap: wrap;">
            <span class="badge" style="background-color: rgba(255, 255, 255, 0.04); color: var(--text-secondary); border: 1px solid var(--border-color); font-size: 0.7rem; padding: 2px 8px;">
              🎨 Cor: <strong>${item.cor}</strong>
            </span>
            <span class="badge" style="background-color: rgba(239, 68, 68, 0.08); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.15); font-size: 0.7rem; padding: 2px 8px;">
              ⚠️ Entrada: <strong>${item.situacao}</strong>
            </span>
          </div>

          <!-- Tabela Financeira Exata Conforme Fórmula do Usuário -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-sm); width: 100%; background: rgba(0,0,0,0.15); padding: var(--spacing-sm); border-radius: var(--radius-sm);">
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Custo da Peça</span>
              <span style="font-size: 0.8rem; color: var(--text-secondary); font-family: var(--font-mono);">${formatarMoeda(item.valorPeca)}</span>
            </div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Mão de Obra</span>
              <span style="font-size: 0.8rem; color: var(--text-secondary); font-family: var(--font-mono);">${formatarMoeda(maoDeObraCalculada)}</span>
            </div>
            <div style="display: flex; flex-direction: column; border-left: 1px dashed var(--border-color); padding-left: var(--spacing-sm);">
              <span style="font-size: 0.6rem; color: var(--color-success); text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Lucro (Ganho)</span>
              <span style="font-size: 0.8rem; color: var(--color-success); font-family: var(--font-mono); font-weight: bold;">${formatarMoeda(lucroCalculado)}</span>
            </div>
          </div>

          <!-- Status de Pagamento e Garantia -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--spacing-xs); padding-top: var(--spacing-xs);">
            <div style="display: flex; gap: var(--spacing-xs);">
              <span class="badge ${item.pagoPeloCliente ? 'badge-success' : 'badge-danger'}" style="font-size: 0.6rem;">
                ${item.pagoPeloCliente ? 'Cliente Pago' : 'Pendente Retirada'}
              </span>
              <span class="badge ${item.pecaPaga ? 'badge-success' : 'badge-danger'}" style="font-size: 0.6rem;">
                ${item.pecaPaga ? 'Peça Paga' : 'Peça Pendente'}
              </span>
            </div>
            
            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
              <span style="font-size: 0.7rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 2px;">
                🛡️ Garantia até ${formatarDataBR(item.garantiaAte)}
              </span>
              <button onclick="event.stopPropagation(); abrirModalEditarManutencao('${item.id}')" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: background-color var(--transition-fast);" onmouseenter="this.style.backgroundColor='rgba(59, 130, 246, 0.15)'" onmouseleave="this.style.backgroundColor='transparent'" title="Editar serviço">
                <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
              </button>
              <button onclick="event.stopPropagation(); excluirManutencao('${item.id}')" style="background: none; border: none; color: var(--color-danger); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: background-color var(--transition-fast);" onmouseenter="this.style.backgroundColor='rgba(255, 69, 58, 0.15)'" onmouseleave="this.style.backgroundColor='transparent'" title="Excluir serviço">
                <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  });

  return html;
}

export function atualizarFiltrosManutencoes(campo: string, valor: string): void {
  const filtro = (window as any).filtroManutencoes || { busca: '', ordenacao: 'data_desc', statusPagamento: 'todos', statusPeca: 'todos' };
  filtro[campo] = valor;
  (window as any).filtroManutencoes = filtro;

  const listContainer = document.querySelector('.list-container');
  if (listContainer) {
    const filteredAndSortedHTML = obterListItemsHTMLFiltrado();
    listContainer.innerHTML = filteredAndSortedHTML || `
      <div style="text-align: center; padding: var(--spacing-xl) var(--spacing-md); color: var(--text-muted); background: rgba(0,0,0,0.1); border-radius: var(--radius-md); border: 1px dashed var(--border-color); width: 100%; box-sizing: border-box;">
        <svg style="width: 2.5rem; height: 2.5rem; opacity: 0.4; margin-bottom: var(--spacing-sm); display: inline-block;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p style="font-size: 0.9rem; font-weight: 500; margin: 0;">Nenhum serviço encontrado com os filtros aplicados.</p>
      </div>
    `;
  }
}
(window as any).atualizarFiltrosManutencoes = atualizarFiltrosManutencoes;

export function renderizarManutencoes(container: HTMLElement): void {
  const pageElement = document.createElement('div');
  pageElement.className = 'page-container fade-in';

  const cardSettings = obterCardSettings();

  let totalPecas = 0;
  let totalMaoDeObra = 0;
  let totalLucro = 0;
  let totalFaturamento = 0;

  manutencoesMock.forEach(item => {
    const maoDeObraCalculada = item.valorCobrado - (item.valorPeca * 2);
    const lucroCalculado = item.valorPeca + maoDeObraCalculada;

    if (itemNaData(item.data, cardSettings.gastoPecas, cardSettings.gastoPecas_inicio, cardSettings.gastoPecas_fim)) {
      totalPecas += item.valorPeca;
    }
    if (itemNaData(item.data, cardSettings.maoDeObra, cardSettings.maoDeObra_inicio, cardSettings.maoDeObra_fim)) {
      totalMaoDeObra += maoDeObraCalculada;
    }
    if (itemNaData(item.data, cardSettings.lucro, cardSettings.lucro_inicio, cardSettings.lucro_fim)) {
      totalLucro += lucroCalculado;
    }
    if (itemNaData(item.data, cardSettings.faturamento, cardSettings.faturamento_inicio, cardSettings.faturamento_fim)) {
      totalFaturamento += item.valorCobrado;
    }
  });

  const listItemsHTML = obterListItemsHTMLFiltrado();

  pageElement.innerHTML = `
    <div class="page-header" style="display: flex; align-items: center; justify-content: flex-start; gap: var(--spacing-xs);">
      ${obterBotaoVoltarHTML()}
      <div>
        <h2 class="page-title">Serviços Técnicos</h2>
        <p class="page-subtitle">Gerencie ordens de serviço, mão de obra e peças</p>
      </div>
    </div>

    <!-- Cards de Indicadores de Filtros Rápidos (Customizáveis por Card) -->
    <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
      
      <!-- Card Faturamento -->
      <div class="metric-card click-card" onclick="abrirModalFiltroCard('faturamento', 'Faturamento Bruto')" title="Configurar período" style="cursor: pointer; padding: var(--spacing-sm); gap: var(--spacing-xs);">
        <div class="metric-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span class="metric-title" style="font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">Faturamento</span>
          <span style="font-size: 0.6rem; color: var(--color-primary); background-color: rgba(59, 130, 246, 0.1); padding: 1px 4px; border-radius: 4px; font-weight: bold; border: 1px solid rgba(59, 130, 246, 0.15); white-space: nowrap;">
            ${obterRotuloPeriodo(cardSettings.faturamento, cardSettings.faturamento_inicio, cardSettings.faturamento_fim)}
          </span>
        </div>
        <div class="metric-body" style="display: flex; flex-direction: column; gap: 2px;">
          <span class="metric-value" style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">${formatarMoeda(totalFaturamento)}</span>
          <span class="metric-desc" style="color: var(--color-primary); font-size: 0.65rem;">Filtro de período</span>
        </div>
      </div>

      <!-- Card Lucro Real -->
      <div class="metric-card click-card" onclick="abrirModalFiltroCard('lucro', 'Lucro Gerado')" title="Configurar período" style="cursor: pointer; padding: var(--spacing-sm); gap: var(--spacing-xs);">
        <div class="metric-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span class="metric-title" style="font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">Lucro</span>
          <span style="font-size: 0.6rem; color: var(--color-success); background-color: rgba(34, 197, 94, 0.1); padding: 1px 4px; border-radius: 4px; font-weight: bold; border: 1px solid rgba(34, 197, 94, 0.15); white-space: nowrap;">
            ${obterRotuloPeriodo(cardSettings.lucro, cardSettings.lucro_inicio, cardSettings.lucro_fim)}
          </span>
        </div>
        <div class="metric-body" style="display: flex; flex-direction: column; gap: 2px;">
          <span class="metric-value success" style="font-size: 1.15rem; font-weight: 700; color: var(--color-success); font-family: var(--font-mono);">${formatarMoeda(totalLucro)}</span>
          <span class="metric-desc" style="color: var(--color-success); font-size: 0.65rem;">Ganho estimado</span>
        </div>
      </div>

      <!-- Card Gasto com Peças -->
      <div class="metric-card click-card" onclick="abrirModalFiltroCard('gastoPecas', 'Gasto com Peças')" title="Configurar período" style="cursor: pointer; padding: var(--spacing-sm); gap: var(--spacing-xs);">
        <div class="metric-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span class="metric-title" style="font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">Custo Peças</span>
          <span style="font-size: 0.6rem; color: var(--text-muted); background-color: rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 4px; font-weight: bold; border: 1px solid rgba(255,255,255,0.08); white-space: nowrap;">
            ${obterRotuloPeriodo(cardSettings.gastoPecas, cardSettings.gastoPecas_inicio, cardSettings.gastoPecas_fim)}
          </span>
        </div>
        <div class="metric-body" style="display: flex; flex-direction: column; gap: 2px;">
          <span class="metric-value" style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">${formatarMoeda(totalPecas)}</span>
          <span class="metric-desc" style="color: var(--text-muted); font-size: 0.65rem;">Reposição de peças</span>
        </div>
      </div>

      <!-- Card Mão de Obra Líquida -->
      <div class="metric-card click-card" onclick="abrirModalFiltroCard('maoDeObra', 'Mão de Obra')" title="Configurar período" style="cursor: pointer; padding: var(--spacing-sm); gap: var(--spacing-xs);">
        <div class="metric-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span class="metric-title" style="font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">Mão de Obra</span>
          <span style="font-size: 0.6rem; color: var(--color-primary); background-color: rgba(59, 130, 246, 0.1); padding: 1px 4px; border-radius: 4px; font-weight: bold; border: 1px solid rgba(59, 130, 246, 0.15); white-space: nowrap;">
            ${obterRotuloPeriodo(cardSettings.maoDeObra, cardSettings.maoDeObra_inicio, cardSettings.maoDeObra_fim)}
          </span>
        </div>
        <div class="metric-body" style="display: flex; flex-direction: column; gap: 2px;">
          <span class="metric-value" style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">${formatarMoeda(totalMaoDeObra)}</span>
          <span class="metric-desc" style="color: var(--color-primary); font-size: 0.65rem;">Mão de obra líquida</span>
        </div>
      </div>

    </div>

    <!-- Barra de Ações: Filtro por texto e botão de adicionar -->
    <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); flex-wrap: wrap;">
      <div style="position: relative; flex: 1; min-width: 200px;">
        <input type="text" id="busca-manutencao" class="input-field" placeholder="Buscar cliente, aparelho, OS..." value="${(window as any).filtroManutencoes?.busca || ''}" style="padding-left: 2.25rem; height: 2.25rem; font-size: 0.85rem;" oninput="atualizarFiltrosManutencoes('busca', this.value)" />
        <svg style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); width: 1rem; height: 1rem; color: var(--text-muted); pointer-events: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      <button class="btn btn-primary" onclick="abrirModalCadastroServico()" style="font-size: 0.75rem; padding: 0 var(--spacing-sm); height: 2.25rem; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
        <svg style="width: 0.9rem; height: 0.9rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Registrar Serviço
      </button>
    </div>

    <!-- Filtros Avançados Expansíveis -->
    <details style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: var(--spacing-sm); padding: var(--spacing-xs) var(--spacing-sm);">
      <summary style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500; cursor: pointer; user-select: none; display: flex; align-items: center; gap: 4px;">
        Filtros Avançados e Ordenação
      </summary>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: var(--spacing-sm); padding-top: var(--spacing-sm);">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.65rem;" for="filtro-pagamento">Status Cliente</label>
          <select id="filtro-pagamento" class="input-field" style="background-color: var(--bg-input); height: 2rem; font-size: 0.75rem; padding: 2px 6px;" onchange="atualizarFiltrosManutencoes('statusPagamento', this.value)">
            <option value="todos" ${(window as any).filtroManutencoes?.statusPagamento === 'todos' ? 'selected' : ''}>Todos</option>
            <option value="pagos" ${(window as any).filtroManutencoes?.statusPagamento === 'pagos' ? 'selected' : ''}>Pagos</option>
            <option value="pendentes" ${(window as any).filtroManutencoes?.statusPagamento === 'pendentes' ? 'selected' : ''}>Pendentes</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.65rem;" for="filtro-peca">Status Peça</label>
          <select id="filtro-peca" class="input-field" style="background-color: var(--bg-input); height: 2rem; font-size: 0.75rem; padding: 2px 6px;" onchange="atualizarFiltrosManutencoes('statusPeca', this.value)">
            <option value="todos" ${(window as any).filtroManutencoes?.statusPeca === 'todos' ? 'selected' : ''}>Todos</option>
            <option value="pagos" ${(window as any).filtroManutencoes?.statusPeca === 'pagos' ? 'selected' : ''}>Peças Pagas</option>
            <option value="pendentes" ${(window as any).filtroManutencoes?.statusPeca === 'pendentes' ? 'selected' : ''}>Peças Pendentes</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.65rem;" for="ordenacao-manutencao">Ordenar por</label>
          <select id="ordenacao-manutencao" class="input-field" style="background-color: var(--bg-input); height: 2rem; font-size: 0.75rem; padding: 2px 6px;" onchange="atualizarFiltrosManutencoes('ordenacao', this.value)">
            <option value="data_desc" ${(window as any).filtroManutencoes?.ordenacao === 'data_desc' ? 'selected' : ''}>Data (Mais Novo)</option>
            <option value="data_asc" ${(window as any).filtroManutencoes?.ordenacao === 'data_asc' ? 'selected' : ''}>Data (Mais Antigo)</option>
            <option value="os_desc" ${(window as any).filtroManutencoes?.ordenacao === 'os_desc' ? 'selected' : ''}>Nº OS (Decrescente)</option>
            <option value="os_asc" ${(window as any).filtroManutencoes?.ordenacao === 'os_asc' ? 'selected' : ''}>Nº OS (Crescente)</option>
            <option value="valor_desc" ${(window as any).filtroManutencoes?.ordenacao === 'valor_desc' ? 'selected' : ''}>Valor Cobrado (Maior)</option>
            <option value="valor_asc" ${(window as any).filtroManutencoes?.ordenacao === 'valor_asc' ? 'selected' : ''}>Valor Cobrado (Menor)</option>
            <option value="lucro_desc" ${(window as any).filtroManutencoes?.ordenacao === 'lucro_desc' ? 'selected' : ''}>Lucro Real (Maior)</option>
          </select>
        </div>
      </div>
    </details>

    <!-- Lista de Manutenções -->
    <div class="list-container" style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
      ${listItemsHTML || `
        <div style="text-align: center; padding: var(--spacing-xl) var(--spacing-md); color: var(--text-muted); background: rgba(0,0,0,0.1); border-radius: var(--radius-md); border: 1px dashed var(--border-color); width: 100%; box-sizing: border-box;">
          <svg style="width: 2.5rem; height: 2.5rem; opacity: 0.4; margin-bottom: var(--spacing-sm); display: inline-block;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p style="font-size: 0.9rem; font-weight: 500; margin: 0;">Nenhum serviço encontrado com os filtros aplicados.</p>
        </div>
      `}
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(pageElement);
}

// Helper para cálculo seguro de data de garantia
function calcularGarantia(dataStr: string, dias: number): string {
  const d = new Date(dataStr + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

// 1. Cadastrar Novo Serviço Técnico
export function abrirModalCadastroServico(): void {
  const dataHoje = new Date().toISOString().split('T')[0];

  UI.abrirModal(
    "Registrar Serviço Técnico (O.S.)",
    `
      <form id="form-cadastro-manutencao" style="display: flex; flex-direction: column; gap: var(--spacing-xs); max-height: 70vh; overflow-y: auto; padding-right: 4px;" onsubmit="event.preventDefault();">
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="input-os-numero">Nº O.S.</label>
            <input type="text" id="input-os-numero" class="input-field" placeholder="Ex: 4504" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="input-os-cliente">Cliente</label>
            <input type="text" id="input-os-cliente" class="input-field" placeholder="Nome do Cliente" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="input-os-marca">Marca</label>
            <select id="input-os-marca" class="input-field" style="background-color: var(--bg-input); height: 2.5rem;">
              <option value="Apple">Apple (iPhone)</option>
              <option value="Samsung">Samsung</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Motorola">Motorola</option>
              <option value="LG">LG</option>
              <option value="ASUS">ASUS</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="input-os-modelo">Modelo</label>
            <input type="text" id="input-os-modelo" class="input-field" placeholder="Ex: iPhone 11 Pro" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="input-os-cor">Cor</label>
            <input type="text" id="input-os-cor" class="input-field" placeholder="Ex: Preto" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="input-os-data">Data de Entrada</label>
            <input type="date" id="input-os-data" class="input-field" value="${dataHoje}" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="input-os-situacao">Situação de Entrada / Defeito</label>
          <input type="text" id="input-os-situacao" class="input-field" placeholder="Ex: Tela trincada, não liga" required />
        </div>

        <!-- Inputs de Precificação com Auto-Cálculo Conforme Fórmula -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: var(--spacing-sm); border-radius: var(--radius-sm);" oninput="
          const peca = parseFloat((document.getElementById('input-os-peca') as HTMLInputElement).value) || 0;
          const mao = parseFloat((document.getElementById('input-os-mao') as HTMLInputElement).value) || 0;
          const cobrado = (peca * 2) + mao;
          const lucro = peca + mao;
          (document.getElementById('input-os-cobrado') as HTMLInputElement).value = cobrado.toFixed(2);
          document.getElementById('span-calc-cobrado').textContent = cobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          document.getElementById('span-calc-lucro').textContent = lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        ">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="input-os-peca">Custo da Peça (R$)</label>
            <input type="number" id="input-os-peca" class="input-field" placeholder="0.00" step="0.01" min="0" value="0.00" required />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="input-os-mao">Mão de Obra Livre (R$)</label>
            <input type="number" id="input-os-mao" class="input-field" placeholder="0.00" step="0.01" min="0" value="0.00" required />
          </div>
        </div>

        <!-- Pré-visualização Financeira em Tempo Real -->
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; padding: 4px var(--spacing-sm); background-color: rgba(0,0,0,0.1); border-radius: var(--radius-sm); margin-bottom: 4px;">
          <span class="text-muted">Cobrado do Cliente: <strong id="span-calc-cobrado" style="color: var(--text-primary); font-family: var(--font-mono);">R$ 0,00</strong></span>
          <span style="color: var(--color-success); font-weight: bold;">Lucro Estimado: <span id="span-calc-lucro" style="font-family: var(--font-mono);">R$ 0,00</span></span>
        </div>

        <!-- Campo oculto para envio do valor total cobrado -->
        <input type="hidden" id="input-os-cobrado" value="0.00" />

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="select-os-pago">Pagamento Cliente</label>
            <select id="select-os-pago" class="input-field" style="background-color: var(--bg-input); height: 2.5rem;">
              <option value="false">Pendente</option>
              <option value="true">Pago (Finalizado)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="select-os-pecapaga">Fornecedor Peça</label>
            <select id="select-os-pecapaga" class="input-field" style="background-color: var(--bg-input); height: 2.5rem;">
              <option value="false">Pendente pagar peça</option>
              <option value="true">Peça Paga</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="input-os-garantia">Dias de Garantia</label>
          <input type="number" id="input-os-garantia" class="input-field" value="90" min="0" required />
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-cadastro-manutencao') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const os = (document.getElementById('input-os-numero') as HTMLInputElement).value.trim();
      const cliente = (document.getElementById('input-os-cliente') as HTMLInputElement).value.trim();
      const marca = (document.getElementById('input-os-marca') as HTMLSelectElement).value;
      const modelo = (document.getElementById('input-os-modelo') as HTMLInputElement).value.trim();
      const cor = (document.getElementById('input-os-cor') as HTMLInputElement).value.trim();
      const data = (document.getElementById('input-os-data') as HTMLInputElement).value;
      const situacao = (document.getElementById('input-os-situacao') as HTMLInputElement).value.trim();
      const valorPeca = parseFloat((document.getElementById('input-os-peca') as HTMLInputElement).value) || 0;
      const maoDeObra = parseFloat((document.getElementById('input-os-mao') as HTMLInputElement).value) || 0;
      const valorCobrado = parseFloat((document.getElementById('input-os-cobrado') as HTMLInputElement).value) || 0;
      const pagoPeloCliente = (document.getElementById('select-os-pago') as HTMLSelectElement).value === 'true';
      const pecaPaga = (document.getElementById('select-os-pecapaga') as HTMLSelectElement).value === 'true';
      const garantiaDias = parseInt((document.getElementById('input-os-garantia') as HTMLInputElement).value) || 90;

      const lucro = valorCobrado - valorPeca;
      const garantiaAte = calcularGarantia(data, garantiaDias);
      const novoId = `M-${101 + manutencoesMock.length + Date.now().toString().slice(-4)}`;

      const novaManutencao: Manutencao = {
        id: novoId,
        os,
        cliente,
        aparelho: `${marca} ${modelo}`,
        marca,
        modelo,
        cor,
        situacao,
        valorPeca,
        maoDeObra,
        valorCobrado,
        lucro,
        pagoPeloCliente,
        pecaPaga,
        data,
        garantiaAte
      };

      // Grava quem criou
      assinarCriacao(novaManutencao);
      manutencoesMock.unshift(novaManutencao);

      localStorage.setItem('gestor_manutencoes', JSON.stringify(manutencoesMock));
      recalcularDadosDashboard();
      UI.mostrarToast('Ordem de serviço registrada com sucesso!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        renderizarManutencoes(mainContent);
      }
    },
    'Lançar Ordem de Serviço'
  );
}

// 2. Editar Serviço Técnico Existente
export function abrirModalEditarManutencao(id: string): void {
  const item = manutencoesMock.find(m => m.id === id);
  if (!item) {
    UI.mostrarToast('Ordem de serviço não encontrada.', 'danger');
    return;
  }

  // Descobre dias de garantia restantes aproximados
  const dataEntrada = new Date(item.data + 'T12:00:00');
  const dataGarantia = new Date(item.garantiaAte + 'T12:00:00');
  const diffTime = Math.abs(dataGarantia.getTime() - dataEntrada.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 90;

  UI.abrirModal(
    "Editar Ordem de Serviço",
    `
      <form id="form-editar-manutencao" style="display: flex; flex-direction: column; gap: var(--spacing-xs); max-height: 70vh; overflow-y: auto; padding-right: 4px;" onsubmit="event.preventDefault();">
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="edit-os-numero">Nº O.S.</label>
            <input type="text" id="edit-os-numero" class="input-field" value="${item.os}" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-os-cliente">Cliente</label>
            <input type="text" id="edit-os-cliente" class="input-field" value="${item.cliente}" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="edit-os-marca">Marca</label>
            <select id="edit-os-marca" class="input-field" style="background-color: var(--bg-input); height: 2.5rem;">
              <option value="Apple" ${item.marca === 'Apple' ? 'selected' : ''}>Apple (iPhone)</option>
              <option value="Samsung" ${item.marca === 'Samsung' ? 'selected' : ''}>Samsung</option>
              <option value="Xiaomi" ${item.marca === 'Xiaomi' ? 'selected' : ''}>Xiaomi</option>
              <option value="Motorola" ${item.marca === 'Motorola' ? 'selected' : ''}>Motorola</option>
              <option value="LG" ${item.marca === 'LG' ? 'selected' : ''}>LG</option>
              <option value="ASUS" ${item.marca === 'ASUS' ? 'selected' : ''}>ASUS</option>
              <option value="Outro" ${item.marca === 'Outro' ? 'selected' : ''}>Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-os-modelo">Modelo</label>
            <input type="text" id="edit-os-modelo" class="input-field" value="${item.modelo}" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="edit-os-cor">Cor</label>
            <input type="text" id="edit-os-cor" class="input-field" value="${item.cor}" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-os-data">Data de Entrada</label>
            <input type="date" id="edit-os-data" class="input-field" value="${item.data}" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-os-situacao">Situação / Defeito</label>
          <input type="text" id="edit-os-situacao" class="input-field" value="${item.situacao}" required />
        </div>

        <!-- Inputs de Precificação com Auto-Cálculo -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: var(--spacing-sm); border-radius: var(--radius-sm);" oninput="
          const peca = parseFloat((document.getElementById('edit-os-peca') as HTMLInputElement).value) || 0;
          const mao = parseFloat((document.getElementById('edit-os-mao') as HTMLInputElement).value) || 0;
          const cobrado = (peca * 2) + mao;
          const lucro = peca + mao;
          (document.getElementById('edit-os-cobrado') as HTMLInputElement).value = cobrado.toFixed(2);
          document.getElementById('span-edit-cobrado').textContent = cobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          document.getElementById('span-edit-lucro').textContent = lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        ">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="edit-os-peca">Custo da Peça (R$)</label>
            <input type="number" id="edit-os-peca" class="input-field" value="${item.valorPeca}" step="0.01" min="0" required />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="edit-os-mao">Mão de Obra Livre (R$)</label>
            <input type="number" id="edit-os-mao" class="input-field" value="${item.maoDeObra}" step="0.01" min="0" required />
          </div>
        </div>

        <!-- Pré-visualização Financeira Recalculada -->
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; padding: 4px var(--spacing-sm); background-color: rgba(0,0,0,0.1); border-radius: var(--radius-sm); margin-bottom: 4px;">
          <span class="text-muted">Cobrado Cliente: <strong id="span-edit-cobrado" style="color: var(--text-primary); font-family: var(--font-mono);">${formatarMoeda(item.valorCobrado)}</strong></span>
          <span style="color: var(--color-success); font-weight: bold;">Lucro Estimado: <span id="span-edit-lucro" style="font-family: var(--font-mono);">${formatarMoeda(item.lucro)}</span></span>
        </div>

        <!-- Campo oculto para envio do valor total cobrado -->
        <input type="hidden" id="edit-os-cobrado" value="${item.valorCobrado}" />

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="select-edit-pago">Pagamento Cliente</label>
            <select id="select-edit-pago" class="input-field" style="background-color: var(--bg-input); height: 2.5rem;">
              <option value="false" ${!item.pagoPeloCliente ? 'selected' : ''}>Pendente</option>
              <option value="true" ${item.pagoPeloCliente ? 'selected' : ''}>Pago (Finalizado)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="select-edit-pecapaga">Fornecedor Peça</label>
            <select id="select-edit-pecapaga" class="input-field" style="background-color: var(--bg-input); height: 2.5rem;">
              <option value="false" ${!item.pecaPaga ? 'selected' : ''}>Pendente pagar peça</option>
              <option value="true" ${item.pecaPaga ? 'selected' : ''}>Peça Paga</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-os-garantia">Dias de Garantia</label>
          <input type="number" id="edit-os-garantia" class="input-field" value="${diffDays}" min="0" required />
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-editar-manutencao') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      item.os = (document.getElementById('edit-os-numero') as HTMLInputElement).value.trim();
      item.cliente = (document.getElementById('edit-os-cliente') as HTMLInputElement).value.trim();
      item.marca = (document.getElementById('edit-os-marca') as HTMLSelectElement).value;
      item.modelo = (document.getElementById('edit-os-modelo') as HTMLInputElement).value.trim();
      item.aparelho = `${item.marca} ${item.modelo}`;
      item.cor = (document.getElementById('edit-os-cor') as HTMLInputElement).value.trim();
      item.data = (document.getElementById('edit-os-data') as HTMLInputElement).value;
      item.situacao = (document.getElementById('edit-os-situacao') as HTMLInputElement).value.trim();
      item.valorPeca = parseFloat((document.getElementById('edit-os-peca') as HTMLInputElement).value) || 0;
      item.maoDeObra = parseFloat((document.getElementById('edit-os-mao') as HTMLInputElement).value) || 0;
      item.valorCobrado = parseFloat((document.getElementById('edit-os-cobrado') as HTMLInputElement).value) || 0;
      item.pagoPeloCliente = (document.getElementById('select-edit-pago') as HTMLSelectElement).value === 'true';
      item.pecaPaga = (document.getElementById('select-edit-pecapaga') as HTMLSelectElement).value === 'true';
      const garantiaDias = parseInt((document.getElementById('edit-os-garantia') as HTMLInputElement).value) || 90;

      item.lucro = item.valorCobrado - item.valorPeca;
      item.garantiaAte = calcularGarantia(item.data, garantiaDias);

      // Assina modificação
      assinarModificacao(item);

      localStorage.setItem('gestor_manutencoes', JSON.stringify(manutencoesMock));
      recalcularDadosDashboard();
      UI.mostrarToast('Ordem de serviço atualizada com sucesso!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        renderizarManutencoes(mainContent);
      }
    },
    'Salvar Alterações'
  );
}

// 3. Excluir Serviço Técnico
export function excluirManutencao(id: string): void {
  UI.abrirModal(
    "Excluir Ordem de Serviço",
    `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%; box-sizing: border-box;">
        <p style="color: var(--color-danger); font-weight: 500; font-size: 0.95rem; margin: 0;">Tem certeza que deseja excluir esta O.S.?</p>
        <p class="text-muted" style="font-size: 0.8rem; margin: 0; line-height: 1.4;">Esta ação removerá permanentemente o histórico do serviço e atualizará os faturamentos.</p>
      </div>
    `,
    () => {
      const index = manutencoesMock.findIndex(m => m.id === id);
      if (index !== -1) {
        manutencoesMock.splice(index, 1);
        localStorage.setItem('gestor_manutencoes', JSON.stringify(manutencoesMock));
        recalcularDadosDashboard();
        UI.mostrarToast('Ordem de serviço excluída!', 'success');
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          renderizarManutencoes(mainContent);
        }
      }
    },
    'Excluir'
  );
}

// Vincula ao escopo global para acionamento por tags HTML onclick
(window as any).abrirModalCadastroServico = abrirModalCadastroServico;
(window as any).abrirModalEditarManutencao = abrirModalEditarManutencao;
(window as any).excluirManutencao = excluirManutencao;

