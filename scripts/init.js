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

(() => {
    const container = document.querySelector('.canvarsAndHelp');
    const isDisabled = localStorage.getItem('helpDisenable') === 'true';
    if (isDisabled) return;

    const helpHTML = `
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
    `;
    container.insertAdjacentHTML('beforeend', helpHTML);
})();

window.addEventListener('beforeunload', function (event) {
    if (isProjDirty() || isEditing()) event.preventDefault();
});