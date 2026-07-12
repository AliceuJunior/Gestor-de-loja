/* 
  views/dashboard.ts
  Renderizador da tela do Dashboard (Painel de Controle).
*/

import { formatarMoeda, UI } from '../ui.ts';
import { 
  dadosDashboardMock, 
  vendasMock, 
  configInicial, 
  recalcularDadosDashboard, 
  paginaAtual,
  contasPagBankMock,
  salvarContasPagBank,
  historicoComprasMock,
  saldoCaixaFisico,
  salvarSaldoCaixaFisico
} from '../state.ts';
import { DashboardData } from '../types.ts';

export function abrirModalEditarSaldoPagBank(): void {
  UI.abrirModal(
    "Gerenciamento de Caixa e Contas",
    `
      <div id="contas-manager-container" style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%; box-sizing: border-box;">
        
        <!-- Seção do Caixa Físico (Dinheiro Diário) -->
        <div style="margin-bottom: var(--spacing-xs); padding: var(--spacing-sm); background: rgba(250, 204, 21, 0.08); border: 1px solid rgba(250, 204, 21, 0.25); border-radius: var(--radius-md); text-align: left;">
          <label class="form-label" for="input-edit-caixa-fisico" style="font-weight: 600; color: #facc15; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span>💵</span> Caixa Físico (Dinheiro em Gaveta)
          </label>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 600;">R$</span>
            <input type="number" id="input-edit-caixa-fisico" class="input-field" value="${saldoCaixaFisico}" step="0.01" style="height: 2.25rem; font-size: 0.95rem; padding: 4px var(--spacing-sm); background: var(--bg-input); font-family: var(--font-mono); font-weight: bold; width: 100%; max-width: 200px;" required />
          </div>
          <p class="text-muted" style="font-size: 0.72rem; margin-top: 6px; line-height: 1.35; margin-bottom: 0;">
            Valores que entram diariamente em dinheiro e não são depositados no PagBank. Ele é somado ao saldo das contas bancárias para compor o seu capital de giro total.
          </p>
        </div>

        <p class="text-muted" style="font-size: 0.8rem; margin: var(--spacing-xs) 0 0 0; line-height: 1.4;">
          Gerencie suas contas do PagBank. Contas <strong>ativas</strong> somam ao Saldo PagBank. Contas <strong>inativas</strong> vão para a <strong>Reserva de Emergência</strong>.
        </p>
        
        <div id="lista-contas-dinamica" style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; padding-right: 4px; border: 1px solid var(--border-color); padding: var(--spacing-sm); border-radius: var(--radius-md); background: rgba(0,0,0,0.15);">
          ${contasPagBankMock.map((conta) => `
            <div class="account-row" data-id="${conta.id}" style="display: flex; align-items: center; gap: var(--spacing-xs); padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <div style="display: flex; flex-direction: column; gap: 2px; flex: 2; min-width: 0;">
                <input type="text" class="account-nome-input input-field" value="${conta.nomeOuCnpj}" placeholder="Nome ou CNPJ" style="height: 2rem; font-size: 0.8rem; padding: 4px 8px; background: var(--bg-input);" required />
              </div>
              <div style="flex: 1.2; display: flex; align-items: center; gap: 2px;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">R$</span>
                <input type="number" class="account-valor-input input-field" value="${conta.valor}" step="0.01" style="height: 2rem; font-size: 0.8rem; padding: 4px 8px; background: var(--bg-input);" required />
              </div>
              <div style="display: flex; align-items: center; gap: 4px; padding: 0 4px; flex-shrink: 0;">
                <input type="checkbox" id="chk-active-${conta.id}" class="account-ativa-checkbox" ${conta.ativa ? 'checked' : ''} style="cursor: pointer; width: 0.9rem; height: 0.9rem;" />
                <label for="chk-active-${conta.id}" style="font-size: 0.72rem; cursor: pointer; user-select: none;">Ativa</label>
              </div>
              <button type="button" class="btn-delete-row" onclick="this.parentElement.remove();" style="background: none; border: none; color: var(--color-danger); cursor: pointer; padding: 4px; font-size: 0.85rem;" title="Remover conta">
                ❌
              </button>
            </div>
          `).join('')}
        </div>

        <!-- Seção para adicionar nova conta -->
        <div style="border: 1px dashed var(--border-color); padding: var(--spacing-sm); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: var(--spacing-xs); background: rgba(255,255,255,0.02);">
          <span style="font-size: 0.75rem; font-weight: bold; color: var(--color-primary); text-transform: uppercase;">Adicionar Nova Conta PagBank</span>
          <div style="display: flex; gap: var(--spacing-xs); align-items: center;">
            <input type="text" id="new-account-nome" class="input-field" placeholder="Nome ou CNPJ" style="height: 2rem; font-size: 0.8rem; padding: 4px 8px; flex: 2; background: var(--bg-input);" />
            <input type="number" id="new-account-valor" class="input-field" placeholder="Valor (R$)" style="height: 2rem; font-size: 0.8rem; padding: 4px 8px; flex: 1.2; background: var(--bg-input);" />
            <div style="display: flex; align-items: center; gap: 2px; flex-shrink: 0; padding: 0 4px;">
              <input type="checkbox" id="new-account-ativa" checked style="cursor: pointer;" />
              <label for="new-account-ativa" style="font-size: 0.72rem; cursor: pointer; user-select: none;">Ativa</label>
            </div>
            <button type="button" class="btn btn-primary" onclick="
              const nInput = document.getElementById('new-account-nome');
              const vInput = document.getElementById('new-account-valor');
              const aInput = document.getElementById('new-account-ativa');
              const nome = nInput.value.trim();
              if(!nome) return;
              const valor = parseFloat(vInput.value) || 0;
              const id = 'C-' + Date.now();
              const listDiv = document.getElementById('lista-contas-dinamica');
              const newRow = document.createElement('div');
              newRow.className = 'account-row';
              newRow.setAttribute('data-id', id);
              newRow.style.display = 'flex';
              newRow.style.alignItems = 'center';
              newRow.style.gap = 'var(--spacing-xs)';
              newRow.style.paddingBottom = '6px';
              newRow.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
              newRow.innerHTML = \`
                <div style='display: flex; flex-direction: column; gap: 2px; flex: 2; min-width: 0;'>
                  <input type='text' class='account-nome-input input-field' value='\${nome.replace(/\\\\'/g, '&apos;')}' placeholder='Nome ou CNPJ' style='height: 2rem; font-size: 0.8rem; padding: 4px 8px; background: var(--bg-input);' required />
                </div>
                <div style='flex: 1.2; display: flex; align-items: center; gap: 2px;'>
                  <span style='font-size: 0.8rem; color: var(--text-muted);'>R$</span>
                  <input type='number' class='account-valor-input input-field' value='\${valor}' step='0.01' style='height: 2rem; font-size: 0.8rem; padding: 4px 8px; background: var(--bg-input);' required />
                </div>
                <div style='display: flex; align-items: center; gap: 4px; padding: 0 4px; flex-shrink: 0;'>
                  <input type='checkbox' id='chk-active-\${id}' class='account-ativa-checkbox' \${aInput.checked ? 'checked' : ''} style='cursor: pointer; width: 0.9rem; height: 0.9rem;' />
                  <label for='chk-active-\${id}' style='font-size: 0.72rem; cursor: pointer;'>Ativa</label>
                </div>
                <button type='button' onclick='this.parentElement.remove();' style='background: none; border: none; color: var(--color-danger); cursor: pointer; padding: 4px; font-size: 0.85rem;'>
                  ❌
                </button>
              \`;
              listDiv.appendChild(newRow);
              nInput.value = '';
              vInput.value = '';
            " style="padding: 4px 8px; font-size: 0.75rem; height: 2rem; border-radius: var(--radius-sm); white-space: nowrap;">+ Add</button>
          </div>
        </div>
      </div>
    `,
    () => {
      // Salva o Caixa Físico
      const caixaInput = document.getElementById('input-edit-caixa-fisico') as HTMLInputElement;
      if (caixaInput) {
        const novoCaixa = parseFloat(caixaInput.value) || 0;
        salvarSaldoCaixaFisico(novoCaixa);
      }

      const rows = document.querySelectorAll('.account-row');
      const novasContas: typeof contasPagBankMock = [];
      
      rows.forEach(row => {
        const id = row.getAttribute('data-id') || '';
        const nomeInput = row.querySelector('.account-nome-input') as HTMLInputElement;
        const valorInput = row.querySelector('.account-valor-input') as HTMLInputElement;
        const ativaCheckbox = row.querySelector('.account-ativa-checkbox') as HTMLInputElement;
        
        if (nomeInput && valorInput && ativaCheckbox) {
          novasContas.push({
            id,
            nomeOuCnpj: nomeInput.value.trim(),
            valor: parseFloat(valorInput.value) || 0,
            ativa: ativaCheckbox.checked
          });
        }
      });
      
      // Se não houver contas, cria uma padrão
      if (novasContas.length === 0) {
        novasContas.push({ id: "C-1", nomeOuCnpj: "Conta PagBank Principal", valor: 0, ativa: true });
      }

      contasPagBankMock.length = 0;
      contasPagBankMock.push(...novasContas);
      salvarContasPagBank();
      
      recalcularDadosDashboard();
      UI.mostrarToast('Contas e saldos atualizados com sucesso!', 'success');
      
      const mainContent = document.getElementById('main-content');
      if (mainContent && paginaAtual === 'dashboard') {
        renderizarDashboard(mainContent, dadosDashboardMock);
      }
    },
    'Salvar Contas & Saldos'
  );
}
(window as any).abrirModalEditarSaldoPagBank = abrirModalEditarSaldoPagBank;

