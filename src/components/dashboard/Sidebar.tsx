'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  Home,
  Settings,
  Wifi,
  CreditCard,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  children?: NavItem[];
  badge?: number;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: Home,
  },
  {
    href: '/dashboard/zones',
    label: 'Mes WiFi Zones',
    icon: Wifi,
    children: [
      { href: '/dashboard/zones', label: 'Liste des zones', icon: Wifi },
      { href: '/dashboard/zones/new', label: 'Ajouter une zone', icon: Plus },
    ],
  },
  {
    href: '/dashboard/transactions',
    label: 'Transactions',
    icon: CreditCard,
  },
  {
    href: '/dashboard/settings',
    label: 'Paramètres',
    icon: Settings,
  },
];

interface SidebarProps {
  children: React.ReactNode;
}

function NavItem({ item, pathname, onClick, isMobile = false, badge }: { item: NavItem; pathname: string; onClick?: () => void; isMobile?: boolean; badge?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = pathname === item.href;
  const hasActiveChild = item.children?.some(child => pathname === child.href);

  useEffect(() => {
    if (hasActiveChild) {
      setIsExpanded(true);
    }
  }, [hasActiveChild]);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            (isActive || hasActiveChild)
              ? 'bg-[#123B8B]/10 text-[#123B8B]'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <span className="flex items-center gap-3">
            <item.icon className="w-5 h-5" />
            {item.label}
            {item.badge && item.badge > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-amber-500 text-white rounded-full">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {isExpanded && (
          <ul className="ml-9 mt-1 space-y-1">
            {item.children.map((child) => (
              <li key={child.href}>
                {onClick ? (
                  <button
                    onClick={() => {
                      window.location.href = child.href;
                      onClick();
                    }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left',
                      pathname === child.href
                        ? 'text-[#81B545] font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <child.icon className="w-4 h-4" />
                    {child.label}
                  </button>
                ) : (
                  <Link
                    href={child.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                      pathname === child.href
                        ? 'text-[#81B545] font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <child.icon className="w-4 h-4" />
                    {child.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <>
      {onClick ? (
        <button
          onClick={() => {
            window.location.href = item.href;
            onClick();
          }}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left',
            isActive
              ? 'bg-[#123B8B] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <item.icon className="w-5 h-5" />
          {item.label}
        </button>
      ) : (
        <Link
          href={item.href}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive
              ? 'bg-[#123B8B] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <item.icon className="w-5 h-5" />
          {item.label}
        </Link>
      )}
    </>
  );
}

export function SidebarLayout({ children }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [zoneIds, setZoneIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(data);

          // Load zones for pending count
          const { data: zones } = await supabase
            .from('zones')
            .select('id')
            .eq('owner_id', user.id);
          const ids = zones?.map((z) => z.id) || [];
          setZoneIds(ids);

          // Fetch pending count
          if (ids.length > 0) {
            const { count } = await supabase
              .from('pending_requests')
              .select('*', { count: 'exact', head: true })
              .in('zone_id', ids)
              .eq('status', 'waiting_payment')
              .gt('expires_at', new Date().toISOString());
            setPendingCount(count || 0);
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    loadProfile();
  }, []);

  // Realtime subscription for pending requests
  useEffect(() => {
    if (zoneIds.length === 0) return;

    const supabase = createClient();
    const channel: RealtimeChannel = supabase
      .channel('sidebar_pending_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_requests',
          filter: `zone_id=in.(${zoneIds.join(',')})`,
        },
        async (payload) => {
          const request = payload.new as any;
          const oldRequest = payload.old as any;

          if (payload.eventType === 'INSERT') {
            if (request.status === 'waiting_payment' && new Date(request.expires_at) > new Date()) {
              setPendingCount((prev) => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            // If it was waiting and is no longer waiting, decrement
            if (oldRequest.status === 'waiting_payment' && request.status !== 'waiting_payment') {
              setPendingCount((prev) => Math.max(0, prev - 1));
            }
          } else if (payload.eventType === 'DELETE') {
            if (oldRequest.status === 'waiting_payment') {
              setPendingCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [zoneIds]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getPageTitle = () => {
    const activeItem = navItems.find(item => pathname === item.href);
    if (activeItem) return activeItem.label;

    const parentItem = navItems.find(item =>
      item.children?.some(child => pathname === child.href)
    );
    if (parentItem) return parentItem.label;

    return 'Tableau de bord';
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#123B8B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#123B8B] flex items-center justify-center">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">TicketWiFiZone</span>
          </Link>
          <div className="w-8" />
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 fixed h-screen bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#123B8B] flex items-center justify-center shadow-lg shadow-[#123B8B]/20">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 leading-tight">TicketWiFiZone</h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="mb-4">
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Principal
              </p>
              <div className="space-y-1">
                <NavItem item={navItems[0]} pathname={pathname} />
              </div>
            </div>

            <div className="mb-4">
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Gestion
              </p>
              <div className="space-y-1">
                {navItems.slice(1).map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    badge={item.href === '/dashboard/transactions' ? pendingCount : undefined}
                  />
                ))}
              </div>
            </div>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-100">
            {profile && (
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-[#81B545]/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-[#81B545]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile.business_name || 'Mon Business'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 bg-white shadow-xl flex flex-col">
              {/* Mobile header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#123B8B] flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">TicketWiFiZone</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onClick={() => setMobileMenuOpen(false)}
                    isMobile
                    badge={item.href === '/dashboard/transactions' ? pendingCount : undefined}
                  />
                ))}
              </nav>

              {/* Mobile user section */}
              <div className="p-4 border-t border-gray-100">
                {profile && (
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-[#81B545]/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#81B545]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {profile.business_name || 'Mon Business'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-screen pt-16 lg:pt-0">
          {/* Desktop header */}
          <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
            </div>
            {profile && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {profile.business_name || 'Mon Business'}
                  </p>
                  <p className="text-xs text-gray-500">{profile.city || 'Ouagadougou'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#81B545]/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#81B545]" />
                </div>
              </div>
            )}
          </header>

          {/* Page content */}
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
