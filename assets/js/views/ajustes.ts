/* 
  views/ajustes.ts
  Renderizador da tela de Configurações / Ajustes, incluindo parâmetros financeiros e o motor de backups JSON.
*/

import { formatarMoeda, obterBotaoVoltarHTML, UI } from '../ui.ts';
import { 
  configInicial, 
  dadosDashboardMock, 
  recalcularDadosDashboard, 
  paginaAtual, 
  manutencoesMock, 
  despesasMock, 
  retiradasMock, 
  vendasMock,
  obterUsuarioLogado,
  definirUsuarioLogado,
  usuariosMock,
  hashSenha,
  zerarTodosOsDados
} from '../state.ts';
import { renderizarDashboard } from './dashboard.ts';

// Abre modal para editar a Reserva de Emergência de forma dinâmica e persistente
export function abrirModalEditarReservaEmergencia(): void {
  UI.abrirModal(
    "Editar Reserva de Emergência",
    `
      <form id="form-editar-reserva" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="input-reserva">Reserva de Emergência (R$)</label>
          <input type="number" id="input-reserva" class="input-field" value="${configInicial.reservaMinima}" step="0.01" min="0" required style="height: 2.75rem; background-color: var(--bg-input);" />
          <p class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">Dinheiro reservado de segurança. Este valor serve de referência e proteção para a sua assistência.</p>
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-editar-reserva') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const inputReserva = document.getElementById('input-reserva') as HTMLInputElement;
      const novaReserva = parseFloat(inputReserva.value) || 0;

      configInicial.reservaMinima = novaReserva;
      localStorage.setItem('gestor_reserva_minima', novaReserva.toString());

      recalcularDadosDashboard();
      UI.mostrarToast('Reserva de Emergência atualizada com sucesso!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        if (paginaAtual === 'dashboard') {
          renderizarDashboard(mainContent, dadosDashboardMock);
        } else if (paginaAtual === 'ajustes') {
          renderizarAjustes(mainContent);
        }
      }
    },
    'Salvar Reserva'
  );
}
(window as any).abrirModalEditarReservaEmergencia = abrirModalEditarReservaEmergencia;

// Abre modal para editar a Estimativa de Despesas Fixas de forma dinâmica e persistente
export function abrirModalEditarDespesasFixas(): void {
  UI.abrirModal(
    "Editar Despesas Fixas Estimadas",
    `
      <form id="form-editar-despesas-fixas" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="input-despesas-fixas">Estimativa de Despesas Fixas (R$)</label>
          <input type="number" id="input-despesas-fixas" class="input-field" value="${configInicial.despesasFixasEstimadas}" step="0.01" min="0" required style="height: 2.75rem; background-color: var(--bg-input);" />
          <p class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">Soma projetada das despesas operacionais necessárias do mês.</p>
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-editar-despesas-fixas') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const inputDespesas = document.getElementById('input-despesas-fixas') as HTMLInputElement;
      const novasDespesas = parseFloat(inputDespesas.value) || 0;

      configInicial.despesasFixasEstimadas = novasDespesas;
      localStorage.setItem('gestor_despesas_fixas_estimadas', novasDespesas.toString());

      recalcularDadosDashboard();
      UI.mostrarToast('Estimativa de Despesas Fixas atualizada com sucesso!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        if (paginaAtual === 'dashboard') {
          renderizarDashboard(mainContent, dadosDashboardMock);
        } else if (paginaAtual === 'ajustes') {
          renderizarAjustes(mainContent);
        }
      }
    },
    'Salvar Despesas'
  );
}
(window as any).abrirModalEditarDespesasFixas = abrirModalEditarDespesasFixas;

