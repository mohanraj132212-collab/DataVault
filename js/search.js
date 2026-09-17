// DataVault Search & Filter Module

/**
 * Filter items array based on query text and active filter pill
 * @param {Array} items - List of item objects from Firestore
 * @param {string} query - Search term
 * @param {string} activeFilter - Active pill ('all'|'document'|'photo'|'note'|'book'|'visiting-card'|'favorite')
 * @returns {Array} Filtered list
 */
export function filterVaultItems(items = [], query = '', activeFilter = 'all') {
  let filtered = [...items];

  // Category & Favorites Pill Filter
  if (activeFilter !== 'all') {
    if (activeFilter === 'favorite') {
      filtered = filtered.filter(item => Boolean(item.favorite));
    } else {
      filtered = filtered.filter(item => item.type === activeFilter);
    }
  }

  // Keyword Search Text Query Filter
  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(item => {
      const matchTitle = item.title && item.title.toLowerCase().includes(q);
      const matchCategory = item.category && item.category.toLowerCase().includes(q);
      const matchDesc = item.description && item.description.toLowerCase().includes(q);
      const matchCompany = item.company && item.company.toLowerCase().includes(q);
      const matchPerson = item.personName && item.personName.toLowerCase().includes(q);
      const matchAuthor = item.author && item.author.toLowerCase().includes(q);
      const matchContent = item.content && item.content.toLowerCase().includes(q);

      return matchTitle || matchCategory || matchDesc || matchCompany || matchPerson || matchAuthor || matchContent;
    });
  }

  return filtered;
}
