/* 
  state.ts
  Gerenciamento de estado, dados simulados persistentes (localStorage) e lógica de recálculo financeiro.
*/

import { DashboardData, Manutencao, Despesa, Retirada, Venda, Configuracoes, Usuario, PedidoCompra, Aviso, ContaPagBank, RegistroGastoCompra } from './types.ts';

// Helper para retornar a data da próxima segunda-feira útil
function obterProximaSegundaFeira(): string {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  // Se for segunda (1) hoje, queremos a próxima segunda (daqui a 7 dias)
  const diasAteSegunda = diaSemana === 1 ? 7 : (8 - diaSemana) % 7;
  const proximaSegunda = new Date(hoje);
  proximaSegunda.setDate(hoje.getDate() + diasAteSegunda);
  return proximaSegunda.toISOString().split('T')[0];
}

// Helper para calcular a média de gastos históricos para previsão de compras
function obterMediaGastoCompras(): number {
  const saved = localStorage.getItem('gestor_historico_compras');
  if (saved) {
    try {
      const parsed: RegistroGastoCompra[] = JSON.parse(saved);
      if (parsed && parsed.length > 0) {
        const soma = parsed.reduce((acc, curr) => {
          const valorAjustado = curr.tipo === 'mensal' ? (curr.valor / 2) : curr.valor;
          return acc + (valorAjustado || 0);
        }, 0);
        return soma / parsed.length;
      }
    } catch (e) {}
  }
  return parseFloat(localStorage.getItem('gestor_compra_reposicao_valor') || '7000.00');
}

// Configurações iniciais com a nova Margem de Lucro das Vendas e Planejamento de Compras Quinzenais
export const configInicial: Configuracoes = {
  reservaMinima: parseFloat(localStorage.getItem('gestor_reserva_minima') || '2500.00'),
  despesasFixasEstimadas: parseFloat(localStorage.getItem('gestor_despesas_fixas_estimadas') || '1350.00'),
  margemLucroVendas: parseFloat(localStorage.getItem('gestor_margem_lucro_vendas') || '40.0'), // Padrão: 40% de margem
  compraReposicaoValor: obterMediaGastoCompras(), // Valor baseado na média dos gastos
  compraReposicaoProximaData: localStorage.getItem('gestor_compra_reposicao_proxima_data') || obterProximaSegundaFeira(),
  compraReposicaoAtiva: localStorage.getItem('gestor_compra_reposicao_ativa') !== 'false', // Padrão ativo
  metaFaturamento: parseFloat(localStorage.getItem('gestor_meta_faturamento') || '15000.00') // Nova Meta Mensal padrão
};

// ==========================================================================
// Gestão de Usuários e Sessão
// ==========================================================================
export const usuariosMock: Usuario[] = JSON.parse(localStorage.getItem('gestor_usuarios') || '[]');
const defaultUser: Usuario = { username: 'admin', nome: 'Assistência Central', senhaHash: '' };
export let usuarioLogado: Usuario | null = JSON.parse(localStorage.getItem('gestor_usuario_logado') || 'null') || defaultUser;

export function definirUsuarioLogado(usuario: Usuario | null): void {
  usuarioLogado = usuario;
  if (usuario) {
    localStorage.setItem('gestor_usuario_logado', JSON.stringify(usuario));
  } else {
    localStorage.removeItem('gestor_usuario_logado');
  }
  
  // Atualiza o display do cabeçalho
  const display = document.getElementById('user-name-display');
  if (display) {
    display.textContent = usuario ? usuario.nome : 'Visitante';
  }
}

export function registrarUsuario(usuario: Usuario): void {
  usuariosMock.push(usuario);
  localStorage.setItem('gestor_usuarios', JSON.stringify(usuariosMock));
}

export function obterUsuarioLogado(): Usuario | null {
  return usuarioLogado;
}

export function realizarLogout(): void {
  definirUsuarioLogado(null);
  // Executa o roteamento para login
  const nav = (window as any).navegarPara;
  if (typeof nav === 'function') {
    nav('login');
  }
}
(window as any).realizarLogout = realizarLogout;

// Helper para preencher metadados de modificação/criação em registros
export function assinarCriacao(registro: any): void {
  const usuario = obterUsuarioLogado();
  const dataHoje = new Date().toISOString();
  registro.criadoPor = usuario ? usuario.nome : 'sistema';
  registro.criadoEm = dataHoje;
  registro.modificadoPor = usuario ? usuario.nome : 'sistema';
  registro.modificadoEm = dataHoje;
}

export function assinarModificacao(registro: any): void {
  const usuario = obterUsuarioLogado();
  const dataHoje = new Date().toISOString();
  registro.modificadoPor = usuario ? usuario.nome : 'sistema';
  registro.modificadoEm = dataHoje;
}

