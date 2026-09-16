import { Link } from '@tanstack/react-router';
import { useId } from 'react';
import { toast } from 'sonner';

import { FooterNewsletter } from '@/components/footer-newsletter';
import { FooterSocial } from '@/components/footer-social';
import { FOOTER_COLUMNS, FOOTER_COPY, FOOTER_HIGHLIGHTS } from '@/constants/footer';
import { BRAND_NAME } from '@/constants/brand';
import { useFooterCollections } from '@/features/catalog/hooks/use-footer-collections';

/**
 * Rodapé do site, presente em todas as telas do design.
 *
 * As colunas de coleções vêm das facetas do catálogo — o rodapé lista o que a
 * API realmente tem, e cada item leva ao Mercado já filtrado por aquela
 * coleção, em vez de ser um texto decorativo.
 *
 * Links de páginas editoriais não navegam: avisam que estão fora do escopo.
 *
 * Régua do Figma (caixa de 1200×610):
 * - destaques 250 · faixa da marca 85 · colunas de links 230 · direitos 45;
 * - bloco de destaques com padding 32 e 12px entre as quatro partes; cada parte
 *   separada pela linha divisória tem 16px de recuo nas laterais e 10px entre
 *   os próprios elementos — é o que dá o vão de 44px que se vê no frame;
 * - as três primeiras partes dividem a largura em 23% e a newsletter fica com
 *   31%, porque o campo de e-mail ocupa a coluna inteira;
 * - no rodapé o corpo de 14px anda em linha de 22 (e não os 24 do resto do
 *   site); nas colunas de links título e itens andam de 30 em 30, com 32px em
 *   cima e 18 embaixo — é o que faz os quatro blocos fecharem 250/85/230/45;
 * - a faixa da marca e as colunas de links usam a mesma grade de quatro
 *   colunas de 230 com 72px de vão, também com 32px de recuo. O vão de 72 vale
 *   só a partir de `xl`, onde a caixa cabe inteira nos 1200 do frame; abaixo
 *   disso o bloco aperta o vão em vez de estourar a largura da página.
 *
 * A caixa "Carteiras compatíveis" fica presa à coluna (`max-w-full`): no frame
 * ela sangra alguns pixels para fora, e em telas menores isso a jogava para
 * fora do rodapé. Com 10px (a medida que o frame usa) as três marcas cabem na
 * coluna de 230 em uma linha só, e em telas estreitas a caixa quebra em vez de
 * escapar.
 *
 * As alturas são mínimos (`min-h`), não travas: com fonte ampliada ou em
 * tradução mais longa o bloco cresce em vez de cortar conteúdo.
 */
export function SiteFooter() {
  const headingId = useId();
  const collections = useFooterCollections();

  return (
    <footer aria-labelledby={headingId} className="mt-24">
      <h2 className="sr-only" id={headingId}>
        {FOOTER_COPY.label}
      </h2>

      <div className="bg-card rounded-t-panel mx-auto max-w-(--container-page)">
        <div className="grid gap-3 p-8 md:grid-cols-2 lg:min-h-[250px] lg:grid-cols-[23fr_23fr_23fr_31fr] lg:divide-x lg:divide-primary/60">
          {FOOTER_HIGHLIGHTS.map((highlight) => (
            <section key={highlight.initial} className="flex flex-col gap-2.5 px-4">
              <span
                aria-hidden="true"
                className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-full text-[24px] leading-none font-bold"
              >
                {highlight.initial}
              </span>
              <h3 className="text-body-lg font-bold">{highlight.title}</h3>
              <p className="text-tan text-body leading-[22px]">{highlight.description}</p>
            </section>
          ))}

          <FooterNewsletter />
        </div>

        <div className="bg-band grid gap-4 px-8 py-4 md:grid-cols-4 md:items-center lg:min-h-[85px] lg:gap-12 xl:gap-18">
          <span className="text-label">{BRAND_NAME}</span>
          <span className="text-body">{FOOTER_COPY.tagline}</span>
          <a className="text-body rounded-control" href={`mailto:${FOOTER_COPY.email}`}>
            {FOOTER_COPY.email}
          </a>
          <span className="text-body">{FOOTER_COPY.phone}</span>
        </div>

        <div className="grid gap-8 px-8 pt-8 pb-[18px] md:grid-cols-2 lg:min-h-[230px] lg:grid-cols-4 lg:gap-12 xl:gap-18">
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col">
              <h3 className="text-body-lg leading-[30px] font-bold">{column.title}</h3>
              <ul className="flex flex-col">
                {column.links.map((link) => (
                  <li key={link.label} className="text-body leading-[30px]">
                    {link.to ? (
                      <Link to={link.to} className="rounded-control">
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="rounded-control cursor-pointer text-left"
                        onClick={() => {
                          toast.info(`"${link.label}" não faz parte desta demonstração.`);
                        }}
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label={FOOTER_COPY.collectionsTitle} className="flex flex-col">
            <h3 className="text-body-lg leading-[30px] font-bold">{FOOTER_COPY.collectionsTitle}</h3>
            <ul className="flex flex-col">
              {collections.map((collection) => (
                <li key={collection.id} className="text-body leading-[30px]">
                  <Link
                    to="/mercado"
                    search={{ collections: [collection.id] }}
                    className="rounded-control"
                  >
                    {collection.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-4">
            <FooterSocial />

            <div className="flex flex-col gap-2.5">
              <h3 className="text-body-lg font-bold">{FOOTER_COPY.walletsTitle}</h3>
              <p className="border-primary/60 bg-band text-primary rounded-control w-fit max-w-full border px-2 py-2 text-[10px]">
                {FOOTER_COPY.wallets}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-body flex min-h-[45px] items-center justify-center px-4 text-center">
        {FOOTER_COPY.rights}
      </p>
    </footer>
  );
}
