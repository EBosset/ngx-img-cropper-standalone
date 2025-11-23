import { Injectable } from '@angular/core';

export interface CompressedImage {
  base64: string;
  width: number;
  height: number;
}

// Petit service injectable qui encapsule le redimensionnement et la compression JPEG
// afin que le composant de dialogue reste centré sur l'interface et que la logique soit réutilisable
@Injectable({ providedIn: 'root' })
export class ImageCompressionService {
  async compressImage(base64: string, maxWidth: number = 800, quality: number = 0.85): Promise<CompressedImage> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);

          resolve({
            base64: compressedBase64,
            width,
            height,
          });
        }
      };
    });
  }
}
