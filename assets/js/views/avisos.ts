/* 
  views/avisos.ts
  Renderizador da tela do Mural / Quadro de Avisos e Recados da Loja.
*/

import { formatarMoeda, formatarDataBR, obterBotaoVoltarHTML, UI } from '../ui.ts';
import { avisosMock, salvarAvisos, paginaAtual, avisosLixeiraMock, salvarAvisosLixeira } from '../state.ts';
import { Aviso } from '../types.ts';

export function renderizarAvisos(container: HTMLElement): void {
  const pageElement = document.createElement('div');
  pageElement.className = 'page-container fade-in';

  // Renderizar Recados e Procedimentos dinamicamente
  let htmlProcedimentos = '';
  let htmlAvisos = '';

  avisosMock.forEach(aviso => {
    const isUrgente = aviso.urgente;
    const cardBorder = isUrgente 
      ? 'border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.02); border-top: 1px solid rgba(239, 68, 68, 0.15); border-right: 1px solid rgba(239, 68, 68, 0.15); border-bottom: 1px solid rgba(239, 68, 68, 0.15);' 
      : 'border-left: 4px solid var(--color-primary); background: var(--bg-secondary); border-top: 1px solid var(--border-color); border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);';

    // Se estiver resolvido, mostramos um botão adicional "Mover p/ Lixeira" no rodapé
    const extraActionHTML = aviso.resolvido 
      ? `<button onclick="moverParaLixeira('${aviso.id}')" class="btn" style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); color: #e9d5ff; font-size: 0.62rem; padding: 2px 6px; height: auto; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 4px; cursor: pointer; font-weight: 500;" title="Mover definitivamente para a Lixeira (Requer Confirmação)">
          🗑️ Enviar p/ Lixeira
         </button>`
      : '';

    const cardHTML = `
      <div class="card" style="padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: var(--spacing-xs); ${cardBorder}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-sm);">
          <div style="display: flex; align-items: center; gap: var(--spacing-xs); flex-wrap: wrap; min-width: 0;">
            ${isUrgente ? '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.25); font-size: 0.6rem; padding: 1px 4px;">Urgente</span>' : ''}
            <h4 class="font-highlight" style="font-size: 0.95rem; margin: 0; color: var(--text-primary); font-weight: 600; overflow: hidden; text-overflow: ellipsis; ${aviso.resolvido ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${aviso.titulo}</h4>
          </div>
          <div style="display: flex; align-items: center; gap: var(--spacing-xs); flex-shrink: 0;">
            <button onclick="abrirModalEditarAviso('${aviso.id}')" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: background-color var(--transition-fast);" onmouseenter="this.style.backgroundColor='rgba(59, 130, 246, 0.15)'" onmouseleave="this.style.backgroundColor='transparent'" title="Editar aviso">
              <svg style="width: 0.8rem; height: 0.8rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </button>
            <button onclick="excluirAviso('${aviso.id}')" style="background: none; border: none; color: var(--color-danger); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: background-color var(--transition-fast);" onmouseenter="this.style.backgroundColor='rgba(255, 69, 58, 0.15)'" onmouseleave="this.style.backgroundColor='transparent'" title="Remover aviso">
              <svg style="width: 0.8rem; height: 0.8rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
        <p class="text-muted" style="font-size: 0.82rem; margin: 2px 0 0 0; line-height: 1.4; word-break: break-word; ${aviso.resolvido ? 'opacity: 0.5;' : ''}">${aviso.conteudo}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; border-top: 1px dashed rgba(255, 255, 255, 0.08); padding-top: 8px; font-size: 0.68rem; color: var(--text-muted); flex-wrap: wrap; gap: var(--spacing-xs);">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span>Por: <strong>${aviso.autor}</strong></span>
            <span style="opacity: 0.4;">•</span>
            <span>${aviso.data.split('-').reverse().join('/')}</span>
          </div>
          
          <div style="display: flex; align-items: center; gap: 6px;">
            <!-- Botão para marcar se fez ou não -->
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.65rem; background: ${aviso.resolvido ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.03)'}; color: ${aviso.resolvido ? '#4ade80' : 'var(--text-muted)'}; border: 1px solid ${aviso.resolvido ? 'rgba(34, 197, 94, 0.25)' : 'var(--border-color)'}; border-radius: 4px; padding: 2px 6px; cursor: pointer; user-select: none;" onclick="toggleAvisoResolvido('${aviso.id}')" title="Clique para alternar o status da tarefa">
              <span style="font-size: 0.75rem; line-height: 1;">${aviso.resolvido ? '✓' : '○'}</span>
              <span style="font-weight: 600;">${aviso.resolvido ? 'Tarefa Concluída' : 'Marcar Concluída'}</span>
            </div>
            
            ${extraActionHTML}
          </div>
        </div>
      </div>
    `;

    if (aviso.categoria === 'procedimento') {
      htmlProcedimentos += cardHTML;
    } else {
      htmlAvisos += cardHTML;
    }
  });

  if (!htmlProcedimentos) {
    htmlProcedimentos = `<div style="text-align: center; padding: var(--spacing-xl) var(--spacing-md); color: var(--text-muted); font-size: 0.8rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md); background: var(--bg-secondary);">Nenhuma regra ou procedimento cadastrado.</div>`;
  }
  if (!htmlAvisos) {
    htmlAvisos = `<div style="text-align: center; padding: var(--spacing-xl) var(--spacing-md); color: var(--text-muted); font-size: 0.8rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md); background: var(--bg-secondary);">Nenhum recado rápido cadastrado.</div>`;
  }

  // Lixeira Section HTML
  let htmlLixeira = '';
  if (avisosLixeiraMock.length === 0) {
    htmlLixeira = `
      <div style="text-align: center; padding: var(--spacing-md); color: var(--text-muted); font-size: 0.75rem; border: 1px dashed rgba(255,255,255,0.05); border-radius: var(--radius-md); background: rgba(0,0,0,0.1);">
        A lixeira de avisos está vazia.
      </div>
    `;
  } else {
    avisosLixeiraMock.forEach(item => {
      htmlLixeira += `
        <div class="list-item" style="padding: 8px 12px; display: flex; gap: var(--spacing-sm); align-items: center; background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.03); border-radius: var(--radius-sm); margin-bottom: 6px;">
          <div style="min-width: 0; flex: 1; text-align: left;">
            <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
              <span style="font-size: 0.6rem; background: rgba(255, 255, 255, 0.05); color: var(--text-muted); padding: 1px 4px; border-radius: 3px; font-weight: 500;">
                ${item.categoria === 'procedimento' ? 'Procedimento' : 'Aviso'}
              </span>
              <span class="font-highlight" style="font-size: 0.8rem; margin: 0; text-decoration: line-through; opacity: 0.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${item.titulo}
              </span>
            </div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">
              Original por: <strong>${item.autor}</strong> • Armazenado em Lixeira
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            <button onclick="restaurarAvisoDaLixeira('${item.id}')" class="btn" style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.25); font-size: 0.65rem; padding: 2px 8px; height: auto; border-radius: var(--radius-sm); font-weight: 500; cursor: pointer;">
              Restaurar
            </button>
            <button onclick="excluirPermanenteDaLixeira('${item.id}')" class="btn" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25); font-size: 0.65rem; padding: 2px 8px; height: auto; border-radius: var(--radius-sm); font-weight: 500; cursor: pointer;">
              Apagar
            </button>
          </div>
        </div>
      `;
    });
  }

  pageElement.innerHTML = `
    <div class="page-header" style="display: flex; align-items: center; justify-content: flex-start; gap: var(--spacing-xs);">
      ${obterBotaoVoltarHTML()}
      <div>
        <h2 class="page-title">Mural de Avisos & Recados</h2>
        <p class="page-subtitle">Comunique procedimentos fixos e compartilhe comunicados rápidos com seu sócio</p>
      </div>
    </div>

    <!-- Botão Adicionar Recado no Topo -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: var(--spacing-md);">
      <button class="btn btn-primary" onclick="abrirModalCadastroAviso()" style="font-size: 0.8rem; padding: 0 var(--spacing-md); height: 2.25rem; border-radius: var(--radius-md); display: flex; align-items: center; gap: 6px;">
        <svg style="width: 0.95rem; height: 0.95rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Adicionar Recado / Regra
      </button>
    </div>

    <div style="display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg);" class="md-grid-cols-2">
      <!-- Procedimentos e Regras Fixas -->
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
        <h4 class="font-highlight" style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-primary); margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px; font-weight: bold;">
          <span style="width: 8px; height: 8px; background: var(--color-primary); border-radius: 50%;"></span>
          Procedimentos & Regras Fixas
        </h4>
        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);" id="container-procedimentos-mural">
          ${htmlProcedimentos}
        </div>
      </div>

      <!-- Mural de Avisos & Recados Rápidos -->
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
        <h4 class="font-highlight" style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-primary); margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px; font-weight: bold;">
          <span style="width: 8px; height: 8px; background: var(--color-warning); border-radius: 50%;"></span>
          Mural de Avisos & Recados
        </h4>
        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);" id="container-recados-mural">
          ${htmlAvisos}
        </div>
      </div>
    </div>

    <!-- Seção de Lixeira de Avisos & Recados -->
    <div style="margin-top: var(--spacing-xl); border-top: 1px solid var(--border-color); padding-top: var(--spacing-md); text-align: left; box-sizing: border-box; width: 100%;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
        <h4 class="font-highlight" style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 0; display: flex; align-items: center; gap: 8px; font-weight: bold;">
          🗑️ Lixeira de Avisos (Descartes com Confirmação)
        </h4>
        ${avisosLixeiraMock.length > 0 ? `<button onclick="esvaziarLixeira()" class="btn" style="background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.15); font-size: 0.65rem; padding: 2px 8px; height: auto; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer;">Limpar Lixeira</button>` : ''}
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px;" id="container-lixeira-mural">
        ${htmlLixeira}
      </div>
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(pageElement);
}
(window as any).renderizarAvisos = renderizarAvisos;

export function abrirModalCadastroAviso(): void {
  UI.abrirModal(
    "Adicionar Aviso ou Procedimento",
    `
      <form id="form-cadastro-aviso" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="input-aviso-titulo">Título / Assunto</label>
          <input type="text" id="input-aviso-titulo" class="input-field" placeholder="Ex: Regra de Garantia, Fornecedor SP" required style="background-color: var(--bg-input); height: 2.75rem;" />
        </div>
        <div class="form-group">
          <label class="form-label" for="select-aviso-autor">Quem está escrevendo? (Autor)</label>
          <select id="select-aviso-autor" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;">
            <option value="Sócio A">Sócio A</option>
            <option value="Sócio B">Sócio B</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="select-aviso-categoria">Tipo de Quadro</label>
          <select id="select-aviso-categoria" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;">
            <option value="aviso">Mural de Avisos & Recados Rápidos</option>
            <option value="procedimento">Procedimentos & Regras Fixas</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-aviso-conteudo">Conteúdo / Descrição</label>
          <textarea id="input-aviso-conteudo" class="input-field" placeholder="Escreva a mensagem ou procedimento completo aqui..." required style="background-color: var(--bg-input); height: 5rem; resize: vertical; padding: 10px;"></textarea>
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
          <input type="checkbox" id="input-aviso-urgente" style="width: 16px; height: 16px; accent-color: var(--color-primary);" />
          <label for="input-aviso-urgente" class="form-label" style="margin: 0; cursor: pointer; user-select: none;">Marcar como Urgente / Destacado</label>
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-cadastro-aviso') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const tituloInput = document.getElementById('input-aviso-titulo') as HTMLInputElement;
      const autorSelect = document.getElementById('select-aviso-autor') as HTMLSelectElement;
      const categoriaSelect = document.getElementById('select-aviso-categoria') as HTMLSelectElement;
      const conteudoInput = document.getElementById('input-aviso-conteudo') as HTMLTextAreaElement;
      const urgenteInput = document.getElementById('input-aviso-urgente') as HTMLInputElement;

      const titulo = tituloInput.value.trim();
      const autor = autorSelect.value;
      const categoria = categoriaSelect.value as 'procedimento' | 'aviso';
      const conteudo = conteudoInput.value.trim();
      const urgente = urgenteInput.checked;
      const dataHoje = new Date().toISOString().split('T')[0];

      const novoId = `A-${Date.now()}`;

      const novoAviso: Aviso = {
        id: novoId,
        titulo,
        conteudo,
        categoria,
        data: dataHoje,
        autor,
        urgente
      };

      avisosMock.unshift(novoAviso);
      salvarAvisos();

      UI.mostrarToast('Aviso/Procedimento publicado no quadro!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        if (paginaAtual === 'avisos') {
          renderizarAvisos(mainContent);
        } else {
          // @ts-ignore
          const navegarPara = (window as any).navegarPara;
          if (typeof navegarPara === 'function') {
            navegarPara('avisos');
          }
        }
      }
    },
    'Publicar'
  );
}
(window as any).abrirModalCadastroAviso = abrirModalCadastroAviso;

