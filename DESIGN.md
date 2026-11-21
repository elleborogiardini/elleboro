# Design

## Theme

Verde bosco sulla prima schermata pubblica. Nel gestionale lo stesso verde solo per azioni e selezione. Fondo quasi bianco con una punta del verde del marchio, non carta calda. Oro solo come filo, non come bottone.

## Color

Token in `src/app/globals.css`, in OKLCH.

- `--forest` azioni e hero
- `--ink` testo
- `--paper` fondo
- `--gold` filo, non bottoni
- `--danger` errori
- `--grove` fondo alternato delle sezioni nel gestionale

Tema chiaro progettato per primo. La coppia scura usa gli stessi nomi e segue il sistema del telefono.

## Typography

Bricolage Grotesque, un solo carattere. Sul sito i titoli usano una scala ampia, tracking non più stretto di -0.03em. Nel gestionale la scala è fissa.

## Shape

Pannelli e foto a 12px. Il bottone principale è una pillola. Niente bordo insieme a un'ombra larga.

## Motion

Apertura del sito: salita breve, opacità piena da subito. Campi: linea verde che si disegna al focus in 220ms. Nel gestionale i passaggi restano corti. `prefers-reduced-motion` toglie lo spostamento.

## Tavole botaniche

Incisioni di elleboro in `public/botanica`, solo canale alfa. Si usano con `Botanica` da `src/components/botanica.tsx`, colorate dai token: oro sul verde dell'hero, `--herb` sulla carta e nel titolo del gestionale. Una tavola per schermata, mai sotto il testo di lettura, sempre decorative. Nel gestionale la vede solo il proprietario, piccola, accanto al titolo. Le sezioni del gestionale alternano `--surface` e `--grove`.

## Logo

Unico punto: `src/components/brand/Logo.tsx`, file `public/brand/logo.jpg`. Per sostituirlo, cambia quel file. In hero il file si vede intero, largo, su una lastra con un filo d’oro. La crema resta nel file, non diventa il fondo della pagina.
