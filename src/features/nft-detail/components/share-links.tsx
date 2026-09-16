import { MailIcon } from 'lucide-react';

import { SocialIcon } from '@/components/social-icon';
import { DETAIL_COPY, SHARE_INTENT_URLS } from '@/features/nft-detail/constants/detail';
import type { ShareLinksProps } from '@/features/nft-detail/types/detail-components';

/**
 * Linha "Compartilhar este NFT".
 *
 * São os três glifos do frame — LinkedIn, e-mail e Twitter — e cada um leva ao
 * destino de verdade: as intenções públicas de compartilhamento das duas redes
 * e o cliente de e-mail do sistema. Nenhum deles finge sucesso: são links reais,
 * que abrem numa aba nova, com o endereço do NFT já preenchido.
 *
 * Os glifos de marca são decorativos; quem descreve a ação é o `aria-label` do
 * link que os envolve.
 *
 * @param props - Nome do NFT, que entra no assunto do e-mail e no texto do post.
 */
export function ShareLinks({ name }: ShareLinksProps) {
  const url = typeof window === 'undefined' ? '' : window.location.href;
  const encodedUrl = encodeURIComponent(url);
  const encodedName = encodeURIComponent(name);

  return (
    // 8px entre o rótulo e os glifos, e entre eles — no frame os três ficam
    // encostados na frase.
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-body-lg font-bold">{DETAIL_COPY.share}</span>

      <ul className="flex items-center gap-2">
        <li>
          <a
            href={`${SHARE_INTENT_URLS.linkedin}${encodedUrl}`}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={DETAIL_COPY.shareLinkedin}
            className="text-foreground rounded-control flex size-6 items-center justify-center"
          >
            <SocialIcon id="linkedin" className="size-5" />
          </a>
        </li>

        <li>
          <a
            href={`mailto:?subject=${encodedName}&body=${encodedUrl}`}
            aria-label={DETAIL_COPY.shareEmail}
            className="text-foreground rounded-control flex size-6 items-center justify-center"
          >
            <MailIcon className="size-5" aria-hidden="true" />
          </a>
        </li>

        <li>
          <a
            href={`${SHARE_INTENT_URLS.twitter}${encodedUrl}&text=${encodedName}`}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={DETAIL_COPY.shareTwitter}
            className="text-foreground rounded-control flex size-6 items-center justify-center"
          >
            <SocialIcon id="twitter" className="size-5" />
          </a>
        </li>
      </ul>
    </div>
  );
}
