// Registra visitas e cliques no checkout na Supabase e repassa as UTMs para a Kiwify.
(function () {
  var cfg = window.SITE_CONFIG || {};
  var params = new URLSearchParams(location.search);
  var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "src"];
  var utm = {};
  keys.forEach(function (k) {
    var v = params.get(k);
    if (v) utm[k] = v.slice(0, 120);
  });

  // Guarda as UTMs da primeira visita para não perder a origem se a pessoa navegar.
  try {
    if (Object.keys(utm).length) sessionStorage.setItem("utm", JSON.stringify(utm));
    else utm = JSON.parse(sessionStorage.getItem("utm") || "{}");
  } catch (e) {}

  function log(tipo) {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
    var row = {
      tipo: tipo,
      utm_source: utm.utm_source || utm.src || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_content: utm.utm_content || null,
      referrer: (document.referrer || "").slice(0, 300) || null,
      dispositivo: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
    };
    try {
      fetch(cfg.supabaseUrl + "/rest/v1/eventos", {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.supabaseAnonKey,
          Prefer: "return=minimal"
        },
        body: JSON.stringify(row)
      }).catch(function () {});
    } catch (e) {}
  }

  // Leva as UTMs até o checkout, para a Kiwify mostrar de onde veio cada venda.
  document.querySelectorAll("a[data-checkout]").forEach(function (a) {
    var url = new URL(a.href);
    Object.keys(utm).forEach(function (k) { url.searchParams.set(k, utm[k]); });
    if (utm.utm_source && !utm.src) url.searchParams.set("src", utm.utm_source);
    a.href = url.toString();
    a.addEventListener("click", function () { log("clique_checkout"); });
  });

  log("visita");
})();
