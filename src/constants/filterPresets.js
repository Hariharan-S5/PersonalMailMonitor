/**
 * Shared data for Ecosystem Filter presets.
 * Labels and IDs only; icons are handled at the component level.
 */
export const FILTER_PRESETS = [
  { id: 'today', label: 'Today', desc: 'Current calendar day' },
  { id: '24h', label: 'Last 24 Hours', desc: 'Within past 24 hours' },
  { id: 'yesterday', label: 'Yesterday', desc: 'Previous calendar day' },
  { id: 'day_before', label: 'Day before yesterday', desc: '2 days ago' },
  { id: '3d', label: 'Last 3 Days', desc: 'Past 72 hours' },
  { id: '7d', label: 'Last 7 Days', desc: 'Past week' },
  { id: '14d', label: 'Last 14 Days', desc: 'Past 2 weeks' },
  { id: '30d', label: 'Last 30 Days', desc: 'Past 30 days' },
  { id: 'this_week', label: 'This Week', desc: 'Start of current week to now' },
  { id: 'last_week', label: 'Last Week', desc: 'Previous calendar week' },
  { id: 'this_month', label: 'This Month', desc: 'Start of current month to now' },
  { id: 'last_month', label: 'Last Month', desc: 'Previous calendar month' },
  { id: 'this_quarter', label: 'This Quarter', desc: 'Current quarter' },
  { id: 'last_quarter', label: 'Last Quarter', desc: 'Previous quarter' },
  { id: 'this_year', label: 'This Year', desc: 'Start of current year to now' },
  { id: 'last_year', label: 'Last Year', desc: 'Previous calendar year' },
  { id: '90d', label: 'Past 90 Days', desc: 'Past 3 months' },
  { id: '180d', label: 'Past 180 Days', desc: 'Past 6 months' },
  { id: '365d', label: 'Past 365 Days', desc: 'Past year' },
  { id: 'all', label: 'All Time', icon: 'Infinity', desc: 'No date limit' },
];

export const getPresetLabel = (id) => {
  return FILTER_PRESETS.find(p => p.id === id)?.label || 'Filter Sync';
};
