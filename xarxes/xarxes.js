// Pàgina d'enllaços (/xarxes/): fitxer propi perquè la CSP no permet scripts en línia (WEB-E01).
// Afegeix etiquetes UTM pròpies als enllaços de la web segons d'on ve la visita (?o=ig, ?o=tt, ?o=gbp).
// No hi ha cap rastrejador de tercers: només paràmetres que llegeix la teva pròpia web.
(function () {
  var fonts = { ig: "instagram", tt: "tiktok", gbp: "google" };
  var o = new URLSearchParams(location.search).get("o");
  var font = fonts[o] || "xarxes";
  document.querySelectorAll("a[data-utm]").forEach(function (a) {
    var url = new URL(a.href);
    url.searchParams.set("utm_source", font);
    url.searchParams.set("utm_medium", font === "google" ? "organic" : "social");
    url.searchParams.set("utm_campaign", "llancament-2026");
    url.searchParams.set("utm_content", "pagina-enllacos");
    a.href = url.toString();
  });
})();
