// DataVault UI Utilities Module

/**
 * Show a toast notification on screen
 * @param {string} message - Message text
 * @param {'success'|'error'|'info'} type - Toast type
 */
export function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconMap = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span>${iconMap[type] || 'ℹ️'}</span>
    <span class="text-sm font-medium">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * Toggle Modal display
 * @param {string} modalId - Element ID of modal
 * @param {boolean} show - Show or hide
 */
export function toggleModal(modalId, show = true) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  if (show) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Toggle Theme (Dark / Light)
 * @param {'dark'|'light'|null} themeName 
 */
export function setTheme(themeName) {
  const current = themeName || (document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', current);
  localStorage.setItem('datavault_theme', current);
  
  const themeToggles = document.querySelectorAll('.theme-toggle-icon');
  themeToggles.forEach(icon => {
    icon.textContent = current === 'dark' ? '☀️' : '🌙';
  });
}

/**
 * Initialize theme preference from localStorage or system preference
 */
export function initTheme() {
  const savedTheme = localStorage.getItem('datavault_theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setTheme('dark');
  } else {
    setTheme('light');
  }
}

/**
 * Format timestamp to human readable date
 * @param {Date|Object|number} timestamp 
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'Just now';
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date();
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
