# Encàrrecs per a Mistral — repositori de la web

Normes i procediment: `AGENTS.md` (arrel del repositori). Pla complet: `rgpdtool/docs/panell-web/PLA-ACCIONS.md`
(repositori privat).

Estat: ▶ a punt · ◐ en curs · ☑ integrat · ☐ encara no (depèn d'una altra feina)

| ID | Encàrrec | Estat | Branca de treball | Depèn de | Pot anar en paral·lel amb |
|---|---|---|---|---|---|
| WEB-H04 | [Port del generador de Python](WEB-H04-port-serveis.md) | ▶ | `mistral/WEB-H04` | — | H03b, L01 |
| WEB-H03b | [Bloc «actualitat» a dades](WEB-H03-bloc-a-dades.md) | ▶ | `mistral/WEB-H03b` | — | H04, L01 |
| WEB-H03d | [Bloc «serveis» a dades](WEB-H03-bloc-a-dades.md) | ☐ | `mistral/WEB-H03d` | H03b integrat (mateixos fitxers) | H04, L01 |
| WEB-L01 | [Revisió lingüística i de to](WEB-L01-revisio-linguistica.md) | ▶ | `mistral/WEB-L01` | — | tots |
| WEB-H05b | Pàgines legals a Markdown | ☐ | `mistral/WEB-H05b` | WEB-H05a (Claude: bloc `document`) | — |
| WEB-A02 | Migrar les 3 notícies actuals | ☐ | `mistral/WEB-A02` | WEB-A01 (Claude: tipus «notícia») | — |
| WEB-M05 | Subtítols dels vídeos | ☐ | `mistral/WEB-M05` | WEB-M03 (Claude: vídeos) | — |

Ordre recomanat: **WEB-H04 → WEB-H03b → WEB-H03d**, i **WEB-L01** quan vulguis. Un sol encàrrec obert per sessió de Vibe.

Quan un encàrrec queda integrat, Claude n'actualitza l'estat aquí i, si cal, escriu el següent.
