import { ServiceDef } from '../types';

export const SERVICES: Record<string, ServiceDef> = {
  revestimento: {
    id: 'revestimento',
    nome: 'Revestimento de Tambor',
    identificacaoLabel: 'Identificação do Tambor:',
    identificacaoPlaceholder: 'Ex: TR-313K-05',
    hasTamborMask: true,
    secoes: [
      {
        titulo: 'DADOS INICIAIS',
        itens: [
          { id: 'rev_om_pag1', nome: 'OM (pág. 1)' },
          { id: 'rev_sup_prep', nome: 'Superfície Preparada' },
          { id: 'rev_nom_tambor', nome: 'Nominal do Tambor' },
          { id: 'rev_med_carcaca', nome: 'Medição de Carcaça' },
        ],
      },
      {
        titulo: 'LOTE E VALIDADE DOS MATERIAIS',
        itens: [
          { id: 'rev_solvente', nome: 'Solvente' },
          { id: 'rev_primer', nome: 'Primer' },
          { id: 'rev_adesivo', nome: 'Adesivo' },
          { id: 'rev_catalisador', nome: 'Catalisador' },
          { id: 'rev_revestimento', nome: 'Revestimento Utilizado' },
        ],
      },
      {
        titulo: 'REGISTRO DO PROCEDIMENTO',
        itens: [
          { id: 'rev_orvalho1', nome: '1° Ponto de Orvalho' },
          { id: 'rev_primer_aplicado', nome: 'Metal Primer Aplicado' },
          { id: 'rev_orvalho2', nome: '2° Ponto de Orvalho' },
          { id: 'rev_adesivo_aplicado', nome: 'Superfície com Adesivo Aplicado' },
          { id: 'rev_tambor_revestido', nome: 'Tambor Revestido' },
          { id: 'rev_nao_conformidades', nome: 'NÃO CONFORMIDADES', allowsNA: true },
        ],
      },
    ],
  },
  'emenda-lona-quente': {
    id: 'emenda-lona-quente',
    nome: 'Emenda de Correia de Lona a Quente',
    identificacaoLabel: 'Identificação da Emenda:',
    identificacaoPlaceholder: 'EX: CORREIA TRANSPORTADORA TR-01',
    secoes: [
      {
        titulo: 'DADOS INICIAIS',
        itens: [{ id: 'eq_om_pag1', nome: 'OM (pág. 1)' }],
      },
      {
        titulo: 'DIMENSÕES',
        itens: [
          { id: 'eq_espessura_correia', nome: 'ESPESSURA DA CORREIA' },
          { id: 'eq_largura_emenda', nome: 'LARGURA DA EMENDA' },
          { id: 'eq_espessura_regua', nome: 'ESPESSURA DA RÉGUA' },
        ],
      },
      {
        titulo: 'MATERIAIS (FAB/VAL)',
        itens: [
          { id: 'eq_borracha_cob', nome: 'BORRACHA DE COBERTURA' },
          { id: 'eq_borracha_lig', nome: 'BORRACHA DE LIGAÇÃO' },
          { id: 'eq_adesivo', nome: 'ADESIVO' },
          { id: 'eq_solvente', nome: 'SOLVENTE' },
          { id: 'eq_outros', nome: 'OUTROS', allowsNA: true },
        ],
      },
      {
        titulo: 'ALINHAMENTO',
        itens: [
          { id: 'eq_alinhamento', nome: 'ALINHAMENTO DA EMENDA' },
          { id: 'eq_comp_passos', nome: 'COMP. DOS PASSOS' },
        ],
      },
      {
        titulo: 'SUPERFÍCIE',
        itens: [
          { id: 'eq_sup_lix_carga', nome: 'SUP. LIXADA - CARGA' },
          { id: 'eq_sup_lix_ret', nome: 'SUP. LIXADA - RETORNO' },
          { id: 'eq_orvalho1', nome: '1° PONTO DE ORVALHO' },
          { id: 'eq_sup_adesivo', nome: 'SUP. COM ADESIVO' },
          { id: 'eq_ligacao_pos', nome: 'LIGAÇÃO POSICIONADA' },
          { id: 'eq_fechamento', nome: 'FECHAMENTO DA EMENDA' },
        ],
      },
      {
        titulo: 'VARIÁVEIS DE VULCANIZAÇÃO',
        itens: [
          { id: 'eq_temp_vulc', nome: 'TEMP. DE VULCANIZAÇÃO (PAINEL PRENSA)' },
          { id: 'eq_pressao_bomba', nome: 'PRESSÃO DA BOMBA (KIT)' },
        ],
      },
      {
        titulo: 'FINALIZAÇÃO',
        itens: [
          { id: 'eq_emenda_fin', nome: 'EMENDA FINALIZADA' },
          { id: 'eq_medicao_dureza', nome: 'MEDIÇÃO DE DUREZA' },
          { id: 'eq_contraprova', nome: 'CONTRAPROVA DA DUREZA' },
          { id: 'eq_nao_conformidades', nome: 'NÃO CONFORMIDADES', allowsNA: true },
        ],
      },
    ],
  },
  'emenda-lona-frio': {
    id: 'emenda-lona-frio',
    nome: 'Emenda de Correia de Lona a Frio',
    identificacaoLabel: 'Identificação da Emenda:',
    identificacaoPlaceholder: 'EX: CORREIA TRANSPORTADORA TR-02',
    secoes: [
      {
        titulo: 'DADOS INICIAIS',
        itens: [{ id: 'ef_om_pag1', nome: 'OM (pág. 1)' }],
      },
      {
        titulo: 'DIMENSÕES',
        itens: [
          { id: 'ef_espessura_correia', nome: 'ESPESSURA DA CORREIA' },
          { id: 'ef_largura_emenda', nome: 'LARGURA DA EMENDA' },
        ],
      },
      {
        titulo: 'MATERIAIS (FAB/VAL)',
        itens: [
          { id: 'ef_adesivo', nome: 'ADESIVO' },
          { id: 'ef_catalisador', nome: 'CATALISADOR' },
          { id: 'ef_solvente', nome: 'SOLVENTE' },
          { id: 'ef_outros', nome: 'OUTROS', allowsNA: true },
        ],
      },
      {
        titulo: 'ALINHAMENTO',
        itens: [
          { id: 'ef_alinhamento', nome: 'ALINHAMENTO DA EMENDA' },
          { id: 'ef_comp_passos', nome: 'COMPRIMENTO DOS PASSOS' },
        ],
      },
      {
        titulo: 'SUPERFÍCIE',
        itens: [
          { id: 'ef_sup_lix_carga', nome: 'SUP. LIXADA - CARGA' },
          { id: 'ef_sup_lix_ret', nome: 'SUP. LIXADA - RETORNO' },
          { id: 'ef_orvalho1', nome: '1° PONTO DE ORVALHO' },
          { id: 'ef_primeira_demao', nome: 'PRIMEIRA DEMÃO DE ADESIVO' },
          { id: 'ef_orvalho2', nome: '2° PONTO DE ORVALHO' },
          { id: 'ef_segunda_demao', nome: 'SEGUNDA DEMÃO DE ADESIVO' },
          { id: 'ef_fechamento', nome: 'FECHAMENTO DA EMENDA' },
          { id: 'ef_roletamento', nome: 'ROLETAMENTO DA EMENDA' },
        ],
      },
      {
        titulo: 'FINALIZAÇÃO',
        itens: [
          { id: 'ef_emenda_fin', nome: 'EMENDA FINALIZADA' },
          { id: 'ef_nao_conformidades', nome: 'NÃO CONFORMIDADES', allowsNA: true },
        ],
      },
    ],
  },
  'emenda-cabo': {
    id: 'emenda-cabo',
    nome: 'Emenda de Correia de Cabo de Aço',
    identificacaoLabel: 'Identificação da Emenda:',
    identificacaoPlaceholder: 'EX: CORREIA CABO DE AÇO TR-03',
    secoes: [
      {
        titulo: 'DADOS INICIAIS',
        itens: [{ id: 'ec_om_pag1', nome: 'OM (pág. 1)' }],
      },
      {
        titulo: 'DIMENSÕES',
        itens: [
          { id: 'ec_espessura_correia', nome: 'ESPESSURA DA CORREIA' },
          { id: 'ec_largura_emenda', nome: 'LARGURA DA EMENDA' },
          { id: 'ec_espessura_regua', nome: 'ESPESSURA DA RÉGUA' },
        ],
      },
      {
        titulo: 'MATERIAIS (FAB/VAL)',
        itens: [
          { id: 'ec_borracha_cob', nome: 'BORRACHA DE COBERTURA' },
          { id: 'ec_borracha_lig', nome: 'BORRACHA DE LIGAÇÃO' },
          { id: 'ec_ligacao_macarrao', nome: 'LIGAÇÃO (MACARRÃO)' },
          { id: 'ec_adesivo', nome: 'ADESIVO' },
          { id: 'ec_solvente', nome: 'SOLVENTE' },
          { id: 'ec_outros', nome: 'OUTROS', allowsNA: true },
        ],
      },
      {
        titulo: 'ALINHAMENTO',
        itens: [
          { id: 'ec_alinhamento', nome: 'ALINHAMENTO DA EMENDA' },
          { id: 'ec_comp_cabos', nome: 'COMP. DOS CABOS' },
        ],
      },
      {
        titulo: 'SUPERFÍCIE',
        itens: [
          { id: 'ec_cabos_limpos', nome: 'CABOS LIMPOS' },
          { id: 'ec_chanfros_lixados', nome: 'CHANFROS LIXADOS' },
          { id: 'ec_orvalho1', nome: '1° PONTO DE ORVALHO' },
          { id: 'ec_cob_inferior', nome: 'COBERTURA INFERIOR MONTADA' },
          { id: 'ec_espaguetamento', nome: 'ESPAGUETAMENTO FEITO' },
          { id: 'ec_cob_superior', nome: 'COBERTURA SUPERIOR MONTADA' },
        ],
      },
      {
        titulo: 'VARIÁVEIS DE VULCANIZAÇÃO',
        itens: [
          { id: 'ec_temp_vulc', nome: 'TEMP. DE VULCANIZAÇÃO (PAINEL PRENSA)' },
          { id: 'ec_pressao_bomba', nome: 'PRESSÃO DA BOMBA (KIT)' },
        ],
      },
      {
        titulo: 'FINALIZAÇÃO',
        itens: [
          { id: 'ec_emenda_vulc', nome: 'EMENDA VULCANIZADA' },
          { id: 'ec_lateral_dir', nome: 'LATERAL DIREITA' },
          { id: 'ec_lateral_esq', nome: 'LATERAL ESQUERDA' },
          { id: 'ec_medicao_dureza', nome: 'MEDIÇÃO DE DUREZA' },
          { id: 'ec_contraprova', nome: 'CONTRAPROVA DA DUREZA' },
          { id: 'ec_nao_conformidades', nome: 'NÃO CONFORMIDADES', allowsNA: true },
        ],
      },
    ],
  },
};