// Abre modal para configurar o planejamento de compras de mercadorias quinzenais
export function abrirModalEditarPlanejamentoCompras(): void {
  UI.abrirModal(
    "Planejamento de Compras Quinzenais",
    `
      <form id="form-editar-planejamento-compras" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group" style="display: flex; align-items: center; gap: var(--spacing-xs); background: rgba(255,255,255,0.03); padding: var(--spacing-sm); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: var(--spacing-xs); box-sizing: border-box; width: 100%;">
          <input type="checkbox" id="input-compras-ativa" style="width: 1.15rem; height: 1.15rem; cursor: pointer; accent-color: var(--color-primary);" ${configInicial.compraReposicaoAtiva ? 'checked' : ''} />
          <label for="input-compras-ativa" style="cursor: pointer; font-size: 0.9rem; font-weight: 500; color: var(--text-primary); user-select: none;">Dedução Preventiva Ativa</label>
        </div>
        <p class="text-muted" style="font-size: 0.75rem; margin-top: -10px; margin-bottom: var(--spacing-xs); line-height: 1.3;">
          Se ativado, o sistema deduzirá preventivamente o valor da próxima compra de reposição do saldo "Disponível para Retiradas", garantindo que você tenha o dinheiro necessário na segunda-feira sem desfalcar o caixa da loja.
        </p>

        <div class="form-group">
          <label class="form-label" for="input-compras-valor">Valor Estimado por Compra (R$)</label>
          <input type="number" id="input-compras-valor" class="input-field" value="${configInicial.compraReposicaoValor}" step="0.01" min="0" required style="height: 2.75rem; background-color: var(--bg-input);" />
          <p class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">Custo médio quinzenal de reposição de mercadorias e insumos (ex: R$ 7.000,00).</p>
        </div>

        <div class="form-group">
          <label class="form-label" for="input-compras-data">Próxima Data de Compra (Segunda-feira)</label>
          <input type="date" id="input-compras-data" class="input-field" value="${configInicial.compraReposicaoProximaData}" required style="height: 2.75rem; background-color: var(--bg-input);" />
          <p class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">Data da segunda-feira programada para a compra de mercadorias.</p>
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-editar-planejamento-compras') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const inputAtiva = document.getElementById('input-compras-ativa') as HTMLInputElement;
      const inputValor = document.getElementById('input-compras-valor') as HTMLInputElement;
      const inputData = document.getElementById('input-compras-data') as HTMLInputElement;

      const ativa = inputAtiva.checked;
      const valor = parseFloat(inputValor.value) || 0;
      const data = inputData.value;

      configInicial.compraReposicaoAtiva = ativa;
      configInicial.compraReposicaoValor = valor;
      configInicial.compraReposicaoProximaData = data;

      localStorage.setItem('gestor_compra_reposicao_ativa', ativa.toString());
      localStorage.setItem('gestor_compra_reposicao_valor', valor.toString());
      localStorage.setItem('gestor_compra_reposicao_proxima_data', data);

      recalcularDadosDashboard();
      UI.mostrarToast('Planejamento de compras quinzenais atualizado!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        if (paginaAtual === 'dashboard') {
          renderizarDashboard(mainContent, dadosDashboardMock);
        } else if (paginaAtual === 'ajustes') {
          renderizarAjustes(mainContent);
        }
      }
    },
    'Salvar Planejamento'
  );
}
(window as any).abrirModalEditarPlanejamentoCompras = abrirModalEditarPlanejamentoCompras;

// Abre modal para configurar a Meta de Faturamento de forma dinâmica e persistente
export function abrirModalEditarMetaFaturamento(): void {
  UI.abrirModal(
    "Editar Meta de Faturamento",
    `
      <form id="form-editar-meta" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="input-meta">Meta de Faturamento Mensal (R$)</label>
          <input type="number" id="input-meta" class="input-field" value="${configInicial.metaFaturamento}" step="0.01" min="0" required style="height: 2.75rem; background-color: var(--bg-input);" />
          <p class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">Alvo bruto total somando vendas de balcão e receita bruta de serviços (ex: R$ 15.000,00).</p>
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-editar-meta') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const inputMeta = document.getElementById('input-meta') as HTMLInputElement;
      const novaMeta = parseFloat(inputMeta.value) || 0;

      configInicial.metaFaturamento = novaMeta;
      localStorage.setItem('gestor_meta_faturamento', novaMeta.toString());

      recalcularDadosDashboard();
      UI.mostrarToast('Meta de Faturamento atualizada com sucesso!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        if (paginaAtual === 'dashboard') {
          renderizarDashboard(mainContent, dadosDashboardMock);
        } else if (paginaAtual === 'ajustes') {
          renderizarAjustes(mainContent);
        }
      }
    },
    'Salvar Meta'
  );
}
(window as any).abrirModalEditarMetaFaturamento = abrirModalEditarMetaFaturamento;

// Abre modal para configurar a Margem de Lucro das Vendas (%) de forma dinâmica e persistente
export function abrirModalEditarMargemLucroVendas(): void {
  UI.abrirModal(
    "Margem de Lucro de Balcão",
    `
      <form id="form-editar-margem-lucro" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="input-margem-lucro">Margem de Lucro Estimada (%)</label>
          <input type="number" id="input-margem-lucro" class="input-field" value="${configInicial.margemLucroVendas}" step="0.1" min="1" max="100" required style="height: 2.75rem; background-color: var(--bg-input);" />
          <p class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">Porcentagem de lucro estimada sobre as vendas de balcão (como películas, capinhas, acessórios) para cálculo do pool livre (ex: 40%).</p>
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-editar-margem-lucro') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const inputMargem = document.getElementById('input-margem-lucro') as HTMLInputElement;
      const novaMargem = parseFloat(inputMargem.value) || 0;

      configInicial.margemLucroVendas = novaMargem;
      localStorage.setItem('gestor_margem_lucro_vendas', novaMargem.toString());

      recalcularDadosDashboard();
      UI.mostrarToast('Margem de Lucro de Vendas atualizada com sucesso!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        if (paginaAtual === 'dashboard') {
          renderizarDashboard(mainContent, dadosDashboardMock);
        } else if (paginaAtual === 'ajustes') {
          renderizarAjustes(mainContent);
        }
      }
    },
    'Salvar Margem'
  );
}
(window as any).abrirModalEditarMargemLucroVendas = abrirModalEditarMargemLucroVendas;

export function exportarBackupJSON(): void {
  try {
    const backupData = {
      gestor_manutencoes: JSON.parse(localStorage.getItem('gestor_manutencoes') || '[]'),
      gestor_despesas: JSON.parse(localStorage.getItem('gestor_despesas') || '[]'),
      gestor_retiradas: JSON.parse(localStorage.getItem('gestor_retiradas') || '[]'),
      gestor_vendas: JSON.parse(localStorage.getItem('gestor_vendas') || '[]'),
      gestor_reserva_minima: localStorage.getItem('gestor_reserva_minima') || '2500.00',
      gestor_despesas_fixas_estimadas: localStorage.getItem('gestor_despesas_fixas_estimadas') || '1350.00',
      gestor_saldo_pagbank: localStorage.getItem('gestor_saldo_pagbank') || '8450.00'
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    const dataHoje = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `gestor_loja_backup_${dataHoje}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    UI.mostrarToast('Cópia de segurança exportada com sucesso!', 'success');
  } catch (err) {
    console.error('Erro ao exportar backup:', err);
    UI.mostrarToast('Erro ao exportar backup.', 'danger');
  }
}
(window as any).exportarBackupJSON = exportarBackupJSON;

