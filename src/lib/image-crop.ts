/** Resize + center-crop gambar ke ukuran tetap sebelum diunggah, supaya
 *  gambar sampul materi tidak kebesaran (baik dimensi maupun ukuran file)
 *  dan seragam bentuknya di kartu daftar materi. */
export function cropImageToBlob(
  file: File,
  targetWidth = 480,
  targetHeight = 360
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const targetRatio = targetWidth / targetHeight;
      const sourceRatio = img.width / img.height;

      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;

      if (sourceRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas tidak didukung di browser ini."));
        return;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Gagal memproses gambar."))),
        "image/jpeg",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal membaca gambar."));
    };

    img.src = objectUrl;
  });
}
