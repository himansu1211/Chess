// app.js - Main Application Orchestrator
// Connects ChessGame, AIEngine, SoundController and UI.
// Handles Undo, Redo, Back, Hint, Restart, New Game, Difficulty switching,
// drag-and-drop, click-to-move, pawn promotion modal, and responsive board rendering.

// Vector SVG chess piece generator (crisp, resolution-independent, 100% offline)
const SVG_PIECES = {
  // White pieces
  'K': `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff" stroke-linecap="butt"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7z" fill="#fff"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g></svg>`,
  'Q': `<svg viewBox="0 0 45 45"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5 4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm-8.5 2.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm-16 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-6-19-6 19-7-11 2 12z" stroke-linecap="butt"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path d="M11 38.5a35 35 0 0 0 23 0" fill="none"/><path d="M11 29a35 35 0 0 0 23 0" fill="none"/></g></svg>`,
  'R': `<svg viewBox="0 0 45 45"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm1.5-4.5l1.5-12.5h15l1.5 12.5h-18zm-2.5-14.5l1.5-2.5h20l1.5 2.5H11zm-2-2.5V9h4v3.5h5V9h4v3.5h5V9h4v5.5H9z" stroke-linecap="butt"/><path d="M12 35.5h21m-20-4h19m-18-2h17m-17.5-11h18" fill="none"/></g></svg>`,
  'B': `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#fff" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5m-3-2.5h6" stroke-linejoin="miter"/></g></svg>`,
  'N': `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff"/><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.64 1.47-2 2-1 0-1.5-.5-1.5-2.5 0-3 1.5-4 1.5-4s-3.5-.5-4-3c-.5-2.5 1-3.5 2-3.5 2 0 4.5 1 5.5.5s1-2.5 2.5-4.5c2.5-3.5 6.5-4.5 9.5-3.5z" fill="#fff"/><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.5-9a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill="#000"/><path d="M24.55 10.4s-1.85 2.1-1.35 4.3c.5 2.2 3.1 3.2 3.1 3.2m-11.8 7.6c1.3.5 3 .5 4.1-.3" stroke="#000"/></g></svg>`,
  'P': `<svg viewBox="0 0 45 45"><path d="M22 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.21-3.28 5.62 0 2.03.93 3.84 2.38 5.03-3.02 1.34-5.38 5.37-5.38 10.47H32.5c0-5.1-2.36-9.13-5.38-10.47 1.45-1.19 2.38-3 2.38-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  // Black pieces
  'k': `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#2d3748" stroke-linecap="butt"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7z" fill="#2d3748"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="#fff"/></g></svg>`,
  'q': `<svg viewBox="0 0 45 45"><g fill="#2d3748" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5 4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm-8.5 2.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm-16 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-6-19-6 19-7-11 2 12z" stroke-linecap="butt"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path d="M11 38.5a35 35 0 0 0 23 0" fill="none" stroke="#fff"/><path d="M11 29a35 35 0 0 0 23 0" fill="none" stroke="#fff"/></g></svg>`,
  'r': `<svg viewBox="0 0 45 45"><g fill="#2d3748" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm1.5-4.5l1.5-12.5h15l1.5 12.5h-18zm-2.5-14.5l1.5-2.5h20l1.5 2.5H11zm-2-2.5V9h4v3.5h5V9h4v3.5h5V9h4v5.5H9z" stroke-linecap="butt"/><path d="M12 35.5h21m-20-4h19m-18-2h17m-17.5-11h18" fill="none" stroke="#fff"/></g></svg>`,
  'b': `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#2d3748" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5m-3-2.5h6" stroke-linejoin="miter" stroke="#fff"/></g></svg>`,
  'n': `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#2d3748"/><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.64 1.47-2 2-1 0-1.5-.5-1.5-2.5 0-3 1.5-4 1.5-4s-3.5-.5-4-3c-.5-2.5 1-3.5 2-3.5 2 0 4.5 1 5.5.5s1-2.5 2.5-4.5c2.5-3.5 6.5-4.5 9.5-3.5z" fill="#2d3748"/><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.5-9a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill="#fff"/><path d="M24.55 10.4s-1.85 2.1-1.35 4.3c.5 2.2 3.1 3.2 3.1 3.2m-11.8 7.6c1.3.5 3 .5 4.1-.3" stroke="#fff"/></g></svg>`,
  'p': `<svg viewBox="0 0 45 45"><path d="M22 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.21-3.28 5.62 0 2.03.93 3.84 2.38 5.03-3.02 1.34-5.38 5.37-5.38 10.47H32.5c0-5.1-2.36-9.13-5.38-10.47 1.45-1.19 2.38-3 2.38-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#2d3748" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`
};

