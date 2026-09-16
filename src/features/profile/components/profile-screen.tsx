import { LiveRegion } from '@/components/live-region';
import { Button } from '@/components/ui/button';
import { PasswordSection } from '@/features/profile/components/password-section';
import { ProfileFields } from '@/features/profile/components/profile-fields';
import { ProfileSkeleton } from '@/features/profile/components/profile-skeleton';
import { PROFILE_COPY } from '@/features/profile/constants/profile';
import { useAvatarControl } from '@/features/profile/hooks/use-avatar-control';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useSession } from '@/features/auth/hooks/use-session';

/**
 * Tela "Perfil do colecionador" (`design/Perfil do Colecionador.png`).
 *
 * O frame tem **um formulário só**, com um "Salvar" que cobre os dados e a
 * troca de senha — o despacho para as duas mutations fica em `useProfileForm`,
 * e aqui só se desenha. O `noValidate` é deliberado: as mensagens são nossas e
 * ficam associadas aos campos, e o balão do navegador competiria com elas e
 * sumiria ao primeiro clique.
 *
 * O bloco de avatar é o único que salva sozinho: no frame ele tem os próprios
 * botões, e um avatar escolhido que só aparecesse depois do "Salvar" lá embaixo
 * seria uma espera sem motivo.
 */
export function ProfileScreen() {
  const { user } = useSession();
  const state = useProfile();
  const avatar = useAvatarControl(user?.id ?? '', state.profile?.avatarUrl ?? '');

  if (state.isPending) return <ProfileSkeleton />;

  if (state.isError || !state.profile) {
    return (
      <div role="alert" data-testid="profile-error" className="flex flex-col items-start gap-3">
        <h1 className="text-heading">{PROFILE_COPY.title}</h1>
        <p className="text-tan text-body">{state.error?.message ?? PROFILE_COPY.loadError}</p>
        <Button variant="outline" size="sm" onClick={state.refetch}>
          {PROFILE_COPY.retry}
        </Button>
      </div>
    );
  }

  const { form, profile } = state;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-body-lg font-bold">{PROFILE_COPY.title}</h1>

      <LiveRegion testId="profile-status" message={form.announcement} />

      <form
        noValidate
        data-testid="profile-form"
        aria-label={PROFILE_COPY.title}
        className="flex flex-col gap-8"
        onSubmit={form.submit}
      >
        <ProfileFields
          form={form}
          avatar={avatar}
          displayName={profile.displayName}
          avatarInitial={profile.username.slice(0, 1).toUpperCase()}
        />

        <div className="flex max-w-[416px] flex-col gap-6">
          <PasswordSection form={form} />

          <Button type="submit" className="w-fit px-10" disabled={form.isSaving}>
            {form.isSaving ? PROFILE_COPY.submitting : PROFILE_COPY.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}
