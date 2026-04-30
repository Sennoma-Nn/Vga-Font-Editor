let activePressedBtn = null;

document.addEventListener('keydown', (e) => {
    if (editorData.inputmode === 'name') {
        e.preventDefault();
        const k = e.key;

        if (k === 'Enter') {
            if (editorData.stringInput.trim().length > 0) {
                setTabData('name', editorData.stringInput);
            }
            editorData.inputmode = 'normal';
            updateTabs();
        } else if (k === 'Escape') {
            editorData.inputmode = 'normal';
            updateTabs();
        } else if (k === 'Backspace') {
            editorData.stringInput = editorData.stringInput.slice(0, -1);
            updateTabs();
        } else if (k.length === 1) {
            const invalidChars = /[<>:"/\\|?*]/;
            if (!invalidChars.test(k)) {
                editorData.stringInput += k;
                updateTabs();
            }
        }
        return;
    }

    if (editorData.inputmode === 'goto') {
        e.preventDefault();
        const k = e.key;

        if (k === 'Enter') {
            gotoJump();
        } else if (k === 'Escape') {
            cancelGoto();
        } else if (k === 'Backspace') {
            if (editorData.stringInput.length > 0) {
                editorData.stringInput = editorData.stringInput.slice(0, -1);
                updataGoto();
            }
        } else if (k.length === 1 && /^[0-9A-Fa-f+-]$/i.test(k)) {
            let newInput = editorData.stringInput + (k === '+' || k === '-' ? k : k.toUpperCase());

            const isHex = /^[0-9A-F]*$/i.test(newInput);
            const isAllPlus = /^\+*$/.test(newInput);
            const isAllMinus = /^-*$/.test(newInput);

            if ((isHex || isAllPlus || isAllMinus) && newInput.length <= 2) {
                editorData.stringInput = newInput;
                updataGoto();
            }
        }
        return;
    }

    if (e.repeat) return;

    if (activePressedBtn) {
        const prevBtn = activePressedBtn;
        activePressedBtn = null;
        prevBtn.classList.remove('pressed');
        prevBtn.click();
    }

    const k = key2Symbol(e.key.toUpperCase());

    const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.offsetParent !== null && getBrightKey(b) === k);

    if (btn) {
        btn.classList.add('pressed');
        activePressedBtn = btn;
    }
});

document.addEventListener('keyup', (e) => {
    if (editorData.inputmode === 'goto' || editorData.inputmode === 'name') return;

    const k = key2Symbol(e.key.toUpperCase());

    if (activePressedBtn && getBrightKey(activePressedBtn) === k) {
        const btn = activePressedBtn;
        activePressedBtn = null;
        btn.classList.remove('pressed');
        btn.click();
    } else {
        document.querySelectorAll('button').forEach(btn => {
            if (getBrightKey(btn) === k) btn.classList.remove('pressed');
        });
    }
});

function getBrightKey(button) {
    const bb = button.querySelector('bright');
    return bb ? bb.innerText.trim().toUpperCase() : null;
}

function key2Symbol(k) {
    switch (k) {
        case 'ARROWUP': return '↑';
        case 'ARROWDOWN': return '↓';
        case 'ARROWLEFT': return '←';
        case 'ARROWRIGHT': return '→';
        default: return k;
    }
}
