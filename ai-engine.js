// ai-engine.js - Multi-Tier Offline Chess AI with 5 Progressive Difficulty Levels
// Uses Minimax with Alpha-Beta Pruning, Piece-Square Tables (PST), Mobility & Tactical Evaluation.

// Positional Piece-Square Tables (from White's perspective; inverted for Black)
const PST = {
  p: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  r: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ],
  q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

class AIEngine {
  constructor() {
    this.nodesEvaluated = 0;
  }

  // Get positional bonus for a piece at (r, c)
  getPieceSquareScore(piece, r, c) {
    const isW = piece === piece.toUpperCase();
    const type = piece.toLowerCase();
    const table = PST[type];
    if (!table) return 0;

    // Table is defined for White (rank 7 is white back rank, but table row 7 is back rank)
    // For white: table[r][c]
    // For black: table[7 - r][c]
    if (isW) {
      return table[r][c];
    } else {
      return table[7 - r][c];
    }
  }

  // Static evaluation function from White's perspective (+ = White advantage, - = Black advantage)
  evaluateBoard(game) {
    let score = 0;
    const board = game.board;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;
        const val = PIECE_VALUES[p.toLowerCase()] || 0;
        const pstVal = this.getPieceSquareScore(p, r, c);
        const totalPieceVal = val + pstVal;

        if (p === p.toUpperCase()) {
          score += totalPieceVal;
        } else {
          score -= totalPieceVal;
        }
      }
    }

    return score;
  }

  // Sort moves for Alpha-Beta move ordering efficiency: captures & promotions first
  orderMoves(moves, game) {
    return moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.captured) {
        const victimVal = PIECE_VALUES[a.captured.toLowerCase()] || 0;
        const attackerVal = PIECE_VALUES[game.board[a.from.r][a.from.c]?.toLowerCase()] || 100;
        scoreA += victimVal * 10 - attackerVal; // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
      }
      if (b.captured) {
        const victimVal = PIECE_VALUES[b.captured.toLowerCase()] || 0;
        const attackerVal = PIECE_VALUES[game.board[b.from.r][b.from.c]?.toLowerCase()] || 100;
        scoreB += victimVal * 10 - attackerVal;
      }

      if (a.promo) scoreA += 800;
      if (b.promo) scoreB += 800;

      return scoreB - scoreA;
    });
  }

  // Alpha-Beta Minimax search
  minimax(game, depth, alpha, beta, isMaximizing) {
    this.nodesEvaluated++;

    if (depth === 0) {
      return { score: this.evaluateBoard(game) };
    }

    const legalMoves = game.getLegalMoves();
    if (legalMoves.length === 0) {
      if (game.isInCheck(game.turn)) {
        // Checkmate! If maximizing is next to move and has no moves, it's mated
        return { score: isMaximizing ? -100000 - depth : 100000 + depth };
      }
      return { score: 0 }; // Stalemate
    }

    const orderedMoves = this.orderMoves(legalMoves, game);
    let bestMove = orderedMoves[0];

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of orderedMoves) {
        const snapshot = game.getSnapshot();
        game.makeMove(move);
        const evalResult = this.minimax(game, depth - 1, alpha, beta, false);
        game.undoSingle();

        if (evalResult.score > maxEval) {
          maxEval = evalResult.score;
          bestMove = move;
        }
        alpha = Math.max(alpha, evalResult.score);
        if (beta <= alpha) break; // Pruning
      }
      return { score: maxEval, move: bestMove };
    } else {
      let minEval = Infinity;
      for (const move of orderedMoves) {
        const snapshot = game.getSnapshot();
        game.makeMove(move);
        const evalResult = this.minimax(game, depth - 1, alpha, beta, true);
        game.undoSingle();

        if (evalResult.score < minEval) {
          minEval = evalResult.score;
          bestMove = move;
        }
        beta = Math.min(beta, evalResult.score);
        if (beta <= alpha) break; // Pruning
      }
      return { score: minEval, move: bestMove };
    }
  }

  // Master difficulty decider
  getBestMove(game, level = 3) {
    const legalMoves = game.getLegalMoves();
    if (legalMoves.length === 0) return null;

    const isWhite = game.turn === 'w';
    this.nodesEvaluated = 0;

    // Level 1: Novice - 85% random, 15% 1-ply capture
    if (level === 1) {
      if (Math.random() < 0.85) {
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }
      return this.minimax(game, 1, -Infinity, Infinity, isWhite).move || legalMoves[0];
    }

    // Level 2: Casual - 1-ply evaluation with a 30% chance of random play (for human blunder simulation)
    if (level === 2) {
      if (Math.random() < 0.3) {
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }
      return this.minimax(game, 1, -Infinity, Infinity, isWhite).move || legalMoves[0];
    }

    // Level 3: Club - 2-ply evaluation with slight randomization between top 3 moves
    if (level === 3) {
      // Evaluate all moves with depth 2
      const scoredMoves = [];
      for (const m of legalMoves) {
        game.makeMove(m);
        const res = this.minimax(game, 1, -Infinity, Infinity, !isWhite);
        game.undoSingle();
        scoredMoves.push({ move: m, score: res.score });
      }

      scoredMoves.sort((a, b) => isWhite ? b.score - a.score : a.score - b.score);
      // Pick randomly from top 2 to avoid deterministic repeats
      const topCount = Math.min(2, scoredMoves.length);
      const chosen = scoredMoves[Math.floor(Math.random() * topCount)];
      return chosen ? chosen.move : legalMoves[0];
    }

    // Level 4: Expert - 3-ply Minimax with Alpha-Beta Pruning
    if (level === 4) {
      const res = this.minimax(game, 3, -Infinity, Infinity, isWhite);
      return res.move || legalMoves[0];
    }

    // Level 5: Master - 4-ply Minimax with Alpha-Beta Pruning & positional heuristics
    if (level === 5) {
      const res = this.minimax(game, 4, -Infinity, Infinity, isWhite);
      return res.move || legalMoves[0];
    }

    return legalMoves[0];
  }

  // Get Move Hint (always calculates highest quality recommendation)
  getHint(game) {
    const isWhite = game.turn === 'w';
    const res = this.minimax(game, 3, -Infinity, Infinity, isWhite);
    return res.move || null;
  }
}

window.aiEngine = new AIEngine();
