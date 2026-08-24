(() => {
  const canvas = document.getElementById('tetris-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('next-canvas');
  const nextCtx = nextCanvas.getContext('2d');

  const COLS = 8;
  const ROWS = 14;
  const CELL = canvas.width / COLS; // 20

  const BOARD_BG = '#F7F2EC';
  const GRID_LINE = 'rgba(58, 42, 32, 0.08)';

  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    T: [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    S: [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
    Z: [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    J: [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    L: [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
  };
  const COLORS = {
    I: '#8B6F52',
    O: '#3A2A20',
    T: '#7A5B45',
    S: '#A88E76',
    Z: '#5C4530',
    J: '#C7A98A',
    L: '#4A3A2C',
  };
  const TYPES = Object.keys(SHAPES);
  const RIG_FILL_COLOR = COLORS.J; // reuse an existing piece color so the pre-filled row looks legit
  const SPAWN_X = Math.floor((COLS - 4) / 2); // centers a 4-wide piece on the (now narrower) board

  const scoreEl = document.getElementById('stat-score');
  const linesEl = document.getElementById('stat-lines');
  const messageEl = document.getElementById('game-message');
  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');

  let board, current, next, score, lines, level, dropInterval, dropTimer;
  let running = false;
  let paused = false;
  let hasWon = false;
  let rafId = null;
  let lastTime = 0;

  function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function rotateMatrix(m) {
    const n = m.length;
    const out = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        out[c][n - 1 - r] = m[r][c];
      }
    }
    return out;
  }

  function randomType() {
    return TYPES[Math.floor(Math.random() * TYPES.length)];
  }

  function spawnPiece(type) {
    return {
      type,
      matrix: SHAPES[type].map((row) => row.slice()),
      color: COLORS[type],
      x: SPAWN_X,
      y: 0,
    };
  }

  function collides(piece, offsetX, offsetY, matrix) {
    const m = matrix || piece.matrix;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const boardX = piece.x + c + offsetX;
        const boardY = piece.y + r + offsetY;
        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
        if (boardY >= 0 && board[boardY][boardX]) return true;
      }
    }
    return false;
  }

  function merge(piece) {
    piece.matrix.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val) {
          const y = piece.y + r;
          const x = piece.x + c;
          if (y >= 0) board[y][x] = piece.color;
        }
      });
    });
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((cell) => cell)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    return cleared;
  }

  function applyScore(cleared) {
    const table = { 1: 100, 2: 300, 3: 500, 4: 800 };
    if (cleared > 0) {
      score += (table[cleared] || 0) * level;
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(120, 800 - (level - 1) * 65);
    }
    scoreEl.textContent = score;
    linesEl.textContent = lines;
  }

  function lockPiece() {
    merge(current);
    const cleared = clearLines();
    applyScore(cleared);
    if (!hasWon) {
      triggerWin();
      return;
    }
    current = next;
    next = spawnPiece(randomType());
    drawNext();
    if (collides(current, 0, 0)) {
      gameOver();
    }
  }

  function move(dx) {
    if (!running || paused) return;
    if (!collides(current, dx, 0)) current.x += dx;
    draw();
  }

  function softDrop() {
    if (!running || paused) return;
    if (!collides(current, 0, 1)) {
      current.y += 1;
      score += 1;
      scoreEl.textContent = score;
    } else {
      lockPiece();
    }
    draw();
  }

  function hardDrop() {
    if (!running || paused) return;
    let dist = 0;
    while (!collides(current, 0, 1)) {
      current.y += 1;
      dist++;
    }
    score += dist * 2;
    scoreEl.textContent = score;
    lockPiece();
    draw();
  }

  function rotate() {
    if (!running || paused) return;
    const rotated = rotateMatrix(current.matrix);
    if (!collides(current, 0, 0, rotated)) {
      current.matrix = rotated;
    } else if (!collides(current, -1, 0, rotated)) {
      current.x -= 1;
      current.matrix = rotated;
    } else if (!collides(current, 1, 0, rotated)) {
      current.x += 1;
      current.matrix = rotated;
    }
    draw();
  }

  function drawCell(context, x, y, color) {
    context.fillStyle = color;
    context.fillRect(x, y, CELL - 1, CELL - 1);
    context.fillStyle = 'rgba(255,255,255,0.18)';
    context.fillRect(x, y, CELL - 1, 3);
  }

  function draw() {
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(canvas.width, r * CELL);
      ctx.stroke();
    }

    board.forEach((row, r) => {
      row.forEach((color, c) => {
        if (color) drawCell(ctx, c * CELL, r * CELL, color);
      });
    });

    if (current) {
      current.matrix.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val) {
            const y = current.y + r;
            if (y >= 0) drawCell(ctx, (current.x + c) * CELL, y * CELL, current.color);
          }
        });
      });
    }
  }

  function drawNext() {
    nextCtx.fillStyle = BOARD_BG;
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    const cell = 18;
    const shape = next.matrix;
    let minC = 4, maxC = -1, minR = 4, maxR = -1;
    shape.forEach((row, r) => row.forEach((v, c) => {
      if (v) { minC = Math.min(minC, c); maxC = Math.max(maxC, c); minR = Math.min(minR, r); maxR = Math.max(maxR, r); }
    }));
    const w = (maxC - minC + 1) * cell;
    const h = (maxR - minR + 1) * cell;
    const offX = (nextCanvas.width - w) / 2;
    const offY = (nextCanvas.height - h) / 2;
    shape.forEach((row, r) => row.forEach((v, c) => {
      if (v) {
        nextCtx.fillStyle = next.color;
        const x = offX + (c - minC) * cell;
        const y = offY + (r - minR) * cell;
        nextCtx.fillRect(x, y, cell - 1, cell - 1);
      }
    }));
  }

  function setMessage(text) {
    messageEl.textContent = text;
  }

  function gameOver() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    setMessage('Game over — press Start to try again.');
    btnStart.textContent = 'Start';
  }

  function triggerWin() {
    hasWon = true;
    running = false;
    current = null;
    if (rafId) cancelAnimationFrame(rafId);
    setMessage('You win! Check the popup for your promo code — press Start to play again.');
    btnStart.textContent = 'Start';
    document.dispatchEvent(new CustomEvent('rd:tetris-win'));
  }

  function tick(time) {
    if (!running) return;
    if (!paused) {
      if (time - lastTime > dropInterval) {
        lastTime = time;
        if (!collides(current, 0, 1)) {
          current.y += 1;
        } else {
          lockPiece();
        }
        draw();
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  function resetGame() {
    board = emptyBoard();
    for (let c = 0; c < COLS; c++) {
      if (c < SPAWN_X || c >= SPAWN_X + 4) board[ROWS - 1][c] = RIG_FILL_COLOR;
    }
    hasWon = false;
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 900; // paced so an untouched piece still "wins" in ~10-15s, not instantly
    current = spawnPiece('I');       // forced piece lines up with the pre-filled row above
    next = spawnPiece(randomType()); // "Next" preview stays genuinely random
    scoreEl.textContent = 0;
    linesEl.textContent = 0;
    drawNext();
    draw();
  }

  function startGame() {
    resetGame();
    running = true;
    paused = false;
    lastTime = performance.now();
    setMessage('');
    btnStart.textContent = 'Restart';
    btnPause.textContent = 'Pause';
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    btnPause.textContent = paused ? 'Resume' : 'Pause';
    setMessage(paused ? 'Paused' : '');
  }

  btnStart.addEventListener('click', startGame);
  btnPause.addEventListener('click', togglePause);

  document.addEventListener('keydown', (e) => {
    if (!running) return;
    switch (e.code) {
      case 'ArrowLeft': e.preventDefault(); move(-1); break;
      case 'ArrowRight': e.preventDefault(); move(1); break;
      case 'ArrowDown': e.preventDefault(); softDrop(); break;
      case 'ArrowUp': e.preventDefault(); rotate(); break;
      case 'Space': e.preventDefault(); hardDrop(); break;
      case 'KeyP': e.preventDefault(); togglePause(); break;
    }
  });

  document.querySelectorAll('.touch-controls [data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      switch (btn.dataset.action) {
        case 'left': move(-1); break;
        case 'right': move(1); break;
        case 'down': softDrop(); break;
        case 'rotate': rotate(); break;
      }
    });
  });

  // Idle board preview before the player presses Start
  board = emptyBoard();
  current = null;
  next = spawnPiece(randomType());
  drawNext();
  draw();
  setMessage('Press Start to play.');
})();
