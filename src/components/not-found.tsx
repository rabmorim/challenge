import { Link } from '@tanstack/react-router';

import { ROUTES } from '@/constants/routes';

/**
 * Tela exibida quando a URL nao corresponde a nenhuma rota conhecida —
 * inclusive no acesso direto a um endereco desconhecido.
 */
export function NotFound() {
  return (
    <section className="mx-auto flex min-h-dvh max-w-(--container-page) flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-tan text-body">Erro 404</p>
      <h1 className="text-heading">Página não encontrada</h1>
      <p className="text-tan text-body max-w-prose">
        O endereço acessado não existe ou foi movido.
      </p>
      <Link
        to={ROUTES.home}
        className="bg-primary text-primary-foreground rounded-control px-6 py-3 text-label"
      >
        VOLTAR AO INÍCIO
      </Link>
    </section>
  );
}