const LEVEL_DESCRIPTIONS = {
  1: "Level 1: Novice - Plays playful, erratic moves. Perfect for learners.",
  2: "Level 2: Casual - Plays basic moves with occasional tactical slips.",
  3: "Level 3: Club - Solid candidate. Thinks 2 turns ahead with good positioning.",
  4: "Level 4: Expert - Strong tactical foresight (depth 3 minimax with alpha-beta).",
  5: "Level 5: Master - Grandmaster depth calculation with strict positional tables."
};

class ChessApp {
  constructor() {
    this.game = new ChessGame();
    this.currentLevel = 1;
    this.playMode = 'pve-white'; // 'pve-white', 'pve-black', 'pvp'
    this.selectedSquare = null;
    this.legalMovesFromSelected = [];
    this.hintMove = null;
    this.isAiThinking = false;
    this.pendingPromotionMove = null;

    this.cacheDomElements();
    this.bindEvents();
    this.initBoardUI();
    this.updateUI();
  }

  cacheDomElements() {
    this.boardEl = document.getElementById('chessBoard');
    this.arrowOverlay = document.getElementById('arrowOverlay');
    this.undoBtn = document.getElementById('undoBtn');
    this.redoBtn = document.getElementById('redoBtn');
    this.hintBtn = document.getElementById('hintBtn');
    this.backBtn = document.getElementById('backBtn');
    this.restartBtn = document.getElementById('restartBtn');
    this.newGameBtn = document.getElementById('newGameBtn');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.soundToggle = document.getElementById('soundToggle');
    this.playModeSelect = document.getElementById('playModeSelect');
    this.levelPills = document.getElementById('levelPills');
    this.levelDescription = document.getElementById('levelDescription');
    this.gameStatusText = document.getElementById('gameStatusText');
    this.moveCountBadge = document.getElementById('moveCountBadge');
    this.moveHistoryList = document.getElementById('moveHistoryList');
    this.whiteCaptured = document.getElementById('whiteCaptured');
    this.blackCaptured = document.getElementById('blackCaptured');
    this.turnIndicator = document.getElementById('turnIndicator');
    this.opponentName = document.getElementById('opponentName');
    this.opponentLevelText = document.getElementById('opponentLevelText');
    this.aiThinkingBadge = document.getElementById('aiThinkingBadge');

    // Promotion Modal
    this.promotionModal = document.getElementById('promotionModal');
    this.promoPieces = document.getElementById('promoPieces');

    // Game Over Modal
    this.gameOverModal = document.getElementById('gameOverModal');
    this.gameOverTitle = document.getElementById('gameOverTitle');
    this.gameOverMsg = document.getElementById('gameOverMsg');
    this.modalNewGameBtn = document.getElementById('modalNewGameBtn');
    this.modalReviewBtn = document.getElementById('modalReviewBtn');
  }

