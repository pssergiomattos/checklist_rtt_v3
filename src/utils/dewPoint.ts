import { DewPointResult } from '../types';

export function calculateDewPoint(
  temp: number,
  umidade: number,
  tempSuperficie: number
): DewPointResult {
  const b = 17.625;
  const c = 243.04;
  const alfa = Math.log(umidade / 100) + (b * temp) / (c + temp);
  const pontoOrvalho = (c * alfa) / (b - alfa);
  const pontoOrvalhoSeguro = pontoOrvalho + 3;
  const apto = tempSuperficie >= pontoOrvalhoSeguro;

  return {
    pontoOrvalho: Number(pontoOrvalho.toFixed(1)),
    pontoOrvalhoSeguro: Number(pontoOrvalhoSeguro.toFixed(1)),
    tempSuperficie: Number(tempSuperficie.toFixed(1)),
    apto,
  };
}