export function mostrarInformacaoCard(cardId: string): void {
  let titulo = "";
  let descricao = "";
  
  switch(cardId) {
    case 'disponivel':
      titulo = "Disponível para Retirada";
      const comprasAtiva = configInicial.compraReposicaoAtiva;
      const formulaStr = comprasAtiva 
        ? "Disponível = Saldo PagBank - Despesas Pendentes - Retiradas Efetuadas - Provisão Compras (7k)"
        : "Disponível = Saldo PagBank - Despesas Pendentes - Retiradas Efetuadas";
      descricao = `
        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); line-height: 1.5; font-size: 0.9rem;">
          <p>O <strong>Disponível para Retirada</strong> representa o valor líquido que os sócios podem sacar hoje com total segurança, garantindo que as despesas ainda não pagas, a reserva de emergência e a reposição quinzenal de mercadorias estejam 100% resguardadas.</p>
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); padding: var(--spacing-sm); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.75rem; margin: var(--spacing-xs) 0; color: var(--color-success); font-weight: bold; text-align: center; line-height: 1.4;">
            ${formulaStr}
          </div>
          ${comprasAtiva ? `<p>Note que o sistema está blindando e retendo preventivamente o valor de <strong>${formatarMoeda(configInicial.compraReposicaoValor)}</strong> para garantir o fôlego da sua próxima compra de reposição de mercadorias planejada para <strong>${configInicial.compraReposicaoProximaData.split('-').reverse().join('/')}</strong>.</p>` : ''}
          <p class="text-muted" style="font-size: 0.8rem;">Dica: Ao pagar despesas, registrar novas retiradas ou alterar as configurações de planejamento, este valor é recalculado de forma dinâmica e instantânea pelo sistema.</p>
        </div>
      `;
      break;
    case 'saldo_total':
      titulo = "Saldo Total Operacional";
      descricao = `
        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); line-height: 1.5; font-size: 0.9rem;">
          <p>O <strong>Saldo Total Operacional</strong> representa a soma de todo o capital de giro líquido e imediato disponível na empresa:</p>
          <ul style="padding-left: var(--spacing-md); list-style-type: disc; display: flex; flex-direction: column; gap: 4px;">
            <li><strong>Contas PagBank:</strong> Os saldos das contas bancárias ativas cadastradas.</li>
            <li><strong>Caixa Físico:</strong> Dinheiro físico que entra diariamente na loja proveniente de vendas rápidas e recebimentos em espécie.</li>
          </ul>
          <p>A união desses valores compõe o caixa operacional líquido total da empresa. Clique no card para atualizar e gerenciar ambos os saldos.</p>
        </div>
      `;
      break;
    case 'reserva':
      titulo = "Reserva de Emergência";
      descricao = `
        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); line-height: 1.5; font-size: 0.9rem;">
          <p>A <strong>Reserva de Emergência</strong> é um valor estipulado pelos sócios para cobrir capital de giro e custos operacionais inesperados (como reposição de estoque ou manutenção de ferramentas).</p>
          <p>O sistema "protege" e retém este valor na conta de cálculo das retiradas para evitar que a loja fique sem fôlego financeiro.</p>
        </div>
      `;
      break;
    case 'lucro_servicos':
      titulo = "Lucro de Serviços (Manutenções)";
      descricao = `
        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); line-height: 1.5; font-size: 0.9rem;">
          <p>O <strong>Lucro de Serviços</strong> representa a margem líquida ganha em todas as ordens de serviço de assistência técnica concluídas.</p>
          <p>Calculado com base na mão de obra e no custo da peça aplicada:</p>
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); padding: var(--spacing-sm); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.8rem; margin: var(--spacing-xs) 0; text-align: center;">
            Lucro = Valor Cobrado - Custo Real da Peça
          </div>
          <p class="text-muted" style="font-size: 0.8rem;">Note que o sistema rastreia este lucro de maneira segregada (no Mercado Pago) para facilitar o acompanhamento independente da receita de serviços.</p>
        </div>
      `;
      break;
    case 'despesas':
      titulo = "Despesas do Mês";
      descricao = `
        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); line-height: 1.5; font-size: 0.9rem;">
          <p>As <strong>Despesas</strong> são a somatória de todos os custos (como luz, aluguel, compras pontuais ou insumos) registrados no sistema para o mês corrente.</p>
          <ul style="padding-left: var(--spacing-md); list-style-type: disc; display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem;" class="text-muted">
            <li><strong>Despesas Pagas</strong>: Já quitadas e pagas.</li>
            <li><strong>Despesas Pendentes</strong>: Contas agendadas que ainda necessitam de pagamento (bloqueiam saques preventivamente no cálculo de Retirada).</li>
          </ul>
        </div>
      `;
      break;
    case 'retiradas':
      titulo = "Retiradas de Sócios";
      descricao = `
        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); line-height: 1.5; font-size: 0.9rem;">
          <p>As <strong>Retiradas</strong> registram os adiantamentos de lucros, vales e pró-labores que os sócios retiraram do caixa no mês.</p>
          <p>Isso permite um controle total e transparente das retiradas feitas por cada membro da equipe (sócios, irmãos), identificando quem realizou a retirada.</p>
        </div>
      `;
      break;
    case 'vendas':
      titulo = "Faturamento de Vendas (Balcão)";
      descricao = `
        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); line-height: 1.5; font-size: 0.9rem;">
          <p>O faturamento total das <strong>Vendas de Balcão</strong> (como películas, capinhas, acessórios).</p>
          <p>O lucro estimado é obtido aplicando a margem de lucro padrão definida nas configurações (atualmente ${configInicial.margemLucroVendas}%):</p>
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); padding: var(--spacing-sm); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.8rem; margin: var(--spacing-xs) 0; text-align: center;">
            Lucro Estimado = Total de Vendas × ${configInicial.margemLucroVendas}%
          </div>
        </div>
      `;
      break;
    case 'meta_faturamento':
      titulo = "Faturamento & Meta Mensal";
      descricao = `
        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); line-height: 1.5; font-size: 0.9rem;">
          <p>O <strong>Faturamento Acumulado</strong> representa a receita bruta total gerada no mês corrente, somando tanto as vendas de balcão quanto o valor total cobrado nos serviços.</p>
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); padding: var(--spacing-sm); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.8rem; margin: var(--spacing-xs) 0; text-align: center;">
            Faturamento Bruto = Vendas de Balcão + Cobrado nos Serviços
          </div>
          <p>A barra de progresso exibe quanto falta para atingir a meta mensal estipulada pelos sócios. Você pode atualizar o valor da meta de faturamento a qualquer momento nas Configurações.</p>
        </div>
      `;
      break;
    case 'lucro_liquido':
      titulo = "Lucro Líquido Real Estimado";
      descricao = `
        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); line-height: 1.5; font-size: 0.9rem;">
          <p>O <strong>Lucro Líquido</strong> é o indicador de rentabilidade real da sua loja após todas as obrigações.</p>
          <p>Ele subtrai as despesas operacionais totais do lucro bruto consolidado:</p>
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); padding: var(--spacing-sm); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.8rem; margin: var(--spacing-xs) 0; text-align: center;">
            Lucro Líquido = Lucro de Serviços + Lucro de Balcão - Despesas Totais
          </div>
          <p class="text-muted" style="font-size: 0.8rem;">Diferente do "Disponível para Retirada", o Lucro Líquido não retém fundos de provisão de compras quinzenais ou de reserva mínima de segurança, servindo como uma visão pura de ganho operacional.</p>
        </div>
      `;
      break;
  }
  
  UI.abrirModal(titulo, descricao, undefined, "Fechar");
}
(window as any).mostrarInformacaoCard = mostrarInformacaoCard;

