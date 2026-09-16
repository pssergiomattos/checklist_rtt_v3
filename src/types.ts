export type ScreenId = 'home' | 'checklist' | 'orvalho' | 'carcaca' | 'admin-logs';

export interface AccessLogEntry {
  id: string;
  dataHora: string;
  nome: string;
  email: string;
  cargo: string;
  acao: string;
  detalhes?: string;
  dispositivo?: string;
  ip?: string;
}

export interface UserProfile {
  nome: string;
  email?: string;
  cargo?: string;
}

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
