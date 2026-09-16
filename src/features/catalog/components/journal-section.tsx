import { ArrowRightIcon } from 'lucide-react';
import { toast } from 'sonner';

import { HOME_COPY } from '@/features/catalog/constants/catalog-copy';
import { JOURNAL_ENTRIES, JOURNAL_OUT_OF_SCOPE } from '@/features/catalog/constants/home-content';

/**
 * Seção "Diário da Cunhagem" da Início.
 *
 * Conteúdo editorial, que o enunciado §3 deixa fora da entrega: os cartões
 * existem porque estão no frame, e "Ler mais" diz que o artigo não faz parte da
 * demonstração — nada de link para uma tela inexistente nem de sucesso fingido.
 *
 * Tipografia do frame: data, resumo e "Ler mais" em 12px (`text-caption`) e só
 * o título em 16px, que é o que dá ao cartão a hierarquia do `design/Início.png`.
 */
export function JournalSection() {
  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-heading">{HOME_COPY.journalTitle}</h2>
        <p className="text-tan text-body max-w-[760px]">{HOME_COPY.journalSubtitle}</p>
      </div>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {JOURNAL_ENTRIES.map((entry) => (
          <li key={entry.title} className="bg-card rounded-panel flex flex-col overflow-hidden">
            <img
              src={entry.imageUrl}
              alt=""
              width={268}
              height={190}
              loading="lazy"
              decoding="async"
              className="h-[190px] w-full object-cover"
            />

            <div className="flex flex-1 flex-col gap-2 p-4">
              <p className="text-tan text-caption">
                {entry.date} <span aria-hidden="true">|</span> {entry.readingTime}
              </p>
              <h3 className="text-body-lg font-bold">{entry.title}</h3>
              <p className="text-tan text-caption flex-1">{entry.description}</p>

              <button
                type="button"
                className="text-link text-caption rounded-control inline-flex w-fit cursor-pointer items-center gap-2"
                onClick={() => {
                  toast.info(JOURNAL_OUT_OF_SCOPE);
                }}
              >
                {HOME_COPY.journalReadMore}
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                <span className="sr-only">: {entry.title}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