export function abrirModalEditarAviso(id: string): void {
  const item = avisosMock.find(a => a.id === id);
  if (!item) return;

  UI.abrirModal(
    "Editar Aviso ou Procedimento",
    `
      <form id="form-editar-aviso" style="display: flex; flex-direction: column; gap: var(--spacing-sm);" onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="edit-aviso-titulo">Título / Assunto</label>
          <input type="text" id="edit-aviso-titulo" class="input-field" value="${item.titulo}" required style="background-color: var(--bg-input); height: 2.75rem;" />
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-aviso-autor">Quem está escrevendo? (Autor)</label>
          <select id="edit-aviso-autor" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;">
            <option value="Sócio A" ${item.autor === 'Sócio A' ? 'selected' : ''}>Sócio A</option>
            <option value="Sócio B" ${item.autor === 'Sócio B' ? 'selected' : ''}>Sócio B</option>
            <option value="Outro" ${item.autor !== 'Sócio A' && item.autor !== 'Sócio B' ? 'selected' : ''}>Outro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-aviso-categoria">Tipo de Quadro</label>
          <select id="edit-aviso-categoria" class="input-field" style="background-color: var(--bg-input); height: 2.75rem;">
            <option value="aviso" ${item.categoria === 'aviso' ? 'selected' : ''}>Mural de Avisos & Recados Rápidos</option>
            <option value="procedimento" ${item.categoria === 'procedimento' ? 'selected' : ''}>Procedimentos & Regras Fixas</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-aviso-conteudo">Conteúdo / Descrição</label>
          <textarea id="edit-aviso-conteudo" class="input-field" required style="background-color: var(--bg-input); height: 5rem; resize: vertical; padding: 10px;">${item.conteudo}</textarea>
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
          <input type="checkbox" id="edit-aviso-urgente" style="width: 16px; height: 16px; accent-color: var(--color-primary);" ${item.urgente ? 'checked' : ''} />
          <label for="edit-aviso-urgente" class="form-label" style="margin: 0; cursor: pointer; user-select: none;">Marcar como Urgente / Destacado</label>
        </div>
      </form>
    `,
    () => {
      const form = document.getElementById('form-editar-aviso') as HTMLFormElement;
      if (!form) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const tituloInput = document.getElementById('edit-aviso-titulo') as HTMLInputElement;
      const autorSelect = document.getElementById('edit-aviso-autor') as HTMLSelectElement;
      const categoriaSelect = document.getElementById('edit-aviso-categoria') as HTMLSelectElement;
      const conteudoInput = document.getElementById('edit-aviso-conteudo') as HTMLTextAreaElement;
      const urgenteInput = document.getElementById('edit-aviso-urgente') as HTMLInputElement;

      item.titulo = tituloInput.value.trim();
      item.autor = autorSelect.value;
      item.categoria = categoriaSelect.value as 'procedimento' | 'aviso';
      item.conteudo = conteudoInput.value.trim();
      item.urgente = urgenteInput.checked;

      salvarAvisos();
      UI.mostrarToast('Quadro de avisos updated!', 'success');

      const mainContent = document.getElementById('main-content');
      if (mainContent && paginaAtual === 'avisos') {
        renderizarAvisos(mainContent);
      }
    },
    'Salvar'
  );
}
(window as any).abrirModalEditarAviso = abrirModalEditarAviso;

