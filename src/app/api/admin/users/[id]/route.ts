import { NextResponse } from "next/server";
import { requireAdminUser, createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabaseAdmin = createAdminClient();

  if (body.role !== undefined) {
    if (body.role !== "admin" && body.role !== "siswa") {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }
    if (id === admin.id && body.role !== "admin") {
      return NextResponse.json(
        { error: "Tidak bisa menurunkan role akun sendiri. Minta admin lain melakukannya." },
        { status: 400 }
      );
    }
    const { error } = await supabaseAdmin.from("profiles").update({ role: body.role }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (body.banned !== undefined) {
    if (id === admin.id && body.banned) {
      return NextResponse.json({ error: "Tidak bisa menonaktifkan akun sendiri." }, { status: 400 });
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: body.banned ? "876000h" : "none",
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: body.password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri." }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
