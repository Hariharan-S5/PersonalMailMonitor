import { 
  Zap, 
  User, 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  ShieldAlert, 
  Inbox, 
  SendHorizontal 
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', path: '/overview', icon: Zap, label: 'Overview' },
  { id: 'personal', path: '/personal', icon: User, label: 'Personal' },
  { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Job Monitor', restricted: 'Pro' },
  { id: 'hr-tracker', path: '/hr-tracker', icon: Users, label: 'HR Monitor', restricted: 'Elite' },
  { id: 'business-analytics', path: '/business-analytics', icon: Sparkles, label: 'Business Analytics', restricted: 'Pro' },
  { id: 'alerts-center', path: '/alerts-center', icon: ShieldAlert, label: 'Alerts Center', restricted: 'Elite' },
  { id: 'inbox', path: '/inbox', icon: Inbox, label: 'Incoming' },
  { id: 'sent', path: '/sent', icon: SendHorizontal, label: 'Outgoing' },
];
