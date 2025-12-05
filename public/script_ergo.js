// Psychedelic Keyboard script
// Génère un keyMap aléatoire et remplace la saisie physique par des caractères mappés.

(() => {
    // Only letters A-Z are used for mapping and output
    const letters = ['a','z','e','r','t','y','u','i','o','p',
                     'q','s','d','f','g','h','j','k','l','m',
                     'w','x','c','v','b','n'];

    // alphabet used as output values (must form a permutation)
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

    // Fisher-Yates shuffle to produce a random permutation
    function shuffleArray(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    const keyboardEl = document.getElementById('keyboard');
    // select only letter keys (exclude space and other special keys like Shift)
    const keyEls = Array.from(document.querySelectorAll('.key')).filter(k => {
        const key = (k.dataset.key || '').toLowerCase();
        return !k.classList.contains('space') && letters.includes(key);
    });
    const targetInput = document.getElementById('targetInput');
    const goalInput = document.getElementById('goalInput');
    const clearBtn = document.getElementById('clearBtn');
    const resetMapBtn = document.getElementById('resetMapBtn');
    const matchHint = document.getElementById('matchHint');
    const capsLockBtn = document.getElementById('capsLockBtn');

    let keyMap = {};
    // input active state: only process psychedelic input when true
    let isInputActive = false;
    // shift active state: uppercase letters when true
    let isShiftActive = false;
    // caps lock active state: synchronized with physical Caps Lock key
    let isCapsLockActive = false;
    // Game state: freeze keyboard during snake game
    let keyboardFrozen = false;
    // Prevent multiple countdowns
    let snakeCountdownRunning = false;
    const shiftKeyEl = document.getElementById('shiftKey');

    // Helper: sync virtual Caps Lock button with physical state
    function syncCapsLock(event) {
        const physicalCapsLockState = event ? event.getModifierState('CapsLock') : false;
        isCapsLockActive = physicalCapsLockState;
        if (capsLockBtn) {
            if (isCapsLockActive) {
                capsLockBtn.classList.add('active');
            } else {
                capsLockBtn.classList.remove('active');
            }
        }
    }

    // Helper: force caret to end and auto-scroll to end
    function moveCaret() {
        if (!targetInput) return;
        const len = targetInput.value.length;
        targetInput.selectionStart = len;
        targetInput.selectionEnd = len;
        // Auto-scroll to end
        targetInput.scrollLeft = targetInput.scrollWidth;
    }

    // Helper: dispatch an input event when we change the value programmatically
    function triggerInputEvent() {
        if (!targetInput) return;
        // Create and dispatch a standard input event so listeners react
        const ev = new Event('input', { bubbles: true });
        targetInput.dispatchEvent(ev);
    }

    function generateKeyMap() {
        keyMap = {};
        // create a shuffled permutation of the 26-letter alphabet
        const shuffled = shuffleArray(alphabet);
        // assign a unique output letter to each physical letter key
        // letters.length === shuffled.length === 26
        for (let i = 0; i < letters.length; i++) {
            keyMap[letters[i]] = shuffled[i];
        }
    }

    function updateKeyVisuals() {
        // update only letter keys visuals
        keyEls.forEach(k => {
            const phys = k.dataset.key.toLowerCase();
            const out = keyMap[phys] || '';
            k.textContent = out;
        });
    }

    // Helper: restore original letters (non-mapped)
    function restoreOriginalLetters() {
        keyEls.forEach(k => {
            const phys = k.dataset.key.toLowerCase();
            k.textContent = phys;
        });
    }

    // focus/blur control for goalInput and targetInput
    if (goalInput) {
        goalInput.addEventListener('focus', () => {
            isInputActive = false;
            restoreOriginalLetters();
        });
        goalInput.addEventListener('blur', () => {
            // no special action on blur
        });
    }

    if (targetInput) {
        targetInput.addEventListener('focus', () => { 
            isInputActive = true;
            generateKeyMap();
            updateKeyVisuals();
        });
        targetInput.addEventListener('blur', () => { isInputActive = false; });
    }

    function flashKeyboard() {
        if (!keyboardEl) return;
        keyboardEl.classList.add('shuffle');
        window.setTimeout(() => keyboardEl.classList.remove('shuffle'), 300);
    }

    function checkGoal() {
        if (!goalInput || !matchHint) return;
        const goal = goalInput.value.trim();
        if (!goal) { matchHint.textContent = ''; return; }
        if (targetInput.value.endsWith(goal)) {
            matchHint.textContent = `Objectif atteint: ${goal}`;
        } else if (goal && targetInput.value.includes(goal)) {
            matchHint.textContent = `Séquence trouvée quelque part dans la sortie.`;
        } else {
            matchHint.textContent = `Objectif: «${goal}» (${targetInput.value.length} caractères saisis)`;
        }
    }

    // Helper to find the virtual key element that corresponds to a DOM KeyboardEvent.key
    function findKeyElementFromKey(key) {
        if (!key) return null;
        let k = key;
        if (k.length === 1) k = k.toLowerCase();
        // match dataset attribute exactly
        return document.querySelector(`.key[data-key="${k}"]`);
    }

    // Visual feedback: when a physical key is pressed, add a glow class to the virtual key
    document.addEventListener('keydown', (e) => {
        const el = findKeyElementFromKey(e.key);
        if (el) el.classList.add('key-active');

        // Sync physical Caps Lock with virtual button
        if (e.key === 'CapsLock') {
            syncCapsLock(e);
        }
    });

    // Remove visual feedback when key is released
    document.addEventListener('keyup', (e) => {
        const el = findKeyElementFromKey(e.key);
        if (el) el.classList.remove('key-active');
    });

    // Main key handler: only active when input is focused
    document.addEventListener('keydown', (e) => {
        // Freeze keyboard during Snake game
        if (keyboardFrozen) return;
        if (!isInputActive) return;

        // Handle Shift key
        if (e.key === 'Shift') {
            e.preventDefault();
            isShiftActive = true;
            if (shiftKeyEl) {
                shiftKeyEl.classList.add('active');
                // also give immediate physical-press glow
                shiftKeyEl.classList.add('key-active');
            }
            return;
        }

        // detect spacebar (do not trigger shuffle)
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            if (targetInput) targetInput.value = (targetInput.value || '') + ' ';
            moveCaret();
            checkGoal();
            triggerInputEvent();
            return;
        }

        // Only handle letter keys a-z (AZERTY physical keys listed)
        const phys = (e.key || '').toLowerCase();
        if (!letters.includes(phys)) {
            // For non-letter keys (numbers, punctuation, accents, etc.):
            // Insert them directly without triggering shuffle
            if (isInputActive && e.key && e.key.length === 1) {
                e.preventDefault();
                if (targetInput) targetInput.value = (targetInput.value || '') + e.key;
                moveCaret();
                checkGoal();
                triggerInputEvent();
            }
            return;
        }

        e.preventDefault();

        let outChar = keyMap[phys] || '';
        // Convert to uppercase if Shift OR Caps Lock is active
        if (isShiftActive || isCapsLockActive) {
            outChar = outChar.toUpperCase();
        }
        if (targetInput) targetInput.value = (targetInput.value || '') + outChar;
        moveCaret();

        // After each letter press, regenerate mapping and update visuals
        generateKeyMap();
        updateKeyVisuals();
        // Do NOT call flashKeyboard here — avoid animating the entire keyboard on every press.
        // Keep only the per-key visual feedback (key-active) to avoid jitter/jump across keys.
        checkGoal();
        triggerInputEvent();
    });

    // Shift keyup handler: deactivate shift state
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            isShiftActive = false;
            if (shiftKeyEl) shiftKeyEl.classList.remove('active');
        }
    });

    // Add mouse handlers to the virtual Shift key so clicking doesn't clear text and shows visual feedback
    if (shiftKeyEl) {
        // When pressing the virtual shift (mouse down), prevent defaults and activate shift state
        shiftKeyEl.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            isShiftActive = true;
            shiftKeyEl.classList.add('active');
            shiftKeyEl.classList.add('key-active');
        });

        // When releasing the virtual shift, deactivate shift state
        shiftKeyEl.addEventListener('mouseup', (ev) => {
            ev.preventDefault();
            isShiftActive = false;
            shiftKeyEl.classList.remove('active');
            shiftKeyEl.classList.remove('key-active');
        });

        // If the pointer leaves the Shift key while pressed, ensure we clear state
        shiftKeyEl.addEventListener('mouseleave', (ev) => {
            isShiftActive = false;
            shiftKeyEl.classList.remove('active');
            shiftKeyEl.classList.remove('key-active');
        });
    }

    // Backspace handler: separate, does not trigger shuffle
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Backspace') return;
        if (!isInputActive) return;
        if (!targetInput) return;
        e.preventDefault();
        targetInput.value = targetInput.value.slice(0, -1);
        moveCaret();
        checkGoal();
        triggerInputEvent();
    });

    // Caps Lock button handler: sync with physical state or reflect it
    if (capsLockBtn) {
        capsLockBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            // When clicked, just read and sync the current physical state
            syncCapsLock(ev);
        });
    }

    // Contrôles UI
    if (clearBtn) clearBtn.addEventListener('click', () => { targetInput.value = ''; moveCaret(); checkGoal(); triggerInputEvent(); });
    if (resetMapBtn) resetMapBtn.addEventListener('click', () => { generateKeyMap(); updateKeyVisuals(); flashKeyboard(); });

    // Initialisation
    generateKeyMap();
    updateKeyVisuals();
    
    // Initialize Caps Lock state from physical key on load
    const dummyEvent = { getModifierState: () => false };
    syncCapsLock(dummyEvent);
    
    checkGoal();

    // ============================================================================
    // EASTER EGG: Detect "Snake" in targetInput and trigger game
    // ============================================================================
    
    if (targetInput) {
        targetInput.addEventListener('input', () => {
            const value = targetInput.value.toLowerCase().trim();
            
            // Check if value is exactly "snake"
            if (value === 'snake' && !snakeCountdownRunning) {
                // start a 3-second countdown before launching the game
                snakeCountdownRunning = true;

                // Clear the input immediately
                targetInput.value = '';

                // Freeze keyboard and clear input focus
                keyboardFrozen = true;
                isInputActive = false;

                const wrapEl = document.querySelector('.wrap');
                const snakeContainer = document.getElementById('snakeGameContainer');
                const countdownEl = document.getElementById('snakeCountdown');
                const scoreEl = document.getElementById('snakeScore');

                // Hide main UI and show the game container during countdown
                if (wrapEl) wrapEl.style.display = 'none';
                if (snakeContainer) snakeContainer.style.display = 'flex';

                let count = 3;
                if (countdownEl) countdownEl.textContent = `${count}`;

                const countdownTimer = setInterval(() => {
                    count -= 1;
                    if (countdownEl) countdownEl.textContent = `${count}`;
                    if (count <= 0) {
                        clearInterval(countdownTimer);
                        // Clear countdown
                        if (countdownEl) countdownEl.textContent = '';
                        // Ensure score shows 0
                        if (scoreEl) scoreEl.textContent = '0';
                        // Start the game
                        if (window.snakeGameManager) {
                            window.snakeGameManager.startGame();
                            // Hook endGame to unfreeze keyboard when game ends
                            const originalEndGame = window.snakeGameManager.endGame.bind(window.snakeGameManager);
                            window.snakeGameManager.endGame = function() {
                                originalEndGame();
                                keyboardFrozen = false;
                                snakeCountdownRunning = false;
                            };
                        } else {
                            // If manager missing, unfreeze
                            keyboardFrozen = false;
                            snakeCountdownRunning = false;
                        }
                    }
                }, 1000);
            }
        });
    }

})();
