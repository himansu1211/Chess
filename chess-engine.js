// chess-engine.js - Full Standard Offline Chess Rules Engine
// Supports standard moves, castling (kingside/queenside), en-passant, pawn promotion,
// check, checkmate, stalemate, 50-move rule, threefold repetition, and algebraic notation.

const PIECE_SYMBOLS = {
  'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
  'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'
};

const PIECE_VALUES = {
  'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
};

class ChessGame {
  constructor() {
    this.reset();
  }

  reset() {
    // 8x8 Board representation: row 0 is rank 8 (Black side), row 7 is rank 1 (White side)
    // col 0 is file a, col 7 is file h
    this.board = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];

    this.turn = 'w'; // 'w' or 'b'
    this.castling = {
      w: { k: true, q: true },
      b: { k: true, q: true }
    };
    this.enPassant = null; // { r, c } target square pawn skips over
    this.halfmoveClock = 0; // For 50-move rule
    this.fullmoveNumber = 1;

    // History stack for full undo/redo
    this.history = []; // Array of { move, stateSnapshot }
    this.redoStack = []; // Moves undone, available for redo
    this.positionCounts = {}; // For 3-fold repetition detection
    this.recordPosition();
  }

  // Get deep snapshot of current state
  getSnapshot() {
    return {
      board: this.board.map(row => [...row]),
      turn: this.turn,
      castling: {
        w: { ...this.castling.w },
        b: { ...this.castling.b }
      },
      enPassant: this.enPassant ? { ...this.enPassant } : null,
      halfmoveClock: this.halfmoveClock,
      fullmoveNumber: this.fullmoveNumber
    };
  }

  // Restore snapshot
  restoreSnapshot(s) {
    this.board = s.board.map(row => [...row]);
    this.turn = s.turn;
    this.castling = {
      w: { ...s.castling.w },
      b: { ...s.castling.b }
    };
    this.enPassant = s.enPassant ? { ...s.enPassant } : null;
    this.halfmoveClock = s.halfmoveClock;
    this.fullmoveNumber = s.fullmoveNumber;
  }

  isWhite(piece) {
    return piece && piece === piece.toUpperCase();
  }

  isBlack(piece) {
    return piece && piece === piece.toLowerCase();
  }

  getColor(piece) {
    if (!piece) return null;
    return piece === piece.toUpperCase() ? 'w' : 'b';
  }

  getPiece(r, c) {
    if (r < 0 || r > 7 || c < 0 || c > 7) return null;
    return this.board[r][c];
  }

  // Find King coordinates for player
  findKing(color) {
    const target = color === 'w' ? 'K' : 'k';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] === target) return { r, c };
      }
    }
    return null;
  }

  // Check if a square (r, c) is attacked by opponent of `byColor`
  isSquareAttacked(r, c, byColor) {
    const pawnDir = byColor === 'w' ? 1 : -1; // Pawns attack diagonally forward
    // Pawn attacks
    const pR = r + pawnDir;
    if (pR >= 0 && pR <= 7) {
      if (c - 1 >= 0 && this.board[pR][c - 1] === (byColor === 'w' ? 'P' : 'p')) return true;
      if (c + 1 <= 7 && this.board[pR][c + 1] === (byColor === 'w' ? 'P' : 'p')) return true;
    }

    // Knight attacks
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    const knightChar = byColor === 'w' ? 'N' : 'n';
    for (const [dr, dc] of knightMoves) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        if (this.board[nr][nc] === knightChar) return true;
      }
    }

    // King attacks
    const kingChar = byColor === 'w' ? 'K' : 'k';
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
          if (this.board[nr][nc] === kingChar) return true;
        }
      }
    }

    // Straight attacks (Rook, Queen)
    const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const rookChar = byColor === 'w' ? 'R' : 'r';
    const queenChar = byColor === 'w' ? 'Q' : 'q';
    for (const [dr, dc] of straightDirs) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        const p = this.board[nr][nc];
        if (p) {
          if (p === rookChar || p === queenChar) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }

    // Diagonal attacks (Bishop, Queen)
    const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const bishopChar = byColor === 'w' ? 'B' : 'b';
    for (const [dr, dc] of diagDirs) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        const p = this.board[nr][nc];
        if (p) {
          if (p === bishopChar || p === queenChar) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }

    return false;
  }

  // Is current color in check?
  isInCheck(color = this.turn) {
    const king = this.findKing(color);
    if (!king) return false;
    const enemyColor = color === 'w' ? 'b' : 'w';
    return this.isSquareAttacked(king.r, king.c, enemyColor);
  }

  // Generate pseudo-legal moves for a specific square
  getPseudoMoves(fromR, fromC) {
    const piece = this.board[fromR][fromC];
    if (!piece) return [];
    const color = this.getColor(piece);
    if (color !== this.turn) return [];

    const moves = [];
    const pType = piece.toLowerCase();

    // 1. Pawn Moves
    if (pType === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRank = color === 'w' ? 6 : 1;
      const promoRank = color === 'w' ? 0 : 7;

      // 1 square forward
      const f1R = fromR + dir;
      if (f1R >= 0 && f1R <= 7 && !this.board[f1R][fromC]) {
        if (f1R === promoRank) {
          ['q', 'r', 'b', 'n'].forEach(promo => {
            moves.push({ from: { r: fromR, c: fromC }, to: { r: f1R, c: fromC }, promo });
          });
        } else {
          moves.push({ from: { r: fromR, c: fromC }, to: { r: f1R, c: fromC } });
          // 2 squares forward
          const f2R = fromR + 2 * dir;
          if (fromR === startRank && !this.board[f2R][fromC]) {
            moves.push({ from: { r: fromR, c: fromC }, to: { r: f2R, c: fromC }, isDoublePawn: true });
          }
        }
      }

      // Diagonal Captures
      [-1, 1].forEach(dc => {
        const toC = fromC + dc;
        if (toC >= 0 && toC <= 7) {
          const targetPiece = this.board[f1R] ? this.board[f1R][toC] : null;
          // Standard Capture
          if (targetPiece && this.getColor(targetPiece) !== color) {
            if (f1R === promoRank) {
              ['q', 'r', 'b', 'n'].forEach(promo => {
                moves.push({ from: { r: fromR, c: fromC }, to: { r: f1R, c: toC }, promo, captured: targetPiece });
              });
            } else {
              moves.push({ from: { r: fromR, c: fromC }, to: { r: f1R, c: toC }, captured: targetPiece });
            }
          }
          // En Passant Capture
          if (this.enPassant && this.enPassant.r === f1R && this.enPassant.c === toC) {
            const capturedPawn = this.board[fromR][toC];
            moves.push({
              from: { r: fromR, c: fromC },
              to: { r: f1R, c: toC },
              isEnPassant: true,
              captured: capturedPawn,
              epCapturedSquare: { r: fromR, c: toC }
            });
          }
        }
      });
    }

    // 2. Knight Moves
    else if (pType === 'n') {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of offsets) {
        const toR = fromR + dr, toC = fromC + dc;
        if (toR >= 0 && toR <= 7 && toC >= 0 && toC <= 7) {
          const destPiece = this.board[toR][toC];
          if (!destPiece) {
            moves.push({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC } });
          } else if (this.getColor(destPiece) !== color) {
            moves.push({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC }, captured: destPiece });
          }
        }
      }
    }

    // 3. Bishop & Queen (Diagonals)
    if (pType === 'b' || pType === 'q') {
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of dirs) {
        let toR = fromR + dr, toC = fromC + dc;
        while (toR >= 0 && toR <= 7 && toC >= 0 && toC <= 7) {
          const destPiece = this.board[toR][toC];
          if (!destPiece) {
            moves.push({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC } });
          } else {
            if (this.getColor(destPiece) !== color) {
              moves.push({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC }, captured: destPiece });
            }
            break;
          }
          toR += dr; toC += dc;
        }
      }
    }

    // 4. Rook & Queen (Straights)
    if (pType === 'r' || pType === 'q') {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let toR = fromR + dr, toC = fromC + dc;
        while (toR >= 0 && toR <= 7 && toC >= 0 && toC <= 7) {
          const destPiece = this.board[toR][toC];
          if (!destPiece) {
            moves.push({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC } });
          } else {
            if (this.getColor(destPiece) !== color) {
              moves.push({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC }, captured: destPiece });
            }
            break;
          }
          toR += dr; toC += dc;
        }
      }
    }

    // 5. King Moves & Castling
    if (pType === 'k') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const toR = fromR + dr, toC = fromC + dc;
          if (toR >= 0 && toR <= 7 && toC >= 0 && toC <= 7) {
            const destPiece = this.board[toR][toC];
            if (!destPiece) {
              moves.push({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC } });
            } else if (this.getColor(destPiece) !== color) {
              moves.push({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC }, captured: destPiece });
            }
          }
        }
      }

      // Castling rules:
      // - King and Rook haven't moved
      // - Squares between are empty
      // - King is not in check, and does not pass through check
      const enemyColor = color === 'w' ? 'b' : 'w';
      const rank = color === 'w' ? 7 : 0;
      if (fromR === rank && fromC === 4 && !this.isInCheck(color)) {
        // Kingside castling
        if (this.castling[color].k) {
          if (!this.board[rank][5] && !this.board[rank][6]) {
            if (!this.isSquareAttacked(rank, 5, enemyColor) && !this.isSquareAttacked(rank, 6, enemyColor)) {
              moves.push({
                from: { r: rank, c: 4 },
                to: { r: rank, c: 6 },
                isCastle: 'k'
              });
            }
          }
        }
        // Queenside castling
        if (this.castling[color].q) {
          if (!this.board[rank][3] && !this.board[rank][2] && !this.board[rank][1]) {
            if (!this.isSquareAttacked(rank, 3, enemyColor) && !this.isSquareAttacked(rank, 2, enemyColor)) {
              moves.push({
                from: { r: rank, c: 4 },
                to: { r: rank, c: 2 },
                isCastle: 'q'
              });
            }
          }
        }
      }
    }

    return moves;
  }

  // Get all legal moves for current turn
  getLegalMoves() {
    const allLegal = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.getColor(this.board[r][c]) === this.turn) {
          const pseudo = this.getPseudoMoves(r, c);
          for (const m of pseudo) {
            if (this.isLegalMove(m)) {
              allLegal.push(m);
            }
          }
        }
      }
    }
    return allLegal;
  }

  // Get legal moves originating from a given square
  getLegalMovesFrom(r, c) {
    const pseudo = this.getPseudoMoves(r, c);
    return pseudo.filter(m => this.isLegalMove(m));
  }

  // Check if pseudo-move leaves own king in check
  isLegalMove(move) {
    const snapshot = this.getSnapshot();
    this.executeRawMove(move);
    const inCheck = this.isInCheck(snapshot.turn);
    this.restoreSnapshot(snapshot);
    return !inCheck;
  }

  // Apply raw changes without full rule validation (used for check testing & simulation)
  executeRawMove(m) {
    const piece = this.board[m.from.r][m.from.c];
    this.board[m.from.r][m.from.c] = null;

    if (m.isEnPassant) {
      this.board[m.epCapturedSquare.r][m.epCapturedSquare.c] = null;
    }

    if (m.isCastle === 'k') {
      const r = m.from.r;
      this.board[r][5] = this.board[r][7]; // rook to f1/f8
      this.board[r][7] = null;
    } else if (m.isCastle === 'q') {
      const r = m.from.r;
      this.board[r][3] = this.board[r][0]; // rook to d1/d8
      this.board[r][0] = null;
    }

    // Pawn promotion
    if (m.promo) {
      this.board[m.to.r][m.to.c] = (this.turn === 'w') ? m.promo.toUpperCase() : m.promo.toLowerCase();
    } else {
      this.board[m.to.r][m.to.c] = piece;
    }
  }

  // Make move and commit to history
  makeMove(move) {
    const movingPiece = this.board[move.from.r][move.from.c];
    const targetPiece = this.board[move.to.r][move.to.c];
    const snapshot = this.getSnapshot();

    // Standard notation calculation
    const notation = this.generateMoveNotation(move, movingPiece, targetPiece);

    // Apply movement
    this.executeRawMove(move);

    // Update Castling rights if King or Rook moved or Rook captured
    const pType = movingPiece.toLowerCase();
    if (pType === 'k') {
      this.castling[this.turn].k = false;
      this.castling[this.turn].q = false;
    } else if (pType === 'r') {
      if (move.from.r === 7 && move.from.c === 7) this.castling.w.k = false;
      if (move.from.r === 7 && move.from.c === 0) this.castling.w.q = false;
      if (move.from.r === 0 && move.from.c === 7) this.castling.b.k = false;
      if (move.from.r === 0 && move.from.c === 0) this.castling.b.q = false;
    }

    // If opponent rook captured on original square
    if (move.to.r === 7 && move.to.c === 7) this.castling.w.k = false;
    if (move.to.r === 7 && move.to.c === 0) this.castling.w.q = false;
    if (move.to.r === 0 && move.to.c === 7) this.castling.b.k = false;
    if (move.to.r === 0 && move.to.c === 0) this.castling.b.q = false;

    // En passant square update
    if (move.isDoublePawn) {
      const epR = (move.from.r + move.to.r) / 2;
      this.enPassant = { r: epR, c: move.from.c };
    } else {
      this.enPassant = null;
    }

    // Halfmove clock (resets on pawn move or capture)
    if (pType === 'p' || targetPiece || move.isEnPassant) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock++;
    }

    if (this.turn === 'b') {
      this.fullmoveNumber++;
    }

    // Switch turn
    this.turn = this.turn === 'w' ? 'b' : 'w';

    // Store in history
    const record = {
      move,
      piece: movingPiece,
      captured: move.captured || targetPiece,
      notation,
      snapshot
    };
    this.history.push(record);
    this.redoStack = []; // Clear redo stack on new regular move
    this.recordPosition();

    return record;
  }

  // Generate clean Standard Algebraic Notation (SAN)
  generateMoveNotation(move, piece, target) {
    if (move.isCastle === 'k') return 'O-O';
    if (move.isCastle === 'q') return 'O-O-O';

    const pType = piece.toLowerCase();
    const files = 'abcdefgh';
    const ranks = '87654321';
    const dest = files[move.to.c] + ranks[move.to.r];

    let prefix = '';
    if (pType !== 'p') {
      prefix = piece.toUpperCase();
    }

    const isCapture = !!target || move.isEnPassant;
    let captureSymbol = '';
    if (isCapture) {
      if (pType === 'p') {
        prefix = files[move.from.c];
      }
      captureSymbol = 'x';
    }

    let promoSuffix = '';
    if (move.promo) {
      promoSuffix = '=' + move.promo.toUpperCase();
    }

    return `${prefix}${captureSymbol}${dest}${promoSuffix}`;
  }

  // Position key for 3-fold repetition
  getBoardFEN() {
    let fen = '';
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (!p) {
          empty++;
        } else {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          fen += p;
        }
      }
      if (empty > 0) fen += empty;
      if (r < 7) fen += '/';
    }
    const cW = (this.castling.w.k ? 'K' : '') + (this.castling.w.q ? 'Q' : '');
    const cB = (this.castling.b.k ? 'k' : '') + (this.castling.b.q ? 'q' : '');
    const cast = (cW + cB) || '-';
    const ep = this.enPassant ? ('abcdefgh'[this.enPassant.c] + (8 - this.enPassant.r)) : '-';
    return `${fen} ${this.turn} ${cast} ${ep}`;
  }

  recordPosition() {
    const key = this.getBoardFEN();
    this.positionCounts[key] = (this.positionCounts[key] || 0) + 1;
  }

  unrecordPosition() {
    const key = this.getBoardFEN();
    if (this.positionCounts[key]) {
      this.positionCounts[key]--;
      if (this.positionCounts[key] <= 0) {
        delete this.positionCounts[key];
      }
    }
  }

  // Undo last 1 ply (single move)
  undoSingle() {
    if (this.history.length === 0) return null;
    this.unrecordPosition();
    const lastRecord = this.history.pop();
    this.restoreSnapshot(lastRecord.snapshot);
    this.redoStack.push(lastRecord);
    return lastRecord;
  }

  // Redo 1 ply
  redoSingle() {
    if (this.redoStack.length === 0) return null;
    const nextRecord = this.redoStack.pop();
    this.makeMove(nextRecord.move);
    return nextRecord;
  }

  // Game termination check
  getGameState() {
    const legalMoves = this.getLegalMoves();
    const inCheck = this.isInCheck(this.turn);

    if (legalMoves.length === 0) {
      if (inCheck) {
        return {
          isOver: true,
          result: 'checkmate',
          winner: this.turn === 'w' ? 'Black' : 'White',
          loser: this.turn === 'w' ? 'White' : 'Black'
        };
      } else {
        return {
          isOver: true,
          result: 'stalemate',
          reason: 'Stalemate! No legal moves available.'
        };
      }
    }

    // 50-move rule
    if (this.halfmoveClock >= 100) {
      return {
        isOver: true,
        result: 'draw',
        reason: 'Draw by 50-move rule.'
      };
    }

    // Threefold repetition
    const fen = this.getBoardFEN();
    if (this.positionCounts[fen] >= 3) {
      return {
        isOver: true,
        result: 'draw',
        reason: 'Draw by threefold repetition.'
      };
    }

    // Insufficient material (K vs K, K+B vs K, K+N vs K)
    if (this.isInsufficientMaterial()) {
      return {
        isOver: true,
        result: 'draw',
        reason: 'Draw by insufficient material.'
      };
    }

    return {
      isOver: false,
      inCheck: inCheck,
      turn: this.turn
    };
  }

  isInsufficientMaterial() {
    let pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p) pieces.push(p.toLowerCase());
      }
    }
    if (pieces.length === 2) return true; // Only kings
    if (pieces.length === 3 && (pieces.includes('b') || pieces.includes('n'))) return true;
    return false;
  }

  // Captured pieces calculation
  getCapturedPieces() {
    const initialCounts = {
      'P': 8, 'N': 2, 'B': 2, 'R': 2, 'Q': 1,
      'p': 8, 'n': 2, 'b': 2, 'r': 2, 'q': 1
    };
    const currentCounts = {
      'P': 0, 'N': 0, 'B': 0, 'R': 0, 'Q': 0,
      'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0
    };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && currentCounts[p] !== undefined) {
          currentCounts[p]++;
        }
      }
    }

    const whiteCaptured = []; // Pieces captured by White (i.e. missing black pieces)
    const blackCaptured = []; // Pieces captured by Black (i.e. missing white pieces)

    for (const [p, count] of Object.entries(initialCounts)) {
      const missing = Math.max(0, count - (currentCounts[p] || 0));
      for (let i = 0; i < missing; i++) {
        if (p === p.toUpperCase()) {
          blackCaptured.push(p);
        } else {
          whiteCaptured.push(p);
        }
      }
    }

    return { whiteCaptured, blackCaptured };
  }
}

window.ChessGame = ChessGame;
window.PIECE_SYMBOLS = PIECE_SYMBOLS;
window.PIECE_VALUES = PIECE_VALUES;