export function importarBackupJSON(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input || !input.files || input.files.length === 0) return;

  const arquivo = input.files[0];
  const leitor = new FileReader();
  
  leitor.onload = (e) => {
    try {
      const conteudo = e.target?.result as string;
      const dados = JSON.parse(conteudo);
      
      if (!dados || (typeof dados !== 'object')) {
        throw new Error('Formato inválido.');
      }

      UI.abrirModal(
        "Confirmar Restauração de Backup",
        `
          <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%; box-sizing: border-box;">
            <p style="color: var(--color-danger); font-weight: 500; font-size: 0.9rem; margin: 0;">Atenção: Esta ação irá substituir todos os dados atuais do sistema!</p>
            <p class="text-muted" style="font-size: 0.8rem; margin: 0;">Os seguintes registros importados serão salvos:</p>
            <ul class="text-muted" style="font-size: 0.8rem; padding-left: var(--spacing-md); list-style-type: disc; margin: 0; display: flex; flex-direction: column; gap: 2px;">
              <li>Serviços (Manutenções): ${Array.isArray(dados.gestor_manutencoes) ? dados.gestor_manutencoes.length : 0}</li>
              <li>Despesas: ${Array.isArray(dados.gestor_despesas) ? dados.gestor_despesas.length : 0}</li>
              <li>Retiradas: ${Array.isArray(dados.gestor_retiradas) ? dados.gestor_retiradas.length : 0}</li>
              <li>Vendas: ${Array.isArray(dados.gestor_vendas) ? dados.gestor_vendas.length : 0}</li>
              <li>Saldo PagBank: R$ ${parseFloat(dados.gestor_saldo_pagbank || '0').toFixed(2)}</li>
            </ul>
            <p class="text-muted" style="font-size: 0.8rem; margin: 4px 0 0 0;">Deseja prosseguir com a restauração?</p>
          </div>
        `,
        () => {
          if (Array.isArray(dados.gestor_manutencoes)) {
            localStorage.setItem('gestor_manutencoes', JSON.stringify(dados.gestor_manutencoes));
            manutencoesMock.length = 0;
            manutencoesMock.push(...dados.gestor_manutencoes);
          }
          if (Array.isArray(dados.gestor_despesas)) {
            localStorage.setItem('gestor_despesas', JSON.stringify(dados.gestor_despesas));
            despesasMock.length = 0;
            despesasMock.push(...dados.gestor_despesas);
          }
          if (Array.isArray(dados.gestor_retiradas)) {
            localStorage.setItem('gestor_retiradas', JSON.stringify(dados.gestor_retiradas));
            retiradasMock.length = 0;
            retiradasMock.push(...dados.gestor_retiradas);
          }
          if (Array.isArray(dados.gestor_vendas)) {
            localStorage.setItem('gestor_vendas', JSON.stringify(dados.gestor_vendas));
            vendasMock.length = 0;
            vendasMock.push(...dados.gestor_vendas);
          }
          
          if (dados.gestor_reserva_minima !== undefined) {
            localStorage.setItem('gestor_reserva_minima', dados.gestor_reserva_minima.toString());
            configInicial.reservaMinima = parseFloat(dados.gestor_reserva_minima);
          }
          if (dados.gestor_despesas_fixas_estimadas !== undefined) {
            localStorage.setItem('gestor_despesas_fixas_estimadas', dados.gestor_despesas_fixas_estimadas.toString());
            configInicial.despesasFixasEstimadas = parseFloat(dados.gestor_despesas_fixas_estimadas);
          }
          if (dados.gestor_saldo_pagbank !== undefined) {
            localStorage.setItem('gestor_saldo_pagbank', dados.gestor_saldo_pagbank.toString());
            dadosDashboardMock.saldoPagBank = parseFloat(dados.gestor_saldo_pagbank);
          }

          recalcularDadosDashboard();
          UI.mostrarToast('Backup restaurado com sucesso!', 'success');
          
          const mainContent = document.getElementById('main-content');
          if (mainContent && paginaAtual === 'ajustes') {
            renderizarAjustes(mainContent);
          }
        },
        'Restaurar Backup'
      );
    } catch (err) {
      console.error('Erro ao ler backup:', err);
      UI.mostrarToast('Formato de arquivo inválido ou corrompido.', 'danger');
    }
    input.value = '';
  };

  leitor.readAsText(arquivo);
}
(window as any).importarBackupJSON = importarBackupJSON;

