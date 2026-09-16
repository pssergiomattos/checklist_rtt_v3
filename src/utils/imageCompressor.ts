export async function compressImage(
  file: File,
  index: number,
  stepName: string
): Promise<{ dataUrl: string; file: File }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = (err) => reject(err);

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = (err) => reject(err);

      img.onload = () => {
        const MAX_DIMENSION = 800;
        let drawW = img.width;
        let drawH = img.height;

        if (drawW > MAX_DIMENSION || drawH > MAX_DIMENSION) {
          if (drawW > drawH) {
            drawH = Math.round((drawH * MAX_DIMENSION) / drawW);
            drawW = MAX_DIMENSION;
          } else {
            drawW = Math.round((drawW * MAX_DIMENSION) / drawH);
            drawH = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = drawW;
        canvas.height = drawH;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, drawW, drawH);

        const quality = 0.6;
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha ao gerar blob de imagem'));
              return;
            }

            const prefixo = String(index).padStart(2, '0');
            const sanitizedName = stepName.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `${prefixo}_${sanitizedName}.jpg`;
            const finalFile = new File([blob], filename, { type: 'image/jpeg' });

            resolve({ dataUrl, file: finalFile });
          },
          'image/jpeg',
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export function base64ToFile(
  dataUrl: string,
  index: number,
  stepName: string
): File | null {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    const prefixo = String(index).padStart(2, '0');
    const sanitizedName = stepName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${prefixo}_${sanitizedName}.jpg`;

    return new File([u8arr], filename, { type: mime });
  } catch (error) {
    console.error('Erro ao converter base64 para arquivo:', error);
    return null;
  }
}
