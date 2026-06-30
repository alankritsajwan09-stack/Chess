document.addEventListener('DOMContentLoaded', () => {
    const boardBody = document.getElementById('board');
    const turnIndicator = document.getElementById('turn-indicator');
    const whiteCapturedArea = document.getElementById('white-captured-area');
    const blackCapturedArea = document.getElementById('black-captured-area');
    const gameOverScreen = document.getElementById('game-over-screen');
    const checkmateText = document.getElementById('checkmate-text');
    const winnerText = document.getElementById('winner-text');

    // SVG image URLs — Wikimedia Commons orthodox piece set (matches reference image)
    const PIECE_IMGS = {
        w: {
            king:   'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
            queen:  'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
            rook:   'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
            bishop: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
            knight: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
            pawn:   'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg'
        },
        b: {
            king:   'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
            queen:  'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
            rook:   'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
            bishop: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
            knight: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
            pawn:   'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg'
        }
    };

    // Initial board state (8x8 grid)
    // 0 = empty
    // string representation like 'b-rook' for black rook or 'w-pawn' for white pawn
    let board = [
        ['b-rook', 'b-knight', 'b-bishop', 'b-king', 'b-queen', 'b-bishop', 'b-knight', 'b-rook'],
        ['b-pawn', 'b-pawn', 'b-pawn', 'b-pawn', 'b-pawn', 'b-pawn', 'b-pawn', 'b-pawn'],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        ['w-pawn', 'w-pawn', 'w-pawn', 'w-pawn', 'w-pawn', 'w-pawn', 'w-pawn', 'w-pawn'],
        ['w-rook', 'w-knight', 'w-bishop', 'w-queen', 'w-king', 'w-bishop', 'w-knight', 'w-rook']
    ];

    let currentTurn = 'white';
    let selectedSquare = null;
    let validMoves = [];

    // Board orientation: flip if player chose black
    const FLIPPED = (window.playerColor === 'black');

    // ── Sound Effects (Web Audio API – no external files needed) ──────────────
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playMoveSound() {
        // Soft wooden thud: short low-frequency noise burst
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.12, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
        }
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.55, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        src.start();
    }

    function playCaptureSound() {
        // Sharp crack: high-frequency noise burst with harder attack
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.18, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
        }
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1200;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.9, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        src.start();
    }
    // ─────────────────────────────────────────────────────────────────────────

    // DOM Rendering function — builds <tr><td> rows to match the HTML <table> structure
    function renderBoard() {
        boardBody.innerHTML = ''; // Clear board

        for (let row = 0; row < 8; row++) {
            const tr = document.createElement('tr');

            for (let col = 0; col < 8; col++) {
                // Map visual row/col to logical board coords (flip if playing as black)
                const logRow = FLIPPED ? 7 - row : row;
                const logCol = FLIPPED ? 7 - col : col;

                const td = document.createElement('td');

                // Color pattern for chess board
                td.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');

                td.dataset.row = logRow;
                td.dataset.col = logCol;

                // Add piece if exists
                const pieceData = board[logRow][logCol];
                if (pieceData !== 0) {
                    const [color, type] = pieceData.split('-');
                    const img = document.createElement('img');
                    img.src = PIECE_IMGS[color][type];
                    img.alt = `${color}-${type}`;
                    img.draggable = false;
                    img.style.cssText = 'width:56px;height:56px;display:block;margin:auto;pointer-events:none;';
                    td.appendChild(img);
                }

                // Highlight selected square
                if (selectedSquare && selectedSquare.row === logRow && selectedSquare.col === logCol) {
                    td.classList.add('selected');
                }

                // Highlight valid move squares
                if (isValidMovePosition(logRow, logCol)) {
                    td.classList.add('valid-move');
                }

                td.addEventListener('click', () => handleSquareClick(logRow, logCol));
                tr.appendChild(td);
            }

            boardBody.appendChild(tr);
        }

        // Update turn indicator to match HTML format: "- White's Turn"
        const turnName = currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1);
        turnIndicator.textContent = `- ${turnName}'s Turn`;
    }

    function isWhitePiece(pieceData) {
        return pieceData !== 0 && pieceData.startsWith('w-');
    }

    function isBlackPiece(pieceData) {
        return pieceData !== 0 && pieceData.startsWith('b-');
    }

    // Move validation helper function
    function isValidMovePosition(row, col) {
        return validMoves.some(move => move.r === row && move.c === col);
    }

    function calculateValidMoves(row, col) {
        validMoves = [];
        const pieceData = board[row][col];
        if (pieceData === 0) return;

        const [color, type] = pieceData.split('-');
        const isWhite = color === 'w';
        const direction = isWhite ? -1 : 1; // White moves up (-row), Black moves down (+row)

        // Helper to add move, returns true if space was empty (can keep sliding)
        const addMoveIfValid = (r, c) => {
            if (r < 0 || r > 7 || c < 0 || c > 7) return false;
            const target = board[r][c];
            if (target === 0) {
                validMoves.push({ r, c });
                return true;
            } else {
                // Cannot capture own pieces
                const isTargetWhite = target.startsWith('w-');
                if (isWhite !== isTargetWhite) {
                    validMoves.push({ r, c }); // Can capture enemy
                }
                return false; // Path blocked, can't slide further
            }
        };

        if (type === 'pawn') {
            // Forward movement
            const fwdRow = row + direction;
            if (fwdRow >= 0 && fwdRow <= 7 && board[fwdRow][col] === 0) {
                validMoves.push({ r: fwdRow, c: col });
                // Double jump on first move
                const startRow = isWhite ? 6 : 1;
                const doubleFwdRow = fwdRow + direction;
                if (row === startRow && doubleFwdRow >= 0 && doubleFwdRow <= 7 && board[doubleFwdRow][col] === 0) {
                    validMoves.push({ r: doubleFwdRow, c: col });
                }
            }

            // Diagonal captures
            for (let c of [col - 1, col + 1]) {
                if (c >= 0 && c <= 7 && fwdRow >= 0 && fwdRow <= 7) {
                    const target = board[fwdRow][c];
                    if (target !== 0 && (isWhite ? isBlackPiece(target) : isWhitePiece(target))) {
                        validMoves.push({ r: fwdRow, c: c });
                    }
                }
            }
        } else if (type === 'rook') {
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            dirs.forEach(([dr, dc]) => {
                let r = row + dr, c = col + dc;
                while (addMoveIfValid(r, c)) { r += dr; c += dc; }
            });
        } else if (type === 'knight') {
            const moves = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            moves.forEach(([dr, dc]) => addMoveIfValid(row + dr, col + dc));
        } else if (type === 'bishop') {
            const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
            dirs.forEach(([dr, dc]) => {
                let r = row + dr, c = col + dc;
                while (addMoveIfValid(r, c)) { r += dr; c += dc; }
            });
        } else if (type === 'queen') {
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
            dirs.forEach(([dr, dc]) => {
                let r = row + dr, c = col + dc;
                while (addMoveIfValid(r, c)) { r += dr; c += dc; }
            });
        } else if (type === 'king') {
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
            dirs.forEach(([dr, dc]) => addMoveIfValid(row + dr, col + dc));
        }
    }

    function checkWinCondition() {
        // Simple game over check based on King capture
        let whiteKingAlive = false;
        let blackKingAlive = false;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === 'w-king') whiteKingAlive = true;
                if (board[r][c] === 'b-king') blackKingAlive = true;
            }
        }

        if (!whiteKingAlive || !blackKingAlive) {
            const winner = whiteKingAlive ? 'White' : 'Black';
            setTimeout(() => {
                // Show the game-over screen from HTML
                checkmateText.textContent = 'CHECKMATE!';
                winnerText.textContent = `${winner} Wins!`;
                gameOverScreen.style.transition = 'opacity 0.8s ease';
                gameOverScreen.style.opacity = '1';
                gameOverScreen.style.display = 'flex';

                // Auto-shutdown after 3.5 seconds with a fade-out
                setTimeout(() => {
                    gameOverScreen.style.opacity = '0';
                    setTimeout(() => {
                        // Wipe the entire page to black — game over / shutdown
                        document.body.innerHTML = '';
                        document.body.style.cssText = 'margin:0;padding:0;background:#000;width:100vw;height:100vh;';
                        window.close(); // works if the tab was opened via a script
                    }, 800); // wait for fade to finish
                }, 3500);
            }, 100);
            return true;
        }
        return false;
    }

    function handleSquareClick(row, col) {
        const clickedPiece = board[row][col];
        // currentTurn is 'white' or 'black', piece prefix is 'w' or 'b'
        const turnPrefix = currentTurn.charAt(0);
        const isCurrentTurnPiece = clickedPiece !== 0 && clickedPiece.startsWith(turnPrefix + '-');

        if (selectedSquare) {
            // Already selected, try moving
            if (isValidMovePosition(row, col)) {
                // Execute move
                const targetPiece = board[row][col];

                // Track captured piece — show it in the correct capture box
                if (targetPiece !== 0) {
                    playCaptureSound(); // 🔊 capture sound
                    const [c, t] = targetPiece.split('-');
                    const img = document.createElement('img');
                    img.src = PIECE_IMGS[c][t];
                    img.alt = `${c}-${t}`;
                    img.draggable = false;
                    img.style.cssText = 'width:28px;height:28px;display:inline-block;';
                    // White pieces captured → shown in white-captures box; black pieces → black-captures box
                    if (c === 'w') {
                        whiteCapturedArea.appendChild(img);
                    } else {
                        blackCapturedArea.appendChild(img);
                    }
                } else {
                    playMoveSound(); // 🔊 regular move sound
                }

                // Move piece
                board[row][col] = board[selectedSquare.row][selectedSquare.col];
                board[selectedSquare.row][selectedSquare.col] = 0;

                // Reset selection
                selectedSquare = null;
                validMoves = [];

                // End turn
                if (!checkWinCondition()) {
                    currentTurn = currentTurn === 'white' ? 'black' : 'white';
                    renderBoard();
                }
            } else if (isCurrentTurnPiece && (selectedSquare.row !== row || selectedSquare.col !== col)) {
                // Change selection
                selectedSquare = { row, col };
                calculateValidMoves(row, col);
                renderBoard();
            } else {
                // Deselect
                selectedSquare = null;
                validMoves = [];
                renderBoard();
            }
        } else {
            // Nothing selected yet
            if (isCurrentTurnPiece) {
                selectedSquare = { row, col };
                calculateValidMoves(row, col);
                renderBoard();
            }
        }
    }

    // Initial render
    renderBoard();
});
