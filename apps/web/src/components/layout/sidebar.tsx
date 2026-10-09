'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  Activity,
  DollarSign,
  FileText,
  Key,
  Webhook,
  Settings,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Overview', href: '/', icon: BarChart3 },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Metrics', href: '/metrics', icon: Activity },
  { name: 'Pricing', href: '/pricing', icon: DollarSign },
  { name: 'API Keys', href: '/api-keys', icon: Key },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">
            MeterFlow
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">© 2026 MeterFlow</p>
      </div>
    </aside>
  );
}