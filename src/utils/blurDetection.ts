export async function calculateBlurriness(base64Url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const gray = new Float32Array(img.width * img.height);
      // Convert to grayscale
      for (let i = 0; i < img.width * img.height; i++) {
        const r = imageData.data[i * 4];
        const g = imageData.data[i * 4 + 1];
        const b = imageData.data[i * 4 + 2];
        gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      }
      // Laplacian kernel
      const kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
      const laplacian = new Float32Array(img.width * img.height);
      for (let y = 1; y < img.height - 1; y++) {
        for (let x = 1; x < img.width - 1; x++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const px = x + kx;
              const py = y + ky;
              const weight = kernel[(ky + 1) * 3 + (kx + 1)];
              sum += gray[py * img.width + px] * weight;
            }
          }
          laplacian[y * img.width + x] = sum;
        }
      }
      // Calculate variance of Laplacian
      let mean = 0;
      let count = 0;
      for (let i = 0; i < laplacian.length; i++) {
        mean += laplacian[i];
        count++;
      }
      mean /= count;
      let variance = 0;
      for (let i = 0; i < laplacian.length; i++) {
        variance += (laplacian[i] - mean) ** 2;
      }
      variance /= count;
      resolve(variance);
    };
    img.onerror = (err) => reject(err);
    img.src = base64Url;
  });
}
