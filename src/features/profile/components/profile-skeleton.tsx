import { PROFILE_SKELETON_FIELDS } from '@/features/profile/constants/profile';

/**
 * Esqueleto da tela de perfil.
 *
 * As medidas são as do conteúdo real — rótulo de 20px, campo de 46px, grade de
 * duas colunas com o mesmo vão — para que o formulário **pouse no lugar** quando
 * chegar. Um bloco de altura arbitrária empurraria a coluna, que é exatamente o
 * deslocamento de layout que a auditoria mede.
 *
 * O shimmer vem da classe `.skeleton`, que já respeita movimento reduzido.
 */
export function ProfileSkeleton() {
  return (
    <div data-testid="profile-skeleton" aria-hidden="true" className="flex flex-col gap-8">
      <div className="skeleton rounded-control h-5 w-52" />

      <div className="grid grid-cols-1 gap-x-7 gap-y-8 md:grid-cols-2">
        {Array.from({ length: PROFILE_SKELETON_FIELDS }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="skeleton rounded-control h-5 w-32" />
            <div className="skeleton rounded-control h-[46px] w-full" />
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <div className="skeleton rounded-control h-5 w-20" />
          <div className="flex items-center gap-4">
            <div className="skeleton size-11 rounded-full" />
            <div className="skeleton rounded-control h-[38px] w-24" />
          </div>
        </div>
      </div>

      <div className="flex max-w-[416px] flex-col gap-5">
        <div className="skeleton rounded-control h-5 w-40" />
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="skeleton rounded-control h-5 w-36" />
            <div className="skeleton rounded-control h-[46px] w-full" />
          </div>
        ))}
        <div className="skeleton rounded-control h-[38px] w-32" />
      </div>
    </div>
  );
}