export function moverParaLixeira(id: string): void {
  const aviso = avisosMock.find(a => a.id === id);
  if (!aviso) return;

  UI.abrirModal(
    "Confirmação do Autor",
    `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%; box-sizing: border-box; text-align: left;">
        <p style="font-size: 0.9rem; color: var(--text-primary); margin: 0; line-height: 1.45;">
          Este aviso/tarefa foi escrito por: <strong style="color: #60a5fa; font-size: 0.95rem;">${aviso.autor}</strong>.
        </p>
        <p class="text-muted" style="font-size: 0.8rem; margin: 0; line-height: 1.4;">
          Para descartá-lo para a Lixeira, o autor do aviso ou um sócio autorizado precisa confirmar a ação de fechamento.
        </p>
        <div style="margin: var(--spacing-xs) 0; padding: var(--spacing-sm); background: rgba(0,0,0,0.15); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.8rem; line-height: 1.35; color: var(--text-secondary);">
          <strong style="color: var(--text-primary); display: block; margin-bottom: 2px;">"${aviso.titulo}"</strong>
          ${aviso.conteudo}
        </div>
        
        <div class="form-group" style="margin-top: 4px;">
          <label class="form-label" for="select-confirmacao-autor" style="font-size: 0.75rem;">Quem está autorizando o descarte?</label>
          <select id="select-confirmacao-autor" class="input-field" style="background-color: var(--bg-input); height: 2.5rem; font-size: 0.85rem; cursor: pointer;">
            <option value="confirmado">Sim, eu sou o autor (${aviso.autor}) e confirmo</option>
            <option value="socio">Sou outro sócio e possuo autorização</option>
          </select>
        </div>
      </div>
    `,
    () => {
      const idx = avisosMock.findIndex(a => a.id === id);
      if (idx !== -1) {
        const [itemRemovido] = avisosMock.splice(idx, 1);
        itemRemovido.resolvido = true; // Garante que fica como resolvido
        avisosLixeiraMock.unshift(itemRemovido);
        
        salvarAvisos();
        salvarAvisosLixeira();
        
        UI.mostrarToast('Item movido para a Lixeira com confirmação!', 'success');
        
        const mainContent = document.getElementById('main-content');
        if (mainContent && paginaAtual === 'avisos') {
          renderizarAvisos(mainContent);
        }
      }
    },
    'Mover para Lixeira'
  );
}
(window as any).moverParaLixeira = moverParaLixeira;

