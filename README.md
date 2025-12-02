# Svenska Myndigheter | Analysverktyg

Ett modernt, interaktivt verktyg för att utforska, visualisera och analysera den svenska statsförvaltningens utveckling från 1978 till idag.

**Öppna verktyget här:** [isakskogstad.github.io/myndigheter](https://isakskogstad.github.io/myndigheter)


## Funktioner

*   **Historisk Överblick:** Se hur antalet myndigheter och anställda förändrats över tid (1978-2025).
*   **Jämförelsevy:** Jämför upp till tre myndigheter sida-vid-sida (personal, budget, struktur).
*   **Avancerade Filter:** Sök och filtrera på departement, ledningsform, status och region.
*   **Datavisualisering:** Interaktiva grafer för könsfördelning, regional spridning och departementsstruktur.
*   **Export:** Ladda ner dataset som CSV för egen analys.


### Projektstruktur

```
src/
├── components/
│   ├── layout/         # Sidebar, Header, Layout wrapper
│   ├── views/          # Dashboard, Register, Jämförelse, m.m.
│   ├── charts/         # Återanvändbara grafer
│   └── ui/             # UI-komponenter (Slider, Loading, etc.)
├── data/               # Statiska dataset och API-logik
└── hooks/              # Custom hooks (useAgencyData, useUrlState)
```

## Komma igång

1.  **Klona:** `git clone https://github.com/isakskogstad/myndigheter.git`
2.  **Installera:** `npm install`
3.  **Starta:** `npm start`
4.  **Bygg:** `npm run build`

## Datakällor

Data sammanställs från öppna källor:
*   [Civic Tech Sweden](https://github.com/civictechsweden/myndighetsdata)
*   Ekonomistyrningsverket (ESV)
*   Statistiska centralbyrån (SCB)
*   Wikidata

## Licens

MIT License.