export function toggleOcultarReservaEmergencia(): void {
  const atual = localStorage.getItem('ocultarReservaEmergencia') === 'true';
  localStorage.setItem('ocultarReservaEmergencia', (!atual).toString());
  
  // Recarrega a tela do dashboard
  const mainContent = document.getElementById('main-content');
  if (mainContent && paginaAtual === 'dashboard') {
    renderizarDashboard(mainContent, dadosDashboardMock);
  }
}
(window as any).toggleOcultarReservaEmergencia = toggleOcultarReservaEmergencia;

export function renderizarDashboard(container: HTMLElement, data: DashboardData): void {
  const pageElement = document.createElement('div');
  pageElement.className = 'page-container fade-in';

  // Cálculos para a barra segmentada de origens do Pool Livre (Loja vs. Manutenções)
  const lucroVendas = (data.vendasMes * configInicial.margemLucroVendas / 100);
  const lucroManutencoes = data.lucroManutencoes;
  const poolTotal = lucroVendas + lucroManutencoes;
  const pctLoja = poolTotal > 0 ? (lucroVendas / poolTotal) * 100 : 50;
  const pctServicos = poolTotal > 0 ? (lucroManutencoes / poolTotal) * 100 : 50;

  // Estado do olho (ocultar reserva)
  const ocultarReserva = localStorage.getItem('ocultarReservaEmergencia') === 'true';

  // Cálculos para a Meta de Faturamento e Lucro Líquido Real do Mês
  const faturamentoTotal = data.faturamentoTotalMes || 0;
  const metaFaturamento = data.metaFaturamentoMes || configInicial.metaFaturamento || 15000;
  const pctMeta = metaFaturamento > 0 ? (faturamentoTotal / metaFaturamento) * 100 : 0;
  const faturamentoRestante = Math.max(0, metaFaturamento - faturamentoTotal);
  const lucroLiquido = data.lucroLiquidoMes !== undefined ? data.lucroLiquidoMes : 0;
  const lucroPositivo = lucroLiquido >= 0;

  pageElement.innerHTML = `
    <div class="page-header-block">
      <h2 class="page-title">Painel de Controle</h2>
      <p class="page-subtitle">Acompanhe a saúde financeira da sua assistência em tempo real</p>
    </div>

    <!-- Central Hero Metric: Saldo Disponível para Retirada -->
    <section class="hero-card">
      <svg class="hero-bg-icon" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"></path>
      </svg>
      <span class="hero-label" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
        Disponível para Retirada hoje
        <button class="info-badge" onclick="event.stopPropagation(); mostrarInformacaoCard('disponivel')" title="Clique para mais informações" style="background-color: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.25); color: #fff; width: 16px; height: 16px; font-size: 10px;">i</button>
      </span>
      <div class="hero-value">
        <span class="hero-currency">R$</span>
        <span>${data.disponivelRetirada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>

      <!-- Barra de Cores Segmentada (Loja vs Manutenções) no Hero Card -->
      <div style="width: 100%; max-width: 500px; margin: 8px auto 0 auto; box-sizing: border-box; text-align: left; background: rgba(0,0,0,0.15); padding: 8px var(--spacing-sm); border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.02);">
        <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-muted); margin-bottom: 4px;">
          <span style="display: flex; align-items: center; gap: 4px; color: #93c5fd; font-weight: 500;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: rgb(59, 130, 246); display: inline-block;"></span>
            Vendas Loja (${pctLoja.toFixed(0)}%): <strong>${formatarMoeda(lucroVendas)}</strong>
          </span>
          <span style="display: flex; align-items: center; gap: 4px; color: #e9d5ff; font-weight: 500;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: rgb(168, 85, 247); display: inline-block;"></span>
            Manutenções (${pctServicos.toFixed(0)}%): <strong>${formatarMoeda(lucroManutencoes)}</strong>
          </span>
        </div>
        <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; width: 100%; display: flex;">
          <div style="height: 100%; width: ${pctLoja}%; background: rgb(59, 130, 246); transition: width 0.3s ease;"></div>
          <div style="height: 100%; width: ${pctServicos}%; background: rgb(168, 85, 247); transition: width 0.3s ease;"></div>
        </div>
      </div>

      <div class="hero-status" style="display: flex; flex-direction: column; align-items: center; gap: var(--spacing-xs); margin-top: var(--spacing-xs);">
        <div style="margin-bottom: 2px;">
          <span class="badge badge-success">Operação Segura</span>
        </div>
        ${configInicial.compraReposicaoAtiva ? `
          <div style="margin-top: 2px; font-size: 0.8rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); padding: var(--spacing-xs) var(--spacing-sm); border-radius: var(--radius-sm); display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: #e9d5ff; font-weight: 500; cursor: pointer; transition: all var(--transition-fast); line-height: 1.4; max-width: 90%; text-align: center;" onclick="abrirOpcoesCompraQuinzenal()" title="Clique para gerenciar o planejamento de compras" onmouseover="this.style.backgroundColor='rgba(168, 85, 247, 0.25)'" onmouseout="this.style.backgroundColor='rgba(168, 85, 247, 0.15)'">
            <span>📦</span>
            <span>Caixa Blindado para Reposição: <strong>${formatarMoeda(configInicial.compraReposicaoValor)}</strong> em <strong>${configInicial.compraReposicaoProximaData.split('-').reverse().join('/')}</strong></span>
          </div>
        ` : `
          <div style="margin-top: 2px; font-size: 0.8rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: var(--spacing-xs) var(--spacing-sm); border-radius: var(--radius-sm); display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: var(--text-muted); cursor: pointer; transition: all var(--transition-fast); line-height: 1.4; max-width: 90%; text-align: center;" onclick="navegarPara('ajustes')" title="Clique para ativar o planejamento" onmouseover="this.style.backgroundColor='rgba(255, 255, 255, 0.1)'" onmouseout="this.style.backgroundColor='rgba(255, 255, 255, 0.05)'">
            <span>⚠️</span>
            <span>Provisão de compras quinzenais desativada. Clique para ativar.</span>
          </div>
        `}
      </div>
    </section>

    <!-- Grid de Cards de Métricas -->
    <section class="metrics-grid">
      <!-- 1. Card Vendas do Mês (No topo!) -->
      <div class="metric-card" onclick="navegarPara('vendas')" style="cursor: pointer;">
        <div class="metric-header">
          <span class="metric-title" style="display: flex; align-items: center; gap: 6px;">
            Vendas do Mês
            <button class="info-badge" onclick="event.stopPropagation(); mostrarInformacaoCard('vendas')" title="Clique para mais informações">i</button>
          </span>
          <div class="metric-icon-wrapper" style="background-color: rgba(34, 197, 94, 0.1); color: rgb(34, 197, 94); width: 2.25rem; height: 2.25rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg class="nav-icon" style="width: 1.15rem; height: 1.15rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
          </div>
        </div>
        <div class="metric-body">
          <span class="metric-value success">${formatarMoeda(data.vendasMes)}</span>
          <span class="metric-desc" style="font-size: 0.65rem;">Última lançada: ${formatarMoeda(vendasMock.length > 0 ? vendasMock[vendasMock.length - 1].total : 0)}</span>
        </div>
      </div>

      <!-- 2. Card Lucro Manutenções (Segundo!) -->
      <div class="metric-card" onclick="navegarPara('manutencoes')" style="cursor: pointer;">
        <div class="metric-header">
          <span class="metric-title" style="display: flex; align-items: center; gap: 6px;">
            Lucro Serviços
            <button class="info-badge" onclick="event.stopPropagation(); mostrarInformacaoCard('lucro_servicos')" title="Clique para mais informações">i</button>
          </span>
          <div class="metric-icon-wrapper icon-manutencao" style="flex-shrink: 0;">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </div>
        </div>
        <div class="metric-body">
          <span class="metric-value success">${formatarMoeda(data.lucroManutencoes)}</span>
          <span class="metric-desc" style="font-size: 0.65rem;">No Mercado Pago (Separado)</span>
        </div>
      </div>

      <!-- 3. Card Saldo Total (PagBank + Caixa Físico) -->
      <div class="metric-card click-card" onclick="abrirModalEditarSaldoPagBank()" style="cursor: pointer; position: relative;" title="Clique para gerenciar contas e dinheiro em caixa">
        <div class="metric-header">
          <span class="metric-title" style="display: flex; align-items: center; gap: 6px;">
            Saldo Total Operacional
            <button class="info-badge" onclick="event.stopPropagation(); mostrarInformacaoCard('saldo_total')" title="Clique para mais informações">i</button>
            <svg style="width: 0.85rem; height: 0.85rem; opacity: 0.6; color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
          </span>
          <div class="metric-icon-wrapper icon-pagbank">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
        <div class="metric-body" style="display: flex; flex-direction: column; gap: 4px;">
          <span class="metric-value" style="color: #facc15;">${formatarMoeda(data.saldoTotal || 0)}</span>
          <div style="font-size: 0.65rem; color: var(--text-muted); line-height: 1.3;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.06); padding-bottom: 2px; margin-bottom: 3px;">
              <span>🏦 Contas PagBank:</span>
              <strong style="color: var(--text-primary); font-family: var(--font-mono);">${formatarMoeda(data.saldoPagBank)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.06); padding-bottom: 2px; margin-bottom: 3px;">
              <span>💵 Caixa Físico (Dinheiro):</span>
              <strong style="color: #facc15; font-family: var(--font-mono);">${formatarMoeda(data.saldoCaixaFisico || 0)}</strong>
            </div>
            <div style="color: var(--color-primary); font-weight: 600; margin-top: 3px; text-decoration: underline; font-size: 0.65rem; text-align: right;">Gerenciar Caixa & Contas</div>
          </div>
        </div>
      </div>

      <!-- 4. Card Despesas -->
      <div class="metric-card" onclick="navegarPara('despesas')" style="cursor: pointer;">
        <div class="metric-header">
          <span class="metric-title" style="display: flex; align-items: center; gap: 6px;">
            Despesas
            <button class="info-badge" onclick="event.stopPropagation(); mostrarInformacaoCard('despesas')" title="Clique para mais informações">i</button>
          </span>
          <div class="metric-icon-wrapper icon-reserva">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
        </div>
        <div class="metric-body">
          <span class="metric-value">${formatarMoeda(data.despesasMes)}</span>
          <span class="metric-desc" style="font-size: 0.65rem;">Custos registrados no mês</span>
        </div>
      </div>

      <!-- 5. Card Retiradas Sócios -->
      <div class="metric-card" onclick="navegarPara('retiradas')" style="cursor: pointer;">
        <div class="metric-header">
          <span class="metric-title" style="display: flex; align-items: center; gap: 6px;">
            Retiradas Sócios
            <button class="info-badge" onclick="event.stopPropagation(); mostrarInformacaoCard('retiradas')" title="Clique para mais informações">i</button>
          </span>
          <div class="metric-icon-wrapper icon-retiradas">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
        </div>
        <div class="metric-body">
          <span class="metric-value">${formatarMoeda(data.retiradasMes)}</span>
          <span class="metric-desc" style="font-size: 0.65rem;">Total recolhido este mês</span>
        </div>
      </div>

      <!-- 6. Card Reserva de Emergência (Último!) com Olho Ocultar/Exibir -->
      <div class="metric-card click-card" onclick="abrirModalEditarReservaEmergencia()" style="cursor: pointer; position: relative;" title="Clique para editar a reserva">
        <div class="metric-header">
          <span class="metric-title" style="display: flex; align-items: center; gap: 6px;">
            Reserva de Emergência
            <button class="info-badge" onclick="event.stopPropagation(); mostrarInformacaoCard('reserva')" title="Clique para mais informações">i</button>
            <svg style="width: 0.85rem; height: 0.85rem; opacity: 0.6; color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
          </span>
          <div style="display: flex; align-items: center; gap: var(--spacing-xs);">
            <!-- Botão de Visibilidade do Olho -->
            <button onclick="event.stopPropagation(); toggleOcultarReservaEmergencia();" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 50%; transition: color var(--transition-fast);" title="${ocultarReserva ? 'Exibir reserva' : 'Ocultar reserva'}" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='var(--text-muted)'">
              ${ocultarReserva ? `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ` : `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              `}
            </button>
            <div class="metric-icon-wrapper icon-reserva">
              <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
          </div>
        </div>
        <div class="metric-body" style="display: flex; flex-direction: column; gap: 4px;">
          <span class="metric-value danger">${ocultarReserva ? 'R$ ••••••' : formatarMoeda(data.reservaMercadorias)}</span>
          <div style="font-size: 0.65rem; color: var(--text-muted); line-height: 1.25;">
            <div>• Reserva Base: <strong>${ocultarReserva ? 'R$ ••••••' : formatarMoeda(configInicial.reservaMinima)}</strong></div>
            ${contasPagBankMock.filter(c => !c.ativa).map(c => `<div>• ${c.nomeOuCnpj}: <strong>${ocultarReserva ? 'R$ ••••••' : formatarMoeda(c.valor)}</strong> (Inativa)</div>`).join('')}
            <div style="color: var(--color-primary); font-weight: 600; margin-top: 3px; text-decoration: underline; font-size: 0.65rem;">Alterar Reserva Mínima</div>
          </div>
        </div>
      </div>
    </section>
  `;

  container.innerHTML = '';
  container.appendChild(pageElement);
}
(window as any).renderizarDashboard = renderizarDashboard;