// Função auxiliar para calcular SHA-256 de senhas (criptografia no banco de dados local)
export async function hashSenha(senha: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(senha);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================================================
// Carga de Registros Operacionais (Sem dados mockados padrão para iniciar limpo)
// ==========================================================================
export const manutencoesMock: Manutencao[] = JSON.parse(localStorage.getItem('gestor_manutencoes') || '[]');

export const despesasMock: Despesa[] = JSON.parse(localStorage.getItem('gestor_despesas') || '[]');

export const retiradasMock: Retirada[] = JSON.parse(localStorage.getItem('gestor_retiradas') || '[]');

export const vendasMock: Venda[] = JSON.parse(localStorage.getItem('gestor_vendas') || '[]');

export const pedidosCompraMock: PedidoCompra[] = JSON.parse(localStorage.getItem('gestor_pedidos_compra') || '[]');

// Inicializar lista de pedidos padrão se estiver vazia
if (pedidosCompraMock.length === 0) {
  const initialPedidos: PedidoCompra[] = [];
  pedidosCompraMock.push(...initialPedidos);
  localStorage.setItem('gestor_pedidos_compra', JSON.stringify(pedidosCompraMock));
}

export function salvarPedidosCompra(): void {
  localStorage.setItem('gestor_pedidos_compra', JSON.stringify(pedidosCompraMock));
}

export const avisosMock: Aviso[] = JSON.parse(localStorage.getItem('gestor_avisos') || '[]');

if (avisosMock.length === 0) {
  const initialAvisos: Aviso[] = [];
  avisosMock.push(...initialAvisos);
  localStorage.setItem('gestor_avisos', JSON.stringify(avisosMock));
}

export function salvarAvisos(): void {
  localStorage.setItem('gestor_avisos', JSON.stringify(avisosMock));
}

export const avisosLixeiraMock: Aviso[] = JSON.parse(localStorage.getItem('gestor_avisos_lixeira') || '[]');

export function salvarAvisosLixeira(): void {
  localStorage.setItem('gestor_avisos_lixeira', JSON.stringify(avisosLixeiraMock));
}

// Gestão de contas do PagBank (Multi-contas)
export const contasPagBankMock: ContaPagBank[] = JSON.parse(localStorage.getItem('gestor_contas_pagbank') || '[]');
if (contasPagBankMock.length === 0) {
  const initialContas: ContaPagBank[] = [
    { id: "C-1", nomeOuCnpj: "Conta PagBank Principal", valor: 0.00, ativa: true }
  ];
  contasPagBankMock.push(...initialContas);
  localStorage.setItem('gestor_contas_pagbank', JSON.stringify(contasPagBankMock));
}

export function salvarContasPagBank(): void {
  localStorage.setItem('gestor_contas_pagbank', JSON.stringify(contasPagBankMock));
}

// Saldo em dinheiro físico (Caixa Físico / Gaveta)
export let saldoCaixaFisico: number = parseFloat(localStorage.getItem('gestor_saldo_caixa_fisico') || '0.00');

export function salvarSaldoCaixaFisico(valor: number): void {
  saldoCaixaFisico = valor;
  localStorage.setItem('gestor_saldo_caixa_fisico', valor.toString());
  recalcularDadosDashboard();
}
(window as any).salvarSaldoCaixaFisico = salvarSaldoCaixaFisico;
(window as any).saldoCaixaFisico = saldoCaixaFisico;

// Histórico de Compras Reais dos Últimos 4 Meses para previsão média
export const historicoComprasMock: RegistroGastoCompra[] = JSON.parse(localStorage.getItem('gestor_historico_compras') || '[]');
if (historicoComprasMock.length === 0) {
  const initialHistorico: RegistroGastoCompra[] = [];
  historicoComprasMock.push(...initialHistorico);
  localStorage.setItem('gestor_historico_compras', JSON.stringify(historicoComprasMock));
}

export function salvarHistoricoCompras(): void {
  localStorage.setItem('gestor_historico_compras', JSON.stringify(historicoComprasMock));
  
  // Atualiza automaticamente o valor estimado do planejamento de reposição baseado na média!
  if (historicoComprasMock.length > 0) {
    const soma = historicoComprasMock.reduce((acc, curr) => {
      const valorAjustado = curr.tipo === 'mensal' ? (curr.valor / 2) : curr.valor;
      return acc + (valorAjustado || 0);
    }, 0);
    const media = soma / historicoComprasMock.length;
    configInicial.compraReposicaoValor = media;
    localStorage.setItem('gestor_compra_reposicao_valor', media.toString());
  }
}

// Estado do Dashboard consolidado (inicia zerado se não houver registros ou saldo salvo)
export const dadosDashboardMock: DashboardData = {
  saldoPagBank: parseFloat(localStorage.getItem('gestor_saldo_pagbank') || '0.00'),
  saldoCaixaFisico: saldoCaixaFisico,
  saldoTotal: 0.00,
  reservaMercadorias: configInicial.reservaMinima,
  despesasMes: 0.00,
  despesasPendentes: 0.00,
  lucroManutencoes: 0.00,
  lucroVendas: 0.00,
  retiradasMes: 0.00,
  disponivelRetirada: 0.00,
  vendasMes: 0.00
};

// Histórico de navegação do SPA
export const pilhaHistorico: string[] = [];
export let paginaAtual: string = "dashboard";

export function setPaginaAtual(novaPagina: string): void {
  paginaAtual = novaPagina;
}

// Filtros Globais
export const filtroManutencoes = {
  busca: '',
  ordenacao: 'data_desc',
  statusPagamento: 'todos',
  statusPeca: 'todos'
};
(window as any).filtroManutencoes = filtroManutencoes;

export const filtroDespesas = {
  tipo: 'todos' // 'todos' | 'Fixa' | 'Pontual'
};
(window as any).filtroDespesas = filtroDespesas;

// Função para recalcular as métricas do dashboard de forma dinâmica e matematicamente precisa
export function recalcularDadosDashboard(): void {
  // Calcula saldos de contas PagBank de forma dinâmica (contas ativas somam ao saldo, inativas somam à Reserva de Emergência)
  let totalAtivoPagBank = 0;
  let totalInativoPagBank = 0;
  if (typeof contasPagBankMock !== 'undefined') {
    contasPagBankMock.forEach(c => {
      if (c.ativa) {
        totalAtivoPagBank += c.valor;
      } else {
        totalInativoPagBank += c.valor;
      }
    });
  }
  dadosDashboardMock.saldoPagBank = totalAtivoPagBank;
  dadosDashboardMock.saldoCaixaFisico = saldoCaixaFisico;
  dadosDashboardMock.saldoTotal = totalAtivoPagBank + saldoCaixaFisico;
  dadosDashboardMock.reservaMercadorias = configInicial.reservaMinima + totalInativoPagBank;

  // Calcula despesas totais e despesas ainda pendentes (não pagas)
  let totalDespesas = 0;
  let totalDespesasPendentes = 0;
  despesasMock.forEach(d => {
    totalDespesas += d.valor;
    if (!d.paga) {
      totalDespesasPendentes += d.valor;
    }
  });
  dadosDashboardMock.despesasMes = totalDespesas;
  dadosDashboardMock.despesasPendentes = totalDespesasPendentes;

  // Lógica de cálculo de manutenção: Mão de obra e Lucro
  let totalLucroManutencoes = 0;
  let totalFaturamentoManutencoes = 0;
  manutencoesMock.forEach(m => {
    const maoDeObra = m.valorCobrado - (m.valorPeca * 2);
    const lucro = m.valorPeca + maoDeObra;
    m.lucro = lucro;
    m.maoDeObra = maoDeObra;
    totalLucroManutencoes += lucro;
    totalFaturamentoManutencoes += m.valorCobrado;
  });
  dadosDashboardMock.lucroManutencoes = totalLucroManutencoes;
  dadosDashboardMock.faturamentoManutencoes = totalFaturamentoManutencoes;

  // Calcula total das retiradas e segmenta por sócio
  let totalRetiradas = 0;
  let totalRetiradasSocioA = 0;
  let totalRetiradasSocioB = 0;
  retiradasMock.forEach(r => {
    totalRetiradas += r.valor;
    if (r.socio === 'Sócio A') {
      totalRetiradasSocioA += r.valor;
    } else if (r.socio === 'Sócio B') {
      totalRetiradasSocioB += r.valor;
    }
  });
  dadosDashboardMock.retiradasMes = totalRetiradas;
  dadosDashboardMock.retiradasSocioA = totalRetiradasSocioA;
  dadosDashboardMock.retiradasSocioB = totalRetiradasSocioB;

  // Calcula faturamento de vendas de balcão
  let totalVendas = 0;
  vendasMock.forEach(v => {
    totalVendas += ((v.debito || 0) + (v.credito || 0) + (v.pix || 0) + (v.dinheiro || 0));
  });
  dadosDashboardMock.vendasMes = totalVendas;
  
  // Calcula o lucro estimado de vendas utilizando a Margem de Lucro configurada
  dadosDashboardMock.lucroVendas = totalVendas * (configInicial.margemLucroVendas / 100);

  // Calcula faturamento total e lucro líquido real do mês
  dadosDashboardMock.faturamentoTotalMes = totalVendas + totalFaturamentoManutencoes;
  dadosDashboardMock.metaFaturamentoMes = configInicial.metaFaturamento;
  dadosDashboardMock.lucroLiquidoMes = totalLucroManutencoes + dadosDashboardMock.lucroVendas - totalDespesas;

  // Atualiza automaticamente o valor estimado baseado no histórico antes de vincular ao dashboard
  if (historicoComprasMock && historicoComprasMock.length > 0) {
    const soma = historicoComprasMock.reduce((acc, curr) => {
      const valorAjustado = curr.tipo === 'mensal' ? (curr.valor / 2) : curr.valor;
      return acc + (valorAjustado || 0);
    }, 0);
    configInicial.compraReposicaoValor = soma / historicoComprasMock.length;
  }

  // Vincula as variáveis de planejamento de reposição quinzenal no dashboard para visualização em outros componentes
  dadosDashboardMock.compraReposicaoValor = configInicial.compraReposicaoValor;
  dadosDashboardMock.compraReposicaoProximaData = configInicial.compraReposicaoProximaData;
  dadosDashboardMock.compraReposicaoAtiva = configInicial.compraReposicaoAtiva;

  /* 
    Fórmula Aprimorada com Planejamento de Compras de Reposição Quinzenal e Lucro de Manutenções:
    Para ajudar nas contas da retirada e garantir que a loja tenha fôlego para as compras das segundas-feiras (7k),
    deduzimos preventivamente o valor da próxima compra de reposição de mercadorias do saldo disponível para saque,
    caso o provisionamento esteja ativado nas configurações.
    O lucro de manutenções também é somado a este pool para ser livremente retirado e dividido 50/50.
  */
  const provisaoCompra = configInicial.compraReposicaoAtiva ? configInicial.compraReposicaoValor : 0;
  
  // O pool livre agora soma o lucro das manutenções (igualmente divididos) e usa o saldo total (PagBank + Caixa Físico)
  const poolLivre = ((dadosDashboardMock.saldoTotal || 0) - dadosDashboardMock.despesasPendentes - provisaoCompra) + dadosDashboardMock.lucroManutencoes;
  dadosDashboardMock.disponivelRetirada = poolLivre - dadosDashboardMock.retiradasMes;

  // Cada sócio tem direito a 50% do pool livre (Saldo - Despesas Pendentes - Provisão + Lucro Manutenções), descontando as suas retiradas individuais
  dadosDashboardMock.disponivelSocioA = (poolLivre / 2) - (dadosDashboardMock.retiradasSocioA || 0);
  dadosDashboardMock.disponivelSocioB = (poolLivre / 2) - (dadosDashboardMock.retiradasSocioB || 0);
}

// Executa o cálculo inicial das métricas com base no localStorage
export function zerarTodosOsDados(): void {
  const keys = [
    'gestor_manutencoes',
    'gestor_despesas',
    'gestor_retiradas',
    'gestor_vendas',
    'gestor_pedidos_compra',
    'gestor_avisos',
    'gestor_contas_pagbank',
    'gestor_saldo_caixa_fisico',
    'gestor_historico_compras',
    'gestor_reserva_minima',
    'gestor_despesas_fixas_estimadas',
    'gestor_margem_lucro_vendas',
    'gestor_compra_reposicao_ativa',
    'gestor_compra_reposicao_valor',
    'gestor_compra_reposicao_proxima_data',
    'gestor_meta_faturamento'
  ];
  keys.forEach(k => localStorage.removeItem(k));
  window.location.reload();
}

recalcularDadosDashboard();

// Expõe no escopo global
(window as any).recalcularDadosDashboard = recalcularDadosDashboard;
(window as any).zerarTodosOsDados = zerarTodosOsDados;
(window as any).configInicial = configInicial;
(window as any).dadosDashboardMock = dadosDashboardMock;
(window as any).vendasMock = vendasMock;
(window as any).despesasMock = despesasMock;
(window as any).manutencoesMock = manutencoesMock;
(window as any).retiradasMock = retiradasMock;
(window as any).pedidosCompraMock = pedidosCompraMock;
(window as any).salvarPedidosCompra = salvarPedidosCompra;
(window as any).avisosMock = avisosMock;
(window as any).salvarAvisos = salvarAvisos;
(window as any).contasPagBankMock = contasPagBankMock;
(window as any).salvarContasPagBank = salvarContasPagBank;
(window as any).historicoComprasMock = historicoComprasMock;
(window as any).salvarHistoricoCompras = salvarHistoricoCompras;

