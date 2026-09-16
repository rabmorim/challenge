import { useState } from 'react';

import { HeroBannerDesktop } from '@/features/catalog/components/hero-banner-desktop';
import { HeroBannerMobile } from '@/features/catalog/components/hero-banner-mobile';
import { useHeroHighlights } from '@/features/catalog/hooks/use-hero-highlights';

/**
 * Herói da Início.
 *
 * Guarda o estado do carrossel e escolhe a composição: o frame de 414 desenha
 * um cartão de 190px com círculos decorativos atrás do texto, e o de 1440
 * desenha o texto e a arte de 450px soltos sobre o fundo da página. São
 * layouts diferentes demais para caberem em um só JSX com utilitários
 * responsivos, então cada um é um componente — o dado e o estado ficam aqui,
 * uma vez só.
 *
 * Não há rotação automática de propósito: movimento contínuo precisaria de uma
 * exceção para `prefers-reduced-motion` e tornaria a regressão visual instável,
 * sem acrescentar nada ao fluxo.
 */
export function HeroBanner() {
  const { highlights, isPending } = useHeroHighlights();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = highlights[activeIndex] ?? highlights[0] ?? null;

  const layout = {
    highlights,
    active,
    activeIndex,
    onSelect: setActiveIndex,
    isPending,
  };

  return (
    <div data-testid="hero">
      <HeroBannerMobile {...layout} />
      <HeroBannerDesktop {...layout} />
    </div>
  );
}
