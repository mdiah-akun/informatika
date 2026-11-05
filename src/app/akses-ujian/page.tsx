import AksesUjianClient from "@/components/AksesUjianClient";
import { URL_UJIAN } from "@/lib/link-ujian";

export default function AksesUjianPage() {
  return <AksesUjianClient urlUjian={URL_UJIAN} />;
}
