import { ShellWearResult } from '../types';

export function calculateShellWear(
  nominal: number,
  menorMedida: number
): ShellWearResult {
  const diferenca = nominal - menorMedida;
  const porcentagemDesgaste = (diferenca / nominal) * 100;
  const apto = porcentagemDesgaste <= 10;

  return {
    nominal: Number(nominal.toFixed(1)),
    menorMedida: Number(menorMedida.toFixed(1)),
    diferenca: Number(diferenca.toFixed(2)),
    porcentagemDesgaste: Number(porcentagemDesgaste.toFixed(1)),
    apto,
  };
}
