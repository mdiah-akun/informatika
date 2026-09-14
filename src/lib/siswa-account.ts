export const SISWA_EMAIL_DOMAIN = "smp14trk.sch.id";

/** Email login siswa dibuat dari NISN, mis. "0091234501" ->
 *  "0091234501@smp14trk.sch.id". Password awal akun yang dibuat lewat
 *  fitur import juga memakai NISN yang sama (praktik umum sekolah --
 *  siswa sudah pasti tahu NISN-nya sendiri). */
export function buildSiswaEmail(nisn: string): string {
  return `${nisn}@${SISWA_EMAIL_DOMAIN}`;
}
