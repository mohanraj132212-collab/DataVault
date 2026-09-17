// DataVault Dashboard Controller Module
import { subscribeUserItems, toggleItemFavorite, deleteVaultItem, addVaultItem } from './items.js';
import { uploadToCloudinary } from './upload.js';
import { handleNoteSubmit } from './notes.js';
import { handleVisitingCardSubmit, renderVisitingCardHTML } from './visiting-card.js';
import { filterVaultItems } from './search.js';
import { showToast, toggleModal, formatDate } from './ui.js';
import { getCloudinaryConfig, saveCloudinaryConfig, auth } from './firebase-config.js';

let allItems = [];
let currentFilter = 'all';
let currentSearchQuery = '';
let activeSelectedItem = null;

/**
 * Initialize Dashboard UI and Firestore Subscription
 */
export function initDashboard(user) {
  setGreeting(user.displayName || "User");
  
  // Populate User Profile Header
  const avatarEl = document.getElementById('userAvatar');
  if (avatarEl) {
    const initials = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
    avatarEl.textContent = initials;
  }

  // Populate Settings Info
  const profileNameEl = document.getElementById('settingsProfileName');
  const profileEmailEl = document.getElementById('settingsProfileEmail');
  if (profileNameEl) profileNameEl.textContent = user.displayName || 'Vault User';
  if (profileEmailEl) profileEmailEl.textContent = user.email || '';

  const cloudConfig = getCloudinaryConfig();
  const cloudNameInput = document.getElementById('cloudNameInput');
  const uploadPresetInput = document.getElementById('uploadPresetInput');
  if (cloudNameInput) cloudNameInput.value = cloudConfig.cloudName === "YOUR_CLOUD_NAME" ? "" : cloudConfig.cloudName;
  if (uploadPresetInput) uploadPresetInput.value = cloudConfig.uploadPreset === "YOUR_UNSIGNED_UPLOAD_PRESET" ? "" : cloudConfig.uploadPreset;

  // Realtime listener for Firestore items
  subscribeUserItems((items) => {
    allItems = items;
    updateStats(items);
    renderDashboardItems();
  });

  setupEventListeners();
}

/**
 * Calculate dynamic greeting text based on time of day
 */
function setGreeting(name) {
  const greetingEl = document.getElementById('userGreeting');
  if (!greetingEl) return;

  const hour = new Date().getHours();
  let timeStr = "Good Morning";
  if (hour >= 12 && hour < 17) timeStr = "Good Afternoon";
  if (hour >= 17) timeStr = "Good Evening";

  greetingEl.textContent = `${timeStr}, ${name} 👋`;
}

/**
 * Update summary counters
 */
function updateStats(items) {
  const totalEl = document.getElementById('statTotal');
  const docsEl = document.getElementById('statDocs');
  const photosEl = document.getElementById('statPhotos');
  const notesEl = document.getElementById('statNotes');
  const booksEl = document.getElementById('statBooks');
  const cardsEl = document.getElementById('statCards');

  const count = (type) => items.filter(i => i.type === type).length;

  if (totalEl) totalEl.textContent = items.length;
  if (docsEl) docsEl.textContent = count('document');
  if (photosEl) photosEl.textContent = count('photo');
  if (notesEl) notesEl.textContent = count('note');
  if (booksEl) booksEl.textContent = count('book');
  if (cardsEl) cardsEl.textContent = count('visiting-card');

  // Update category card counts
  document.querySelectorAll('.category-card').forEach(card => {
    const catType = card.getAttribute('data-category-type');
    const countSpan = card.querySelector('.category-count');
    if (catType && countSpan) {
      countSpan.textContent = `${count(catType)} items`;
    }
  });
}

/**
 * Render main filtered items grid
 */

