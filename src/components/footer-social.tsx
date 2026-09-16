import { toast } from 'sonner';

import { SocialIcon } from '@/components/social-icon';
import { FOOTER_COPY, FOOTER_SOCIALS } from '@/constants/footer';

/**
 * Bloco "Redes sociais" do rodapé.
 *
 * Perfis em redes de terceiros estão fora do escopo da entrega, então os
 * botões avisam isso em vez de abrir um link que não existe.
 *
 * O quadro é o do Figma: 32px, borda no accent e raio de controle, com o
 * logotipo desenhado por `SocialIcon`. O nome completo da rede vai no rótulo
 * acessível — o glifo sozinho não diz nada a quem usa leitor de tela.
 */
export function FooterSocial() {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-body-lg font-bold">{FOOTER_COPY.socialTitle}</h3>

      <ul className="flex items-center gap-2">
        {FOOTER_SOCIALS.map((social) => (
          <li key={social.id}>
            <button
              type="button"
              aria-label={`${social.label} — ${FOOTER_COPY.socialOutOfScope}`}
              onClick={() => {
                toast.info(FOOTER_COPY.socialOutOfScope);
              }}
              className="border-primary/60 text-primary rounded-control flex size-8 cursor-pointer items-center justify-center border"
            >
              <SocialIcon id={social.id} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
