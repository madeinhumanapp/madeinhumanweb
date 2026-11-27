---
titol: "Galetes a la web: què cal abans de carregar"
resum: "Què exigeix l'article 22.2 de la LSSI-CE i el RGPD per a les galetes i scripts d'una web d'empresa: galetes tècniques, consentiment previ, disseny del bàner i política."
meta_descripcio: "Guia de galetes web per a empreses (art. 22.2 LSSI-CE): quines necessiten consentiment previ, com configurar el bàner i quins errors evitar."
data: 2026-12-05
etiqueta: rgpd
ninxol: general
tipus_article: guia
font_nom: "Llei 34/2002 (LSSI-CE) — BOE"
font_url: "https://www.boe.es/eli/es/l/2002/07/11/34/con"
fonts_addicionals: "https://eur-lex.europa.eu/eli/reg/2016/679/oj | https://www.aepd.es/ | https://apdcat.gencat.cat/"
servei_relacionat: web
cta_desti: diagnostic
estat: esborrany
idioma: ca
grup_hreflang: galetes-web-consentiment-lssi
---

> Abans de carregar galetes no necessàries —com analítica de tercers, píxels publicitaris o mapes integrats—, l'article 22.2 de la LSSI-CE exigeix informar clarament la persona usuària i obtenir-ne el consentiment previ. Si la vostra web només fa servir galetes estrictament tècniques, normalment no cal bàner de consentiment, però sí una política clara.

## Quines galetes necessiten consentiment previ i quines n'estan exemptes?

L'article 22.2 de la Llei 34/2002 (LSSI-CE) regula l'emmagatzematge i la recuperació de dades en el dispositiu de l'usuari (galetes i tecnologies equivalents com píxels o emmagatzematge local). A la pràctica, cal distingir dos grans grups:

- **Galetes exemptes (tècniques o estrictament necessàries):** les que permeten la navegació o presten un servei demanat expressament per l'usuari, com recordar el carretó d'una botiga, mantenir una sessió autenticada, equilibrar la càrrega del servidor o guardar la preferència del mateix bàner de galetes.
- **Galetes que requereixen consentiment previ:** galetes d'analítica (llevat de supòsits molt acotats de mesurament d'audiència que compleixin criteris estrictes), galetes de publicitat comportamental, píxels de xarxes socials i continguts incrustats de tercers que instal·len rastrejadors [REVISAR: confirmar criteris vigents de la Guia sobre l'ús de les cookies de l'Agència Espanyola de Protecció de Dades (AEPD) respecte de galetes analítiques pròpies o exemptes].

## Com ha de funcionar el bàner de galetes perquè el consentiment sigui vàlid?

Un error molt habitual és posar un bàner purament decoratiu que deixa carregar els scripts igualment. Perquè el consentiment compleixi el RGPD i les pautes de l'AEPD i de l'Autoritat Catalana de Protecció de Dades (APDCat), ha de ser lliure, específic, informat i inequívoc:

- **Bloqueig real abans de decidir:** cap galeta ni script no necessari s'ha de carregar abans que l'usuari accepti.
- **Acceptar i rebutjar al mateix nivell:** la primera capa del bàner ha d'oferir l'opció de rebutjar amb la mateixa visibilitat i facilitat que acceptar, sense amagar el rebuig en menús secundaris ni usar colors enganyosos [REVISAR: confirmar criteris exactes de la Guia de cookies vigent de l'AEPD sobre botó de rebutjar a la primera capa i murs de cookies].
- **Sense consentiment tàcit:** seguir navegant o fer *scroll* no es considera un consentiment vàlid.
- **Revocació fàcil:** l'usuari ha de poder canviar o retirar la seva decisió en qualsevol moment des d'un enllaç permanent (normalment al peu del web).

## Què heu d'explicar a la política de galetes?

La segona capa (la pàgina de política de galetes) ha de correspondre a la realitat tècnica del vostre web, no ser un text copiat genèric. Normalment ha d'incloure què són les galetes, quins tipus utilitza el lloc, la llista real de galetes o proveïdors amb la seva finalitat i durada, si impliquen transferències internacionals de dades i com configurar-les o revocar-les.

## Quins errors habituals trobem en webs de pimes?

Quan revisem webs corporatives i botigues online, els mateixos desajustos solen repetir-se:

- Carregar eines d'analítica o píxels de màrqueting des del primer segon, abans de clicar res al bàner.
- Incrustar vídeos o mapes de tercers que col·loquen galetes publicitàries sense bloqueig previ.
- Tenir un gestor de galetes gratuït mal configurat on el botó «Rebutjar» no atura realment els scripts.
- Mantenir una política de galetes desactualitzada que no reflecteix els plugins ni els serveis instal·lats actualment.

## Com podeu auditar les galetes de la vostra web en cinc passos?

Podeu comprovar en pocs minuts com es comporta realment el vostre lloc web:

1. **Obriu la web en una finestra privada:** sense clicar cap botó del bàner, obriu les eines de desenvolupador del navegador i reviseu quines galetes i peticions a tercers s'han carregat.
2. **Proveu el botó de rebutjar:** cliqueu rebutjar i comproveu que no s'activa cap script d'analítica ni publicitat.
3. **Reviseu el panell de configuració i la revocació:** verifiqueu que podeu triar categories per separat i reobrir la configuració des del peu del web.
4. **Contrasteu la llista real amb la política de galetes:** actualitzeu la pàgina legal perquè només descrigui les eines que feu servir de debò.
5. **Valoreu simplificar:** si no necessiteu publicitat ni analítica intrusiva, prescindir de galetes no tècniques redueix risc i millora l'experiència; podeu veure com ho ordenem a [Textos legals i formularis web](/serveis/textos-legals-web/).