export function excluirAviso(id: string): void {
  // Redireciona a remoção para a lixeira com confirmação do autor
  moverParaLixeira(id);
}
(window as any).excluirAviso = excluirAviso;

export function restaurarAvisoDaLixeira(id: string): void {
  const idx = avisosLixeiraMock.findIndex(a => a.id === id);
  if (idx !== -1) {
    const [itemRestaurado] = avisosLixeiraMock.splice(idx, 1);
    itemRestaurado.resolvido = false; // Reseta para fazer novamente
    avisosMock.push(itemRestaurado);
    
    salvarAvisos();
    salvarAvisosLixeira();
    
    UI.mostrarToast('Aviso restaurado com sucesso!', 'success');
    
    const mainContent = document.getElementById('main-content');
    if (mainContent && paginaAtual === 'avisos') {
      renderizarAvisos(mainContent);
    }
  }
}
(window as any).restaurarAvisoDaLixeira = restaurarAvisoDaLixeira;

export function excluirPermanenteDaLixeira(id: string): void {
  UI.abrirModal(
    "Excluir Permanentemente",
    `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%; box-sizing: border-box; text-align: left;">
        <p style="color: var(--color-danger); font-weight: 600; font-size: 0.95rem; margin: 0;">Esta ação é permanente e irreversível!</p>
        <p class="text-muted" style="font-size: 0.8rem; margin: 0; line-height: 1.4;">Deseja excluir definitivamente este aviso da Lixeira? Ele não poderá mais ser restaurado.</p>
      </div>
    `,
    () => {
      const idx = avisosLixeiraMock.findIndex(a => a.id === id);
      if (idx !== -1) {
        avisosLixeiraMock.splice(idx, 1);
        salvarAvisosLixeira();
        
        UI.mostrarToast('Aviso apagado definitivamente!', 'success');
        
        const mainContent = document.getElementById('main-content');
        if (mainContent && paginaAtual === 'avisos') {
          renderizarAvisos(mainContent);
        }
      }
    },
    "Apagar Definitivamente"
  );
}
(window as any).excluirPermanenteDaLixeira = excluirPermanenteDaLixeira;

