/* 
  views/vendas.ts
  Renderizador da tela de Vendas Diárias.
*/

import { formatarMoeda, formatarDataBR, obterBotaoVoltarHTML, UI, formatarAssinatura } from '../ui.ts';
import { vendasMock, dadosDashboardMock, recalcularDadosDashboard, paginaAtual, assinarCriacao, assinarModificacao } from '../state.ts';
import { renderizarDashboard } from './dashboard.ts';
import { Venda } from '../types.ts';

export function abrirModalCadastroVenda(): void {
  const dataHoje = new Date().toISOString().split('T')[0];

  UI.abrirModal(
    "Lançar Venda Diária",
    `
      <form id="form-cadastro-venda" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="input-venda-data">Data da Venda</label>
          <input type="date" id="input-venda-data" class="input-field" value="${dataHoje}" required style="height: 2.75rem; background-color: var(--bg-input);" />
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="input-venda-pix">PIX (R$)</label>
            <input type="number" id="input-venda-pix" class="input-field" step="0.01" min="0" value="0.00" style="height: 2.75rem; background-color: var(--bg-input);" />
          </div>
          <div class="form-group">
            <label class="form-label" for="input-venda-credito">Crédito (R$)</label>
            <input type="number" id="input-venda-credito" class="input-field" step="0.01" min="0" value="0.00" style="height: 2.75rem; background-color: var(--bg-input);" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="input-venda-debito">Débito (R$)</label>
            <input type="number" id="input-venda-debito" class="input-field" step="0.01" min="0" value="0.00" style="height: 2.75rem; background-color: var(--bg-input);" />
          </div>
          <div class="form-group">
            <label class="form-label" for="input-venda-dinheiro">Dinheiro (R$)</label>
            <input type="number" id="input-venda-dinheiro" class="input-field" step="0.01" min="0" value="0.00" style="height: 2.75rem; background-color: var(--bg-input);" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="input-venda-obs">Observação / Descrição</label>
          <input type="text" id="input-venda-obs" class="input-field" placeholder="Ex: Capas, películas, venda de acessórios" style="height: 2.75rem; background-color: var(--bg-input);" />
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-cadastro-venda') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const dataInput = document.getElementById('input-venda-data') as HTMLInputElement;
      const pixInput = document.getElementById('input-venda-pix') as HTMLInputElement;
      const creditoInput = document.getElementById('input-venda-credito') as HTMLInputElement;
      const debitoInput = document.getElementById('input-venda-debito') as HTMLInputElement;
      const dinheiroInput = document.getElementById('input-venda-dinheiro') as HTMLInputElement;
      const obsInput = document.getElementById('input-venda-obs') as HTMLInputElement;

      const data = dataInput.value;
      const pix = parseFloat(pixInput.value) || 0;
      const credito = parseFloat(creditoInput.value) || 0;
      const debito = parseFloat(debitoInput.value) || 0;
      const dinheiro = parseFloat(dinheiroInput.value) || 0;
      const observacao = obsInput.value.trim() || `Venda do dia ${formatarDataBR(data)}`;

      const total = pix + credito + debito + dinheiro;

      if (total <= 0) {
        UI.mostrarToast('Por favor, insira o valor de pelo menos uma forma de pagamento.', 'danger');
        return;
      }

      const novoId = `V-${Date.now()}`;
      const novaVenda: Venda = {
        id: novoId,
        data,
        pix,
        credito,
        debito,
        dinheiro,
        total,
        observacao
      };
      
      assinarCriacao(novaVenda);
      vendasMock.unshift(novaVenda);

      localStorage.setItem('gestor_vendas', JSON.stringify(vendasMock));
      recalcularDadosDashboard();
      UI.mostrarToast('Venda diária cadastrada com sucesso!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        if (paginaAtual === 'vendas') {
          renderizarVendas(mainContent);
        } else if (paginaAtual === 'dashboard') {
          renderizarDashboard(mainContent, dadosDashboardMock);
        }
      }
    },
    'Lançar Venda'
  );
}
(window as any).abrirModalCadastroVenda = abrirModalCadastroVenda;

export function obterVendasFiltradas(): Venda[] {
  const filtro = (window as any).filtroVendas || { periodo: 'mes', dataInicio: '', dataFim: '' };
  const hoje = new Date();
  
  return vendasMock.filter(v => {
    const dataVenda = new Date(v.data + 'T12:00:00');
    
    if (filtro.periodo === 'dia') {
      const hojeStr = hoje.toISOString().split('T')[0];
      return v.data === hojeStr;
    }
    
    if (filtro.periodo === 'semana') {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(hoje.getDate() - 7);
      seteDiasAtras.setHours(0,0,0,0);
      return dataVenda >= seteDiasAtras && dataVenda <= hoje;
    }
    
    if (filtro.periodo === 'mes') {
      const primeiroDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      return dataVenda >= primeiroDoMes && dataVenda <= hoje;
    }
    
    if (filtro.periodo === 'ano') {
      const primeiroDoAno = new Date(hoje.getFullYear(), 0, 1);
      return dataVenda >= primeiroDoAno && dataVenda <= hoje;
    }
    
    if (filtro.periodo === 'personalizado') {
      if (!filtro.dataInicio || !filtro.dataFim) return true;
      const inicio = new Date(filtro.dataInicio + 'T00:00:00');
      const fim = new Date(filtro.dataFim + 'T23:59:59');
      return dataVenda >= inicio && dataVenda <= fim;
    }
    
    return true;
  });
}

export function obterDadosGraficoEvolucao(vendasFiltradas: Venda[]): { label: string; valor: number }[] {
  const filtro = (window as any).filtroVendas || { periodo: 'mes', dataInicio: '', dataFim: '' };
  
  if (filtro.periodo === 'ano') {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const valoresMes = Array(12).fill(0);
    
    vendasFiltradas.forEach(v => {
      const dataParts = v.data.split('-');
      if (dataParts.length === 3) {
        const mesIndex = parseInt(dataParts[1]) - 1;
        if (mesIndex >= 0 && mesIndex < 12) {
          valoresMes[mesIndex] += v.total;
        }
      }
    });
    
    return meses.map((nome, i) => ({ label: nome, valor: valoresMes[i] }));
  }
  
  const hoje = new Date();
  let datas: Date[] = [];
  
  if (filtro.periodo === 'dia') {
    datas = [new Date()];
  } else if (filtro.periodo === 'semana') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(hoje.getDate() - i);
      datas.push(d);
    }
  } else if (filtro.periodo === 'mes') {
    const totalDias = hoje.getDate();
    for (let i = 1; i <= totalDias; i++) {
      datas.push(new Date(hoje.getFullYear(), hoje.getMonth(), i));
    }
  } else if (filtro.periodo === 'personalizado') {
    if (filtro.dataInicio && filtro.dataFim) {
      const inicio = new Date(filtro.dataInicio + 'T12:00:00');
      const fim = new Date(filtro.dataFim + 'T12:00:00');
      const diffTime = Math.abs(fim.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const maxDays = Math.min(diffDays, 45);
      for (let i = 0; i <= maxDays; i++) {
        const d = new Date(inicio.getTime());
        d.setDate(inicio.getDate() + i);
        datas.push(d);
      }
    } else {
      for (let i = 14; i >= 0; i--) {
        const d = new Date();
        d.setDate(hoje.getDate() - i);
        datas.push(d);
      }
    }
  } else {
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(hoje.getDate() - i);
      datas.push(d);
    }
  }
  
  return datas.map(date => {
    const isoStr = date.toISOString().split('T')[0];
    const totalDia = vendasFiltradas
      .filter(v => v.data === isoStr)
      .reduce((sum, v) => sum + v.total, 0);
      
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    return {
      label: `${dia}/${mes}`,
      valor: totalDia
    };
  });
}

export function gerarDonutChartHTML(pix: number, credito: number, debito: number, dinheiro: number): string {
  const total = pix + credito + debito + dinheiro;
  if (total === 0) {
    return `
      <div style="display: flex; align-items: center; justify-content: center; height: 160px; color: var(--text-muted); font-size: 0.85rem;">
        Sem dados de pagamento no período
      </div>
    `;
  }

  const pPix = (pix / total) * 100;
  const pCred = (credito / total) * 100;
  const pDeb = (debito / total) * 100;
  const pDinh = (dinheiro / total) * 100;

  const r = 38;
  const circ = 2 * Math.PI * r;

  let currentOffset = 0;
  
  const segments = [
    { value: pix, pct: pPix, color: '#3b82f6', label: 'PIX' },
    { value: credito, pct: pCred, color: '#10b981', label: 'Crédito' },
    { value: debito, pct: pDeb, color: '#f59e0b', label: 'Débito' },
    { value: dinheiro, pct: pDinh, color: '#8b5cf6', label: 'Dinheiro' }
  ].filter(s => s.value > 0);

  let svgCircles = '';
  segments.forEach(seg => {
    const dashArray = `${(seg.pct / 100) * circ} ${circ}`;
    const dashOffset = -currentOffset;
    svgCircles += `<circle cx="50" cy="50" r="${r}" fill="transparent" stroke="${seg.color}" stroke-width="10" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 50 50)" style="transition: stroke-dashoffset 0.5s ease;" />`;
    currentOffset += (seg.pct / 100) * circ;
  });

  let legendHTML = '<div style="display: flex; flex-direction: column; gap: var(--spacing-xs); flex: 1; min-width: 140px;">';
  segments.forEach(seg => {
    legendHTML += `
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; width: 100%;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${seg.color};"></span>
          <span style="color: var(--text-secondary); font-weight: 500;">${seg.label}</span>
        </div>
        <div style="text-align: right; font-family: var(--font-mono);">
          <strong style="color: var(--text-primary);">${seg.pct.toFixed(0)}%</strong>
          <span style="color: var(--text-muted); font-size: 0.7rem; display: block;">${formatarMoeda(seg.value)}</span>
        </div>
      </div>
    `;
  });
  legendHTML += '</div>';

  return `
    <div style="display: flex; align-items: center; justify-content: space-around; gap: var(--spacing-md); flex-wrap: wrap; padding: var(--spacing-sm) 0;">
      <div style="position: relative; width: 120px; height: 120px; flex-shrink: 0;">
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
          <circle cx="50" cy="50" r="${r}" fill="transparent" stroke="var(--border-color)" stroke-width="10" opacity="0.3" />
          ${svgCircles}
        </svg>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; pointer-events: none;">
          <span style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: block; line-height: 1;">Total</span>
          <strong style="font-size: 0.9rem; color: var(--text-primary); font-family: var(--font-mono); font-weight: bold; line-height: 1.2; display: block; margin-top: 2px;">${total >= 1000 ? (total/1000).toFixed(1) + 'k' : total.toFixed(0)}</strong>
        </div>
      </div>
      ${legendHTML}
    </div>
  `;
}

