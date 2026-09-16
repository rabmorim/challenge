import type { NftCreator } from '@/features/catalog/types/nft';

/**
 * Criadores do catalogo simulado.
 * Sao poucos de proposito: com tres criadores a busca por criador tem sempre
 * mais de um resultado, o que exercita o filtro de verdade.
 */
export const CREATOR_FIXTURES: Record<string, NftCreator> = {
  'nova-sato': {
    id: 'nova-sato',
    name: 'Nova Sato',
    avatarUrl: '/avatars/creator-nova-sato.png',
  },
  'nomad-atelier': {
    id: 'nomad-atelier',
    name: 'Nomad Atelier',
    avatarUrl: '/avatars/creator-nomad-atelier.png',
  },
  'oficina-aurora': {
    id: 'oficina-aurora',
    name: 'Oficina Aurora',
    avatarUrl: '/avatars/creator-oficina-aurora.png',
  },
};