export function renderizarAjustes(container: HTMLElement): void {
  const usuarioAtual = obterUsuarioLogado();
  const pageElement = document.createElement('div');
  pageElement.className = 'page-container fade-in';

  pageElement.innerHTML = `
    <div class="page-header" style="display: flex; align-items: center; justify-content: flex-start; gap: var(--spacing-xs);">
      ${obterBotaoVoltarHTML()}
      <div>
        <h2 class="page-title">Configurações</h2>
        <p class="page-subtitle">Ajustes gerais e parâmetros operacionais do sistema</p>
      </div>
    </div>

    <section class="card" style="gap: var(--spacing-md);">
      <h3 class="font-highlight" style="font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: var(--spacing-sm); margin-bottom: var(--spacing-xs);">
        Parâmetros Financeiros
      </h3>

      <p class="text-muted" style="font-size: 0.8rem; margin-bottom: var(--spacing-xs);">
        Clique nos cards abaixo para editar as configurações e atualizar as projeções operacionais do sistema:
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-sm);">
        <!-- Card Reserva de Emergência -->
        <div class="metric-card click-card" onclick="abrirModalEditarReservaEmergencia()" style="cursor: pointer; position: relative; border: 1px solid var(--border-color); background: var(--bg-tertiary);" title="Clique para editar">
          <div class="metric-header">
            <span class="metric-title" style="display: flex; align-items: center; gap: 6px;">
              Reserva de Emergência
              <svg style="width: 0.85rem; height: 0.85rem; opacity: 0.6; color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </span>
            <div class="metric-icon-wrapper" style="background-color: rgba(239, 68, 68, 0.1); color: rgb(239, 68, 68); width: 1.85rem; height: 1.85rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span>🛡️</span>
            </div>
          </div>
          <div class="metric-body" style="margin-top: 4px;">
            <span class="metric-value danger" style="font-size: 1.25rem;">${formatarMoeda(configInicial.reservaMinima)}</span>
            <span class="metric-desc">Toque para alterar o fundo de segurança</span>
          </div>
        </div>

        <!-- Card Estimativa de Despesas Fixas -->
        <div class="metric-card click-card" onclick="abrirModalEditarDespesasFixas()" style="cursor: pointer; position: relative; border: 1px solid var(--border-color); background: var(--bg-tertiary);" title="Clique para editar">
          <div class="metric-header">
            <span class="metric-title" style="display: flex; align-items: center; gap: 6px;">
              Estimativa de Despesas Fixas
              <svg style="width: 0.85rem; height: 0.85rem; opacity: 0.6; color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </span>
            <div class="metric-icon-wrapper" style="background-color: rgba(59, 130, 246, 0.1); color: rgb(59, 130, 246); width: 1.85rem; height: 1.85rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span>📊</span>
            </div>
          </div>
          <div class="metric-body" style="margin-top: 4px;">
            <span class="metric-value" style="font-size: 1.25rem;">${formatarMoeda(configInicial.despesasFixasEstimadas)}</span>
            <span class="metric-desc">Toque para alterar projeção do mês</span>
          </div>
        </div>

        <!-- Card Planejamento de Compras Quinzenais -->
        <div class="metric-card click-card" onclick="abrirModalEditarPlanejamentoCompras()" style="cursor: pointer; position: relative; border: 1px solid var(--border-color); background: var(--bg-tertiary);" title="Clique para editar">
          <div class="metric-header">
            <span class="metric-title" style="display: flex; align-items: center; gap: 6px;">
              Reposição Quinzenal (Compras)
              <svg style="width: 0.85rem; height: 0.85rem; opacity: 0.6; color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </span>
            <div class="metric-icon-wrapper" style="background-color: rgba(168, 85, 247, 0.1); color: rgb(168, 85, 247); width: 1.85rem; height: 1.85rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span>🛒</span>
            </div>
          </div>
          <div class="metric-body" style="margin-top: 4px;">
            <span class="metric-value" style="font-size: 1.25rem; color: rgb(168, 85, 247);">${formatarMoeda(configInicial.compraReposicaoValor)}</span>
            <span class="metric-desc" style="line-height: 1.4;">${configInicial.compraReposicaoAtiva ? '<span style="color: var(--color-success); font-weight: 500;">🟢 Ativado (Deduzindo do livre)</span>' : '<span style="color: var(--text-muted);">⚪ Informativo apenas</span>'}<br>Próxima: ${configInicial.compraReposicaoProximaData.split('-').reverse().join('/')}</span>
          </div>
        </div>

        <!-- Card Meta de Faturamento -->
        <div class="metric-card click-card" onclick="abrirModalEditarMetaFaturamento()" style="cursor: pointer; position: relative; border: 1px solid var(--border-color); background: var(--bg-tertiary);" title="Clique para editar">
          <div class="metric-header">
            <span class="metric-title" style="display: flex; align-items: center; gap: 6px;">
              Meta de Faturamento
              <svg style="width: 0.85rem; height: 0.85rem; opacity: 0.6; color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </span>
            <div class="metric-icon-wrapper" style="background-color: rgba(16, 185, 129, 0.1); color: rgb(16, 185, 129); width: 1.85rem; height: 1.85rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span>🎯</span>
            </div>
          </div>
          <div class="metric-body" style="margin-top: 4px;">
            <span class="metric-value success" style="font-size: 1.25rem;">${formatarMoeda(configInicial.metaFaturamento)}</span>
            <span class="metric-desc">Toque para alterar o alvo bruto mensal</span>
          </div>
        </div>

        <!-- Card Margem de Lucro Balcão -->
        <div class="metric-card click-card" onclick="abrirModalEditarMargemLucroVendas()" style="cursor: pointer; position: relative; border: 1px solid var(--border-color); background: var(--bg-tertiary);" title="Clique para editar">
          <div class="metric-header">
            <span class="metric-title" style="display: flex; align-items: center; gap: 6px;">
              Margem de Vendas (Balcão)
              <svg style="width: 0.85rem; height: 0.85rem; opacity: 0.6; color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </span>
            <div class="metric-icon-wrapper" style="background-color: rgba(245, 158, 11, 0.1); color: rgb(245, 158, 11); width: 1.85rem; height: 1.85rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span>📈</span>
            </div>
          </div>
          <div class="metric-body" style="margin-top: 4px;">
            <span class="metric-value" style="font-size: 1.25rem; color: rgb(245, 158, 11);">${configInicial.margemLucroVendas}%</span>
            <span class="metric-desc">Toque para alterar a margem do balcão</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Seção de Configuração da Conta -->
    <section class="card" style="gap: var(--spacing-md); margin-top: var(--spacing-sm);">
      <h3 class="font-highlight" style="font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: var(--spacing-sm); margin-bottom: var(--spacing-xs);">
        Configurações da Conta
      </h3>
      <p class="text-muted" style="font-size: 0.8rem; margin: 0 0 var(--spacing-xs) 0; line-height: 1.4;">
        Atualize suas credenciais e nome de usuário. Se desejar alterar sua senha, preencha os campos abaixo de forma segura (sua senha é criptografada no banco de dados local via SHA-256).
      </p>
      
      <form id="form-ajustes-conta" onsubmit="salvarAjustesConta(event); return false;" style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="ajustes-nome">Nome Completo</label>
            <input type="text" id="ajustes-nome" class="input-field" value="${usuarioAtual ? usuarioAtual.nome : ''}" required style="height: 2.5rem; background-color: var(--bg-input);" />
          </div>
          <div class="form-group">
            <label class="form-label" for="ajustes-username">Nome de Usuário (Login)</label>
            <input type="text" id="ajustes-username" class="input-field" value="${usuarioAtual ? usuarioAtual.username : ''}" required style="height: 2.5rem; background-color: var(--bg-input);" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-sm);">
          <div class="form-group">
            <label class="form-label" for="ajustes-senha">Nova Senha (Opcional)</label>
            <input type="password" id="ajustes-senha" class="input-field" placeholder="Deixe em branco para manter a atual" style="height: 2.5rem; background-color: var(--bg-input);" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label class="form-label" for="ajustes-confirmar-senha">Confirmar Nova Senha</label>
            <input type="password" id="ajustes-confirmar-senha" class="input-field" placeholder="Confirme a nova senha" style="height: 2.5rem; background-color: var(--bg-input);" autocomplete="new-password" />
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="height: 2.5rem; font-weight: 600; width: 100%; margin-top: var(--spacing-xs); border-radius: var(--radius-md);">
          💾 Salvar Alterações da Conta
        </button>
      </form>
    </section>

    <!-- Seção de Backup e Cópia de Segurança -->
    <section class="card" style="gap: var(--spacing-md); margin-top: var(--spacing-sm);">
      <h3 class="font-highlight" style="font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: var(--spacing-sm); margin-bottom: var(--spacing-xs);">
        Cópia de Segurança & Relatórios
      </h3>
      <p class="text-muted" style="font-size: 0.8rem; margin: 0 0 var(--spacing-xs) 0; line-height: 1.4;">
        Gere e baixe uma cópia de segurança de todos os seus dados em JSON para restaurar depois, ou exporte relatórios formatados em Excel/CSV.
      </p>
      <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap; width: 100%; box-sizing: border-box; margin-bottom: var(--spacing-xs);">
        <button class="btn btn-secondary" onclick="exportarBackupJSON()" style="flex: 1; min-width: 140px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.82rem; height: 2.5rem; border-radius: var(--radius-md);">
          💾 Backup Completo (JSON)
        </button>
        <button class="btn btn-secondary" onclick="document.getElementById('input-importar-backup').click()" style="flex: 1; min-width: 140px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.82rem; height: 2.5rem; border-radius: var(--radius-md);">
          📂 Restaurar Backup (JSON)
        </button>
        <button class="btn btn-primary" onclick="abrirModalExportarCSV()" style="flex: 1; min-width: 140px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.82rem; height: 2.5rem; border-radius: var(--radius-md);">
          📊 Exportar para Excel (CSV)
        </button>
        <input type="file" id="input-importar-backup" accept=".json" onchange="importarBackupJSON(event)" style="display: none;" />
      </div>

      <div style="border-top: 1px dashed var(--border-color); padding-top: var(--spacing-sm); margin-top: var(--spacing-sm);">
        <p class="text-muted" style="font-size: 0.8rem; margin: 0 0 var(--spacing-sm) 0; line-height: 1.4;">
          <strong>Modo de Produção / Limpeza de Dados:</strong> Se você estiver pronto para colocar a aplicação no ar e quiser limpar todos os dados de teste (mocks) de forma instantânea, use a opção abaixo.
        </p>
        <button class="btn btn-danger" onclick="confirmarZerarSistema()" style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.82rem; height: 2.5rem; border-radius: var(--radius-md); width: 100%; max-width: 280px; font-weight: 600; background-color: var(--color-danger); color: white; border: none; cursor: pointer;">
          ⚠️ Zerar Todos os Dados (Produção)
        </button>
      </div>
    </section>

    <section class="card" style="margin-top: var(--spacing-sm); gap: var(--spacing-sm);">
      <h3 class="font-highlight" style="font-size: 1rem;">Sobre o Gestor da Loja</h3>
      <p class="text-muted" style="font-size: 0.8rem;">
        Desenvolvido sob o padrão SPA de alta performance usando HTML5, CSS3 Customizado e TypeScript nativo. 
        Pronto para futuras migrações de backend.
      </p>
    </section>
  `;

  container.innerHTML = '';
  container.appendChild(pageElement);
}
(window as any).renderizarAjustes = renderizarAjustes;

