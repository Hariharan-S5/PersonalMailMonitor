import { useEmailStore } from '../store/useEmailStore';

/**
 * Hook to access global date filter state and helpers for a specific page.
 *
 * @param {string} pageId - The page identifier (matches NAV_ITEMS id, e.g. 'overview', 'inbox')
 * @returns {{ isActive: boolean, filterEmails: (emails: any[]) => any[], globalDateFilter: object }}
 */
export const useGlobalDateFilter = (pageId) => {
  const globalDateFilter = useEmailStore((s) => s.globalDateFilter);

  const isActive = () => {
    const pages = globalDateFilter.selectedPages || ['all'];
    return pages.includes('all') || pages.includes(pageId);
  };

  /**
   * Filters an array of email objects by the current global date range.
   * Returns the "Last 7 Days" fallback if the filter is not active for this page.
   */
  const filterEmails = (emails = []) => {
    const pages = globalDateFilter.selectedPages || ['all'];
    // Explicitly exclude 'plans' from any synchronization as per user requirement
    const isSynchronized = pageId !== 'plans' && (pages.includes('all') || pages.includes(pageId));
    
    // Default system filter if this page isn't part of the synchronized ecosystem
    const activeFilter = isSynchronized ? globalDateFilter : { type: 'preset', preset: '3d' };

    const { type, preset, mode, startDate, endDate } = activeFilter;

    if (type === 'preset') {
      if (preset === 'all') return emails;

      const now = new Date();
      let start = new Date();
      let end = new Date();

      switch (preset) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          break;
        case '24h':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'yesterday':
          start.setDate(now.getDate() - 1);
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
          break;
        case 'day_before':
          start.setDate(now.getDate() - 2);
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
          break;
        case '3d': case '7d': case '14d': case '30d': case '90d': case '180d': case '365d':
          const daysMap = { '3d': 3, '7d': 7, '14d': 14, '30d': 30, '90d': 90, '180d': 180, '365d': 365 };
          start = new Date(now.getTime() - daysMap[preset] * 24 * 60 * 60 * 1000);
          break;
        case 'this_week':
          const dayOfWeek = now.getDay() || 7; // 1 (Mon) to 7 (Sun)
          start.setDate(now.getDate() - dayOfWeek + 1);
          start.setHours(0, 0, 0, 0);
          break;
        case 'last_week':
          const lastWeekDay = now.getDay() || 7;
          start.setDate(now.getDate() - lastWeekDay - 6);
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          break;
        case 'this_month':
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          break;
        case 'last_month':
          start.setMonth(now.getMonth() - 1);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case 'this_quarter':
          const thisQuarter = Math.floor(now.getMonth() / 3);
          start.setMonth(thisQuarter * 3);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          break;
        case 'last_quarter':
          const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
          start.setMonth(lastQuarter * 3);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case 'this_year':
          start.setMonth(0, 1);
          start.setHours(0, 0, 0, 0);
          break;
        case 'last_year':
          start.setFullYear(now.getFullYear() - 1, 0, 1);
          start.setHours(0, 0, 0, 0);
          end = new Date(now.getFullYear() - 1, 11, 31);
          end.setHours(23, 59, 59, 999);
          break;
        default:
          start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // Fallback
      }

      return emails.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
    }

    return emails;
  };

  return { isActive: isActive(), filterEmails, globalDateFilter };
};