export function gerarBarChartHTML(dados: { label: string; valor: number }[]): string {
  const maxValor = Math.max(...dados.map(d => d.valor), 10);
  
  const height = 110;
  const paddingBottom = 20;
  const paddingTop = 15;
  const totalHeight = height + paddingBottom + paddingTop;
  
  let columnsHTML = '';
  const numItems = dados.length;
  
  dados.forEach((d) => {
    const pctHeight = (d.valor / maxValor) * height;
    const barHeight = Math.max(pctHeight, d.valor > 0 ? 3 : 0);
    const topOffset = height - barHeight + paddingTop;
    
    columnsHTML += `
      <div style="display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 28px; position: relative; height: ${totalHeight}px;" title="${d.label}: ${formatarMoeda(d.valor)}">
        ${d.valor > 0 ? `<span style="font-size: 0.58rem; color: var(--color-success); font-family: var(--font-mono); position: absolute; top: ${topOffset - 12}px; font-weight: bold; white-space: nowrap;">${d.valor >= 1000 ? (d.valor/1000).toFixed(1) + 'k' : d.valor.toFixed(0)}</span>` : ''}
        <div style="position: absolute; top: ${topOffset}px; bottom: ${paddingBottom}px; width: 10px; background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); border-radius: var(--radius-xs) var(--radius-xs) 0 0; transition: height 0.5s ease-in-out;"></div>
        <span style="font-size: 0.6rem; color: var(--text-muted); font-family: var(--font-mono); position: absolute; bottom: 2px; white-space: nowrap;">${d.label}</span>
      </div>
    `;
  });
  
  return `
    <div style="width: 100%; overflow-x: auto; padding-bottom: 4px; box-sizing: border-box; -webkit-overflow-scrolling: touch;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; min-width: ${numItems * 32}px; height: ${totalHeight}px; box-sizing: border-box; padding: 0 var(--spacing-xs); border-bottom: 1px solid var(--border-color); position: relative;">
        <div style="position: absolute; left: 0; right: 0; top: ${paddingTop}px; border-top: 1px dashed rgba(255,255,255,0.05); pointer-events: none;"></div>
        <div style="position: absolute; left: 0; right: 0; top: ${paddingTop + height / 2}px; border-top: 1px dashed rgba(255,255,255,0.05); pointer-events: none;"></div>
        ${columnsHTML}
      </div>
    </div>
  `;
}