function renderDashboardItems() {
  const grid = document.getElementById('itemsGrid');
  if (!grid) return;

  const filtered = filterVaultItems(allItems, currentSearchQuery, currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🔒</div>
        <div class="empty-state-title">No items found</div>
        <div class="empty-state-desc">Your vault is clean. Click the + button below to add your first item to DataVault.</div>
        <button class="btn btn-primary" onclick="document.getElementById('fabMain').click()">Add First Item</button>
      </div>
    `;
    return;
  }

  const iconMap = {
    'document': '📄',
    'photo': '🖼️',
    'note': '📝',
    'book': '📚',
    'visiting-card': '💼'
  };

  grid.innerHTML = filtered.map(item => `
    <div class="vault-item-card" data-id="${item.id}">
      <div class="item-thumb">
        ${item.fileUrl && (item.fileType?.includes('image') || item.type === 'photo' || item.type === 'visiting-card' || item.type === 'book') ? `
          <img src="${item.fileUrl}" alt="${item.title}" loading="lazy" />
        ` : `
          <span class="item-thumb-placeholder">${iconMap[item.type] || '📁'}</span>
        `}
        <span class="item-badge">${item.category || item.type}</span>
        <button class="fav-btn ${item.favorite ? 'active' : ''}" data-fav-id="${item.id}">
          ${item.favorite ? '⭐' : '☆'}
        </button>
      </div>

      <div class="item-content">
        <div class="item-title">${item.title}</div>
        <div class="item-desc">${item.description || item.content || 'No details provided'}</div>
        
        <div class="item-footer">
          <span>${formatDate(item.createdAt)}</span>
          <span style="text-transform: capitalize; font-weight:600; color:var(--primary)">${item.type}</span>
        </div>
      </div>
    </div>
  `).join('');

  // Event Delegation for Item Click & Favorites
  grid.querySelectorAll('.vault-item-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.fav-btn');
      if (favBtn) {
        e.stopPropagation();
        const id = favBtn.getAttribute('data-fav-id');
        const item = allItems.find(i => i.id === id);
        if (item) toggleItemFavorite(id, item.favorite);
        return;
      }

      const itemId = card.getAttribute('data-id');
      const item = allItems.find(i => i.id === itemId);
      if (item) openItemDetailModal(item);
    });
  });
}

/**
 * Open Item Detail View Modal
 */
function openItemDetailModal(item) {
  activeSelectedItem = item;
  const modal = document.getElementById('itemDetailModal');
  if (!modal) return;

  const body = document.getElementById('itemDetailBody');
  const iconMap = { 'document': '📄', 'photo': '🖼️', 'note': '📝', 'book': '📚', 'visiting-card': '💼' };

  let previewHTML = '';
  if (item.type === 'visiting-card') {
    previewHTML = renderVisitingCardHTML(item);
  } else if (item.fileUrl) {
    if (item.fileType?.includes('pdf') || item.fileUrl.endsWith('.pdf')) {
      previewHTML = `
        <div style="background:var(--surface-secondary); padding:24px; border-radius:12px; text-align:center;">
          <div style="font-size:3rem; margin-bottom:12px;">📄</div>
          <div style="font-weight:700; margin-bottom:12px;">PDF Document</div>
          <a href="${item.fileUrl}" target="_blank" class="btn btn-outline">
            Open / Download PDF ↗
          </a>
        </div>
      `;
    } else {
      previewHTML = `
        <div style="position:relative; cursor:pointer;" id="previewImageTrigger">
          <img src="${item.fileUrl}" alt="${item.title}" style="width:100%; max-height:280px; object-fit:cover; border-radius:12px;" />
          <div style="position:absolute; bottom:12px; right:12px; background:rgba(0,0,0,0.7); color:#fff; padding:4px 10px; border-radius:20px; font-size:0.75rem;">🔍 Click to Zoom</div>
        </div>
      `;
    }
  }

  body.innerHTML = `
    ${previewHTML}
    <div style="margin-top:20px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <span style="font-size:1.2rem;">${iconMap[item.type] || '📁'}</span>
        <span class="item-badge" style="position:static;">${item.category || item.type}</span>
        <span style="margin-left:auto; font-size:0.8rem; color:var(--text-muted);">${formatDate(item.createdAt)}</span>
      </div>
      
      <h3 style="font-size:1.3rem; font-weight:800; margin-bottom:8px;">${item.title}</h3>
      
      ${item.author ? `<p style="font-weight:600; color:var(--primary); margin-bottom:8px;">By ${item.author}</p>` : ''}
      
      <div style="background:var(--surface-secondary); padding:14px; border-radius:12px; font-size:0.92rem; white-space:pre-wrap; color:var(--text-primary); margin-bottom:16px;">
        ${item.content || item.description || 'No description added.'}
      </div>
    </div>
  `;

  const zoomTrigger = body.querySelector('#previewImageTrigger');
  if (zoomTrigger && item.fileUrl) {
    zoomTrigger.addEventListener('click', () => {
      openFullscreenImageViewer(item.fileUrl, item.title);
    });
  }

  toggleModal('itemDetailModal', true);
}

/**
 * Open full-screen zoomable image viewer
 */
function openFullscreenImageViewer(url, title) {
  const viewer = document.getElementById('fullscreenImageViewer');
  const img = document.getElementById('fullscreenImage');
  const titleEl = document.getElementById('fullscreenTitle');
  const downloadBtn = document.getElementById('fullscreenDownload');

  if (viewer && img) {
    img.src = url;
    if (titleEl) titleEl.textContent = title || 'Vault Photo';
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = title || 'vault-image';
        a.target = '_blank';
        a.click();
      };
    }
    viewer.classList.add('active');
  }
}

/**
 * Attach Event Listeners for search, speed dial, forms, theme, modals
 */
function setupEventListeners() {
  // Search Input Handler
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderDashboardItems();
    });
  }

  // Category Filter Pills
  document.querySelectorAll('.pill-btn').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter') || 'all';
      renderDashboardItems();
    });
  });

  // FAB Speed Dial Toggle
  const fabMain = document.getElementById('fabMain');
  const fabContainer = document.getElementById('fabContainer');
  if (fabMain && fabContainer) {
    fabMain.addEventListener('click', () => {
      fabContainer.classList.toggle('active');
    });
  }

  // Upload Document / Photo Modal Trigger
  const openUploadModal = (type) => {
    const modalTitle = document.getElementById('uploadModalTitle');
    const typeInput = document.getElementById('uploadItemType');
    if (modalTitle) modalTitle.textContent = type === 'document' ? 'Upload Document 📄' : 'Upload Photo 🖼️';
    if (typeInput) typeInput.value = type;

    // Subcategory select options
    const catSelect = document.getElementById('uploadSubcategorySelect');
    if (catSelect) {
      if (type === 'document') {
        catSelect.innerHTML = `
          <option value="Aadhaar Card">Aadhaar Card</option>
          <option value="PAN Card">PAN Card</option>
          <option value="Driving Licence">Driving Licence</option>
          <option value="Voter ID">Voter ID</option>
          <option value="Passport">Passport</option>
          <option value="College ID">College ID</option>
          <option value="Certificates">Certificates</option>
          <option value="Mark Sheets">Mark Sheets</option>
          <option value="Insurance">Insurance</option>
          <option value="Other" selected>Other</option>
        `;
      } else {
        catSelect.innerHTML = `
          <option value="Personal">Personal</option>
          <option value="Family">Family</option>
          <option value="College">College</option>
          <option value="Memories">Memories</option>
          <option value="Important">Important</option>
          <option value="Other" selected>Other</option>
        `;
      }
    }

    if (fabContainer) fabContainer.classList.remove('active');
    toggleModal('uploadMediaModal', true);
  };

  document.querySelectorAll('[data-action="add-doc"]').forEach(b => b.addEventListener('click', () => openUploadModal('document')));
  document.querySelectorAll('[data-action="add-photo"]').forEach(b => b.addEventListener('click', () => openUploadModal('photo')));
  document.querySelectorAll('[data-action="add-note"]').forEach(b => {
    b.addEventListener('click', () => {
      if (fabContainer) fabContainer.classList.remove('active');
      toggleModal('addNoteModal', true);
    });
  });
  document.querySelectorAll('[data-action="add-book"]').forEach(b => {
    b.addEventListener('click', () => {
      if (fabContainer) fabContainer.classList.remove('active');
      toggleModal('addBookModal', true);
    });
  });
  document.querySelectorAll('[data-action="add-vc"]').forEach(b => {
    b.addEventListener('click', () => {
      if (fabContainer) fabContainer.classList.remove('active');
      toggleModal('addVisitingCardModal', true);
    });
  });

  // Media File Upload Form Handler
  const uploadForm = document.getElementById('uploadMediaForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('uploadFileInput');
      const file = fileInput?.files[0];
      const title = document.getElementById('uploadTitleInput').value.trim();
      const type = document.getElementById('uploadItemType').value;
      const category = document.getElementById('uploadSubcategorySelect').value;
      const description = document.getElementById('uploadDescInput').value.trim();

      if (!file || !title) {
        showToast("Please select a file and enter a title.", "error");
        return;
      }

      const progressContainer = document.getElementById('uploadProgressContainer');
      const progressBar = document.getElementById('uploadProgressBar');
      if (progressContainer) progressContainer.style.display = 'block';

      try {
        const uploadResult = await uploadToCloudinary(file, (percent) => {
          if (progressBar) progressBar.style.width = `${percent}%`;
        });

        await addVaultItem({
          type: type || 'document',
          category,
          title,
          description,
          fileUrl: uploadResult.url,
          publicId: uploadResult.publicId,
          fileType: file.type
        });

        uploadForm.reset();
        if (progressContainer) progressContainer.style.display = 'none';
        toggleModal('uploadMediaModal', false);
      } catch (err) {
        if (progressContainer) progressContainer.style.display = 'none';
      }
    });
  }

  // Note Form Handler
  const noteForm = document.getElementById('addNoteForm');
  if (noteForm) {
    noteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleNoteSubmit(noteForm);
    });
  }

  // Visiting Card Form Handler
  const vcForm = document.getElementById('addVisitingCardForm');
  if (vcForm) {
    vcForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const vcFileInput = document.getElementById('vcCardImageInput');
      const vcFile = vcFileInput?.files[0];

      let fileUrl = '';
      let publicId = '';

      if (vcFile) {
        try {
          const res = await uploadToCloudinary(vcFile);
          fileUrl = res.url;
          publicId = res.publicId;
        } catch (_) {}
      }

      await handleVisitingCardSubmit(vcForm, fileUrl, publicId);
    });
  }

  // Book Form Handler
  const bookForm = document.getElementById('addBookForm');
  if (bookForm) {
    bookForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('bookNameInput').value.trim();
      const author = document.getElementById('bookAuthorInput').value.trim();
      const category = document.getElementById('bookCategoryInput').value.trim() || 'Books';
      const description = document.getElementById('bookDescInput').value.trim();
      const coverFileInput = document.getElementById('bookCoverInput');
      const coverFile = coverFileInput?.files[0];

      if (!title || !author) {
        showToast("Book title and author are required.", "error");
        return;
      }

      let fileUrl = '';
      let publicId = '';
      if (coverFile) {
        try {
          const res = await uploadToCloudinary(coverFile);
          fileUrl = res.url;
          publicId = res.publicId;
        } catch (_) {}
      }

      await addVaultItem({
        type: 'book',
        title,
        author,
        category,
        description,
        fileUrl,
        publicId
      });

      bookForm.reset();
      toggleModal('addBookModal', false);
    });
  }

  // Settings Cloudinary Form Save
  const saveCloudBtn = document.getElementById('saveCloudinarySettingsBtn');
  if (saveCloudBtn) {
    saveCloudBtn.addEventListener('click', () => {
      const cloudName = document.getElementById('cloudNameInput').value;
      const uploadPreset = document.getElementById('uploadPresetInput').value;
      saveCloudinaryConfig(cloudName, uploadPreset);
      showToast("Cloudinary settings updated successfully!", "success");
      toggleModal('settingsModal', false);
    });
  }

  // Delete Active Item Button Trigger
  const deleteBtn = document.getElementById('deleteItemBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!activeSelectedItem) return;
      toggleModal('itemDetailModal', false);
      toggleModal('deleteConfirmModal', true);
    });
  }

  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (activeSelectedItem) {
        await deleteVaultItem(activeSelectedItem.id);
        toggleModal('deleteConfirmModal', false);
        activeSelectedItem = null;
      }
    });
  }

  // Fullscreen Viewer Close
  const closeViewerBtn = document.getElementById('closeFullscreenViewer');
  if (closeViewerBtn) {
    closeViewerBtn.addEventListener('click', () => {
      document.getElementById('fullscreenImageViewer')?.classList.remove('active');
    });
  }
}
