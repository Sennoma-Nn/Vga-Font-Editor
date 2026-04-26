(async () => {
    await loadLanguage();
    document.getElementById('btn-new16').innerHTML = lang('New16', 'New (8x1<bright>6</bright>)');
    document.getElementById('btn-new8').innerHTML = lang('New8', 'New (8x<bright>8</bright>)');
    document.getElementById('btn-open').innerHTML = lang('Open', '<bright>O</bright>pen');
    document.getElementById('btn-save').innerHTML = lang('Save', '<bright>S</bright>ave');

    document.body.style.fontFamily = lang('UiFont', 'MBytePC230')

    const charArea = document.getElementById('charArea');
    let buttonsHTML = '';

    for (let i = 0; i < 256; i++) {
        buttonsHTML += `
            <button id="openChar${i}" onclick="openChar(${i})" class="charButton">
                <div id="prev${i}" class="charPreview"></div>
                <span class="charIndex">${i.toString(16).padStart(2, '0').toUpperCase()}</span>
            </button>
        `;
    }
    charArea.insertAdjacentHTML('beforeend', buttonsHTML);

    const container = document.querySelector('.canvarsAndHelp');
    const isDisabled = localStorage.getItem('helpDisenable') === 'true';

    if (!isDisabled) {
        const defaultHelp = `
            <div class="helpText" id="helpText">
                <p>╔═ Help ════════════════╗</p>
                <p>║ Click the Edit button ║</p>
                <p>║ to edit the glyph.&nbsp;&nbsp;&nbsp; ║</p>
                <p>║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;║</p>
                <p>║ Left-click to draw,&nbsp;&nbsp; ║</p>
                <p>║ right-click to erase. ║</p>
                <p>╚══════════════<button class="menuButton" id="closeHelpBtn" onclick="helpDisenable()">I <bright>k</bright>now</button>═╝</p>
            </div>
        `
        container.insertAdjacentHTML('beforeend', lang('HelpBlock', defaultHelp));
    }

    setEmptyData(16);
})();

window.addEventListener('beforeunload', function (event) {
    if (isProjDirty() || isEditing()) event.preventDefault();
});