export function atualizarFiltroVendas(periodo: string): void {
  const filtro = (window as any).filtroVendas || { periodo: 'mes', dataInicio: '', dataFim: '' };
  filtro.periodo = periodo;
  
  if (periodo === 'personalizado' && (!filtro.dataInicio || !filtro.dataFim)) {
    const hoje = new Date();
    const quinzeDiasAtras = new Date();
    quinzeDiasAtras.setDate(hoje.getDate() - 15);
    
    filtro.dataInicio = quinzeDiasAtras.toISOString().split('T')[0];
    filtro.dataFim = hoje.toISOString().split('T')[0];
  }
  
  (window as any).filtroVendas = filtro;
  
  const mainContent = document.getElementById('main-content');
  if (mainContent && paginaAtual === 'vendas') {
    renderizarVendas(mainContent);
  }
}
(window as any).atualizarFiltroVendas = atualizarFiltroVendas;

export function atualizarFiltroVendasDatas(): void {
  const inicioInput = document.getElementById('filtro-vendas-inicio') as HTMLInputElement;
  const fimInput = document.getElementById('filtro-vendas-fim') as HTMLInputElement;
  
  if (inicioInput && fimInput) {
    const filtro = (window as any).filtroVendas || { periodo: 'personalizado', dataInicio: '', dataFim: '' };
    filtro.dataInicio = inicioInput.value;
    filtro.dataFim = fimInput.value;
    (window as any).filtroVendas = filtro;
    
    const mainContent = document.getElementById('main-content');
    if (mainContent && paginaAtual === 'vendas') {
      renderizarVendas(mainContent);
    }
  }
}
(window as any).atualizarFiltroVendasDatas = atualizarFiltroVendasDatas;

