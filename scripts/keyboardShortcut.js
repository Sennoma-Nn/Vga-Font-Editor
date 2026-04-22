document.addEventListener('keydown', (e) => {
    const k = key2Symbol(e.key.toUpperCase());
    const abtn = document.querySelectorAll('button');
    for (const btn of abtn) {
        if (btn.offsetParent !== null && getBrightKey(btn) === k) {
            btn.click();
            e.preventDefault();
            return;
        }
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
