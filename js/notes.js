// DataVault Notes Module
import { addVaultItem } from './items.js';
import { toggleModal, showToast } from './ui.js';

/**
 * Handle Note Creation form submission
 * @param {HTMLFormElement} form 
 */
export async function handleNoteSubmit(form) {
  const title = form.elements['noteTitle'].value.trim();
  const content = form.elements['noteContent'].value.trim();
  const category = form.elements['noteCategory'].value || 'Personal';
  const favorite = form.elements['noteFavorite'].checked;

  if (!title || !content) {
    showToast("Please provide both title and content for note.", "error");
    return;
  }

  await addVaultItem({
    type: 'note',
    title,
    content,
    category,
    favorite,
    description: content.substring(0, 100) + (content.length > 100 ? '...' : '')
  });

  form.reset();
  toggleModal('addNoteModal', false);
}
