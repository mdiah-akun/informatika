import AdminLinkUjianClient from "@/components/AdminLinkUjianClient";
import { URL_APLIKASI_PRODUKSI, URL_UJIAN } from "@/lib/link-ujian";

export default function AdminLinkUjianPage() {
  return <AdminLinkUjianClient urlUjian={URL_UJIAN} urlProduksi={URL_APLIKASI_PRODUKSI} />;
}
