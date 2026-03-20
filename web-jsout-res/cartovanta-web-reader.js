(function (global) {
  "use strict";

  const DOUBLE_TAP_MS = 300;
  const DRAW_CARD_MAX_HEIGHT_PX = 180;
  // tarot-reader-v21-cartovanta-0.1

  function shuffleArray(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function lightShuffleArray(array) {
    const copy = array.slice();
    for (let i = 0; i < copy.length - 1; i += 1) {
      const span = Math.min(4, copy.length - i);
      const j = i + Math.floor(Math.random() * span);
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function clampRotation(deg) {
    var out = deg % 360;
    if (out < 0) out += 360;
    return out;
  }

  function resolveUrl(baseUrl, maybeRelativeUrl) {
    return new URL(maybeRelativeUrl, baseUrl).href;
  }

  function selectedCardSummary(card) {
    return card ? " | Selected: " + card.name : "";
  }

  function byId(id) {
    return document.getElementById(id);
  }

  class TarotReaderApp {
    constructor(root) {
      if (!root) throw new Error("TarotReaderApp requires a root element.");
      this.root = root;
      this.deck = null;
      this.deckUrl = "";
      this.originalDeckOrder = [];
      this.deckOrder = [];
      this.drawIndex = 0;
      this.tableCards = [];
      this.selectedCardId = null;
      this.dragState = null;
      this.flashTimer = null;
      this.flashMessage = "";
      this.zoomedCardId = null;
      this.pendingClickTimer = null;
      this.lastTouchTap = null;
      this.inversionEnabled = false;

      this.installBaseUi();
      this.bindUi();

      var deckUrl = root.dataset.deckUrl;
      if (!deckUrl) throw new Error("data-deck-url is required.");
      this.loadDeckFromUrl(deckUrl).catch((error) => {
        this.setFlashMessage("Could not load deck: " + error.message, 6000);
        console.error(error);
      });
    }

    installBaseUi() {
      this.root.innerHTML = [
        '<style>',
        '#tarot-app { --side-width: 170px; font-family: sans-serif; margin: 0; padding: 1rem; background: #f4f1ea; color: #111; min-height: 100vh; box-sizing: border-box; }',
        '#tarot-app .layout { display: flex; gap: 1rem; align-items: stretch; }',
        '#tarot-app .sidebar { width: var(--side-width); min-width: var(--side-width); display: flex; flex-direction: column; gap: 0.5rem; }',
        '#tarot-app button { font: inherit; padding: 0.55rem 0.7rem; width: 100%; }',
        '#tarot-app .draw-card-button { padding: 0.25rem; aspect-ratio: 3 / 5; height: auto; max-height: ' + DRAW_CARD_MAX_HEIGHT_PX + 'px; display: flex; align-items: center; justify-content: center; overflow: hidden; }',
        '#tarot-app .draw-card-button img { width: 100%; height: 100%; object-fit: contain; display: block; border-radius: 8px; }',
        '#tarot-app .inversion-toggle { display: flex; align-items: center; gap: 0.5rem; font: inherit; padding: 0.25rem 0; }',
        '#tarot-app .main { flex: 1 1 auto; min-width: 0; }',
        '#tarot-app .flash { min-height: 1.4em; margin-bottom: 0.35rem; font-weight: 600; }',
        '#tarot-app .status { margin-bottom: 0.75rem; font-size: 0.95rem; }',
        '#tarot-app .table { position: relative; width: 100%; min-height: 78vh; border: 2px solid #6b5f4a; background: #2d5a3d; overflow: hidden; touch-action: none; }',
        '#tarot-app .table.shuffle-animate { animation: tarotShufflePulse 0.9s ease-in-out 1; }',
        '@keyframes tarotShufflePulse {',
        '  0% { transform: scale(1); box-shadow: 0 0 0 rgba(255,255,255,0); }',
        '  50% { transform: scale(1.01); box-shadow: 0 0 0.9rem rgba(255,255,255,0.18); }',
        '  100% { transform: scale(1); box-shadow: 0 0 0 rgba(255,255,255,0); }',
        '}',
        '#tarot-app .tarot-card { position: absolute; transform-origin: center center; cursor: grab; user-select: none; box-sizing: border-box; }',
        '#tarot-app .tarot-card.selected { outline: 3px solid #ffd24d; outline-offset: 2px; }',
        '#tarot-app .tarot-card img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; display: block; pointer-events: none; box-shadow: 0 4px 10px rgba(0,0,0,0.35); }',
        '#tarot-app .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.72); display: none; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; box-sizing: border-box; }',
        '#tarot-app .overlay.open { display: flex; }',
        '#tarot-app .overlay-inner { position: relative; display: inline-flex; align-items: center; justify-content: center; width: auto; height: auto; max-width: 100%; max-height: 100%; }',
        '#tarot-app .overlay img { width: auto; height: auto; object-fit: contain; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.5); background: white; }',
        '',
        '@media (max-width: 900px) {',
        '  #tarot-app .layout { flex-direction: column-reverse; }',
        '  #tarot-app .sidebar { width: 100%; min-width: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }',
        '  #tarot-app .table { min-height: 65vh; }',
        '}',
        '</style>',
        '<div class="layout">',
        '  <div class="sidebar">',
        '    <button type="button" data-role="shuffle-full">Full Shuffle</button>',
        '    <button type="button" data-role="shuffle-light">Light Shuffle</button>',
        '    <button type="button" data-role="shuffle-restack">Restack &amp; Shuffle</button>',
        '    <button type="button" data-role="draw" class="draw-card-button" aria-label="Draw Card"><img data-role="draw-card-image" alt="Draw Card"></button>',
        '    <button type="button" data-role="flip">Flip Selected</button>',
        '    <button type="button" data-role="rotate-left">Rotate -90°</button>',
        '    <button type="button" data-role="rotate-right">Rotate +90°</button>',
        '    <button type="button" data-role="zoom">Zoom Selected</button>',
        '    <label class="inversion-toggle"><input type="checkbox" data-role="inversion-toggle"> Inversion in Shuffle</label>',
        '  </div>',
        '  <div class="main">',
        '    <div class="flash" data-role="flash"></div>',
        '    <div class="status" data-role="status">Loading…</div>',
        '    <div class="table" data-role="table"></div>',
        '  </div>',
        '</div>',
        '<div class="overlay" data-role="overlay">',
        '  <div class="overlay-inner">',
        '    <img data-role="zoom-image" alt="">',
        '',
        '  </div>',
        '</div>'
      ].join("");

      this.el = {
        shuffleFull: this.root.querySelector('[data-role="shuffle-full"]'),
        shuffleLight: this.root.querySelector('[data-role="shuffle-light"]'),
        shuffleRestack: this.root.querySelector('[data-role="shuffle-restack"]'),
        draw: this.root.querySelector('[data-role="draw"]'),
        drawCardImage: this.root.querySelector('[data-role="draw-card-image"]'),
        flip: this.root.querySelector('[data-role="flip"]'),
        rotateLeft: this.root.querySelector('[data-role="rotate-left"]'),
        rotateRight: this.root.querySelector('[data-role="rotate-right"]'),
        zoom: this.root.querySelector('[data-role="zoom"]'),
        inversionToggle: this.root.querySelector('[data-role="inversion-toggle"]'),
        flash: this.root.querySelector('[data-role="flash"]'),
        status: this.root.querySelector('[data-role="status"]'),
        table: this.root.querySelector('[data-role="table"]'),
        overlay: this.root.querySelector('[data-role="overlay"]'),
        zoomImage: this.root.querySelector('[data-role="zoom-image"]'),
      };
    }

    bindUi() {
      this.el.shuffleFull.addEventListener("click", () => this.shuffleDeck("full"));
      this.el.shuffleLight.addEventListener("click", () => this.shuffleDeck("light"));
      this.el.shuffleRestack.addEventListener("click", () => this.shuffleDeck("restack"));
      this.el.draw.addEventListener("click", () => this.drawCard());
      this.el.flip.addEventListener("click", () => this.flipSelectedCard());
      this.el.rotateLeft.addEventListener("click", () => this.rotateSelectedCard(-90));
      this.el.rotateRight.addEventListener("click", () => this.rotateSelectedCard(90));
      this.el.zoom.addEventListener("click", () => this.zoomSelectedCard());
      this.el.inversionToggle.addEventListener("change", (event) => {
        this.inversionEnabled = !!event.target.checked;
        this.renderStatusOnly();
      });

      this.el.table.addEventListener("pointermove", (event) => this.handlePointerMove(event));
      this.el.table.addEventListener("pointerup", () => this.stopDragging());
      this.el.table.addEventListener("pointercancel", () => this.stopDragging());
      this.el.table.addEventListener("pointerleave", () => this.stopDragging());
      this.el.table.addEventListener("dblclick", (event) => this.handleTableDoubleClick(event));

      this.el.overlay.addEventListener("click", (event) => {
        if (event.target === this.el.overlay) this.closeZoom();
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && this.zoomedCardId) this.closeZoom();
      });
    }

    async loadDeckFromUrl(deckUrl) {
      var absoluteDeckUrl = resolveUrl(global.location.href, deckUrl);
      var response = await fetch(absoluteDeckUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      var deck = await response.json();
      this.deckUrl = absoluteDeckUrl;
      this.loadDeck(deck);
    }

    validateDeck(deck) {
      if (!deck || typeof deck !== "object" || Array.isArray(deck)) {
        throw new Error("Unsupported or invalid deck format.");
      }
      if (deck.format !== "cartovanta-v0.1") {
        throw new Error("Unsupported or invalid deck format.");
      }
      if (typeof deck.deckId !== "string" || deck.deckId === "") {
        throw new Error("Deck is missing required fields.");
      }
      if (typeof deck.deckName !== "string" || deck.deckName === "") {
        throw new Error("Deck is missing required fields.");
      }
      if (typeof deck.version !== "string" || deck.version === "") {
        throw new Error("Deck is missing required fields.");
      }
      if (!deck.backImage || typeof deck.backImage !== "string") {
        throw new Error("Deck is missing required fields.");
      }
      if (!deck.cardSize || typeof deck.cardSize !== "object" || Array.isArray(deck.cardSize)) {
        throw new Error("Deck is missing cardSize.");
      }
      if (!Number.isFinite(deck.cardSize.width) || !Number.isFinite(deck.cardSize.height)) {
        throw new Error("cardSize.width and cardSize.height must be numbers.");
      }
      if (typeof deck.meta !== "object" || deck.meta === null || Array.isArray(deck.meta)) {
        throw new Error("Deck is missing required fields.");
      }
      if (!Array.isArray(deck.cards) || deck.cards.length === 0) {
        throw new Error("Deck is missing required fields.");
      }

      var seenIds = new Set();

      for (var i = 0; i < deck.cards.length; i += 1) {
        var card = deck.cards[i];
        if (!card.id || !card.name || !card.frontImage || typeof card.meta !== "object" || card.meta === null || Array.isArray(card.meta)) {
          throw new Error("Each card must have id, name, frontImage, and meta object.");
        }
        if (seenIds.has(card.id)) {
          throw new Error("Each card id must be unique.");
        }
        seenIds.add(card.id);
      }
    }

    loadDeck(deck) {
      this.validateDeck(deck);
      this.deck = {
        format: deck.format,
        deckId: deck.deckId,
        deckName: deck.deckName,
        version: deck.version,
        backImage: resolveUrl(this.deckUrl, deck.backImage),
        cardSize: deck.cardSize,
        meta: deck.meta,
        cards: deck.cards.map((card) => ({
          id: card.id,
          name: card.name,
          frontImage: resolveUrl(this.deckUrl, card.frontImage),
          meta: card.meta
        }))
      };
      this.originalDeckOrder = this.deck.cards.map((card) => ({ id: card.id, isReversed: false }));
      this.deckOrder = shuffleArray(this.originalDeckOrder);
      this.drawIndex = 0;
      this.tableCards = [];
      this.selectedCardId = null;
      this.zoomedCardId = null;
      this.pendingClickTimer = null;
      this.setFlashMessage('Loaded "' + this.deck.deckName + '".', 3000);
      this.render();
    }

    getRemainingIds() {
      var drawnIds = new Set(this.tableCards.map((card) => card.id));
      return this.originalDeckOrder.filter((entry) => !drawnIds.has(entry.id));
    }

    assignInversion(entries) {
      return entries.map((entry) => ({
        id: entry.id,
        isReversed: this.inversionEnabled ? (Math.random() < 0.5) : false
      }));
    }

    updateDrawCardControl() {
      if (!this.deck || !this.el || !this.el.drawCardImage) return;
      var upcoming = this.deckOrder[this.drawIndex];
      this.el.drawCardImage.src = this.deck.backImage;
      this.el.drawCardImage.style.transform = (upcoming && upcoming.isReversed) ? "rotate(180deg)" : "rotate(0deg)";
    }

    playShuffleAnimation() {
      if (!this.el || !this.el.table) return;
      this.el.table.classList.remove("shuffle-animate");
      void this.el.table.offsetWidth;
      this.el.table.classList.add("shuffle-animate");
    }

    shuffleDeck(mode) {
      if (!this.deck) return this.setFlashMessage("Deck not loaded.", 3000);

      var remainingIds = this.getRemainingIds();

      if (mode === "restack") {
        var remainingIdSet = new Set(remainingIds.map((entry) => entry.id));
        remainingIds = this.originalDeckOrder.filter((entry) => remainingIdSet.has(entry.id));
        this.deckOrder = this.assignInversion(shuffleArray(remainingIds));
        this.drawIndex = 0;
        this.playShuffleAnimation();
        this.renderStatusOnly();
        return this.setFlashMessage("Restacked undrawn cards, then fully shuffled them.", 3500);
      }

      if (mode === "light") {
        this.deckOrder = this.assignInversion(lightShuffleArray(remainingIds));
        this.drawIndex = 0;
        this.playShuffleAnimation();
        this.renderStatusOnly();
        return this.setFlashMessage("Light-shuffled the undrawn portion of the deck.", 3500);
      }

      this.deckOrder = this.assignInversion(shuffleArray(remainingIds));
      this.drawIndex = 0;
      this.playShuffleAnimation();
      this.renderStatusOnly();
      this.setFlashMessage("Fully shuffled the undrawn portion of the deck.", 3500);
    }

    drawCard() {
      if (!this.deck) return this.setFlashMessage("Deck not loaded.", 3000);
      if (this.drawIndex >= this.deckOrder.length) return this.setFlashMessage("No cards remain in the deck.", 3500);

      var deckEntry = this.deckOrder[this.drawIndex++];
      var cardDef = this.deck.cards.find((card) => card.id === deckEntry.id);

      var newCard = {
        id: cardDef.id,
        name: cardDef.name,
        frontImage: cardDef.frontImage,
        backImage: this.deck.backImage,
        meta: cardDef.meta,
        isReversed: deckEntry.isReversed,
        x: 40 + (this.tableCards.length % 8) * 30,
        y: 40 + Math.floor(this.tableCards.length / 8) * 20,
        rotation: deckEntry.isReversed ? 180 : 0,
        faceUp: false,
        zIndex: this.tableCards.length + 1
      };

      this.tableCards.push(newCard);
      this.selectedCardId = newCard.id;
      this.render();
      this.setFlashMessage("Drew " + cardDef.name + ".", 2500);
    }

    getSelectedCard() {
      return this.tableCards.find((card) => card.id === this.selectedCardId) || null;
    }

    handleTouchTap(cardId) {
      var now = Date.now();

      if (this.lastTouchTap &&
          this.lastTouchTap.cardId === cardId &&
          (now - this.lastTouchTap.time) <= DOUBLE_TAP_MS) {
        this.lastTouchTap = null;

        var tappedCard = this.tableCards.find((item) => item.id === cardId);
        if (!tappedCard) return;

        this.selectedCardId = cardId;
        this.bringToFront(tappedCard);

        if (!tappedCard.faceUp) {
          tappedCard.faceUp = true;
          this.render();
          this.setFlashMessage("Revealed " + tappedCard.name + ".", 2500);
          return;
        }

        this.render();
        this.openZoom(tappedCard.id);
        return;
      }

      this.lastTouchTap = { cardId: cardId, time: now };
      this.handleCardClick(cardId);
    }

    handleCardClick(cardId) {
      if (this.pendingClickTimer) {
        clearTimeout(this.pendingClickTimer);
        this.pendingClickTimer = null;
      }

      this.pendingClickTimer = setTimeout(() => {
        var clickedCard = this.tableCards.find((item) => item.id === cardId);
        if (!clickedCard) return;
        this.selectedCardId = cardId;
        this.bringToFront(clickedCard);
        this.render();
        this.pendingClickTimer = null;
      }, 250);
    }


    flipSelectedCard() {
      var card = this.getSelectedCard();
      if (!card) return this.setFlashMessage("Select a card first.", 3000);
      card.faceUp = !card.faceUp;
      this.render();
      this.setFlashMessage(card.faceUp ? ("Revealed " + card.name + ".") : ("Turned " + card.name + " face down."), 2500);
    }

    rotateSelectedCard(amount) {
      var card = this.getSelectedCard();
      if (!card) return this.setFlashMessage("Select a card first.", 3000);
      card.rotation = clampRotation(card.rotation + amount);
      this.render();
      this.setFlashMessage(card.name + " rotated to " + card.rotation + "°.", 2200);
    }

    zoomSelectedCard() {
      var card = this.getSelectedCard();
      if (!card) return this.setFlashMessage("Select a card first.", 3000);
      if (!card.faceUp) return this.setFlashMessage("Turn the selected card over before zooming in.", 3500);
      this.openZoom(card.id);
    }

    openZoom(cardId) {
      var card = this.tableCards.find((item) => item.id === cardId);
      if (!card || !card.faceUp) return;
      this.zoomedCardId = cardId;
      this.el.zoomImage.src = card.frontImage;
      this.el.zoomImage.alt = card.name;

      var viewportWidth = (window.innerWidth * 0.9) - 8;
      var viewportHeight = window.innerHeight - 8;
      var normalizedRotation = ((card.rotation % 360) + 360) % 360;
      var isQuarterTurn = (normalizedRotation === 90 || normalizedRotation === 270);
      var baseAspect = this.deck.cardSize.width / this.deck.cardSize.height;
      var displayWidth;
      var displayHeight;

      if (isQuarterTurn) {
        displayWidth = Math.min(viewportHeight, viewportWidth * baseAspect);
        displayHeight = displayWidth / baseAspect;
      } else {
        displayWidth = Math.min(viewportWidth, viewportHeight * baseAspect);
        displayHeight = displayWidth / baseAspect;
      }

      this.el.zoomImage.style.width = displayWidth + "px";
      this.el.zoomImage.style.height = displayHeight + "px";
      this.el.zoomImage.style.transform = "rotate(" + card.rotation + "deg)";
      this.el.overlay.classList.add("open");
    }

    closeZoom() {
      this.zoomedCardId = null;
      this.pendingClickTimer = null;
      this.el.overlay.classList.remove("open");
      this.el.zoomImage.removeAttribute("src");
      this.el.zoomImage.style.width = "";
      this.el.zoomImage.style.height = "";
      this.el.zoomImage.style.transform = "";
      this.el.zoomImage.alt = "";
    }

    handleTableDoubleClick(event) {
      if (this.pendingClickTimer) {
        clearTimeout(this.pendingClickTimer);
        this.pendingClickTimer = null;
      }

      var cardEl = event.target.closest(".tarot-card");
      if (!cardEl) return;
      var cardId = cardEl.dataset.cardId;
      var card = this.tableCards.find((item) => item.id === cardId);
      if (!card) return;

      this.selectedCardId = card.id;
      this.bringToFront(card);

      if (!card.faceUp) {
        card.faceUp = true;
        this.render();
        this.setFlashMessage("Revealed " + card.name + ".", 2500);
        return;
      }

      this.render();
      this.openZoom(card.id);
    }

    startDragging(cardId, event) {
      var card = this.tableCards.find((item) => item.id === cardId);
      if (!card) return;
      this.selectedCardId = card.id;
      this.bringToFront(card);

      var tableRect = this.el.table.getBoundingClientRect();
      var cardRect = event.currentTarget.getBoundingClientRect();

      this.dragState = {
        cardId: cardId,
        offsetX: event.clientX - cardRect.left,
        offsetY: event.clientY - cardRect.top,
        tableLeft: tableRect.left,
        tableTop: tableRect.top,
        moved: false
      };

      event.currentTarget.setPointerCapture(event.pointerId);
    }

    handlePointerMove(event) {
      if (!this.dragState) return;
      var card = this.tableCards.find((item) => item.id === this.dragState.cardId);
      if (!card) return;

      var newX = event.clientX - this.dragState.tableLeft - this.dragState.offsetX;
      var newY = event.clientY - this.dragState.tableTop - this.dragState.offsetY;

      if (newX !== card.x || newY !== card.y) {
        this.dragState.moved = true;
        card.x = newX;
        card.y = newY;
        this.render();
      }
    }

    stopDragging() {
      this.dragState = null;
    }

    bringToFront(card) {
      var maxZ = this.tableCards.reduce((max, item) => Math.max(max, item.zIndex || 1), 1);
      card.zIndex = maxZ + 1;
    }

    setFlashMessage(message, durationMs) {
      this.flashMessage = message;
      this.renderStatusOnly();
      if (this.flashTimer) {
        clearTimeout(this.flashTimer);
        this.flashTimer = null;
      }
      if (durationMs && durationMs > 0) {
        this.flashTimer = setTimeout(() => {
          this.flashMessage = "";
          this.renderStatusOnly();
          this.flashTimer = null;
        }, durationMs);
      }
    }

    renderStatusOnly() {
      if (this.el.flash) this.el.flash.textContent = this.flashMessage;
      if (!this.deck) {
        this.el.status.textContent = "Loading…";
        return;
      }
      if (this.el.inversionToggle) this.el.inversionToggle.checked = !!this.inversionEnabled;
      this.updateDrawCardControl();
      var usedCount = this.tableCards.length;
      var remaining = Math.max(this.deck.cards.length - usedCount, 0);
      var selected = this.getSelectedCard();
      this.el.status.textContent = this.deck.deckName + " | Drawn: " + usedCount + " | Remaining: " + remaining + selectedCardSummary(selected);
    }

    render() {
      if (!this.deck) return;
      this.renderStatusOnly();
      this.el.table.innerHTML = "";

      for (let i = 0; i < this.tableCards.length; i += 1) {
        let card = this.tableCards[i];
        let cardId = card.id;
        var cardEl = document.createElement("div");
        cardEl.className = "tarot-card" + (cardId === this.selectedCardId ? " selected" : "");
        cardEl.dataset.cardId = cardId;
        cardEl.style.left = card.x + "px";
        cardEl.style.top = card.y + "px";
        cardEl.style.width = this.deck.cardSize.width + "px";
        cardEl.style.height = this.deck.cardSize.height + "px";
        cardEl.style.zIndex = String(card.zIndex || 1);
        cardEl.style.transform = "rotate(" + card.rotation + "deg)";

        var img = document.createElement("img");
        img.src = card.faceUp ? card.frontImage : card.backImage;
        img.alt = card.faceUp ? card.name : "Face-down card";
        img.draggable = false;

        cardEl.appendChild(img);

        cardEl.addEventListener("pointerdown", (event) => this.startDragging(cardId, event));
        cardEl.addEventListener("click", () => {
          this.handleCardClick(cardId);
        });

        cardEl.addEventListener("touchend", (event) => {
          event.preventDefault();
          this.handleTouchTap(cardId);
        });

        this.el.table.appendChild(cardEl);
      }
    }
  }

  global.TarotReaderApp = TarotReaderApp;

  document.addEventListener("DOMContentLoaded", () => {
    var root = byId("tarot-app");
    if (root) global.tarotApp = new TarotReaderApp(root);
  });
})(window);
