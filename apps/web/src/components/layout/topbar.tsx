'use client';

import { Bell, Search, Menu, LogOut, User, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { signOutAction } from '@/app/actions/auth';
import { Sidebar } from './sidebar';

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function Topbar({ user }: TopbarProps) {
  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 md:px-6">
      {/* Mobile menu button */}
      <Sheet>
        <SheetTrigger
          render={
            <button
              type="button"
              aria-label="Open menu"
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
          }
        />
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:bg-background"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="User menu"
                className="relative h-9 w-9 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user?.name || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user?.email || 'Not signed in'}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}