  bindEvents() {
    // Theme toggle
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

    // Sound toggle
    this.soundToggle.addEventListener('change', (e) => {
      window.soundController.enabled = e.target.checked;
    });

    // Level buttons
    this.levelPills.addEventListener('click', (e) => {
      const btn = e.target.closest('.level-btn');
      if (btn) {
        const lvl = parseInt(btn.dataset.level, 10);
        this.setLevel(lvl);
      }
    });

    // Play mode select
    this.playModeSelect.addEventListener('change', (e) => {
      this.playMode = e.target.value;
      this.restartGame();
    });

    // Primary Control Actions
    this.undoBtn.addEventListener('click', () => this.handleUndo());
    this.redoBtn.addEventListener('click', () => this.handleRedo());
    this.backBtn.addEventListener('click', () => this.handleBack());
    this.hintBtn.addEventListener('click', () => this.handleHint());
    this.restartBtn.addEventListener('click', () => this.restartGame());
    this.newGameBtn.addEventListener('click', () => this.restartGame());

    // Modal Actions
    this.modalNewGameBtn.addEventListener('click', () => {
      this.gameOverModal.classList.remove('active');
      this.restartGame();
    });
    this.modalReviewBtn.addEventListener('click', () => {
      this.gameOverModal.classList.remove('active');
    });

    // Window keyboard shortcuts (Ctrl+Z for undo, Ctrl+Y for redo, H for hint)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this.handleUndo();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.handleRedo();
      } else if (e.key.toLowerCase() === 'h') {
        this.handleHint();
      }
    });
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
  }

  setLevel(lvl) {
    this.currentLevel = lvl;
    this.levelPills.querySelectorAll('.level-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.level, 10) === lvl);
    });
    this.levelDescription.textContent = LEVEL_DESCRIPTIONS[lvl];
    const names = ['Novice', 'Casual', 'Club', 'Expert', 'Master'];
    this.opponentLevelText.textContent = `Difficulty: Level ${lvl} (${names[lvl - 1]})`;
  }

  // Initialize Board DOM squares
  initBoardUI() {
    this.boardEl.innerHTML = '';
    const isFlipped = this.playMode === 'pve-black';

    for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
      for (let colIdx = 0; colIdx < 8; colIdx++) {
        const r = isFlipped ? 7 - rowIdx : rowIdx;
        const c = isFlipped ? 7 - colIdx : colIdx;

        const square = document.createElement('div');
        square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        square.dataset.r = r;
        square.dataset.c = c;

        // Coordinate markers
        if ((isFlipped ? colIdx === 7 : colIdx === 0)) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'coord-rank';
          rankLabel.textContent = 8 - r;
          square.appendChild(rankLabel);
        }
        if ((isFlipped ? rowIdx === 7 : rowIdx === 7)) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'coord-file';
          fileLabel.textContent = 'abcdefgh'[c];
          square.appendChild(fileLabel);
        }

        // Square Click listener
        square.addEventListener('click', () => this.handleSquareClick(r, c));

        // Drag & Drop event listeners
        square.addEventListener('dragover', (e) => e.preventDefault());
        square.addEventListener('drop', (e) => this.handleDrop(e, r, c));

        this.boardEl.appendChild(square);
      }
    }
  }

  // Handle Square Click
  handleSquareClick(r, c) {
    if (this.isAiThinking) return;
    const piece = this.game.getPiece(r, c);
    const isMyTurn = (this.playMode === 'pvp') ||
                     (this.playMode === 'pve-white' && this.game.turn === 'w') ||
                     (this.playMode === 'pve-black' && this.game.turn === 'b');

    if (!isMyTurn) return;

    // If already selected a piece, check if click is a destination square
    if (this.selectedSquare) {
      const matchMove = this.legalMovesFromSelected.find(m => m.to.r === r && m.to.c === c);
      if (matchMove) {
        this.executePlayerMove(matchMove);
        return;
      }
    }

    // Select new piece if it belongs to current player
    if (piece && this.game.getColor(piece) === this.game.turn) {
      this.selectedSquare = { r, c };
      this.legalMovesFromSelected = this.game.getLegalMovesFrom(r, c);
      this.hintMove = null; // Clear hint when user touches board
    } else {
      this.selectedSquare = null;
      this.legalMovesFromSelected = [];
    }

    this.renderBoard();
  }

  // Drag-and-drop
  handleDragStart(e, r, c) {
    if (this.isAiThinking) {
      e.preventDefault();
      return;
    }
    const isMyTurn = (this.playMode === 'pvp') ||
                     (this.playMode === 'pve-white' && this.game.turn === 'w') ||
                     (this.playMode === 'pve-black' && this.game.turn === 'b');
    if (!isMyTurn) {
      e.preventDefault();
      return;
    }
    this.selectedSquare = { r, c };
    this.legalMovesFromSelected = this.game.getLegalMovesFrom(r, c);
    e.dataTransfer.setData('text/plain', JSON.stringify({ r, c }));
  }

  handleDrop(e, toR, toC) {
    e.preventDefault();
    if (!this.selectedSquare) return;
    const matchMove = this.legalMovesFromSelected.find(m => m.to.r === toR && m.to.c === toC);
    if (matchMove) {
      this.executePlayerMove(matchMove);
    }
  }

  // Execute Move
  executePlayerMove(move) {
    // Check if it's a pawn promotion
    if (move.promo) {
      this.promptPromotion(move);
      return;
    }

    this.performMove(move);
  }

  promptPromotion(baseMove) {
    this.pendingPromotionMove = baseMove;
    const color = this.game.turn;
    const pieces = ['q', 'r', 'b', 'n'];

    this.promoPieces.innerHTML = '';
    pieces.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'promo-btn';
      const symbolKey = color === 'w' ? p.toUpperCase() : p;
      btn.innerHTML = SVG_PIECES[symbolKey];
      btn.addEventListener('click', () => {
        this.promotionModal.classList.remove('active');
        const finalMove = { ...this.pendingPromotionMove, promo: p };
        this.performMove(finalMove);
      });
      this.promoPieces.appendChild(btn);
    });

    this.promotionModal.classList.add('active');
  }

  performMove(move) {
    const isCapture = !!move.captured;
    const record = this.game.makeMove(move);

    // Audio cue
    if (this.game.isInCheck(this.game.turn)) {
      window.soundController.playCheck();
    } else if (isCapture) {
      window.soundController.playCapture();
    } else {
      window.soundController.playMove();
    }

    this.selectedSquare = null;
    this.legalMovesFromSelected = [];
    this.hintMove = null;

    this.updateUI();

    // Check game over
    const state = this.game.getGameState();
    if (state.isOver) {
      this.handleGameOver(state);
      return;
    }

    // Trigger AI move if in PvE
    this.checkTriggerAI();
  }

  checkTriggerAI() {
    const isAiTurn = (this.playMode === 'pve-white' && this.game.turn === 'b') ||
                     (this.playMode === 'pve-black' && this.game.turn === 'w');

    if (isAiTurn) {
      this.isAiThinking = true;
      this.aiThinkingBadge.style.display = 'inline-block';
      this.updateControlsState();

      // Non-blocking timeout to let DOM render and feel natural
      const thinkingTime = Math.min(600, 150 + this.currentLevel * 100);
      setTimeout(() => {
        const aiMove = window.aiEngine.getBestMove(this.game, this.currentLevel);
        this.isAiThinking = false;
        this.aiThinkingBadge.style.display = 'none';

        if (aiMove) {
          const isCapture = !!aiMove.captured;
          this.game.makeMove(aiMove);

          if (this.game.isInCheck(this.game.turn)) {
            window.soundController.playCheck();
          } else if (isCapture) {
            window.soundController.playCapture();
          } else {
            window.soundController.playMove();
          }

          this.updateUI();

          const state = this.game.getGameState();
          if (state.isOver) {
            this.handleGameOver(state);
          }
        }
      }, thinkingTime);
    }
  }

  handleGameOver(state) {
    if (state.result === 'checkmate') {
      window.soundController.playGameOver(state.winner === 'White');
      this.gameOverTitle.textContent = `Checkmate!`;
      this.gameOverMsg.textContent = `${state.winner} has achieved victory!`;
      this.gameStatusText.textContent = `Game Over: ${state.winner} won by checkmate`;
    } else {
      window.soundController.playGameOver(false);
      this.gameOverTitle.textContent = `Draw!`;
      this.gameOverMsg.textContent = state.reason || "The game ended in a draw.";
      this.gameStatusText.textContent = `Game Over: ${state.reason}`;
    }
    this.gameOverModal.classList.add('active');
  }

  // --- Controls: Undo, Redo, Back, Hint, Restart ---

  // Undo (In PvE, undos both AI move and Player move so it's the player's turn again)
  handleUndo() {
    if (this.isAiThinking) return;

    if (this.playMode === 'pvp') {
      this.game.undoSingle();
    } else {
      // In PvE, undo 2 plies if AI just moved, or 1 if it's currently AI's turn
      const isPlayerTurn = (this.playMode === 'pve-white' && this.game.turn === 'w') ||
                           (this.playMode === 'pve-black' && this.game.turn === 'b');
      if (isPlayerTurn) {
        this.game.undoSingle(); // AI move
        this.game.undoSingle(); // Player move
      } else {
        this.game.undoSingle();
      }
    }

    this.selectedSquare = null;
    this.legalMovesFromSelected = [];
    this.hintMove = null;
    this.updateUI();
  }

  // Redo
  handleRedo() {
    if (this.isAiThinking) return;

    if (this.playMode === 'pvp') {
      this.game.redoSingle();
    } else {
      // Redo player move + subsequent AI response if available
      this.game.redoSingle();
      if (this.game.redoStack.length > 0) {
        this.game.redoSingle();
      }
    }

    this.selectedSquare = null;
    this.legalMovesFromSelected = [];
    this.hintMove = null;
    this.updateUI();

    // Check if AI turn triggered after redo
    this.checkTriggerAI();
  }

  // Back (Steps back exactly 1 individual ply for fine-grained board review)
  handleBack() {
    if (this.isAiThinking) return;
    this.game.undoSingle();
    this.selectedSquare = null;
    this.legalMovesFromSelected = [];
    this.hintMove = null;
    this.updateUI();
  }

  // Hint
  handleHint() {
    if (this.isAiThinking) return;
    const bestHint = window.aiEngine.getHint(this.game);
    if (bestHint) {
      this.hintMove = bestHint;
      this.renderBoard();
      // Status hint message
      const fromCoord = 'abcdefgh'[bestHint.from.c] + (8 - bestHint.from.r);
      const toCoord = 'abcdefgh'[bestHint.to.c] + (8 - bestHint.to.r);
      this.gameStatusText.textContent = `💡 Hint: Recommended move ${fromCoord.toUpperCase()} → ${toCoord.toUpperCase()}`;
    }
  }

  // Restart match
  restartGame() {
    this.game.reset();
    this.selectedSquare = null;
    this.legalMovesFromSelected = [];
    this.hintMove = null;
    this.isAiThinking = false;
    this.aiThinkingBadge.style.display = 'none';

    this.initBoardUI();
    this.updateUI();

    // If user chose to play as Black against AI, AI goes first as White
    if (this.playMode === 'pve-black') {
      this.checkTriggerAI();
    }
  }

  // Render Chessboard & Pieces
  renderBoard() {
    const isFlipped = this.playMode === 'pve-black';
    const squares = this.boardEl.querySelectorAll('.square');

    // Last move info
    const lastRecord = this.game.history[this.game.history.length - 1];
    const lastFrom = lastRecord ? lastRecord.move.from : null;
    const lastTo = lastRecord ? lastRecord.move.to : null;

    // Check square
    const inCheck = this.game.isInCheck(this.game.turn);
    const kingPos = inCheck ? this.game.findKing(this.game.turn) : null;

    squares.forEach(sq => {
      const r = parseInt(sq.dataset.r, 10);
      const c = parseInt(sq.dataset.c, 10);
      const piece = this.game.getPiece(r, c);

      // Clean classes & overlays
      sq.classList.remove('selected', 'last-move', 'in-check', 'hint-from', 'hint-to');
      const existingPiece = sq.querySelector('.piece');
      if (existingPiece) existingPiece.remove();
      const existingDot = sq.querySelector('.move-dest-marker, .capture-ring');
      if (existingDot) existingDot.remove();

      // Highlight Last Move
      if (lastFrom && ((lastFrom.r === r && lastFrom.c === c) || (lastTo.r === r && lastTo.c === c))) {
        sq.classList.add('last-move');
      }

      // Highlight Selected
      if (this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c) {
        sq.classList.add('selected');
      }

      // Highlight Check
      if (kingPos && kingPos.r === r && kingPos.c === c) {
        sq.classList.add('in-check');
      }

      // Highlight Hint
      if (this.hintMove) {
        if (this.hintMove.from.r === r && this.hintMove.from.c === c) sq.classList.add('hint-from');
        if (this.hintMove.to.r === r && this.hintMove.to.c === c) sq.classList.add('hint-to');
      }

      // Render Piece
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = 'piece';
        pieceEl.innerHTML = SVG_PIECES[piece] || piece;
        pieceEl.draggable = true;
        pieceEl.addEventListener('dragstart', (e) => this.handleDragStart(e, r, c));
        sq.appendChild(pieceEl);
      }

      // Render Possible Move Markers
      if (this.selectedSquare) {
        const moveOnThis = this.legalMovesFromSelected.find(m => m.to.r === r && m.to.c === c);
        if (moveOnThis) {
          if (piece || moveOnThis.isEnPassant) {
            const ring = document.createElement('div');
            ring.className = 'capture-ring';
            sq.appendChild(ring);
          } else {
            const dot = document.createElement('div');
            dot.className = 'move-dest-marker';
            sq.appendChild(dot);
          }
        }
      }
    });

    this.renderHintArrow();
  }

  // Draw clean dynamic SVG Arrow for Hint
  renderHintArrow() {
    this.arrowOverlay.innerHTML = '';
    if (!this.hintMove) return;

    const isFlipped = this.playMode === 'pve-black';
    const rect = this.boardEl.getBoundingClientRect();
    const sqSize = rect.width / 8;

    const fromR = isFlipped ? 7 - this.hintMove.from.r : this.hintMove.from.r;
    const fromC = isFlipped ? 7 - this.hintMove.from.c : this.hintMove.from.c;
    const toR = isFlipped ? 7 - this.hintMove.to.r : this.hintMove.to.r;
    const toC = isFlipped ? 7 - this.hintMove.to.c : this.hintMove.to.c;

    const x1 = fromC * sqSize + sqSize / 2;
    const y1 = fromR * sqSize + sqSize / 2;
    const x2 = toC * sqSize + sqSize / 2;
    const y2 = toR * sqSize + sqSize / 2;

    const svg = `
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#a855f7" />
        </marker>
      </defs>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
            stroke="#a855f7" stroke-width="5" stroke-linecap="round"
            marker-end="url(#arrowhead)" opacity="0.85" />
    `;
    this.arrowOverlay.innerHTML = svg;
  }

  // Update UI Panels, Captured Pieces, History, and Button Disabled States
  updateUI() {
    this.renderBoard();
    this.updateControlsState();
    this.updateHistoryList();
    this.updateCapturedPieces();

    // Turn indicator
    const turnColorName = this.game.turn === 'w' ? 'White' : 'Black';
    if (this.playMode === 'pvp') {
      this.turnIndicator.textContent = `${turnColorName} to move`;
    } else {
      const isPlayerTurn = (this.playMode === 'pve-white' && this.game.turn === 'w') ||
                           (this.playMode === 'pve-black' && this.game.turn === 'b');
      this.turnIndicator.textContent = isPlayerTurn ? 'Your Turn' : 'Waiting for AI...';
    }

    // Status Banner
    const inCheck = this.game.isInCheck(this.game.turn);
    if (inCheck) {
      this.gameStatusText.textContent = `Check! ${turnColorName}'s king is threatened`;
    } else {
      this.gameStatusText.textContent = `${turnColorName}'s Turn`;
    }
  }

  updateControlsState() {
    this.undoBtn.disabled = this.game.history.length === 0 || this.isAiThinking;
    this.redoBtn.disabled = this.game.redoStack.length === 0 || this.isAiThinking;
    this.backBtn.disabled = this.game.history.length === 0 || this.isAiThinking;
    this.hintBtn.disabled = this.isAiThinking;
  }

  updateHistoryList() {
    const history = this.game.history;
    this.moveCountBadge.textContent = `${history.length} moves`;

    if (history.length === 0) {
      this.moveHistoryList.innerHTML = '<div class="history-empty">No moves made yet.</div>';
      return;
    }

    let html = '';
    for (let i = 0; i < history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = history[i].notation;
      const blackMove = history[i + 1] ? history[i + 1].notation : '';

      html += `
        <div class="history-row">
          <span class="history-num">${moveNum}.</span>
          <span class="history-col">${whiteMove}</span>
          <span class="history-col">${blackMove}</span>
        </div>
      `;
    }
    this.moveHistoryList.innerHTML = html;
    this.moveHistoryList.scrollTop = this.moveHistoryList.scrollHeight;
  }

  updateCapturedPieces() {
    const { whiteCaptured, blackCaptured } = this.game.getCapturedPieces();

    this.whiteCaptured.innerHTML = whiteCaptured.map(p => PIECE_SYMBOLS[p] || p).join('');
    this.blackCaptured.innerHTML = blackCaptured.map(p => PIECE_SYMBOLS[p] || p).join('');
  }
}

// Instantiate App when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  window.chessApp = new ChessApp();
});
