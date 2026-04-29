let activePressedBtn = null;

document.addEventListener('keydown', (e) => {
    if (editorData.goto) {
        e.preventDefault();
        const k = e.key;

        if (k === 'Enter') {
            gotoJump();
        } else if (k === 'Escape') {
            cancelGoto();
        } else if (k === 'Backspace') {
            if (editorData.gotoInput.length > 0) {
                editorData.gotoInput = editorData.gotoInput.slice(0, -1);
                updataGoto();
            }
        } else if (k.length === 1 && /[0-9A-Fa-f]/i.test(k)) {
            if (editorData.gotoInput.length < 2) {
                editorData.gotoInput += k.toUpperCase();
                updataGoto();
            }
        }
        return;
    };

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
    if (editorData.goto) return;

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
