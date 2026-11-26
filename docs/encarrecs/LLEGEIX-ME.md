# Encàrrecs per a Mistral i Gemini — repositori de la web

Normes i procediment: `AGENTS.md` (arrel del repositori). Pla complet: `rgpdtool/docs/panell-web/PLA-ACCIONS.md`
(repositori privat).

Estat: ▶ a punt · ◐ en curs · ☑ integrat · ☐ encara no (depèn d'una altra feina)

| ID | Encàrrec | Estat | Branca de treball | Depèn de | Pot anar en paral·lel amb |
|---|---|---|---|---|---|
| WEB-H04 | [Port del generador de Python](WEB-H04-port-serveis.md) | ☑ | `mistral/WEB-H04` | — | H03b, L01 |
| WEB-H03b | [Bloc «actualitat» a dades](WEB-H03-bloc-a-dades.md) | ☑ | `mistral/WEB-H03b` | — | H04, L01 |
| WEB-H03d | [Bloc «serveis» a dades](WEB-H03-bloc-a-dades.md) | ☑ | `mistral/WEB-H03d` | H03b integrat (mateixos fitxers) | H04, L01 |
| WEB-L01 | [Revisió lingüística i de to](WEB-L01-revisio-linguistica.md) | ☑ aplicat (WEB-L02) | `mistral/WEB-L01` | — | tots |
| WEB-L03 | [Esborrany en castellà de la FAQ](WEB-L03-faq-castella.md) | ☑ | `mistral/WEB-L03` | — | tots |
| WEB-H05b | [Pàgines legals a Markdown](WEB-H05b-pagines-legals.md) | ☑ | `mistral/WEB-H05b` | — | tots |
| WEB-L04 | [Esborrany en castellà de les pàgines legals](WEB-L04-legal-castella.md) | ☑ (falta validació jurídica) | `mistral/WEB-L04` | — | tots |
| WEB-H06 | [Pàgines de servei sense HTML al contingut](WEB-H06-serveis-sense-html.md) | ☑ | `mistral/WEB-H06` | — | tots |
| WEB-L05 | [Títols i descripcions per a Google](WEB-L05-seo.md) | ☑ (17 de 20 propostes) | `mistral/WEB-L05` | — | tots |
| WEB-L06 | [Revisió de les pàgines en castellà](WEB-L06-castella.md) | ☑ (3 de 4) | `mistral/WEB-L06` | — | tots |
| WEB-A02 | [Migrar les 3 notícies actuals](WEB-A02-migrar-noticies.md) | ☑ | `mistral/WEB-A02` | — (WEB-A01 fet) | tots |
| WEB-M02 | [Imatges i vídeos al generador](WEB-M02-media-generador.md) | ☑ | `mistral/WEB-M02` | — | WEB-M03 (rgpdtool) |
| WEB-M05 | Subtítols dels vídeos | ☐ | `mistral/WEB-M05` | WEB-M04 (panell) i vídeos reals | — |
| WEB-T01 | [Mapa del lloc generat sencer](WEB-T01-sitemap.md) (Gemini) | ☑ | `gemini/WEB-T01` | — | T03, T04 |
| WEB-T02 | [Hreflang coherent i prova global](WEB-T02-hreflang.md) (Gemini) | ☑ | `gemini/WEB-T02` | WEB-T01 integrat (mateix fitxer) | T03, T04 |
| WEB-T03 | [H1 a la pàgina de preguntes freqüents](WEB-T03-h1-faq.md) (Mistral) | ☑ | `mistral/WEB-T03` | — | T01, T04 |
| WEB-T04 | [Descripcions de 155 caràcters com a màxim](WEB-T04-meta-descripcions.md) (Mistral) | ☑ | `mistral/WEB-T04` | — | T01, T03 |
| WEB-T05 | [El domicili només a l'avís legal](WEB-T05-domicili.md) (Mistral) | ☑ | `mistral/WEB-T05` | — | T02 |
| WEB-T06 | [Plantilla d'article per a SEO](WEB-T06-plantilla-article.md) (Gemini) | ▶ | `gemini/WEB-T06` | — | T07, T08 |
| WEB-T07 | [Preguntes freqüents en castellà](WEB-T07-faq-castella.md) (Mistral) — no es fusiona sense validació | ◐ validació | `mistral/WEB-T07` | — | T06 |
| WEB-T08 | [Esborrany del test d'obligacions d'IA](WEB-T08-test-ia.md) (Mistral) — no es fusiona sense validació | ◐ correcció | `mistral/WEB-T08` | — | T06 |
| WEB-T09 | [Textos legals en castellà](WEB-T09-legal-castella.md) (Mistral) — no es fusiona sense validació | ▶ | `mistral/WEB-T09` | — | T06 |
| WEB-T10 | [Títols i descripcions dins dels límits](WEB-T10-titols.md) (Mistral) | ▶ | `mistral/WEB-T10` | — | T06 |

Ordre recomanat ara: **Gemini** WEB-T06; **Mistral** correcció de WEB-T08 → WEB-T10 → WEB-T09. Un sol encàrrec obert per sessió
(de Vibe o d'Antigravity). Branca base: `main`.

Quan un encàrrec queda integrat, Claude n'actualitza l'estat aquí i, si cal, escriu el següent.