export function abrirModalEditarVenda(id: string): void {
  const item = vendasMock.find(v => v.id === id);
  if (!item) {
    UI.mostrarToast('Venda não encontrada.', 'danger');
    return;
  }

  UI.abrirModal(
    "Editar Venda Diária",
    `
      <form id="form-editar-venda" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="edit-venda-data">Data da Venda</label>
          <input type="date" id="edit-venda-data" class="input-field" value="${item.data}" required style="height: 2.75rem; background-color: var(--bg-input);" />
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="edit-venda-pix">PIX (R$)</label>
            <input type="number" id="edit-venda-pix" class="input-field" step="0.01" min="0" value="${item.pix || 0}" style="height: 2.75rem; background-color: var(--bg-input);" />
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-venda-credito">Crédito (R$)</label>
            <input type="number" id="edit-venda-credito" class="input-field" step="0.01" min="0" value="${item.credito || 0}" style="height: 2.75rem; background-color: var(--bg-input);" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="edit-venda-debito">Débito (R$)</label>
            <input type="number" id="edit-venda-debito" class="input-field" step="0.01" min="0" value="${item.debito || 0}" style="height: 2.75rem; background-color: var(--bg-input);" />
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-venda-dinheiro">Dinheiro (R$)</label>
            <input type="number" id="edit-venda-dinheiro" class="input-field" step="0.01" min="0" value="${item.dinheiro || 0}" style="height: 2.75rem; background-color: var(--bg-input);" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-venda-obs">Observação / Descrição</label>
          <input type="text" id="edit-venda-obs" class="input-field" value="${item.observacao}" placeholder="Ex: Capas, películas, venda de acessórios" style="height: 2.75rem; background-color: var(--bg-input);" />
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-editar-venda') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const dataInput = document.getElementById('edit-venda-data') as HTMLInputElement;
      const pixInput = document.getElementById('edit-venda-pix') as HTMLInputElement;
      const creditoInput = document.getElementById('edit-venda-credito') as HTMLInputElement;
      const debitoInput = document.getElementById('edit-venda-debito') as HTMLInputElement;
      const dinheiroInput = document.getElementById('edit-venda-dinheiro') as HTMLInputElement;
      const obsInput = document.getElementById('edit-venda-obs') as HTMLInputElement;

      const data = dataInput.value;
      const pix = parseFloat(pixInput.value) || 0;
      const credito = parseFloat(creditoInput.value) || 0;
      const debito = parseFloat(debitoInput.value) || 0;
      const dinheiro = parseFloat(dinheiroInput.value) || 0;
      const observacao = obsInput.value.trim() || `Venda do dia ${formatarDataBR(data)}`;

      const total = pix + credito + debito + dinheiro;

      if (total <= 0) {
        UI.mostrarToast('Por favor, insira o valor de pelo menos uma forma de pagamento.', 'danger');
        return;
      }

      item.data = data;
      item.pix = pix;
      item.credito = credito;
      item.debito = debito;
      item.dinheiro = dinheiro;
      item.total = total;
      item.observacao = observacao;

      assinarModificacao(item);

      localStorage.setItem('gestor_vendas', JSON.stringify(vendasMock));
      recalcularDadosDashboard();
      UI.mostrarToast('Venda atualizada com sucesso!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent && paginaAtual === 'vendas') {
        renderizarVendas(mainContent);
      }
    },
    'Salvar Alterações'
  );
}
(window as any).abrirModalEditarVenda = abrirModalEditarVenda;

export function excluirVenda(id: string): void {
  UI.abrirModal(
    "Excluir Venda Diária",
    `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%; box-sizing: border-box;">
        <p style="color: var(--color-danger); font-weight: 500; font-size: 0.95rem; margin: 0;">Tem certeza que deseja excluir este registro de venda?</p>
        <p class="text-muted" style="font-size: 0.8rem; margin: 0; line-height: 1.4;">Esta ação é permanente e atualizará as projeções de faturamento de vendas.</p>
      </div>
    `,
    () => {
      const index = vendasMock.findIndex(v => v.id === id);
      if (index !== -1) {
        vendasMock.splice(index, 1);
        localStorage.setItem('gestor_vendas', JSON.stringify(vendasMock));
        recalcularDadosDashboard();
        UI.mostrarToast('Registro de venda excluído com sucesso!', 'success');
        
        const mainContent = document.getElementById('main-content');
        if (mainContent && paginaAtual === 'vendas') {
          renderizarVendas(mainContent);
        }
      }
    },
    'Excluir'
  );
}
(window as any).excluirVenda = excluirVenda;

export function renderizarVendas(container: HTMLElement): void {
  const pageElement = document.createElement('div');
  pageElement.className = 'page-container fade-in';

  if (!(window as any).filtroVendas) {
    (window as any).filtroVendas = { periodo: 'mes', dataInicio: '', dataFim: '' };
  }
  const filtro = (window as any).filtroVendas;

  const vendasFiltradas = obterVendasFiltradas();

  let totalPix = 0;
  let totalCredito = 0;
  let totalDebito = 0;
  let totalDinheiro = 0;
  let totalGeral = 0;

  vendasFiltradas.forEach(item => {
    totalPix += item.pix || 0;
    totalCredito += item.credito || 0;
    totalDebito += item.debito || 0;
    totalDinheiro += item.dinheiro || 0;
    totalGeral += item.total || 0;
  });

  const dadosGrafico = obterDadosGraficoEvolucao(vendasFiltradas);

  let listItemsHTML = '';
  vendasFiltradas.forEach(item => {
    listItemsHTML += `
      <div class="list-item" style="display: flex; flex-direction: column; gap: var(--spacing-sm); align-items: stretch;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-sm);">
          <div>
            <h4 class="font-highlight" style="font-size: 0.95rem; margin: 0;">${item.observacao || 'Venda'}</h4>
            <p class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">
              Data da Venda: ${formatarDataBR(item.data)}${formatarAssinatura(item)}
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-success); font-size: 1.1rem;">
              ${formatarMoeda(item.total)}
            </span>
            <div style="display: flex; gap: 4px;">
              <button onclick="abrirModalEditarVenda('${item.id}')" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: background-color var(--transition-fast);" onmouseenter="this.style.backgroundColor='rgba(59, 130, 246, 0.15)'" onmouseleave="this.style.backgroundColor='transparent'" title="Editar venda">
                <svg style="width: 0.95rem; height: 0.95rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
              </button>
              <button onclick="excluirVenda('${item.id}')" style="background: none; border: none; color: var(--color-danger); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: background-color var(--transition-fast);" onmouseenter="this.style.backgroundColor='rgba(255, 69, 58, 0.15)'" onmouseleave="this.style.backgroundColor='transparent'" title="Excluir venda">
                <svg style="width: 0.95rem; height: 0.95rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Breakdown de Pagamentos -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background-color: var(--bg-tertiary); padding: 6px var(--spacing-xs); border-radius: var(--radius-sm); border: 1px dashed var(--border-color);">
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <span style="font-size: 0.58rem; color: var(--text-muted); text-transform: uppercase;">PIX</span>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 600; color: ${item.pix > 0 ? 'var(--text-primary)' : 'var(--text-muted)'};">
              ${item.pix > 0 ? formatarMoeda(item.pix) : '—'}
            </span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <span style="font-size: 0.58rem; color: var(--text-muted); text-transform: uppercase;">Crédito</span>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 600; color: ${item.credito > 0 ? 'var(--text-primary)' : 'var(--text-muted)'};">
              ${item.credito > 0 ? formatarMoeda(item.credito) : '—'}
            </span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <span style="font-size: 0.58rem; color: var(--text-muted); text-transform: uppercase;">Débito</span>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 600; color: ${item.debito > 0 ? 'var(--text-primary)' : 'var(--text-muted)'};">
              ${item.debito > 0 ? formatarMoeda(item.debito) : '—'}
            </span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <span style="font-size: 0.58rem; color: var(--text-muted); text-transform: uppercase;">Dinheiro</span>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 600; color: ${item.dinheiro > 0 ? 'var(--text-primary)' : 'var(--text-muted)'};">
              ${item.dinheiro > 0 ? formatarMoeda(item.dinheiro) : '—'}
            </span>
          </div>
        </div>
      </div>
    `;
  });

  if (vendasFiltradas.length === 0) {
    listItemsHTML = `
      <div style="text-align: center; padding: var(--spacing-xl) var(--spacing-md); color: var(--text-muted); font-size: 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); width: 100%;">
        Nenhuma venda registrada para o período selecionado.
      </div>
    `;
  }

  pageElement.innerHTML = `
    <div class="page-header" style="display: flex; align-items: center; justify-content: flex-start; gap: var(--spacing-xs);">
      ${obterBotaoVoltarHTML()}
      <div>
        <h2 class="page-title">Vendas Diárias</h2>
        <p class="page-subtitle">Controle de caixa pessoal por forma de pagamento</p>
      </div>
    </div>

    <!-- Filtros de Período -->
    <div class="card" style="margin-bottom: var(--spacing-md); gap: var(--spacing-sm); display: flex; flex-direction: column; padding: var(--spacing-md);">
      <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Filtrar Vendas por Período</span>
      <div style="display: flex; gap: var(--spacing-xs); flex-wrap: wrap;">
        <button class="btn ${filtro.periodo === 'dia' ? 'btn-primary' : 'btn-secondary'}" onclick="atualizarFiltroVendas('dia')" style="flex: 1; font-size: 0.75rem; height: 2rem; border-radius: var(--radius-sm); padding: 0; min-width: 60px;">Hoje</button>
        <button class="btn ${filtro.periodo === 'semana' ? 'btn-primary' : 'btn-secondary'}" onclick="atualizarFiltroVendas('semana')" style="flex: 1; font-size: 0.75rem; height: 2rem; border-radius: var(--radius-sm); padding: 0; min-width: 60px;">7 Dias</button>
        <button class="btn ${filtro.periodo === 'mes' ? 'btn-primary' : 'btn-secondary'}" onclick="atualizarFiltroVendas('mes')" style="flex: 1; font-size: 0.75rem; height: 2rem; border-radius: var(--radius-sm); padding: 0; min-width: 60px;">Mês</button>
        <button class="btn ${filtro.periodo === 'ano' ? 'btn-primary' : 'btn-secondary'}" onclick="atualizarFiltroVendas('ano')" style="flex: 1; font-size: 0.75rem; height: 2rem; border-radius: var(--radius-sm); padding: 0; min-width: 60px;">Ano</button>
        <button class="btn ${filtro.periodo === 'personalizado' ? 'btn-primary' : 'btn-secondary'}" onclick="atualizarFiltroVendas('personalizado')" style="flex: 1.2; font-size: 0.75rem; height: 2rem; border-radius: var(--radius-sm); padding: 0; min-width: 80px;">Customizado</button>
      </div>
      
      ${filtro.periodo === 'personalizado' ? `
        <div style="display: flex; gap: var(--spacing-sm); align-items: center; justify-content: space-between; flex-wrap: wrap; margin-top: 4px; border-top: 1px solid var(--border-color); padding-top: var(--spacing-sm);">
          <div style="display: flex; gap: var(--spacing-xs); align-items: center; flex: 1; min-width: 140px;">
            <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">Início:</label>
            <input type="date" id="filtro-vendas-inicio" class="input-field" value="${filtro.dataInicio}" onchange="atualizarFiltroVendasDatas()" style="height: 2.25rem; background-color: var(--bg-input); font-size: 0.8rem; padding: 0 8px;" />
          </div>
          <div style="display: flex; gap: var(--spacing-xs); align-items: center; flex: 1; min-width: 140px;">
            <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">Fim:</label>
            <input type="date" id="filtro-vendas-fim" class="input-field" value="${filtro.dataFim}" onchange="atualizarFiltroVendasDatas()" style="height: 2.25rem; background-color: var(--bg-input); font-size: 0.8rem; padding: 0 8px;" />
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Painel de Gráficos Visuais -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
      <!-- Card Gráfico Formas de Pagamento -->
      <div class="card" style="padding: var(--spacing-md); background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); display: flex; flex-direction: column;">
        <h3 class="font-highlight" style="font-size: 0.9rem; margin-bottom: var(--spacing-xs); border-bottom: 1px solid var(--border-color); padding-bottom: var(--spacing-xs); text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; color: var(--text-secondary);">Meios de Pagamento</h3>
        ${gerarDonutChartHTML(totalPix, totalCredito, totalDebito, totalDinheiro)}
      </div>
      
      <!-- Card Gráfico Evolução de Vendas -->
      <div class="card" style="padding: var(--spacing-md); background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); display: flex; flex-direction: column;">
        <h3 class="font-highlight" style="font-size: 0.9rem; margin-bottom: var(--spacing-xs); border-bottom: 1px solid var(--border-color); padding-bottom: var(--spacing-xs); text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; color: var(--text-secondary);">Evolução das Vendas</h3>
        ${gerarBarChartHTML(dadosGrafico)}
      </div>
    </div>

    <!-- Painel de Métricas Rápidas de Vendas -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
      <div class="card" style="padding: var(--spacing-sm); display: flex; flex-direction: column; gap: 2px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">Total no Período</span>
        <span style="font-size: 1.25rem; font-weight: bold; font-family: var(--font-mono); color: var(--color-success);">${formatarMoeda(totalGeral)}</span>
      </div>
      <div class="card" style="padding: var(--spacing-sm); display: flex; flex-direction: column; gap: 2px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">PIX</span>
        <span style="font-size: 1.15rem; font-weight: bold; font-family: var(--font-mono); color: var(--text-primary);">${formatarMoeda(totalPix)}</span>
      </div>
      <div class="card" style="padding: var(--spacing-sm); display: flex; flex-direction: column; gap: 2px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">Crédito</span>
        <span style="font-size: 1.15rem; font-weight: bold; font-family: var(--font-mono); color: var(--text-primary);">${formatarMoeda(totalCredito)}</span>
      </div>
      <div class="card" style="padding: var(--spacing-sm); display: flex; flex-direction: column; gap: 2px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">Débito</span>
        <span style="font-size: 1.15rem; font-weight: bold; font-family: var(--font-mono); color: var(--text-primary);">${formatarMoeda(totalDebito)}</span>
      </div>
      <div class="card" style="padding: var(--spacing-sm); display: flex; flex-direction: column; gap: 2px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">Dinheiro</span>
        <span style="font-size: 1.15rem; font-weight: bold; font-family: var(--font-mono); color: var(--text-primary);">${formatarMoeda(totalDinheiro)}</span>
      </div>
    </div>

    <!-- Botão de Ação -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: var(--spacing-sm);">
      <button class="btn btn-primary" onclick="abrirModalCadastroVenda()" style="font-size: 0.8rem; padding: 0 var(--spacing-md); height: 2.25rem; border-radius: var(--radius-md);">
        <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Lançar Venda
      </button>
    </div>

    <!-- Histórico de Vendas -->
    <div class="list-container">
      ${listItemsHTML}
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(pageElement);
}
(window as any).renderizarVendas = renderizarVendas;
