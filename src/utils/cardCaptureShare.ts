import { toPng, toBlob } from 'html-to-image';

export interface CaptureAndShareOptions {
  element: HTMLElement;
  filename: string;
  captionText: string;
  title: string;
}

/**
 * Ao clicar no botão de compartilhar no WhatsApp:
 * 1. Captura o card de resultados em imagem de alta resolução (PNG).
 * 2. Copia a imagem capturada (PNG) e a legenda de cálculos para a área de transferência do dispositivo.
 * 3. Baixa a imagem gerada (garantindo que o print esteja pronto para anexar na galeria/downloads).
 * 4. Abre IMEDIATAMENTE o WhatsApp direto (api.whatsapp.com / whatsapp://send) com o texto/legenda copiado pronto na mensagem.
 * Desta forma, vai direto para o WhatsApp sem abrir o menu genérico do sistema.
 */
export async function captureAndShareCard({
  element,
  filename,
  captionText,
}: CaptureAndShareOptions): Promise<{ success: boolean; message?: string }> {
  try {
    // 1. Gera o blob e dataUrl da imagem do cartão com nitidez 2x
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

    // 2. Tenta copiar imagem ou texto para a área de transferência
    try {
      if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const item = new ClipboardItem({
          'image/png': blob,
          'text/plain': new Blob([captionText], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(captionText);
      }
    } catch {
      // Fallback para apenas o texto se copiar imagem diretamente for restrito
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(captionText);
        }
      } catch {
        // Ignora silenciosamente
      }
    }

    // 3. Salva/Baixa a imagem no celular/computador com o print capturado
    try {
      const dataUrl = await toPng(element, { pixelRatio: 2, backgroundColor: '#ffffff' });
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (e) {
      console.warn('Erro ao salvar imagem localmente:', e);
    }

    // 4. Redireciona DIRETAMENTE para o WhatsApp sem passar pelo menu nativo do celular
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(captionText)}`;
    
    // Pequeno timeout para garantir que o download da imagem engatilhe antes do redirect
    setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, 200);

    return {
      success: true,
      message: 'Print capturado e abrindo WhatsApp diretamente!',
    };
  } catch (error) {
    console.error('Erro na captura do print:', error);
    // Em qualquer imprevisto, vai direto para o WhatsApp com o texto
    const fallbackUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(captionText)}`;
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    return {
      success: false,
      message: 'Abrindo WhatsApp...',
    };
  }
}

