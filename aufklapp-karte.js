// aufklapp-karte v1.0.1
// Einzeln installierbares Modul (Home Assistant Marketplace / HACS, Kategorie Dashboard).
window.customCards = window.customCards || [];
window.customCardFeatures = window.customCardFeatures || [];
// Eigener Block: Namen bleiben lokal, auch wenn mehrere Karten zusammen geladen werden.
{
// ---------------------------------------------------------------------------
// Aufklapp-Karte: Ueberschrift zum Antippen, darunter beliebige Karten, die ein- und ausgeklappt werden.
// Der Zustand (offen/zu) wird pro Geraet im Browser gemerkt.
//
//   type: custom:aufklapp-karte
//   titel: Service
//   icon: mdi:wrench
//   offen: false          # optional, Startzustand
//   cards: [ ...Karten... ]

const TYPE4 = "aufklapp-karte";

class AufklappKarte extends HTMLElement {
  setConfig(config) {
    if (!Array.isArray(config?.cards)) throw new Error("cards fehlt");
    this._config = config;
    this._key = `aufklapp-karte:${config.titel || ""}`;
    let gemerkt = null;
    try { gemerkt = localStorage.getItem(this._key); } catch (e) { /* kein Speicher */ }
    this._offen = gemerkt != null ? gemerkt === "1" : !!config.offen;
    this._karten = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    (this._karten || []).forEach((k) => { k.hass = hass; });
    if (this._offen && !this._karten) this._kartenBauen();
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const c = this._config;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .kopf {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px;
          cursor: pointer; user-select: none;
        }
        .kopf ha-icon { color: var(--state-icon-color, var(--secondary-text-color)); }
        .titel { flex: 1; font-size: 16px; font-weight: 500; color: var(--primary-text-color); }
        .pfeil { transition: transform 0.2s; color: var(--secondary-text-color); }
        :host([offen]) .pfeil { transform: rotate(180deg); }
        .inhalt { display: none; margin-top: 8px; }
        :host([offen]) .inhalt { display: flex; flex-direction: column; gap: 8px; }
      </style>
      <ha-card>
        <div class="kopf" role="button" tabindex="0" aria-expanded="${this._offen}">
          ${c.icon ? `<ha-icon icon="${c.icon}"></ha-icon>` : ""}
          <div class="titel"></div>
          <ha-icon class="pfeil" icon="mdi:chevron-down"></ha-icon>
        </div>
      </ha-card>
      <div class="inhalt"></div>`;
    this.shadowRoot.querySelector(".titel").textContent = c.titel || "";
    const kopf = this.shadowRoot.querySelector(".kopf");
    kopf.addEventListener("click", () => this._umschalten());
    kopf.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); this._umschalten(); } });
    this.toggleAttribute("offen", this._offen);
    if (this._offen && this._hass) this._kartenBauen();
  }

  _umschalten() {
    this._offen = !this._offen;
    try { localStorage.setItem(this._key, this._offen ? "1" : "0"); } catch (e) { /* kein Speicher */ }
    this.toggleAttribute("offen", this._offen);
    this.shadowRoot.querySelector(".kopf").setAttribute("aria-expanded", String(this._offen));
    if (this._offen && !this._karten) this._kartenBauen();
  }

  async _kartenBauen() {
    if (this._baut) return;
    this._baut = true;
    try {
      const helpers = await window.loadCardHelpers();
      const inhalt = this.shadowRoot.querySelector(".inhalt");
      inhalt.innerHTML = "";
      this._karten = this._config.cards.map((cfg) => {
        const k = helpers.createCardElement(cfg);
        k.hass = this._hass;
        inhalt.appendChild(k);
        return k;
      });
    } finally {
      this._baut = false;
    }
  }

  getCardSize() { return this._offen ? 1 + this._config.cards.length * 2 : 1; }
  // Startwerte, auch fuer die Vorschau in der Kartenauswahl
  static getStubConfig() {
    return { titel: "Aufklapp-Karte", icon: "mdi:chevron-down-circle-outline", offen: true,
      cards: [{ type: "markdown", content: "Beliebige Karten zum Auf- und Zuklappen." }] };
  }
}

if (!customElements.get(TYPE4)) customElements.define(TYPE4, AufklappKarte);
if (!window.customCards.some((c) => c.type === TYPE4)) {
  window.customCards.push({ type: TYPE4, name: "Aufklapp-Karte", description: "Ueberschrift zum Auf- und Zuklappen mit beliebigen Karten darunter", preview: true });
}
}

console.info("%c aufklapp-karte %c v1.0.0 ", "color:#fff;background:#03a9f4;font-weight:700", "color:#03a9f4");
