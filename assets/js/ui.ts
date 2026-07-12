/* 
  ui.ts
  Gerenciador de UI Reutilizável (Modais e Toasts) e utilitários de formatação de strings/valores.
*/

export class UIManager {
  private toastContainer: HTMLElement | null = null;
  private modalOverlay: HTMLElement | null = null;

  inicializar(): void {
    // 1. Injetar container de Toast se não existir
    if (!document.getElementById('global-toast-container')) {
      const tc = document.createElement('div');
      tc.className = 'toast-container';
      tc.id = 'global-toast-container';
      document.body.appendChild(tc);
      this.toastContainer = tc;
    } else {
      this.toastContainer = document.getElementById('global-toast-container');
    }

    // 2. Injetar overlay de Modal se não existir
    if (!document.getElementById('global-modal-overlay')) {
      const mo = document.createElement('div');
      mo.className = 'modal-overlay';
      mo.id = 'global-modal-overlay';
      mo.innerHTML = `
        <div class="modal-container" id="global-modal-container">
          <div class="modal-header">
            <h3 class="modal-title" id="global-modal-title">Título</h3>
            <button class="modal-close" onclick="UI.fecharModal()" aria-label="Fechar modal">
              <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="modal-body" id="global-modal-body"></div>
          <div class="modal-footer" id="global-modal-footer"></div>
        </div>
      `;
      document.body.appendChild(mo);
      this.modalOverlay = mo;

      // Fechar ao clicar fora do container
      mo.addEventListener('click', (e) => {
        if (e.target === mo) {
          this.fecharModal();
        }
      });
    } else {
      this.modalOverlay = document.getElementById('global-modal-overlay');
    }
  }

  mostrarToast(mensagem: string, tipo: 'success' | 'danger' | 'info' = 'info'): void {
    const container = this.toastContainer || document.getElementById('global-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;

    let iconSVG = '';
    if (tipo === 'success') {
      iconSVG = `<svg class="toast-icon" style="color: var(--color-success);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>`;
    } else if (tipo === 'danger') {
      iconSVG = `<svg class="toast-icon" style="color: var(--color-danger);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
    } else {
      iconSVG = `<svg class="toast-icon" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    toast.innerHTML = `
      ${iconSVG}
      <span>${mensagem}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add('active'), 10);

    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  abrirModal(titulo: string, conteudoHTML: string, acaoConfirmar?: () => void, textoConfirmar: string = 'Confirmar'): void {
    const overlay = this.modalOverlay || document.getElementById('global-modal-overlay');
    if (!overlay) return;

    const modalTitle = document.getElementById('global-modal-title');
    const modalBody = document.getElementById('global-modal-body');
    const modalFooter = document.getElementById('global-modal-footer');

    if (modalTitle) modalTitle.textContent = titulo;
    if (modalBody) modalBody.innerHTML = conteudoHTML;

    if (modalFooter) {
      modalFooter.innerHTML = '';

      // Botão Cancelar
      const btnCancelar = document.createElement('button');
      btnCancelar.className = 'btn btn-secondary';
      btnCancelar.textContent = 'Fechar';
      btnCancelar.onclick = () => this.fecharModal();
      modalFooter.appendChild(btnCancelar);

      // Botão Confirmar
      if (acaoConfirmar) {
        const btnConfirmar = document.createElement('button');
        btnConfirmar.className = 'btn btn-primary';
        btnConfirmar.textContent = textoConfirmar;
        btnConfirmar.onclick = () => {
          acaoConfirmar();
          this.fecharModal();
        };
        modalFooter.appendChild(btnConfirmar);
      }
    }

    overlay.classList.add('active');
  }

  fecharModal(): void {
    const overlay = this.modalOverlay || document.getElementById('global-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }
}

export const UI = new UIManager();
(window as any).UI = UI;

// Formata um número para o formato de moeda brasileiro (R$)
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}
(window as any).formatarMoeda = formatarMoeda;

export function formatarDataBR(dataISO: string): string {
  const partes = dataISO.split('-');
  if (partes.length !== 3) return dataISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
(window as any).formatarDataBR = formatarDataBR;

// Retorna o botão de voltar padrão em HTML para ser usado nos cabeçalhos das páginas
export function obterBotaoVoltarHTML(): string {
  return `
    <button class="icon-button" onclick="voltarPagina()" aria-label="Voltar para a página anterior" style="width: 2.5rem; height: 2.5rem; border-radius: var(--radius-md); margin-right: var(--spacing-sm);">
      <svg style="width: 1.25rem; height: 1.25rem; display: block; color: var(--text-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path>
      </svg>
    </button>
  `;
}

// Formata as informações de auditoria/assinatura do usuário em um elemento visual sutil
export function formatarAssinatura(registro: any): string {
  if (!registro || !registro.criadoPor) return '';
  const criadoPor = registro.criadoPor;
  const modificadoPor = registro.modificadoPor;
  
  if (modificadoPor && modificadoPor !== criadoPor && modificadoPor !== 'sistema') {
    return ` | <span style="font-size: 0.75rem; color: var(--color-primary); opacity: 0.85; font-style: italic;" title="Criado por ${criadoPor} e modificado por ${modificadoPor}">✍️ ${criadoPor} (modificado por ${modificadoPor})</span>`;
  }
  return ` | <span style="font-size: 0.75rem; color: var(--text-muted); opacity: 0.85; font-style: italic;" title="Cadastrado por ${criadoPor}">✍️ ${criadoPor}</span>`;
}
(window as any).formatarAssinatura = formatarAssinatura;

