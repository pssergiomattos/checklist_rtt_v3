export type ScreenId = 'home' | 'checklist' | 'orvalho' | 'carcaca';

export type ServiceId =
  | 'revestimento'
  | 'emenda-lona-quente'
  | 'emenda-lona-frio'
  | 'emenda-cabo';

export type ItemStatus = 'OK' | 'Não OK' | 'N/A';

export interface ChecklistItemDef {
  id: string;
  nome: string;
  allowsNA?: boolean;
}

export interface ChecklistSectionDef {
  titulo: string;
  itens: ChecklistItemDef[];
}

export interface ServiceDef {
  id: ServiceId;
  nome: string;
  identificacaoLabel: string;
  identificacaoPlaceholder: string;
  hasTamborMask?: boolean;
  secoes: ChecklistSectionDef[];
}

export interface PhotoData {
  dataUrl: string;
  filename: string;
  timestamp: number;
}

export interface ServiceFormData {
  tecnico: string;
  om: string;
  identificacao: string;
  observacoes: string;
  status: Record<string, ItemStatus>;
  photos: Record<string, PhotoData>;
}

export interface DewPointResult {
  pontoOrvalho: number;
  pontoOrvalhoSeguro: number;
  tempSuperficie: number;
  apto: boolean;
}

export interface ShellWearResult {
  nominal: number;
  menorMedida: number;
  diferenca: number;
  porcentagemDesgaste: number;
  apto: boolean;
}
