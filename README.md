# Gestor da Loja — Controle Financeiro para Assistência Técnica de Celulares 📱

Um sistema de Single Page Application (SPA) moderno, intuitivo, elegante e de alta performance, construído com **TypeScript Nativo**, **CSS3 Customizado** e empacotado via **Vite**. Ideal para técnicos e lojistas que desejam acompanhar a saúde financeira de sua assistência técnica de celulares em tempo real.

---

## ✨ Principais Funcionalidades

- **📊 Painel de Controle (Dashboard):** Visão holística de despesas do mês, saldo do PagBank principal, lucro líquido de serviços técnicos, faturamento de balcão e saques pró-labore.
- **🛡️ Determinação do Saldo Seguro para Retirada:** Fórmula matemática aprimorada que protege o capital de giro e o estoque através de uma reserva de emergência mínima e dedução apenas de despesas pendentes.
- **🔧 Controle de Manutenções (Ordens de Serviço):** Cadastro de O.S., acompanhamento de marcas e modelos (com datalists dinâmicos), controle do custo da peça vs. mão de obra, cálculo de margem e lucros por serviço.
- **💸 Gestão de Despesas com Pagamentos:** Controle de despesas fixas e pontuais com filtros dedicados, controle de status de pagamento (marcar despesas como pagas ou pendentes) com dedução em tempo real.
- **💰 Vendas de Balcão e Métricas de Lucro:** Lançamento de vendas diárias especificando meios de pagamento (PIX, Crédito, Débito e Dinheiro) com gráficos circulares de distribuição e evolução diária, além de customização de margem de lucro estimada.
- **📅 Filtros de Vendas por Período:** Filtragem avançada de faturamentos de balcão (Hoje, 7 dias, Mês atual, Ano atual ou Período Customizado por data de início e fim).
- **🏧 Retiradas de Sócios:** Histórico completo de saques de pró-labore com validação contra o saldo livre seguro atual.
- **💾 Sistema Seguro de Backup (JSON):** Exportação completa de todos os dados do sistema em um arquivo JSON para segurança, e importação instantânea de arquivos de backup para restauração completa.

---

## 🛠️ Tecnologias Utilizadas

- **TypeScript:** Tipagem forte e prevenção de bugs em tempo de compilação.
- **CSS3 Puro e Modularizado:** Variáveis CSS nativas, layout responsivo por Grid e Flexbox, animações de transição ultra-suaves e visual minimalista.
- **Vite:** Empacotamento extremamente veloz e hot-reloads instantâneos.
- **LocalStorage API:** Persistência de dados cliente-side segura e confiável.

---

## 📂 Organização Modular do Projeto

O código-fonte foi completamente refatorado e organizado de acordo com as melhores práticas de modularidade, separando o estado, utilitários visuais e cada tela de exibição:

```bash
/
├── assets/
│   ├── css/
│   │   ├── global.css        # Estilos globais e reset
│   │   ├── variables.css     # Paleta de cores, tipografia e spacing
│   │   ├── components.css    # Cards, botões, modais e toasts
│   │   └── pages.css         # Customização de containers e tabelas
│   └── js/
│       ├── types.ts          # Interfaces de dados centralizadas
│       ├── ui.ts             # UIManager (Gerenciamento de Modais e Toasts)
│       ├── state.ts          # Estado global, cálculos e localStorage
│       ├── app.ts            # Ponto de entrada e motor de roteamento do SPA
│       └── views/            # Módulos de renderização e controle de cada tela
│           ├── dashboard.ts  # Painel de controle e saldo PagBank
│           ├── manutencoes.ts# Controle de O.S. e serviços
│           ├── despesas.ts   # Gestão de custos e pagamentos
│           ├── retiradas.ts  # Retiradas de pró-labore de sócios
│           ├── vendas.ts     # Vendas de balcão, filtros e gráficos
│           └── ajustes.ts    # Configurações financeiras e backups
├── index.html                # Entrypoint principal do aplicativo
├── vite.config.ts            # Configuração do Vite dev-server
└── package.json              # Scripts e dependências de build
```

---

## 🚀 Como Executar o Projeto Localmente

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Executar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Gerar a build de produção:**
   ```bash
   npm run build
   ```

4. **Iniciar a build compilada:**
   ```bash
   npm run start
   ```

---

## 📄 Licença

Este projeto é de uso livre. Sinta-se à vontade para clonar, modificar, implantar no fly.io ou em qualquer outra plataforma, e utilizar para impulsionar a gestão financeira da sua assistência!
