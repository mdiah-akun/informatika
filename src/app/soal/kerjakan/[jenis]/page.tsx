import { notFound } from "next/navigation";
import SoalKerjakanClient from "@/components/SoalKerjakanClient";
import type { SoalJenis } from "@/types/soal";

const JENIS_VALID: SoalJenis[] = ["harian", "sts", "sas"];

export default async function SoalKerjakanPage({ params }: { params: Promise<{ jenis: string }> }) {
  const { jenis } = await params;
  if (!JENIS_VALID.includes(jenis as SoalJenis)) {
    notFound();
  }

  return <SoalKerjakanClient jenis={jenis as SoalJenis} />;
}
