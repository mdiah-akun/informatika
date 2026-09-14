"use client";

import { useState } from "react";
import SidebarNav from "@/components/SidebarNav";
import TopBar from "@/components/TopBar";
import { PageHeaderProvider } from "@/lib/page-header-context";

export default function DashboardShell({
  role,
  nama,
  children,
}: {
  role: "admin" | "siswa";
  nama: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <PageHeaderProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
        <SidebarNav role={role} collapsed={collapsed} />
        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar nama={nama} role={role} collapsed={collapsed} onToggleSidebar={() => setCollapsed((v) => !v)} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </PageHeaderProvider>
  );
}
