/**
 * Dominios ENS oferecidos pelos formularios.
 *
 * Vivem no escopo global porque tres telas usam a MESMA lista — o "Nome ENS" do
 * pagamento, o do perfil e o das carteiras. Uma copia por feature divergiria na
 * primeira vez que alguem acrescentasse um dominio em so um lugar.
 */

/**
 * Dominios oferecidos no seletor "Nome ENS".
 * O frame mostra `.eth` selecionado; os demais existem para o seletor ser um
 * controle de verdade e nao uma caixa de uma opcao so.
 *
 * A ordem importa: `splitEnsName` casa o dominio MAIS LONGO primeiro, senao
 * `nova.kurio.eth` seria lido como rotulo `nova.kurio` + `.eth`.
 */
export const ENS_DOMAIN_OPTIONS: readonly string[] = ['.eth', '.kurio.eth', '.xyz'] as const;

/** Dominio ENS pre-selecionado, como no frame. */
export const DEFAULT_ENS_DOMAIN = '.eth';
