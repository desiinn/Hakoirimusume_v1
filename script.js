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
            if (pos) {
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
        piece.addEventListener('touchstart', startDrag, { passive: false }); // スクロール防止
    });

    // document全体にドラッグとドロップのイベントリスナーを設定
    // これにより、コマの上からマウス/指が離れても処理を継続できる
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', drag, { passive: false }); // スクロール防止
    document.addEventListener('touchend', endDrag);
    document.addEventListener('touchcancel', endDrag); // タッチが中断された場合も考慮

    resetButton.addEventListener('click', initializeGame);

    playAgainButton.addEventListener('click', () => {
        clearModal.classList.remove('active');
        const daughterPiece = document.getElementById('daughter');
        if (daughterPiece) {
            daughterPiece.classList.remove('cleared');
        }
        initializeGame();
    });

    helpButton.addEventListener('click', () => {
        ruleModal.classList.add('active');
    });

    closeRuleButton.addEventListener('click', () => {
        ruleModal.classList.remove('active');
    });

    ruleModal.addEventListener('click', (event) => {
        if (event.target === ruleModal) {
            ruleModal.classList.remove('active');
        }
    });

    // ---- ドラッグ開始処理 ----
    function startDrag(e) {
        // すでにアクティブなコマがある場合は、新しいドラッグを開始しない
        if (activePiece) return;

        // タッチイベントの場合は、複数指のタッチを無視し、最初の指のみを対象とする
        if (e.type === 'touchstart' && e.touches.length > 1) {
            return;
        }

        e.preventDefault(); // デフォルトのタッチ挙動（スクロール、ズームなど）を防止

        activePiece = e.target;
        activePiece.classList.add('dragging');

        // タッチイベントとマウスイベントで座標の取得方法を分ける
        if (e.type === 'touchstart') {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        } else { // mousedown
            startX = e.clientX;
            startY = e.clientY;
        }
        
        pieceStartX = activePiece.offsetLeft;
        pieceStartY = activePiece.offsetTop;
    }

    // ---- ドラッグ中の処理 ----
    function drag(e) {
        if (!activePiece) return; // アクティブなコマがない場合は処理しない

        // タッチイベントの場合は、複数指のタッチを無視し、最初の指のみを対象とする
        if (e.type === 'touchmove' && e.touches.length === 0) {
            return; // 指が離れてしまった場合は処理しない
        }

        e.preventDefault(); // デフォルトのタッチ挙動（スクロールなど）を防止

        let currentX, currentY;
        if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
        } else { // mousemove
            currentX = e.clientX;
            currentY = e.clientY;
        }

        const dx = currentX - startX;
        const dy = currentY - startY;

        // ドラッグの方向をより厳密に判定
        // 許容する移動方向の閾値（例えば、垂直方向の移動が水平方向の2倍以上であれば垂直移動とみなす）
        const THRESHOLD_FACTOR = 0.5; // 水平/垂直方向のどちらに大きく動いたかを判断する閾値

        if (Math.abs(dx) > Math.abs(dy) * THRESHOLD_FACTOR) { // 水平方向の移動が大きい
            activePiece.style.left = (pieceStartX + dx) + 'px';
            activePiece.style.top = pieceStartY + 'px'; // 垂直方向は固定
        } else if (Math.abs(dy) > Math.abs(dx) * THRESHOLD_FACTOR) { // 垂直方向の移動が大きい
            activePiece.style.top = (pieceStartY + dy) + 'px';
            activePiece.style.left = pieceStartX + 'px'; // 水平方向は固定
        }
        // 両方の移動が小さい（まだ方向が定まらない）場合は何もしない
    }

    // ---- ドラッグ終了処理 ----
    function endDrag(e) {
        if (!activePiece) return; // アクティブなコマがない場合は処理しない

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
            // 無効な移動の場合、元の位置に戻す
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
        
        // 盤面外への移動を禁止
        if (targetGridX < 0 || targetGridY < 0 || targetGridX + pieceWidth > 4 || targetGridY + pieceHeight > 5) {
            return false;
        }

        // 移動していない場合は無効な移動とする（手数をカウントしないため）
        if (startGridX === targetGridX && startGridY === targetGridY) {
            return false;
        }

        // 移動経路の衝突判定
        const dx = targetGridX - startGridX;
        const dy = targetGridY - startGridY;

        // 水平移動
        if (dx !== 0 && dy === 0) { // y方向の移動がないことを確認
            const step = dx > 0 ? 1 : -1;
            for (let i = 0; i < Math.abs(dx); i++) {
                const pathX = startGridX + (i + step) * step; // 現在地から目標方向へ1マスずつ
                if (isPathBlocked(movingPiece, pathX, startGridY, pieceWidth, pieceHeight)) {
                    return false;
                }
            }
        } 
        // 垂直移動
        else if (dy !== 0 && dx === 0) { // x方向の移動がないことを確認
            const step = dy > 0 ? 1 : -1;
            for (let i = 0; i < Math.abs(dy); i++) {
                const pathY = startGridY + (i + step) * step; // 現在地から目標方向へ1マスずつ
                if (isPathBlocked(movingPiece, startGridX, pathY, pieceWidth, pieceHeight)) {
                    return false;
                }
            }
        }
        // 斜め移動または同時に両方向への移動は無効
        else {
            return false;
        }
        
        // 最終位置での衝突判定
        return !isPathBlocked(movingPiece, targetGridX, targetGridY, pieceWidth, pieceHeight);
    }

    // ヘルパー関数: 指定した矩形領域が他のコマと衝突するか
    function isPathBlocked(movingPiece, checkX, checkY, width, height) {
        for (const piece of pieces) {
            if (piece === movingPiece) continue; // 動かしているコマ自身は無視

            const otherGridX = Math.round(piece.offsetLeft / GRID_SIZE);
            const otherGridY = Math.round(piece.offsetTop / GRID_SIZE);
            const otherWidth = Math.round(piece.offsetWidth / GRID_SIZE);
            const otherHeight = Math.round(piece.offsetHeight / GRID_SIZE);

            // 衝突判定
            if (checkX < otherGridX + otherWidth && 
                checkX + width > otherGridX && 
                checkY < otherGridY + otherHeight && 
                checkY + height > otherGridY) {
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
        // 娘のコマが特定の出口位置（例: (1, 3)から(2, 4)の範囲）に到達したか
        // daughterは2x2なので、左上グリッドが(1,3)であれば、全体は(1,3) (2,3) (1,4) (2,4)
        if (daughterGridX === 1 && daughterGridY === 3) {
            daughterPiece.classList.add('cleared');
            finalMoveCountSpan.textContent = moveCount;
            setTimeout(() => {
                clearModal.classList.add('active');
            }, 500);
        }
    }

    // ---- ゲーム開始 ----
    initializeGame();
});
