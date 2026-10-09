import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { auth } from '@/lib/auth/config';

export async function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-50">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        <Topbar
          user={{
            name: session?.user?.name,
            email: session?.user?.email,
          }}
        />
        <main className="flex-1 bg-muted/20">{children}</main>
      </div>
    </div>
  );
}