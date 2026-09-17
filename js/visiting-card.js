// DataVault Visiting Cards Module
import { addVaultItem } from './items.js';
import { toggleModal, showToast } from './ui.js';

/**
 * Handle Visiting Card Form submission
 * @param {HTMLFormElement} form 
 * @param {string} fileUrl 
 * @param {string} publicId 
 */
export async function handleVisitingCardSubmit(form, fileUrl = '', publicId = '') {
  const personName = form.elements['vcPersonName'].value.trim();
  const company = form.elements['vcCompany'].value.trim();
  const designation = form.elements['vcDesignation'].value.trim();
  const phone = form.elements['vcPhone'].value.trim();
  const email = form.elements['vcEmail'].value.trim();
  const website = form.elements['vcWebsite'].value.trim();
  const notes = form.elements['vcNotes'].value.trim();

  if (!personName) {
    showToast("Please enter the person's name.", "error");
    return;
  }

  await addVaultItem({
    type: 'visiting-card',
    title: `${personName} - ${company || 'Visiting Card'}`,
    description: `${designation ? designation + ' at ' : ''}${company}`,
    personName,
    company,
    designation,
    phone,
    email,
    website,
    content: notes,
    fileUrl,
    publicId,
    category: 'Business'
  });

  form.reset();
  toggleModal('addVisitingCardModal', false);
}

/**
 * Render Digital Visiting Card HTML block
 * @param {Object} item 
 * @returns {string} HTML string
 */
export function renderVisitingCardHTML(item) {
  const safePhone = item.phone ? item.phone.replace(/[^0-9+]/g, '') : '';
  const webUrl = item.website ? (item.website.startsWith('http') ? item.website : `https://${item.website}`) : '';

  return `
    <div class="visiting-card-container">
      <div class="vc-header">
        <div>
          <div class="vc-name">${item.personName || item.title}</div>
          <div class="vc-title">${item.designation || 'Contact'}</div>
          <div class="vc-company">${item.company || ''}</div>
        </div>
        <div style="font-size:2rem">💼</div>
      </div>

      <div class="vc-actions">
        ${item.phone ? `
          <a href="tel:${safePhone}" class="vc-link-btn" title="Call ${item.personName}">
            <span>📞</span> <span>${item.phone}</span>
          </a>
        ` : ''}
        ${item.email ? `
          <a href="mailto:${item.email}" class="vc-link-btn" title="Email ${item.personName}">
            <span>✉️</span> <span>${item.email}</span>
          </a>
        ` : ''}
        ${item.website ? `
          <a href="${webUrl}" target="_blank" rel="noopener noreferrer" class="vc-link-btn" title="Visit Website">
            <span>🌐</span> <span>${item.website}</span>
          </a>
        ` : ''}
      </div>

      ${item.fileUrl ? `
        <div style="margin-top:16px; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,0.15)">
          <img src="${item.fileUrl}" alt="Card Image" style="width:100%; height:140px; object-fit:cover;" />
        </div>
      ` : ''}
    </div>
  `;
}
