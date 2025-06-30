// 修正後の script.js
document.addEventListener('DOMContentLoaded', () => {
    // ---- 変数・定数の定義 ----
    const GRID_SIZE = 80;
    const board = document.getElementById('board');
    const pieces = document.querySelectorAll('.piece');
    const moveCountSpan = document.getElementById('move-count');
    const resetButton = document.getElementById('reset-button');
    const clearModal = document.getElementById('clear-modal');
    const finalMoveCountSpan = document.getElementById('final-move-count');
    const playAgainButton = document.getElementById('play-again-button');
// ★★★ ルール説明関連の要素を取得 ★★★
    const helpButton = document.getElementById('help-button');
    const ruleModal = document.getElementById('rule-modal');
    const closeRuleButton = document.getElementById('close-rule-button');

    let moveCount = 0;
    let activePiece = null;
    let startX, startY;
    let pieceStartX, pieceStartY;

    // ---- コマの初期配置データ ----
    const initialPositions = {
       'daughter': { top: 0, left: 1 },
       'father':   { top: 0, left: 0 },
       'mother':   { top: 0, left: 3 },
       'bantou':   { top: 2, left: 1 },
       'butler':   { top: 2, left: 0 },
       'maid':     { top: 2, left: 3 },
       'guard1':   { top: 3, left: 1 },
       'guard2':   { top: 3, left: 2 },
       'guard3':   { top: 4, left: 0 },
       'guard4':   { top: 4, left: 3 },
    };

    // ---- ゲームの初期化・リセット関数 ----
    function initializeGame() {
        for (const piece of pieces) {
            const pos = initialPositions[piece.id];
            if (pos) 
                piece.style.top = (pos.top * GRID_SIZE) + 'px';
                piece.style.left = (pos.left * GRID_SIZE) + 'px';
            }
        }
        moveCount = 0;
        moveCountSpan.textContent = moveCount;
        console.log("ゲームが初期化されました。");
    }

    // ---- イベントリスナーの登録 ----
    pieces.forEach(piece => {
        piece.addEventListener('mousedown', startDrag);
    });
    resetButton.addEventListener('click', initializeGame);

    // ★★★ このブロックをリスナー登録セクションに移動しました ★★★
    playAgainButton.addEventListener('click', () => {
        clearModal.classList.remove('active');
        const daughterPiece = document.getElementById('daughter');
        if (daughterPiece) {
            daughterPiece.classList.remove('cleared');
        }
        initializeGame();
    });

// ★★★ ヘルプボタンのクリックイベント ★★★
    helpButton.addEventListener('click', () => {
        ruleModal.classList.add('active');
    });

// ★★★ ルールを閉じるボタンのクリックイベント ★★★
    closeRuleButton.addEventListener('click', () => {
        ruleModal.classList.remove('active');
    });

// ★★★ 背景をクリックしてもモーダルが閉じるようにする ★★★
    ruleModal.addEventListener('click', (event) => {
        // クリックされたのが背景（.modal-overlay自身）の場合のみ閉じる
        if (event.target === ruleModal) {
            ruleModal.classList.remove('active');
        }
    });

    // ---- ドラッグ開始処理 ----
    function startDrag(e) {
        e.preventDefault();
        activePiece = e.target;
        activePiece.classList.add('dragging');
        startX = e.clientX;
        startY = e.clientY;
        pieceStartX = activePiece.offsetLeft;
        pieceStartY = activePiece.offsetTop;
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
    }

    // ---- ドラッグ中の処理 ----
    function drag(e) {
        if (!activePiece) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > Math.abs(dy)) {
            activePiece.style.left = (pieceStartX + dx) + 'px';
            activePiece.style.top = pieceStartY + 'px';
        } else {
            activePiece.style.top = (pieceStartY + dy) + 'px';
            activePiece.style.left = pieceStartX + 'px';
        }
    }

    // ---- ドラッグ終了処理 ----
    function endDrag(e) {
        if (!activePiece) return;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', endDrag);
        const finalLeft = activePiece.offsetLeft;
        const finalTop = activePiece.offsetTop;
        const targetGridX = Math.round(finalLeft / GRID_SIZE);
        const targetGridY = Math.round(finalTop / GRID_SIZE);
        if (isMoveValid(activePiece, targetGridX, targetGridY)) {
            const targetPixelX = targetGridX * GRID_SIZE;
            const targetPixelY = targetGridY * GRID_SIZE;
            activePiece.style.left = targetPixelX + 'px';
            activePiece.style.top = targetPixelY + 'px';
            if (pieceStartX !== targetPixelX || pieceStartY !== targetPixelY) {
                moveCount++;
                moveCountSpan.textContent = moveCount;
            }
            checkWinCondition();
        } else {
            activePiece.style.left = pieceStartX + 'px';
            activePiece.style.top = pieceStartY + 'px';
        }
        activePiece.classList.remove('dragging');
        activePiece = null;
    }

    // ---- 移動の妥当性チェック（改善版） ----
    function isMoveValid(movingPiece, targetGridX, targetGridY) {
        const pieceWidth = Math.round(movingPiece.offsetWidth / GRID_SIZE);
        const pieceHeight = Math.round(movingPiece.offsetHeight / GRID_SIZE);
        const startGridX = Math.round(pieceStartX / GRID_SIZE);
        const startGridY = Math.round(pieceStartY / GRID_SIZE);
        if (targetGridX < 0 || targetGridY < 0 || targetGridX + pieceWidth > 4 || targetGridY + pieceHeight > 5) {
            return false;
        }
        if (startGridX === targetGridX && startGridY === targetGridY) {
            return false;
        }
        const dx = targetGridX - startGridX;
        const dy = targetGridY - startGridY;
        if (dx !== 0) {
            const step = dx > 0 ? 1 : -1;
            for (let i = 1; i <= Math.abs(dx); i++) {
                const pathX = startGridX + i * step;
                if (isPathBlocked(movingPiece, pathX, startGridY, pieceWidth, pieceHeight)) {
                    return false;
                }
            }
        } else if (dy !== 0) {
            const step = dy > 0 ? 1 : -1;
            for (let i = 1; i <= Math.abs(dy); i++) {
                const pathY = startGridY + i * step;
                if (isPathBlocked(movingPiece, startGridX, pathY, pieceWidth, pieceHeight)) {
                    return false;
                }
            }
        }
        return true;
    }

    // ヘルパー関数: 指定した矩形領域が他のコマと衝突するか
    function isPathBlocked(movingPiece, checkX, checkY, width, height) {
        for (const piece of pieces) {
            if (piece === movingPiece) continue;
            const otherGridX = Math.round(piece.offsetLeft / GRID_SIZE);
            const otherGridY = Math.round(piece.offsetTop / GRID_SIZE);
            const otherWidth = Math.round(piece.offsetWidth / GRID_SIZE);
            const otherHeight = Math.round(piece.offsetHeight / GRID_SIZE);
            if (checkX < otherGridX + otherWidth && checkX + width > otherGridX && checkY < otherGridY + otherHeight && checkY + height > otherGridY) {
                return true;
            }
        }
        return false;
    }

   // ---- クリア条件のチェック ----
    function checkWinCondition() {
        const daughterPiece = document.getElementById('daughter');
        if (!daughterPiece) return;
        const daughterGridX = Math.round(daughterPiece.offsetLeft / GRID_SIZE);
        const daughterGridY = Math.round(daughterPiece.offsetTop / GRID_SIZE);
        if (daughterGridX === 1 && daughterGridY === 3) {
            daughterPiece.classList.add('cleared');
            finalMoveCountSpan.textContent = moveCount;
            setTimeout