export async function salvarAjustesConta(event: Event): Promise<void> {
  event.preventDefault();
  
  const usuario = obterUsuarioLogado();
  if (!usuario) {
    UI.mostrarToast('Você precisa estar logado para alterar as configurações de conta.', 'danger');
    return;
  }

  const inputNome = document.getElementById('ajustes-nome') as HTMLInputElement;
  const inputUsername = document.getElementById('ajustes-username') as HTMLInputElement;
  const inputSenha = document.getElementById('ajustes-senha') as HTMLInputElement;
  const inputConfirmarSenha = document.getElementById('ajustes-confirmar-senha') as HTMLInputElement;

  const nome = inputNome.value.trim();
  const username = inputUsername.value.trim().toLowerCase();
  const novaSenha = inputSenha.value;
  const confirmarSenha = inputConfirmarSenha.value;

  if (!nome || !username) {
    UI.mostrarToast('Nome e Nome de Usuário são obrigatórios.', 'danger');
    return;
  }

  // Verifica se o username já é de outro usuário
  const outroUsuario = usuariosMock.find(u => u.username === username && u.username !== usuario.username);
  if (outroUsuario) {
    UI.mostrarToast('Este nome de usuário já está sendo utilizado por outra conta.', 'danger');
    return;
  }

  // Se digitar senha, valida
  if (novaSenha) {
    if (novaSenha.length < 4) {
      UI.mostrarToast('A nova senha deve conter no mínimo 4 caracteres.', 'danger');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      UI.mostrarToast('As senhas digitadas não coincidem!', 'danger');
      return;
    }
  }

  try {
    // Localiza e atualiza o usuário na lista de usuários
    const idx = usuariosMock.findIndex(u => u.username === usuario.username);
    if (idx !== -1) {
      usuariosMock[idx].nome = nome;
      usuariosMock[idx].username = username;
      if (novaSenha) {
        // Encripta a nova senha de forma segura com SHA-256
        usuariosMock[idx].senhaHash = await hashSenha(novaSenha);
      }
      
      // Salva a lista de usuários atualizada
      localStorage.setItem('gestor_usuarios', JSON.stringify(usuariosMock));
      
      // Atualiza a sessão ativa
      definirUsuarioLogado(usuariosMock[idx]);
      
      UI.mostrarToast('Configurações de conta salvas com sucesso!', 'success');
      
      // Limpa os campos de senha
      inputSenha.value = '';
      inputConfirmarSenha.value = '';
      
      // Atualiza o cabeçalho superior (se o nome foi alterado)
      const userDisplay = document.getElementById('user-name-display');
      if (userDisplay) {
        userDisplay.textContent = nome;
      }
    } else {
      UI.mostrarToast('Erro ao localizar o registro de usuário.', 'danger');
    }
  } catch (err) {
    console.error(err);
    UI.mostrarToast('Ocorreu um erro ao salvar as configurações de conta.', 'danger');
  }
}
(window as any).salvarAjustesConta = salvarAjustesConta;

