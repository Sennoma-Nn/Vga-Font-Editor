let activePressedBtn = null;

document.addEventListener('keydown', (e) => {
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
