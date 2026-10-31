# Elleboro Giardini

Gestionale da campo e pagina pubblica per Elleboro Giardini. I dati dei clienti non compaiono sul sito.

## Requisiti

Node 22, Docker, Supabase CLI.

## Avvio

1. Copia `.env.example` in `.env.local` e compila i valori in locale.
2. Le email autorizzate e il token del feed stanno solo in `.local/` e nel database locale, non in Git.
3. `supabase start`
4. Copia URL e chiavi locali in `.env.local`.
5. Inserisci le due email autorizzate in `allowed_emails`, poi crea gli utenti dallo Studio. Un trigger rifiuta chi non è in lista.
6. `npm run dev`

Il sito pubblico è `/`. Il gestionale è `/app`.

Sul telefono, una volta sola. In Safari tocca Condividi, poi Aggiungi a Home. In Chrome tocca il menu, poi Aggiungi a schermata Home. L'icona apre il gestionale a schermo intero.

## Test

`npm test` prima di considerare fatta una modifica. Il test nasce rosso, poi il codice lo fa passare.

## Collegamento cloud

Dopo il login esplicito sull'account Supabase di Elleboro, `supabase link`. Il project ref resta fuori dal repository.
