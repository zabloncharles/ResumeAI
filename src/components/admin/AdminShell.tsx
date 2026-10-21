import { useState, type ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopBar from "./AdminTopBar";

type AdminShellProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export default function AdminShell({
  children,
  title,
  description,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex">
      <AdminSidebar
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <AdminTopBar
          title={title}
          description={description}
          onMenuClick={() => setSidebarOpen((open) => !open)}
        />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="w-full flex flex-col flex-1 min-h-0 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
