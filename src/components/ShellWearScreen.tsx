import React, { useState, useRef } from 'react';
import { Gauge, RotateCcw, ArrowLeft, CheckCircle2, AlertTriangle, Share2, Loader2, Copy, Check } from 'lucide-react';
import { calculateShellWear } from '../utils/shellWear';
import { ScreenId, ShellWearResult } from '../types';
import { captureAndShareCard } from '../utils/cardCaptureShare';

interface ShellWearScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const ShellWearScreen: React.FC<ShellWearScreenProps> = ({ onNavigate }) => {
  const [nominal, setNominal] = useState<string>('');
  const [menorMedida, setMenorMedida] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [result, setResult] = useState<ShellWearResult | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [copyDone, setCopyDone] = useState<boolean>(false);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const nom = parseFloat(nominal);
    const men = parseFloat(menorMedida);

    if (isNaN(nom) || isNaN(men)) {
      setErrorMsg('Preencha todos os campos numéricos.');
      return;
    }

    if (nom <= 0) {
      setErrorMsg('A espessura nominal deve ser maior que zero.');
      return;
    }

    if (men > nom) {
      setErrorMsg('A menor medida não pode ser maior que a nominal.');
      return;
    }

    setErrorMsg('');
    const calculated = calculateShellWear(nom, men);
    setResult(calculated);
  };

  const handleReset = () => {
    setResult(null);
    setErrorMsg('');
    setNominal('');
    setMenorMedida('');
  };

  const getReportText = () => {
    if (!result) return '';
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    const hora = String(now.getHours()).padStart(2, '0');
    const minuto = String(now.getMinutes()).padStart(2, '0');

    let text = `*MEDIÇÃO DE CARCAÇA DE TAMBOR (ULTRASSOM) - REMA TIP TOP*\n`;
    text += `*Data:* ${dia}/${mes}/${ano} às ${hora}:${minuto}\n\n`;
    text += `*Espessura Nominal:* ${result.nominal.toFixed(1)} mm\n`;
    text += `*Menor Medida Encontrada:* ${result.menorMedida.toFixed(1)} mm\n`;
    text += `*Diferença Total:* ${result.diferenca.toFixed(2)} mm\n`;
    text += `*Desgaste Calculado:* ${result.porcentagemDesgaste.toFixed(1)} %\n\n`;
    text += result.apto
      ? `✅ *STATUS: Desgaste abaixo de 10%*\nAPTO PARA REVESTIMENTO.`
      : `⚠️ *STATUS: Atenção! Desgaste acima de 10%*\nINFORMAR LIDERANÇA IMEDIATAMENTE.`;
    return text;
  };

  const handleShareWhatsAppWithScreenshot = async () => {
    if (!result || !resultCardRef.current || isSharing) return;

    try {
      setIsSharing(true);
      const text = getReportText();
      const now = new Date();
      const filename = `Carcaca_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.png`;

      await captureAndShareCard({
        element: resultCardRef.current,
        filename,
        captionText: text,
        title: 'Medição de Carcaça - REMA TIP TOP',
      });
    } catch (err) {
      console.error('Erro ao compartilhar captura da carcaça:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyTextOnly = () => {
    const text = getReportText();
    navigator.clipboard.writeText(text).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  return (
    <div id="tela-carcaca" className="flex flex-col w-full py-1">
      {!result ? (
        <form onSubmit={handleCalculate} className="flex flex-col gap-3.5">
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label
                htmlFor="espessura-nominal-input"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Espessura Nominal (mm):
              </label>
              <input
                id="espessura-nominal-input"
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="Ex: 12.5"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-[#8b0000] focus:ring-2 focus:ring-[#8b0000]/20 transition-all"
                required
              />
            </div>

            <div>
              <label
                htmlFor="menor-medida-input"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Menor Medida Encontrada (mm):
              </label>
              <input
                id="menor-medida-input"
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="Ex: 11.0"
                value={menorMedida}
                onChange={(e) => setMenorMedida(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-[#8b0000] focus:ring-2 focus:ring-[#8b0000]/20 transition-all"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg text-center">
              {errorMsg}
            </div>
          )}

          <button
            id="btn-calcular-desgaste-carcaca"
            type="submit"
            className="w-full py-3 px-4 bg-[#8b0000] hover:bg-[#720000] active:bg-[#5a0000] text-white font-bold text-sm tracking-wider rounded-xl shadow-md shadow-red-950/20 flex items-center justify-center gap-2 transition-all mt-1"
          >
            <Gauge className="w-4 h-4" />
            <span>CALCULAR DESGASTE</span>
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Card que será capturado como imagem para o WhatsApp */}
          <div
            ref={resultCardRef}
            id="card-captura-carcaca"
            className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 text-center shadow-md relative overflow-hidden"
          >
            {/* Cabeçalho de identificação visual na imagem capturada */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 px-1">
              <div className="flex items-center gap-2">
                <img
                  src="./logo-192.png"
                  alt="REMA TIP TOP"
                  className="w-9 h-9 object-contain"
                />
                <div className="text-left">
                  <div className="text-xs font-black text-[#8b0000] tracking-tight leading-none">
                    RTT Check
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">
                    Medição de Carcaça
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400">
                  {new Date().toLocaleDateString('pt-BR')}
                </div>
                <div className="text-[9px] font-semibold text-slate-500">
                  Ultrassom
                </div>
              </div>
            </div>

            {/* Medidas Comparadas */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200/80 mb-3 shadow-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Nominal
                </span>
                <span className="text-sm font-extrabold text-slate-800">
                  {result.nominal.toFixed(1)} mm
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Menor Ponto
                </span>
                <span className="text-sm font-extrabold text-slate-800">
                  {result.menorMedida.toFixed(1)} mm
                </span>
              </div>
            </div>

            {/* Resultados Numéricos */}
            <div className="grid grid-cols-2 gap-2 my-2">
              <div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Diferença
                </div>
                <div className="text-lg font-bold text-slate-700">
                  {result.diferenca.toFixed(2)} mm
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Desgaste
                </div>
                <div className="text-xl font-black text-[#8b0000]">
                  {result.porcentagemDesgaste.toFixed(1)} %
                </div>
              </div>
            </div>

            {/* Status box */}
            <div
              className={`mt-3.5 p-3 rounded-lg border text-xs font-bold leading-relaxed flex items-center justify-center gap-2 ${
                result.apto
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {result.apto ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div className="text-center">
                <div className="font-extrabold text-sm">
                  {result.apto
                    ? 'APTO PARA REVESTIMENTO'
                    : 'INFORMAR LIDERANÇA'}
                </div>
                <div className="text-[11px] opacity-90">
                  {result.apto
                    ? 'Desgaste abaixo de 10%.'
                    : 'Atenção! Desgaste acima do limite de 10%.'}
                </div>
              </div>
            </div>

            {/* Rodapé da imagem capturada */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
              <span>Paulo Matos - CQ</span>
              <span>REMA TIP TOP Brasil</span>
            </div>
          </div>

          {/* Botões de Ação com captura de tela */}
          <div className="flex flex-col gap-2 mt-1">
            <button
              id="btn-compartilhar-carcaca-wpp"
              type="button"
              disabled={isSharing}
              onClick={handleShareWhatsAppWithScreenshot}
              className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1ebe57] active:bg-[#19a74c] text-white font-bold text-sm tracking-wide rounded-xl shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-75"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gerando Print e Compartilhando...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  <span>Compartilhar Print no WhatsApp</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-copiar-texto-carcaca"
                type="button"
                onClick={handleCopyTextOnly}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copyDone ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copiar Legenda</span>
                  </>
                )}
              </button>

              <button
                id="btn-nova-medicao-carcaca"
                type="button"
                onClick={handleReset}
                className="py-2.5 px-3 bg-[#8b0000] hover:bg-[#720000] active:bg-[#5a0000] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nova Medição</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        id="btn-menu-principal-carcaca"
        type="button"
        onClick={() => onNavigate('home')}
        className="w-full py-2.5 px-3 bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white font-semibold text-xs tracking-wider rounded-lg transition-all mt-4 flex items-center justify-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>MENU PRINCIPAL</span>
      </button>

      <div className="mt-5 text-center text-[11px] text-slate-400 font-medium">
        Desenvolvido por Paulo Matos<br />
        Téc. Controle de Qualidade
      </div>
    </div>
  );
};