export function abrirOpcoesCompraQuinzenal(): void {
  // Calcule a soma e média atual considerando a inteligência quinzenal vs mensal
  const somaAjustada = historicoComprasMock.reduce((acc, curr) => {
    const valorAjustado = curr.tipo === 'mensal' ? (curr.valor / 2) : curr.valor;
    return acc + (valorAjustado || 0);
  }, 0);
  const media = historicoComprasMock.length > 0 ? (somaAjustada / historicoComprasMock.length) : 0;

  UI.abrirModal(
    "Fundo de Compras & Previsão Média",
    `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); font-size: 0.9rem; line-height: 1.5; box-sizing: border-box; width: 100%; text-align: left;">
        <p style="margin: 0;">
          Você possui <strong>${formatarMoeda(configInicial.compraReposicaoValor)}</strong> blindados no caixa para a reposição de mercadorias planejada para o dia <strong>${configInicial.compraReposicaoProximaData.split('-').reverse().join('/')}</strong>.
        </p>
        
        <div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.2); padding: var(--spacing-sm); border-radius: var(--radius-md); margin: var(--spacing-xs) 0;">
          <h4 style="margin: 0 0 4px 0; font-size: 0.85rem; color: #e9d5ff; text-transform: uppercase; font-weight: 600;">📊 Previsão baseada nos últimos ${historicoComprasMock.length} lançamentos</h4>
          <p style="font-size: 0.8rem; margin: 0; color: var(--text-secondary);">
            Média Móvel Quinzenal Calculada: <strong>${formatarMoeda(media)}</strong> (Previsão para a próxima compra).
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--border-color); padding: var(--spacing-sm); border-radius: var(--radius-md); background: rgba(0,0,0,0.15); box-sizing: border-box; width: 100%;">
          <span style="font-size: 0.75rem; font-weight: bold; color: var(--color-primary); text-transform: uppercase;">Lançamentos de Compras</span>
          <div id="lista-historico-compras" style="display: flex; flex-direction: column; gap: 6px; max-height: 150px; overflow-y: auto; margin-top: 4px;">
            ${historicoComprasMock.map(item => {
              const tipoBadge = item.tipo === 'mensal' ? `<span style="font-size: 0.65rem; padding: 1px 4px; background: rgba(59, 130, 246, 0.2); color: #93c5fd; border-radius: 3px; margin-left: 4px;">Mensal</span>` : `<span style="font-size: 0.65rem; padding: 1px 4px; background: rgba(168, 85, 247, 0.2); color: #e9d5ff; border-radius: 3px; margin-left: 4px;">Quinzenal</span>`;
              const valorAjustadoTexto = item.tipo === 'mensal' ? ` <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal;">(Ajustado: ${formatarMoeda(item.valor / 2)})</span>` : '';
              return `
              <div class="historico-row" data-id="${item.id}" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
                <span style="font-size: 0.8rem; font-family: var(--font-mono); display: flex; align-items: center; gap: 4px;">
                  ${item.mesOuData} ${tipoBadge}
                </span>
                <div style="display: flex; align-items: center; gap: var(--spacing-xs);">
                  <strong style="font-size: 0.8rem; color: #22c55e;">${formatarMoeda(item.valor)}${valorAjustadoTexto}</strong>
                  <button type="button" onclick="
                    const id = '${item.id}';
                    const list = (window as any).historicoComprasMock;
                    const idx = list.findIndex((x: any) => x.id === id);
                    if (idx !== -1) {
                      list.splice(idx, 1);
                      (window as any).salvarHistoricoCompras();
                      (window as any).recalcularDadosDashboard();
                      UI.fecharModal();
                      (window as any).abrirOpcoesCompraQuinzenal();
                      UI.mostrarToast('Lançamento removido e média recalculada!', 'success');
                    }
                  " style="background: none; border: none; color: var(--color-danger); cursor: pointer; font-size: 0.85rem; padding: 2px;" title="Excluir">❌</button>
                </div>
              </div>
            `}).join('')}
            ${historicoComprasMock.length === 0 ? '<div class="text-muted" style="font-size: 0.75rem; text-align: center; padding: 8px;">Nenhum gasto lançado para cálculo de média.</div>' : ''}
          </div>
        </div>

        <!-- Formulário para adicionar compra histórica manual -->
        <div style="border: 1px dashed var(--border-color); padding: var(--spacing-sm); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: var(--spacing-xs); background: rgba(255,255,255,0.02); box-sizing: border-box; width: 100%;">
          <span style="font-size: 0.75rem; font-weight: bold; color: var(--color-primary); text-transform: uppercase;">Lançar Compra Manual</span>
          <div style="display: flex; gap: var(--spacing-xs); align-items: center; width: 100%; flex-wrap: wrap;">
            <input type="text" id="new-hist-mes" class="input-field" placeholder="Mês (ex: Março)" style="height: 2rem; font-size: 0.8rem; padding: 4px 8px; flex: 1.2; min-width: 90px; background: var(--bg-input);" />
            <input type="number" id="new-hist-valor" class="input-field" placeholder="Valor (R$)" style="height: 2rem; font-size: 0.8rem; padding: 4px 8px; flex: 0.8; min-width: 70px; background: var(--bg-input);" />
            <select id="new-hist-tipo" class="input-field" style="height: 2rem; font-size: 0.8rem; padding: 0 4px; flex: 1; min-width: 90px; background: var(--bg-input); color: var(--text-primary);">
              <option value="quinzenal" selected>Quinzenal</option>
              <option value="mensal">Mensal</option>
            </select>
            <button type="button" class="btn btn-primary" onclick="
              const mInput = document.getElementById('new-hist-mes');
              const vInput = document.getElementById('new-hist-valor');
              const tInput = document.getElementById('new-hist-tipo');
              const mes = mInput.value.trim();
              const valor = parseFloat(vInput.value) || 0;
              const tipo = tInput.value || 'quinzenal';
              if(!mes || valor <= 0) return;
              const list = (window as any).historicoComprasMock;
              list.unshift({ id: 'H-' + Date.now(), mesOuData: mes, valor: valor, tipo: tipo });
              (window as any).salvarHistoricoCompras();
              (window as any).recalcularDadosDashboard();
              UI.fecharModal();
              (window as any).abrirOpcoesCompraQuinzenal();
              UI.mostrarToast('Gasto lançado e média atualizada!', 'success');
            " style="padding: 4px 8px; font-size: 0.75rem; height: 2rem; border-radius: var(--radius-sm); white-space: nowrap;">+ Lançar</button>
          </div>
        </div>
        
        <p class="text-muted" style="font-size: 0.8rem; margin: 4px 0 0 0;">O que você deseja fazer hoje?</p>
        
        <div style="display: flex; flex-direction: column; gap: var(--spacing-xs); margin-top: 4px; width: 100%;">
          <button class="btn btn-primary" onclick="UI.fecharModal(); (window as any).abrirModalRegistrarCompraReal();" style="width: 100%; justify-content: center; height: 2.5rem; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
            📦 Registrar Compra Realizada (Lançar Despesa)
          </button>
          <button class="btn" onclick="UI.fecharModal(); (window as any).navegarPara('ajustes');" style="width: 100%; justify-content: center; height: 2.5rem; font-size: 0.85rem; border: 1px solid var(--border-color); background: rgba(255,255,255,0.03); display: flex; align-items: center; gap: 6px; color: var(--text-secondary);">
            ⚙️ Alterar Configurações de Compra
          </button>
        </div>
      </div>
    `,
    undefined,
    "Fechar"
  );
}
(window as any).abrirOpcoesCompraQuinzenal = abrirOpcoesCompraQuinzenal;
