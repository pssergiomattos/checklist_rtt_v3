import { ServiceDef, ServiceFormData } from '../types';

export function generateTextReport(
  serviceDef: ServiceDef,
  formData: ServiceFormData
): string {
  const now = new Date();
  const dia = String(now.getDate()).padStart(2, '0');
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const ano = now.getFullYear();
  const dataFormatada = `${dia}/${mes}/${ano}`;

  let textoMsg = '*RELATÓRIO DE PRÉ-OPERAÇÃO*\n';
  textoMsg += '*Serviço:* ' + serviceDef.nome + '\n';
  textoMsg += '*Data:* ' + dataFormatada + '\n\n';

  const tec = formData.tecnico.trim() || 'Não informado';
  const om = formData.om.trim() || 'Não informada';
  const idLabel = serviceDef.hasTamborMask
    ? 'Identificação Tambor'
    : 'Identificação da Emenda';
  const idVal = formData.identificacao.trim() || 'Não informado';

  textoMsg += '*Técnico:* ' + tec + '\n';
  textoMsg += '*OM:* ' + om + '\n';
  textoMsg += `*${idLabel}:* ` + idVal + '\n\n';

  textoMsg += '*CHECKLIST FOTOGRÁFICO:*\n';

  for (const secao of serviceDef.secoes) {
    textoMsg += '\n*' + secao.titulo + '*\n';
    for (const item of secao.itens) {
      const status = formData.status[item.id] || 'Não OK';
      let icone = '❌';
      let textoFinal: string = status;

      if (status === 'OK') {
        icone = '✅';
      } else if (status === 'N/A') {
        icone = '➖';
        textoFinal = 'Não Aplicável';
      }

      textoMsg += `${icone} ${item.nome}: ${textoFinal}\n`;
    }
  }

  const obs = formData.observacoes.trim();
  if (obs) {
    textoMsg += `\n*OBSERVAÇÕES:*\n${obs}\n`;
  }

  return textoMsg;
}

export function openWhatsAppText(text: string) {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function sharePhotosWhatsApp(files: File[]): Promise<{
  success: boolean;
  message?: string;
}> {
  if (files.length === 0) {
    return {
      success: false,
      message:
        'Nenhuma foto encontrada! Marque as etapas como "OK" e anexe as fotos antes de enviar.',
    };
  }

  if (navigator.canShare && navigator.canShare({ files })) {
    try {
      await navigator.share({
        files,
        title: 'Álbum de Fotos - RTT Check',
        text: 'Fotos de inspeção e controle de qualidade',
      });
      return { success: true };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, message: 'Compartilhamento cancelado.' };
      }
      return {
        success: false,
        message:
          'O sistema bloqueou o envio múltiplo. Tente desmarcar algumas fotos temporariamente ou compartilhar em lotes menores.',
      };
    }
  } else {
    return {
      success: false,
      message:
        'Seu navegador ou aparelho não suporta o envio direto de múltiplos arquivos simultâneos via compartilhamento nativo.',
    };
  }
}