export function esvaziarLixeira(): void {
  if (avisosLixeiraMock.length === 0) return;

  UI.abrirModal(
    "Limpar Lixeira",
    `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); width: 100%; box-sizing: border-box; text-align: left;">
        <p style="color: var(--color-danger); font-weight: 600; font-size: 0.95rem; margin: 0;">Limpar todos os itens da Lixeira?</p>
        <p class="text-muted" style="font-size: 0.8rem; margin: 0; line-height: 1.4;">Todos os <strong>${avisosLixeiraMock.length}</strong> avisos e tarefas descartados serão apagados definitivamente do sistema.</p>
      </div>
    `,
    () => {
      avisosLixeiraMock.length = 0;
      salvarAvisosLixeira();
      
      UI.mostrarToast('Lixeira de avisos limpa com sucesso!', 'success');
      
      const mainContent = document.getElementById('main-content');
      if (mainContent && paginaAtual === 'avisos') {
        renderizarAvisos(mainContent);
      }
    },
    "Limpar Lixeira"
  );
}
(window as any).esvaziarLixeira = esvaziarLixeira;

export function toggleAvisoResolvido(id: string): void {
  const aviso = avisosMock.find(a => a.id === id);
  if (!aviso) return;
  aviso.resolvido = !aviso.resolvido;
  salvarAvisos();
  UI.mostrarToast(aviso.resolvido ? 'Tarefa marcada como Concluída!' : 'Tarefa reaberta!', 'success');
  const mainContent = document.getElementById('main-content');
  if (mainContent && paginaAtual === 'avisos') {
    renderizarAvisos(mainContent);
  }
}
(window as any).toggleAvisoResolvido = toggleAvisoResolvido;
