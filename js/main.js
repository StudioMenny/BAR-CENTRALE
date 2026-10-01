/* =========================================================
   BAR CENTRALE — script del sito
   ---------------------------------------------------------
   ORARI: modificali SOLO qui. Il sito li usa per:
   - la tabella orari (footer + pagina Contatti)
   - il cartellino "Aperto ora / Chiuso" in home e contatti
   Formato: "HH:MM-HH:MM". Più fasce nello stesso giorno = più voci.
   Giorno di chiusura = [] (lista vuota).
   Chiusura dopo mezzanotte? Scrivi pure "18:00-01:00": funziona.
   ========================================================= */
var ORARI = {
  1: ["06:00-20:30"],                 // lunedì
  2: ["06:00-20:30"],                 // martedì
  3: [],                              // mercoledì (chiuso)
  4: ["06:00-20:30"],                 // giovedì
  5: ["06:00-23:00"],                 // venerdì
  6: ["06:30-23:00"],                 // sabato
  0: ["07:00-13:00", "16:00-21:00"]   // domenica
};

(function () {
  "use strict";

  var GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  var ORDINE = [1, 2, 3, 4, 5, 6, 0];

  function sicuro(nome, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn("[" + nome + "]", e); }
  }
  function maiuscola(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- orari e stato aperto/chiuso ---------- */
  function minuti(hhmm) {
    var p = String(hhmm).trim().split(":");
    var h = parseInt(p[0], 10), m = parseInt(p[1] || "0", 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }
  function fasce(giorno) {
    var lista = ORARI[giorno] || [];
    var out = [];
    for (var i = 0; i < lista.length; i++) {
      var pezzi = String(lista[i]).split("-");
      if (pezzi.length !== 2) continue;
      var s = minuti(pezzi[0]), e = minuti(pezzi[1]);
      if (s === null || e === null) continue;
      if (e <= s) e += 1440; // oltre mezzanotte
      out.push({ s: s, e: e, testo: pezzi[0].trim() + " – " + pezzi[1].trim() });
    }
    out.sort(function (a, b) { return a.s - b.s; });
    return out;
  }
  function hhmm(m) {
    m = ((m % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60), mm = m % 60;
    return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
  }
  function calcolaStato(adesso) {
    var g = adesso.getDay();
    var t = adesso.getHours() * 60 + adesso.getMinutes();
    var oggi = fasce(g), ieri = fasce((g + 6) % 7), i;

    for (i = 0; i < ieri.length; i++) {
      if (ieri[i].e > 1440 && t < ieri[i].e - 1440) return { aperto: true, testo: "Aperto ora · chiude alle " + hhmm(ieri[i].e) };
    }
    for (i = 0; i < oggi.length; i++) {
      if (t >= oggi[i].s && t < oggi[i].e) return { aperto: true, testo: "Aperto ora · chiude alle " + hhmm(oggi[i].e) };
    }
    for (i = 0; i < oggi.length; i++) {
      if (oggi[i].s > t) return { aperto: false, testo: "Chiuso · apre oggi alle " + hhmm(oggi[i].s) };
    }
    for (var k = 1; k <= 7; k++) {
      var gg = (g + k) % 7, f = fasce(gg);
      if (f.length) {
        var quando = k === 1 ? "domani" : GIORNI[gg];
        return { aperto: false, testo: "Chiuso · apre " + quando + " alle " + hhmm(f[0].s) };
      }
    }
    return { aperto: false, testo: "Chiuso" };
  }
  function disegnaOrari() {
    var liste = document.querySelectorAll("[data-orari]");
    var oggi = new Date().getDay();
    for (var n = 0; n < liste.length; n++) {
      var ul = liste[n];
      ul.innerHTML = "";
      for (var i = 0; i < ORDINE.length; i++) {
        var g = ORDINE[i], f = fasce(g);
        var li = document.createElement("li");
        if (g === oggi) { li.className = "oggi"; li.setAttribute("aria-current", "date"); }
        var a = document.createElement("span");
        a.textContent = maiuscola(GIORNI[g]) + (g === oggi ? " (oggi)" : "");
        var b = document.createElement("span");
        if (f.length) {
          b.textContent = f.map(function (x) { return x.testo; }).join(" / ");
        } else {
          b.textContent = "Chiuso"; b.className = "chiuso-txt";
        }
        li.appendChild(a); li.appendChild(b); ul.appendChild(li);
      }
    }
  }
  function aggiornaStato() {
    var st = calcolaStato(new Date());
    var el = document.querySelectorAll("[data-stato]");
    for (var i = 0; i < el.length; i++) {
      el[i].textContent = st.testo;
      el[i].classList.toggle("is-aperto", st.aperto);
      el[i].classList.toggle("is-chiuso", !st.aperto);
    }
  }

  /* ---------- menu mobile ---------- */
  function menuMobile() {
    var header = document.querySelector(".header");
    var burger = document.querySelector(".burger");
    if (!header || !burger) return;
    function chiudi() {
      header.classList.remove("aperto");
      document.body.classList.remove("menu-aperto");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Apri il menu");
    }
    burger.addEventListener("click", function () {
      var apri = !header.classList.contains("aperto");
      header.classList.toggle("aperto", apri);
      document.body.classList.toggle("menu-aperto", apri);
      burger.setAttribute("aria-expanded", apri ? "true" : "false");
      burger.setAttribute("aria-label", apri ? "Chiudi il menu" : "Apri il menu");
    });
    var link = header.querySelectorAll(".nav a");
    for (var i = 0; i < link.length; i++) link[i].addEventListener("click", chiudi);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("aperto")) { chiudi(); burger.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) chiudi(); });
  }

  /* ---------- foto: comparsa morbida + riquadro pulito se manca il file ---------- */
  function fotoMancanti() {
    var img = document.querySelectorAll(".foto img");
    for (var i = 0; i < img.length; i++) {
      (function (im) {
        var fig = im.parentElement;
        function mostra() {
          im.classList.add("caricata");
          if (fig) fig.classList.add("pronta");
        }
        function segna() {
          mostra();
          if (fig) fig.classList.add("noimg");
          var btn = im.closest ? im.closest("button") : null;
          if (btn) { btn.classList.add("noimg-btn"); btn.disabled = true; }
        }
        if (im.complete) {
          if (im.naturalWidth === 0 && im.getAttribute("src")) segna(); else mostra();
        } else {
          im.addEventListener("load", mostra);
          im.addEventListener("error", segna);
        }
      })(img[i]);
    }
    // rete lentissima: dopo 6 secondi mostra comunque quello che c'è
    setTimeout(function () {
      for (var j = 0; j < img.length; j++) if (!img[j].classList.contains("caricata")) img[j].classList.add("caricata");
    }, 6000);
  }

  /* ---------- filtri del listino ---------- */
  function filtriListino() {
    var bottoni = document.querySelectorAll(".filtri button");
    var lavagna = document.querySelector(".lavagna");
    if (!bottoni.length || !lavagna) return;
    var cat = lavagna.querySelectorAll(".categoria");
    function scegli(id) {
      for (var i = 0; i < bottoni.length; i++) {
        bottoni[i].setAttribute("aria-pressed", bottoni[i].getAttribute("data-filtro") === id ? "true" : "false");
      }
      for (var j = 0; j < cat.length; j++) cat[j].hidden = !(id === "tutto" || cat[j].id === id);
      lavagna.classList.toggle("filtrata", id !== "tutto");
    }
    for (var i = 0; i < bottoni.length; i++) {
      bottoni[i].addEventListener("click", function () { scegli(this.getAttribute("data-filtro")); });
    }
    var h = (location.hash || "").replace("#", "");
    if (h && document.getElementById(h) && document.getElementById(h).classList.contains("categoria")) scegli(h);
  }

  /* ---------- galleria ingrandita ---------- */
  function galleria() {
    var box = document.querySelector(".lightbox");
    var voci = document.querySelectorAll(".galleria button");
    if (!box || !voci.length) return;
    var img = box.querySelector("img");
    var chiudiBtn = box.querySelector(".lightbox-chiudi");
    var ultimo = null;
    function chiudi() {
      box.classList.remove("aperto");
      document.body.classList.remove("menu-aperto");
      img.removeAttribute("src");
      if (ultimo) ultimo.focus();
    }
    for (var i = 0; i < voci.length; i++) {
      voci[i].addEventListener("click", function () {
        var sorgente = this.querySelector("img");
        if (!sorgente || this.classList.contains("noimg-btn")) return;
        ultimo = this;
        img.src = sorgente.currentSrc || sorgente.src;
        img.alt = sorgente.alt || "";
        box.classList.add("aperto");
        document.body.classList.add("menu-aperto");
        chiudiBtn.focus();
      });
    }
    chiudiBtn.addEventListener("click", chiudi);
    box.addEventListener("click", function (e) { if (e.target === box) chiudi(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("aperto")) return;
      if (e.key === "Escape") chiudi();
      if (e.key === "Tab") { e.preventDefault(); chiudiBtn.focus(); }
    });
  }

  /* ---------- banner informativo cookie ---------- */
  function bannerCookie() {
    var b = document.querySelector(".cookie");
    if (!b) return;
    var CHIAVE = "barcentrale-info-cookie";
    var visto = false;
    try { visto = window.localStorage.getItem(CHIAVE) === "1"; } catch (e) { visto = false; }
    if (!visto) b.classList.add("visibile");
    var ok = b.querySelector("button");
    if (ok) ok.addEventListener("click", function () {
      b.classList.remove("visibile");
      try { window.localStorage.setItem(CHIAVE, "1"); } catch (e) { /* navigazione privata: pazienza */ }
    });
  }

  /* ---------- torna su ---------- */
  function tornaSu() {
    var su = document.querySelector(".su");
    if (!su) return;
    var attesa = false;
    function controlla() { su.classList.toggle("visibile", window.pageYOffset > 700); attesa = false; }
    window.addEventListener("scroll", function () {
      if (!attesa) { attesa = true; window.requestAnimationFrame(controlla); }
    }, { passive: true });
    su.addEventListener("click", function () { window.scrollTo(0, 0); });
    controlla();
  }

  /* ---------- avvio ---------- */
  function avvia() {
    window.barPronto = true;
    sicuro("orari", disegnaOrari);
    sicuro("stato", aggiornaStato);
    setInterval(function () { sicuro("stato", aggiornaStato); }, 60000);
    sicuro("menu", menuMobile);
    sicuro("foto", fotoMancanti);
    sicuro("filtri", filtriListino);
    sicuro("galleria", galleria);
    sicuro("cookie", bannerCookie);
    sicuro("su", tornaSu);
    sicuro("anno", function () {
      var a = document.querySelectorAll("[data-anno]");
      for (var i = 0; i < a.length; i++) a[i].textContent = new Date().getFullYear();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia);
  else avvia();
})();
