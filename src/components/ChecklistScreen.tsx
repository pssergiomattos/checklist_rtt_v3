import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  MessageCircle,
  Share2,
  RotateCcw,
  Trash2,
  Maximize2,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { SERVICES } from '../data/checklistStructures';
import {
  ItemStatus,
  PhotoData,
  ScreenId,
  ServiceDef,
  ServiceFormData,
  ServiceId,
} from '../types';
import { compressImage, base64ToFile } from '../utils/imageCompressor';
import {
  generateTextReport,
  openWhatsAppText,
  sharePhotosWhatsApp,
} from '../utils/whatsappShare';
import { PhotoModal } from './PhotoModal';

const STORAGE_KEY = 'rttCheckEstado_v2';

interface ChecklistScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

const getInitialFormData = (serviceDef?: ServiceDef): ServiceFormData => {
  const initialStatus: Record<string, ItemStatus> = {};
  if (serviceDef) {
    for (const secao of serviceDef.secoes) {
      for (const item of secao.itens) {
        initialStatus[item.id] = item.allowsNA ? 'N/A' : 'Não OK';
      }
    }
  }
  return {
    tecnico: '',
    om: '',
    identificacao: '',
    observacoes: '',
    status: initialStatus,
    photos: {},
  };
};

export const ChecklistScreen: React.FC<ChecklistScreenProps> = ({ onNavigate }) => {
  const [serviceId, setServiceId] = useState<ServiceId | ''>('revestimento');
  const [formData, setFormData] = useState<ServiceFormData>(() =>
    getInitialFormData(SERVICES['revestimento'])
  );
  const [previewPhoto, setPreviewPhoto] = useState<{
    title: string;
    dataUrl: string;
  } | null>(null);
  const [compressingId, setCompressingId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const activeService = serviceId ? SERVICES[serviceId] : null;

  // Carregar dados salvos no localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.serviceId && SERVICES[parsed.serviceId]) {
          setServiceId(parsed.serviceId);
        }
        if (parsed.formData) {
          setFormData(parsed.formData);
        }
      }
    } catch (err) {
      console.warn('Erro ao restaurar dados do localStorage:', err);
    }
  }, []);

  // Salvar no localStorage sempre que houver alteração
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          serviceId,
          formData,
        })
      );
    } catch (err) {
      console.warn('Limite de armazenamento no localStorage:', err);
    }
  }, [serviceId, formData]);

  const handleServiceChange = (newServiceId: ServiceId | '') => {
    setServiceId(newServiceId);
    if (newServiceId && SERVICES[newServiceId]) {
      const defaultData = getInitialFormData(SERVICES[newServiceId]);
      // Preservar técnico e OM se já foram digitados
      setFormData((prev) => ({
        ...defaultData,
        tecnico: prev.tecnico,
        om: prev.om,
      }));
    }
  };

  // Máscara de Tambor TR-313K-05
  const applyTamborMask = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').substring(0, 5);
    let formatted = '';
    if (digits.length > 0) {
      formatted = 'TR-' + digits.substring(0, 3);
    }
    if (digits.length >= 4) {
      formatted += 'K-' + digits.substring(3, 5);
    }
    return formatted;
  };

  const handleIdentificacaoChange = (val: string) => {
    if (activeService?.hasTamborMask) {
      setFormData((prev) => ({
        ...prev,
        identificacao: applyTamborMask(val),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        identificacao: val.toUpperCase(),
      }));
    }
  };

  const handleStatusChange = (itemId: string, status: ItemStatus) => {
    setFormData((prev) => ({
      ...prev,
      status: {
        ...prev.status,
        [itemId]: status,
      },
    }));
  };

  const handlePhotoUpload = async (
    file: File,
    itemId: string,
    stepName: string,
    index: number
  ) => {
    try {
      setCompressingId(itemId);
      const { dataUrl, file: compressedFile } = await compressImage(
        file,
        index,
        stepName
      );

      setFormData((prev) => ({
        ...prev,
        photos: {
          ...prev.photos,
          [itemId]: {
            dataUrl,
            filename: compressedFile.name,
            timestamp: Date.now(),
          },
        },
      }));
    } catch (err) {
      console.error('Erro ao processar foto:', err);
      setFeedbackMsg({
        type: 'error',
        text: 'Não foi possível processar a foto. Tente novamente.',
      });
    } finally {
      setCompressingId(null);
    }
  };

  const handleRemovePhoto = (itemId: string) => {
    setFormData((prev) => {
      const updatedPhotos = { ...prev.photos };
      delete updatedPhotos[itemId];
      return {
        ...prev,
        photos: updatedPhotos,
      };
    });
  };

  // Verificar se há dados preenchidos para habilitar o botão de reiniciar
  const hasFilledData = Boolean(
    formData.tecnico.trim() ||
      formData.om.trim() ||
      formData.identificacao.trim() ||
      formData.observacoes.trim() ||
      Object.keys(formData.photos).length > 0 ||
      Object.values(formData.status).some((st) => st === 'OK')
  );

  const handleReset = () => {
    if (
      window.confirm(
        'Deseja apagar todos os dados e começar uma nova inspeção do zero?'
      )
    ) {
      localStorage.removeItem(STORAGE_KEY);
      if (activeService) {
        setFormData(getInitialFormData(activeService));
      }
      setFeedbackMsg({
        type: 'success',
        text: 'Formulário reiniciado com sucesso.',
      });
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  };

  // Passo 1: Enviar Relatório de Texto via WhatsApp
  const handleSendText = () => {
    if (!activeService) return;
    const report = generateTextReport(activeService, formData);
    openWhatsAppText(report);
  };

  // Copiar relatório
  const handleCopyReport = () => {
    if (!activeService) return;
    const report = generateTextReport(activeService, formData);
    navigator.clipboard.writeText(report).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Passo 2: Enviar Álbum de Fotos via Web Share API
  const handleSendPhotos = async () => {
    if (!activeService) return;

    const filesArray: File[] = [];
    let globalIndex = 1;

    for (const secao of activeService.secoes) {
      for (const item of secao.itens) {
        const itemStatus = formData.status[item.id];
        const photo = formData.photos[item.id];

        if (itemStatus === 'OK' && photo) {
          const file = base64ToFile(photo.dataUrl, globalIndex, item.nome);
          if (file) {
            filesArray.push(file);
          }
        }
        globalIndex++;
      }
    }

    if (filesArray.length === 0) {
      setFeedbackMsg({
        type: 'error',
        text: 'Nenhuma foto anexada nas etapas marcadas como "OK". Tire as fotos antes de enviar.',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    const result = await sharePhotosWhatsApp(filesArray);
    if (!result.success && result.message) {
      setFeedbackMsg({
        type: 'error',
        text: result.message,
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  return (
    <div id="tela-principal" className="flex flex-col w-full py-1">
      {/* Seleção do Serviço */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-4 shadow-xs">
        <label
          htmlFor="tipo-servico-select"
          className="block text-xs font-bold text-slate-700 mb-1.5"
        >
          Selecione o Serviço:
        </label>
        <select
          id="tipo-servico-select"
          value={serviceId}
          onChange={(e) => handleServiceChange(e.target.value as ServiceId)}
          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#8b0000] focus:ring-2 focus:ring-[#8b0000]/20 transition-all"
        >
          <option value="">-- Selecione uma opção --</option>
          <option value="revestimento">Revestimento de Tambor</option>
          <option value="emenda-lona-quente">
            Emenda de Correia de Lona a Quente
          </option>
          <option value="emenda-lona-frio">
            Emenda de Correia de Lona a Frio
          </option>
          <option value="emenda-cabo">
            Emenda de Correia de Cabo de Aço
          </option>
        </select>
      </div>

      {/* Módulos do Serviço Selecionado */}
      {activeService && (
        <div className="flex flex-col gap-4">
          {/* Dados do Cabeçalho da OS */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3 shadow-xs">
            <div>
              <label
                htmlFor="input-tecnico"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Técnico Responsável:
              </label>
              <input
                id="input-tecnico"
                type="text"
                placeholder="EX: PAULO MATOS"
                value={formData.tecnico}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tecnico: e.target.value
                      .toUpperCase()
                      .replace(/[0-9]/g, ''),
                  }))
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-[#8b0000] focus:ring-2 focus:ring-[#8b0000]/20 transition-all font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="input-om"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Número da OM:
              </label>
              <input
                id="input-om"
                type="tel"
                inputMode="numeric"
                placeholder="Somente números"
                value={formData.om}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    om: e.target.value.replace(/[^0-9]/g, ''),
                  }))
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-[#8b0000] focus:ring-2 focus:ring-[#8b0000]/20 transition-all font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="input-identificacao"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                {activeService.identificacaoLabel}
              </label>
              <input
                id="input-identificacao"
                type={activeService.hasTamborMask ? 'tel' : 'text'}
                inputMode={activeService.hasTamborMask ? 'numeric' : 'text'}
                placeholder={activeService.identificacaoPlaceholder}
                value={formData.identificacao}
                onChange={(e) => handleIdentificacaoChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-[#8b0000] focus:ring-2 focus:ring-[#8b0000]/20 transition-all font-medium uppercase"
              />
            </div>
          </div>

          {/* Título do Checklist */}
          <div className="text-sm font-bold text-slate-800 border-b-2 border-[#8b0000] pb-1.5 flex items-center justify-between">
            <span>Registros Fotográficos</span>
            <span className="text-[11px] text-slate-500 font-normal">
              {Object.values(formData.photos).length} foto(s) anexada(s)
            </span>
          </div>

          {/* Seções e Itens do Checklist */}
          <div className="flex flex-col gap-2.5">
            {activeService.secoes.map((secao, secaoIndex) => (
              <div key={secao.titulo} className="flex flex-col">
                <div className="text-xs font-bold text-white bg-slate-800 px-3 py-1.5 rounded-md tracking-wider uppercase mt-2 mb-1 shadow-xs">
                  {secao.titulo}
                </div>

                <div className="divide-y divide-slate-200">
                  {secao.itens.map((item, itemIdx) => {
                    const currentStatus = formData.status[item.id] || 'Não OK';
                    const hasPhoto = Boolean(formData.photos[item.id]);
                    const isCompressing = compressingId === item.id;
                    const calculatedIdx = secaoIndex * 10 + itemIdx + 1;

                    return (
                      <div
                        key={item.id}
                        id={`container-${item.id}`}
                        className="py-2.5 flex flex-col"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-800 leading-snug flex-1">
                            {item.nome}
                          </span>

                          {/* Toggle Group */}
                          <div className="flex bg-slate-200 rounded-lg p-0.5 shrink-0 overflow-hidden shadow-2xs">
                            <button
                              id={`toggle-${item.id}-ok`}
                              type="button"
                              onClick={() => handleStatusChange(item.id, 'OK')}
                              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                                currentStatus === 'OK'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              OK
                            </button>

                            <button
                              id={`toggle-${item.id}-nao`}
                              type="button"
                              onClick={() =>
                                handleStatusChange(item.id, 'Não OK')
                              }
                              className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                                currentStatus === 'Não OK'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Não OK
                            </button>

                            {item.allowsNA && (
                              <button
                                id={`toggle-${item.id}-na`}
                                type="button"
                                onClick={() =>
                                  handleStatusChange(item.id, 'N/A')
                                }
                                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                                  currentStatus === 'N/A'
                                    ? 'bg-slate-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                N/A
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Seção de foto (revelada apenas quando o item está OK) */}
                        {currentStatus === 'OK' && (
                          <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                            {/* Input Câmera */}
                            <label
                              htmlFor={`cam-${item.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 cursor-pointer transition-colors shadow-2xs"
                            >
                              <Camera className="w-3.5 h-3.5 text-slate-600" />
                              <span>Câmera</span>
                            </label>
                            <input
                              id={`cam-${item.id}`}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              disabled={isCompressing}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handlePhotoUpload(
                                    file,
                                    item.id,
                                    item.nome,
                                    calculatedIdx
                                  );
                                }
                              }}
                            />

                            {/* Input Galeria */}
                            <label
                              htmlFor={`gal-${item.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 cursor-pointer transition-colors shadow-2xs"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                              <span>Galeria</span>
                            </label>
                            <input
                              id={`gal-${item.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isCompressing}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handlePhotoUpload(
                                    file,
                                    item.id,
                                    item.nome,
                                    calculatedIdx
                                  );
                                }
                              }}
                            />

                            {/* Loading state */}
                            {isCompressing && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8b0000]" />
                                Comprimindo...
                              </span>
                            )}

                            {/* Miniatura da Foto com ações */}
                            {hasPhoto && (
                              <div className="flex items-center gap-1.5 ml-auto">
                                <div
                                  className="relative cursor-pointer group"
                                  onClick={() =>
                                    setPreviewPhoto({
                                      title: item.nome,
                                      dataUrl: formData.photos[item.id].dataUrl,
                                    })
                                  }
                                  title="Clique para ampliar"
                                >
                                  <img
                                    src={formData.photos[item.id].dataUrl}
                                    alt={item.nome}
                                    className="w-12 h-9 object-cover rounded-md border border-slate-300 group-hover:opacity-90 shadow-2xs"
                                  />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-md flex items-center justify-center transition-opacity">
                                    <Maximize2 className="w-3.5 h-3.5 text-white drop-shadow-xs" />
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(item.id)}
                                  title="Remover foto"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Observações */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shadow-xs mt-2">
            <label
              htmlFor="input-observacoes"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Observações:
            </label>
            <textarea
              id="input-observacoes"
              rows={3}
              placeholder="Justifique aqui itens Não OK ou pendências do turno..."
              value={formData.observacoes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  observacoes: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-[#8b0000] focus:ring-2 focus:ring-[#8b0000]/20 transition-all font-medium"
            />
          </div>

          {/* Mensagem de Feedback */}
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Botões de Ação WhatsApp */}
          <div className="flex flex-col gap-2.5 mt-2">
            <button
              id="btn-enviar-texto-wpp"
              type="button"
              onClick={handleSendText}
              className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1ebe57] active:bg-[#19a74c] text-white font-bold text-sm tracking-wide rounded-xl shadow-md shadow-emerald-950/15 flex items-center justify-center gap-2 transition-all duration-150"
            >
              <MessageCircle className="w-5 h-5 fill-white/20" />
              <span>1º Passo: Enviar Relatório de Texto</span>
            </button>

            <button
              id="btn-enviar-fotos-wpp"
              type="button"
              onClick={handleSendPhotos}
              className="w-full py-3.5 px-4 bg-[#128C7E] hover:bg-[#0e7468] active:bg-[#0a5c53] text-white font-bold text-sm tracking-wide rounded-xl shadow-md shadow-teal-950/15 flex items-center justify-center gap-2 transition-all duration-150"
            >
              <Share2 className="w-5 h-5" />
              <span>2º Passo: Enviar Álbum de Fotos</span>
            </button>

            <div className="text-[11px] text-slate-500 text-center italic leading-tight px-2">
              Envie o texto primeiro, volte aqui e envie as fotos. Elas ficarão
              logo abaixo no WhatsApp.
            </div>

            {/* Alternativa: Copiar relatório para a área de transferência */}
            <button
              id="btn-copiar-relatorio"
              type="button"
              onClick={handleCopyReport}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 flex items-center justify-center gap-1.5 transition-colors self-center mt-1"
            >
              {copySuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">
                    Copiado para Área de Transferência!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copiar Relatório de Texto</span>
                </>
              )}
            </button>

            {/* Botão Reiniciar */}
            <button
              id="btn-reiniciar-inspecao"
              type="button"
              onClick={handleReset}
              disabled={!hasFilledData}
              className={`w-36 mx-auto mt-2 py-2 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                hasFilledData
                  ? 'bg-[#8b0000] hover:bg-[#720000] text-white shadow-xs border-transparent'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REINICIAR</span>
            </button>
          </div>
        </div>
      )}

      {/* Botão Voltar ao Menu Principal */}
      <button
        id="btn-voltar-home-checklist"
        type="button"
        onClick={() => onNavigate('home')}
        className="w-full py-2.5 px-3 bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white font-semibold text-xs tracking-wider rounded-lg transition-all mt-6 flex items-center justify-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>MENU PRINCIPAL</span>
      </button>

      {/* Rodapé institucional */}
      <div className="mt-5 text-center text-[11px] text-slate-400 font-medium">
        Desenvolvido por Paulo Matos<br />
        Téc. Controle de Qualidade
      </div>

      {/* Modal de foto ampliada */}
      {previewPhoto && (
        <PhotoModal
          isOpen={Boolean(previewPhoto)}
          title={previewPhoto.title}
          dataUrl={previewPhoto.dataUrl}
          onClose={() => setPreviewPhoto(null)}
        />
      )}
    </div>
  );
};
