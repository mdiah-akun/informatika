import { notFound } from "next/navigation";
import SoalEssaiKerjakanClient from "@/components/SoalEssaiKerjakanClient";
import type { SoalJenis } from "@/types/soal";

const JENIS_VALID: SoalJenis[] = ["harian", "sts", "sas"];

export default async function SoalEssaiKerjakanPage({ params }: { params: Promise<{ jenis: string }> }) {
  const { jenis } = await params;
  if (!JENIS_VALID.includes(jenis as SoalJenis)) {
    notFound();
  }

  return <SoalEssaiKerjakanClient jenis={jenis as SoalJenis} />;
}
