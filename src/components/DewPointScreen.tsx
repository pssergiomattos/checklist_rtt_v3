import React, { useState, useRef } from 'react';
import { Droplets, Calculator, RotateCcw, ArrowLeft, CheckCircle2, AlertTriangle, Share2, Loader2, Copy, Check } from 'lucide-react';
import { calculateDewPoint } from '../utils/dewPoint';
import { DewPointResult, ScreenId } from '../types';
import { captureAndShareCard } from '../utils/cardCaptureShare';

interface DewPointScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const DewPointScreen: React.FC<DewPointScreenProps> = ({ onNavigate }) => {
  const [temp, setTemp] = useState<string>('');
  const [umidade, setUmidade] = useState<string>('');
  const [tempSuperficie, setTempSuperficie] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [result, setResult] = useState<DewPointResult | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [copyDone, setCopyDone] = useState<boolean>(false);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseFloat(temp);
    const u = parseFloat(umidade);
    const ts = parseFloat(tempSuperficie);

    if (isNaN(t) || isNaN(u) || isNaN(ts)) {
      setErrorMsg('Preencha todos os campos numéricos.');
      return;
    }

    if (u < 0 || u > 100) {
      setErrorMsg('A umidade deve estar entre 0% e 100%.');
      return;
    }

    setErrorMsg('');
    const calculated = calculateDewPoint(t, u, ts);
    setResult(calculated);
  };

  const handleReset = () => {
    setResult(null);
    setErrorMsg('');
    setTemp('');
    setUmidade('');
    setTempSuperficie('');
  };

  const getReportText = () => {
    if (!result) return '';
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    const hora = String(now.getHours()).padStart(2, '0');
    const minuto = String(now.getMinutes()).padStart(2, '0');

    let text = `*ANÁLISE DE PONTO DE ORVALHO - REMA TIP TOP*\n`;
    text += `*Data:* ${dia}/${mes}/${ano} às ${hora}:${minuto}\n\n`;
    text += `*Temp. Ambiente:* ${temp} °C\n`;
    text += `*Umidade Relativa:* ${umidade} %\n`;
    text += `*Temp. Superfície:* ${result.tempSuperficie} °C\n\n`;
    text += `*Ponto de Orvalho:* ${result.pontoOrvalho} °C\n`;
    text += `*Margem Segura (+3°C):* ${result.pontoOrvalhoSeguro} °C\n\n`;
    text += result.apto
      ? `✅ *STATUS: SUPERFÍCIE APTA*\nPode aplicar o adesivo!`
      : `❌ *STATUS: NÃO APTO*\nRisco iminente de condensação.`;
    return text;
  };

  const handleShareWhatsAppWithScreenshot = async () => {
    if (!result || !resultCardRef.current || isSharing) return;

    try {
      setIsSharing(true);
      const text = getReportText();
      const now = new Date();
      const filename = `Orvalho_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.png`;

      await captureAndShareCard({
        element: resultCardRef.current,
        filename,
        captionText: text,
        title: 'Ponto de Orvalho - REMA TIP TOP',
      });
    } catch (err) {
      console.error('Erro ao compartilhar captura:', err);
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
    <div id="tela-orvalho" className="flex flex-col w-full py-1">
      {!result ? (
        <form onSubmit={handleCalculate} className="flex flex-col gap-3.5">
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label
                htmlFor="temp-input"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Temperatura Ambiente (°C):
              </label>
              <input
                id="temp-input"
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="Ex: 25"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-[#8b0000] focus:ring-2 focus:ring-[#8b0000]/20 transition-all"
                required
              />
            </div>

            <div>
              <label
                htmlFor="umidade-input"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Umidade Relativa (%):
              </label>
              <input
                id="umidade-input"
                type="number"
                step="0.1"
                min="0"
                max="100"
                inputMode="decimal"
                placeholder="Ex: 60"
                value={umidade}
                onChange={(e) => setUmidade(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-[#8b0000] focus:ring-2 focus:ring-[#8b0000]/20 transition-all"
                required
              />
            </div>

            <div>
              <label
                htmlFor="temp-sup-input"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Temperatura da Superfície (°C):
              </label>
              <input
                id="temp-sup-input"
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="Ex: 28"
                value={tempSuperficie}
                onChange={(e) => setTempSuperficie(e.target.value)}
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
            id="btn-calcular-orvalho"
            type="submit"
            className="w-full py-3 px-4 bg-[#8b0000] hover:bg-[#720000] active:bg-[#5a0000] text-white font-bold text-sm tracking-wider rounded-xl shadow-md shadow-red-950/20 flex items-center justify-center gap-2 transition-all mt-1"
          >
            <Calculator className="w-4 h-4" />
            <span>CALCULAR</span>
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Card que será capturado como imagem para o WhatsApp */}
          <div
            ref={resultCardRef}
            id="card-captura-orvalho"
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
                    Análise Climática
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400">
                  {new Date().toLocaleDateString('pt-BR')}
                </div>
                <div className="text-[9px] font-semibold text-slate-500">
                  Ponto de Orvalho
                </div>
              </div>
            </div>

            {/* Dados de entrada na captura */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 mb-3 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Temp. Ambiente
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  {temp} °C
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Umidade Relativa
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  {umidade} %
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              Ponto de Orvalho
            </div>
            <div className="text-2xl font-black text-slate-900 my-0.5">
              {result.pontoOrvalho.toFixed(1)} °C
            </div>

            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-2.5">
              Margem Segura (+3°C)
            </div>
            <div className="text-base font-bold text-slate-700">
              {result.pontoOrvalhoSeguro.toFixed(1)} °C
            </div>

            <div className="my-3 border-t border-slate-200/80" />

            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              Temperatura da Superfície
            </div>
            <div className="text-xl font-bold text-cyan-700 my-0.5">
              {result.tempSuperficie.toFixed(1)} °C
            </div>

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
                  {result.apto ? 'SUPERFÍCIE APTA' : 'NÃO APTO'}
                </div>
                <div className="text-[11px] opacity-90">
                  {result.apto
                    ? 'Pode aplicar o adesivo!'
                    : 'Risco de condensação.'}
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
              id="btn-compartilhar-orvalho-wpp"
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
                id="btn-copiar-texto-orvalho"
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
                id="btn-novo-calculo-orvalho"
                type="button"
                onClick={handleReset}
                className="py-2.5 px-3 bg-[#8b0000] hover:bg-[#720000] active:bg-[#5a0000] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Novo Cálculo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        id="btn-menu-principal-orvalho"
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
