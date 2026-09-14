import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/DashboardShell";

export default async function EbookLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <DashboardShell role={profile?.role === "admin" ? "admin" : "siswa"} nama={profile?.nama || user.email || ""}>
      <div className="px-3 md:px-6 py-8">{children}</div>
    </DashboardShell>
  );
}
