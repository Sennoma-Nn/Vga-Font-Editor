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