// Helpers e Funções de Exportação de CSV/Excel
export function baixarCSV(linhas: string[][], nomeArquivo: string): void {
  const conteudoCSV = '\ufeff' + linhas.map(l => l.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dataHoje = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `gestor_${nomeArquivo}_${dataHoje}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  UI.mostrarToast('Relatório CSV baixado com sucesso!', 'success');
}
(window as any).baixarCSV = baixarCSV;

export function exportarExtratoConsolidadoCSV(): void {
  try {
    const rows: string[][] = [
      ['Data', 'Tipo de Registro', 'Descrição / Detalhe', 'Valor (R$)', 'Sócio / Técnico / Usuário', 'Origem / Forma de Pagamento']
    ];

    // 1. Manutenções (Receitas / Serviços)
    manutencoesMock.forEach(m => {
      rows.push([
        m.data,
        'Serviço Manutenção',
        `${m.aparelho} - Cliente: ${m.cliente} (${m.situacao})`,
        m.valorCobrado.toFixed(2),
        m.criadoPor || 'Sócio',
        m.pagoPeloCliente ? 'Conta PagBank (Saldo)' : 'Pendente de Recebimento'
      ]);
    });

    // 2. Vendas de Balcão (Receitas)
    vendasMock.forEach(v => {
      const descricao = v.observacao || 'Venda de Balcão';
      const valor = (v.debito || 0) + (v.credito || 0) + (v.pix || 0) + (v.dinheiro || 0);
      let origem = 'Conta PagBank (Digital)';
      if (v.dinheiro) origem = 'Dinheiro do Caixa (Físico)';
      
      rows.push([
        v.data,
        'Venda de Balcão',
        descricao,
        valor.toFixed(2),
        v.criadoPor || 'sistema',
        origem
      ]);
    });

    // 3. Despesas (Saídas / Custos)
    despesasMock.forEach(d => {
      rows.push([
        d.dataVencimento,
        'Despesa Operacional',
        `${d.categoria || 'Geral'}: ${d.descricao}`,
        `-${d.valor.toFixed(2)}`,
        d.criadoPor || 'sistema',
        d.tipo || 'Pontual'
      ]);
    });

    // 4. Retiradas de Sócios (Saídas)
    retiradasMock.forEach(r => {
      rows.push([
        r.data,
        'Retirada de Sócio',
        `Retirada - Sócio: ${r.socio || 'Outro'} - ${r.observacao}`,
        `-${r.valor.toFixed(2)}`,
        r.socio || 'Sócio',
        r.formaPagamento || 'Conta PagBank'
      ]);
    });

    // Ordena por data decrescente
    const cabecalho = rows[0];
    const dados = rows.slice(1).sort((a, b) => b[0].localeCompare(a[0]));
    const tudo = [cabecalho, ...dados];

    baixarCSV(tudo, 'extrato_consolidado');
  } catch (err) {
    console.error('Erro ao exportar extrato consolidado:', err);
    UI.mostrarToast('Erro ao exportar extrato consolidado.', 'danger');
  }
}
(window as any).exportarExtratoConsolidadoCSV = exportarExtratoConsolidadoCSV;

export function exportarManutencoesCSV(): void {
  try {
    const rows: string[][] = [
      ['ID', 'OS', 'Data Entrada', 'Cliente', 'Aparelho', 'Marca', 'Modelo', 'Cor', 'Situação', 'Valor Cobrado (R$)', 'Peça (R$)', 'Lucro Líquido (R$)', 'Pago?', 'Peça Paga?', 'Criado Por']
    ];

    manutencoesMock.forEach(m => {
      const lucroReal = m.valorCobrado - m.valorPeca;
      rows.push([
        m.id,
        m.os,
        m.data,
        m.cliente,
        m.aparelho,
        m.marca,
        m.modelo,
        m.cor,
        m.situacao,
        m.valorCobrado.toFixed(2),
        m.valorPeca.toFixed(2),
        lucroReal.toFixed(2),
        m.pagoPeloCliente ? 'Sim' : 'Não',
        m.pecaPaga ? 'Sim' : 'Não',
        m.criadoPor || ''
      ]);
    });

    baixarCSV(rows, 'relatorio_manutencoes');
  } catch (err) {
    console.error('Erro ao exportar manutenções:', err);
    UI.mostrarToast('Erro ao exportar manutenções.', 'danger');
  }
}
(window as any).exportarManutencoesCSV = exportarManutencoesCSV;

export function exportarVendasCSV(): void {
  try {
    const rows: string[][] = [
      ['ID', 'Data', 'Observação / Itens', 'Débito (R$)', 'Crédito (R$)', 'Pix (R$)', 'Dinheiro (R$)', 'Total da Venda (R$)', 'Criado Por']
    ];

    vendasMock.forEach(v => {
      const total = v.total || ((v.debito || 0) + (v.credito || 0) + (v.pix || 0) + (v.dinheiro || 0));
      rows.push([
        v.id,
        v.data,
        v.observacao || 'Venda de Balcão',
        (v.debito || 0).toFixed(2),
        (v.credito || 0).toFixed(2),
        (v.pix || 0).toFixed(2),
        (v.dinheiro || 0).toFixed(2),
        total.toFixed(2),
        v.criadoPor || 'sistema'
      ]);
    });

    baixarCSV(rows, 'relatorio_vendas');
  } catch (err) {
    console.error('Erro ao exportar vendas:', err);
    UI.mostrarToast('Erro ao exportar vendas.', 'danger');
  }
}
(window as any).exportarVendasCSV = exportarVendasCSV;

export function exportarDespesasCSV(): void {
  try {
    const rows: string[][] = [
      ['ID', 'Vencimento', 'Descrição / Detalhes', 'Valor (R$)', 'Categoria', 'Tipo (Fixa/Pontual)', 'Paga?', 'Criado Por']
    ];

    despesasMock.forEach(d => {
      rows.push([
        d.id,
        d.dataVencimento,
        d.descricao,
        d.valor.toFixed(2),
        d.categoria || 'Geral',
        d.tipo || 'Pontual',
        d.paga ? 'Sim' : 'Não',
        d.criadoPor || ''
      ]);
    });

    baixarCSV(rows, 'relatorio_despesas');
  } catch (err) {
    console.error('Erro ao exportar despesas:', err);
    UI.mostrarToast('Erro ao exportar despesas.', 'danger');
  }
}
(window as any).exportarDespesasCSV = exportarDespesasCSV;

export function exportarRetiradasCSV(): void {
  try {
    const rows: string[][] = [
      ['ID', 'Data', 'Sócio Beneficiário', 'Valor Retirado (R$)', 'Observação / Motivo', 'Origem do Recurso', 'Criado Por']
    ];

    retiradasMock.forEach(r => {
      rows.push([
        r.id,
        r.data,
        r.socio || 'Outro',
        r.valor.toFixed(2),
        r.observacao || '',
        r.formaPagamento || 'Conta PagBank',
        r.criadoPor || ''
      ]);
    });

    baixarCSV(rows, 'relatorio_retiradas');
  } catch (err) {
    console.error('Erro ao exportar retiradas:', err);
    UI.mostrarToast('Erro ao exportar retiradas.', 'danger');
  }
}
(window as any).exportarRetiradasCSV = exportarRetiradasCSV;

export function abrirModalExportarCSV(): void {
  UI.abrirModal(
    "Exportar Relatórios para Excel (CSV)",
    `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%; box-sizing: border-box;">
        <p class="text-muted" style="font-size: 0.8rem; margin: 0; line-height: 1.4;">
          Escolha qual relatório deseja baixar no formato CSV (compatível com Microsoft Excel, Google Sheets e LibreOffice Calc):
        </p>
        
        <div style="display: flex; flex-direction: column; gap: var(--spacing-xs); margin-top: var(--spacing-xs); width: 100%; box-sizing: border-box;">
          <button class="btn btn-primary" onclick="exportarExtratoConsolidadoCSV(); UI.fecharModal();" style="justify-content: flex-start; text-align: left; height: 2.75rem; font-size: 0.82rem; border-radius: var(--radius-md); padding: 0 var(--spacing-sm); display: flex; align-items: center; gap: 8px; width: 100%;">
            📊 <span><strong>Extrato Financeiro Consolidado</strong> (Tudo em ordem cronológica)</span>
          </button>
          
          <button class="btn btn-secondary" onclick="exportarManutencoesCSV(); UI.fecharModal();" style="justify-content: flex-start; text-align: left; height: 2.75rem; font-size: 0.82rem; border-radius: var(--radius-md); padding: 0 var(--spacing-sm); display: flex; align-items: center; gap: 8px; width: 100%;">
            🛠️ <span><strong>Serviços / Manutenções</strong> (Histórico completo)</span>
          </button>
          
          <button class="btn btn-secondary" onclick="exportarVendasCSV(); UI.fecharModal();" style="justify-content: flex-start; text-align: left; height: 2.75rem; font-size: 0.82rem; border-radius: var(--radius-md); padding: 0 var(--spacing-sm); display: flex; align-items: center; gap: 8px; width: 100%;">
            🛒 <span><strong>Vendas de Balcão</strong> (Detalhado por modalidade)</span>
          </button>
          
          <button class="btn btn-secondary" onclick="exportarDespesasCSV(); UI.fecharModal();" style="justify-content: flex-start; text-align: left; height: 2.75rem; font-size: 0.82rem; border-radius: var(--radius-md); padding: 0 var(--spacing-sm); display: flex; align-items: center; gap: 8px; width: 100%;">
            💸 <span><strong>Despesas Totais</strong> (Fixas e pontuais)</span>
          </button>
          
          <button class="btn btn-secondary" onclick="exportarRetiradasCSV(); UI.fecharModal();" style="justify-content: flex-start; text-align: left; height: 2.75rem; font-size: 0.82rem; border-radius: var(--radius-md); padding: 0 var(--spacing-sm); display: flex; align-items: center; gap: 8px; width: 100%;">
            ⚖️ <span><strong>Retiradas dos Sócios</strong> (Pró-labores e divisão)</span>
          </button>
        </div>
        
        <p class="text-muted" style="font-size: 0.7rem; margin-top: 4px; line-height: 1.3;">
          * Os arquivos CSV usam codificação UTF-8 com BOM e delimitador ponto e vírgula (;), garantindo abertura imediata e acentuação correta no Excel brasileiro.
        </p>
      </div>
    `
  );
}
(window as any).abrirModalExportarCSV = abrirModalExportarCSV;

export function confirmarZerarSistema(): void {
  UI.abrirModal(
    "⚠️ Zerar Sistema (Modo Produção)",
    `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%; box-sizing: border-box;">
        <p style="color: var(--color-danger); font-weight: 600; font-size: 0.95rem; margin: 0;">Atenção: Esta ação é definitiva e apagará todos os dados do sistema!</p>
        <p class="text-muted" style="font-size: 0.8rem; margin: 0; line-height: 1.4;">
          Isso removerá do banco de dados local todos os serviços cadastrados, vendas de balcão, despesas, retiradas e redefinirá os saldos das contas para zero. Use esta opção para iniciar a loja do zero em produção.
        </p>
        <p class="text-muted" style="font-size: 0.8rem; margin: 0; font-weight: 500;">
          Deseja prosseguir e limpar 100% dos registros?
        </p>
      </div>
    `,
    () => {
      zerarTodosOsDados();
    },
    'Confirmar e Limpar'
  );
}
(window as any).confirmarZerarSistema = confirmarZerarSistema;
