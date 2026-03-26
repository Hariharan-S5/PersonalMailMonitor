/**
 * Formats a YYYY-MM-DD string into DD/MM/YYYY.
 * @param {string} dateStr 
 * @returns {string}
 */
export const formatFilterDate = (dateStr) => {
  if (!dateStr) return '??/??/????';
  
  // Handle datetime-local format: YYYY-MM-DDTHH:MM
  const [datePart, timePart] = dateStr.includes('T') ? dateStr.split('T') : [dateStr, ''];
  const parts = datePart.split('-');
  
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const formattedDate = `${d}/${m}/${y}`;
  
  return timePart ? `${formattedDate} ${timePart}` : formattedDate;
};

export const getPresetDateRange = (preset) => {
  if (preset === 'all') return 'All Time';

  const now = new Date();
  let afterDate = null;
  let beforeDate = new Date();

  if (preset === 'today') {
    afterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (preset === '24h') {
    afterDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  } else if (preset === 'yesterday') {
    afterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    beforeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
  } else if (preset === 'day_before') {
    afterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
    beforeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 23, 59, 59, 999);
  } else if (preset === 'this_week') {
    afterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  } else if (preset === 'last_week') {
    const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    afterDate = new Date(startOfThisWeek);
    afterDate.setDate(afterDate.getDate() - 7);
    beforeDate = new Date(startOfThisWeek.getTime() - 1);
  } else if (preset === 'this_month') {
    afterDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (preset === 'last_month') {
    afterDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    beforeDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (preset === 'this_quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    afterDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
  } else if (preset === 'last_quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    afterDate = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
    beforeDate = new Date(now.getFullYear(), currentQuarter * 3, 0, 23, 59, 59, 999);
  } else if (preset === 'this_year') {
    afterDate = new Date(now.getFullYear(), 0, 1);
  } else if (preset === 'last_year') {
    afterDate = new Date(now.getFullYear() - 1, 0, 1);
    beforeDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  } else {
    const map = { 
      '1d': 1, '2d': 2, '3d': 3, '7d': 7, '14d': 14, '30d': 30, 
      '1m': 30, '90d': 90, 'qm': 90, '180d': 180, '365d': 365 
    };
    const days = map[preset] || 0;
    if (days > 0) {
      afterDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }
  }

  const format = (d) => {
    if (!d) return '??/??/????';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  };

  return `${format(afterDate)} to ${format(beforeDate)}`;
};
