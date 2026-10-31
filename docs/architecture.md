# Architettura

Due lati.

Il sito pubblico legge solo viste pubblicate: testi, portfolio, testimonianze. Non interroga clienti, note, preferenze o appuntamenti.

Il gestionale è sotto `/app`, con sessione. Il tecnico e il proprietario condividono anagrafica, luoghi, foto, interventi, richieste e testi. Preferenze, specifiche, note e agenda sono del proprietario, sia nell'interfaccia sia nelle policy.

Le richieste pubbliche passano da una server action. Il browser non inserisce direttamente.

Il feed calendario è un indirizzo con token. Escono titolo, orario, cliente e luogo. Note e preferenze no. L'indirizzo solo se l'appuntamento lo consente.

Le foto dei clienti stanno nel bucket privato. Pubblicare ne fa una copia nel bucket del portfolio, senza id cliente.
