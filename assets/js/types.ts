/* 
  types.ts
  Definições de tipo e interfaces compartilhadas do Gestor da Loja.
*/

export interface Usuario {
  username: string;
  nome: string;
  senhaHash: string;
}

export interface TrackedRecord {
  criadoPor?: string;
  criadoEm?: string;
  modificadoPor?: string;
  modificadoEm?: string;
}

export interface DashboardData {
  saldoPagBank: number;
  saldoCaixaFisico?: number;         // Novo: Saldo em Dinheiro Físico (Caixa)
  saldoTotal?: number;               // Novo: Saldo PagBank + Caixa Físico
  reservaMercadorias: number;
  despesasMes: number;
  despesasPendentes: number; // Custos ainda não pagos
  lucroManutencoes: number;
  lucroVendas: number;       // Lucro estimado das vendas de balcão
  retiradasMes: number;
  disponivelRetirada: number;
  vendasMes: number;
  compraReposicaoValor?: number;      // Novo: Provisão para reposição de mercadoria
  compraReposicaoProximaData?: string; // Novo: Data da próxima compra planejada
  compraReposicaoAtiva?: boolean;     // Novo: Se o provisionamento está ativo
  disponivelSocioA?: number;          // Disponível para Sócio A
  disponivelSocioB?: number;          // Disponível para Sócio B
  retiradasSocioA?: number;           // Retiradas feitas pelo Sócio A
  retiradasSocioB?: number;           // Retiradas feitas pelo Sócio B
  faturamentoManutencoes?: number;    // Novo: Faturamento bruto das manutenções no mês
  faturamentoTotalMes?: number;       // Novo: Faturamento bruto total do mês (vendas + manutenções)
  metaFaturamentoMes?: number;        // Novo: Meta de faturamento definida
  lucroLiquidoMes?: number;           // Novo: Lucro líquido estimado (lucros - despesas)
}

export interface Manutencao extends TrackedRecord {
  id: string;
  os: string;
  cliente: string;
  aparelho: string;
  marca: string;
  modelo: string;
  cor: string;
  situacao: string;
  valorPeca: number;
  maoDeObra: number;
  valorCobrado: number; // (Peça * 2) + Mão de obra
  lucro: number;        // Valor Cobrado - Peça
  pagoPeloCliente: boolean;
  pecaPaga: boolean;
  data: string;
  garantiaAte: string;  // 90 dias
}

export interface Despesa extends TrackedRecord {
  id: string;
  descricao: string;
  categoria: 'Mercadoria' | 'Infraestrutura' | 'Marketing' | 'Pessoal' | 'Outros';
  valor: number;
  paga: boolean;
  dataVencimento: string;
  tipo?: 'Fixa' | 'Pontual';
}

export interface Retirada extends TrackedRecord {
  id: string;
  valor: number;
  data: string;
  observacao: string;
  socio?: string; // Novo: Sócio associado à retirada (ex: Sócio A, Sócio B, Irmão C, etc.)
  formaPagamento?: string; // Novo: Forma de pagamento/origem (ex: Dinheiro do Caixa, Conta PagBank, etc.)
}

export interface Venda extends TrackedRecord {
  id: string;
  data: string;
  debito: number;
  credito: number;
  pix: number;
  dinheiro: number;
  total: number;
  observacao?: string;
}

export interface Configuracoes {
  reservaMinima: number;
  despesasFixasEstimadas: number;
  margemLucroVendas: number; // Porcentagem de lucro estimada sobre as vendas
  compraReposicaoValor: number;      // Novo: Valor estimado para compra de reposição de mercadoria (padrão 7k)
  compraReposicaoProximaData: string; // Novo: Data da próxima segunda-feira de compra planejada
  compraReposicaoAtiva: boolean;     // Novo: Se o provisionamento está ativado preventivamente
  metaFaturamento: number;           // Novo: Meta de faturamento mensal definida
}

export interface PedidoCompra extends TrackedRecord {
  id: string;
  produto: string;
  quantidadeEstimada: number;
  status: 'Aberto' | 'Pedido' | 'Recebido'; // Aberto (Open), Pedido (Ordered), Recebido (Received)
  data: string;
  observacao?: string;
}

export interface Aviso extends TrackedRecord {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: 'procedimento' | 'aviso'; // 'procedimento' = Instruções / Regras Fixas, 'aviso' = Recados / Avisos Rápidos
  data: string;
  autor: string;
  urgente?: boolean;
  resolvido?: boolean;
}

export interface ContaPagBank extends TrackedRecord {
  id: string;
  nomeOuCnpj: string;
  valor: number;
  ativa: boolean;
}

export interface RegistroGastoCompra {
  id: string;
  mesOuData: string;
  valor: number;
  tipo?: 'quinzenal' | 'mensal';
}

