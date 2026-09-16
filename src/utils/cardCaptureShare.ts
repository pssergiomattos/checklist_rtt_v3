import { toPng, toBlob } from 'html-to-image';

export interface CaptureAndShareOptions {
  element: HTMLElement;
  filename: string;
  captionText: string;
  title: string;
}

/**
 * Ao clicar no botão de compartilhar com print:
 * 1. Captura o card de resultados em imagem de alta resolução (PNG).
 * 2. Se o dispositivo suportar compartilhamento nativo com arquivos (Android / iOS / PWA):
 *    Compartilha a imagem anexada JUNTO com a legenda gerada diretamente para o WhatsApp/aplicativos.
 * 3. Fallback (Desktop ou navegadores sem Web Share de arquivos):
 *    Copia imagem/legenda para área de transferência, baixa o print e abre o WhatsApp com a legenda.
 */
export async function captureAndShareCard({
  element,
  filename,
  captionText,
  title,
}: CaptureAndShareOptions): Promise<{ success: boolean; message?: string }> {
  try {
    // 1. Gera o blob da imagem do cartão com nitidez 2x
    const blob = await toBlob(element, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: (node) => {
        if (node instanceof HTMLElement && node.dataset.captureIgnore === 'true') {
          return false;
        }
        return true;
      },
    });

    if (!blob) {
      throw new Error('Não foi possível gerar a imagem para captura.');
    }

    const file = new File([blob], filename, { type: 'image/png' });

    // 2. Compartilhamento nativo de arquivo + legenda (Android / iOS / PWA)
    // Isso anexa a imagem e preenche a legenda no WhatsApp automaticamente!
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: title || 'RTT Check',
          text: captionText,
        });
        return {
          success: true,
          message: 'Imagem e legenda compartilhadas com sucesso!',
        };
      } catch (shareErr: unknown) {
        // Se o usuário apenas cancelou a tela de compartilhamento, não exibe erro
        if (shareErr instanceof Error && shareErr.name === 'AbortError') {
          return {
            success: true,
            message: 'Compartilhamento cancelado.',
          };
        }
        console.warn('Erro ao compartilhar nativamente, usando modo de contingência:', shareErr);
      }
    }

    // 3. Modo de contingência para navegadores Desktop (sem Web Share de arquivos):
    // Tenta copiar imagem PNG e texto para área de transferência
    try {
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const item = new ClipboardItem({
          'image/png': blob,
          'text/plain': new Blob([captionText], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(captionText);
      }
    } catch {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(captionText);
        }
      } catch {
        // Silencioso
      }
    }

    // 4. Baixa a imagem localmente no computador
    try {
      const dataUrl = await toPng(element, { pixelRatio: 2, backgroundColor: '#ffffff' });
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (e) {
      console.warn('Erro ao baixar imagem:', e);
    }

    // 5. Abre o WhatsApp com a legenda de texto
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(captionText)}`;
    setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, 250);

    return {
      success: true,
      message: 'Print salvo e abrindo WhatsApp com a legenda!',
    };
  } catch (error) {
    console.error('Erro na captura do print:', error);
    // Em qualquer imprevisto crítico, abre o WhatsApp diretamente com a legenda
    const fallbackUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(captionText)}`;
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    return {
      success: false,
      message: 'Abrindo WhatsApp...',
    };
  }
}


