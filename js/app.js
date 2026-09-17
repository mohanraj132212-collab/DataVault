// DataVault App Bootstrap & Entry Point
import { initAuthListener, logoutUser } from './auth.js';
import { initTheme, setTheme, toggleModal } from './ui.js';
import { initDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('[DataVault] Service Worker Registered', reg.scope))
      .catch(err => console.warn('[DataVault] Service Worker Registration Failed:', err));
  }

  // Initialize Theme System
  initTheme();

  // Attach global theme toggle button clicks
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => setTheme());
  });

  // Attach Settings modal triggers
  document.querySelectorAll('[data-action="open-settings"]').forEach(btn => {
    btn.addEventListener('click', () => toggleModal('settingsModal', true));
  });

  // Attach Logout triggers
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', () => logoutUser());
  });

  // Modal dismiss buttons
  document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) toggleModal(modal.id, false);
    });
  });

  // Close modals when clicking overlay background
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) toggleModal(overlay.id, false);
    });
  });

  // Initialize Auth protection & page binding
  const isDashboardPage = window.location.pathname.endsWith('dashboard.html');

  initAuthListener((user) => {
    if (user && isDashboardPage) {
      initDashboard(user);
    }
  }, isDashboardPage);
});
