let fontInfo = {
    height: 16,
    data: []
};

let editorData = {
    index: 0,
    changedData: "",
    isDirty: false,
    clipboard: ""
}

setEmptyData(16);

function setEmptyData(h) {
    fontInfo.height = h;

    let emptyData = ((h) => {
        return "0".repeat(8 * h);
    })(h);

    for (let i = 0; i <= 255; i++) {
        fontInfo.data[i] = emptyData;
    }

    editorData.isDirty = false;
    updateAllPreviews();
    openChar(editorData.index);
}

async function resetCharsData(h) {
    if (editorData.isDirty) {
        updateTitle(true);
        return;
    }

    const proceed = await askIsAbandon();
    if (!proceed) return;

    setEmptyData(h);
}

function askIsAbandon() {
    return new Promise((resolve) => {
        const abandonDiv = document.getElementById('warningArea');

        if (abandonDiv.querySelector('.menuButton')) {
            resolve(false);
            return;
        }

        abandonDiv.innerHTML = `
            <span style="color: var(--vga-red)">&nbsp;* Current will be lost!!!</span>
            <button class="menuButton" id="confirmYes"><bright>Y</bright>es</button>
            <button class="menuButton" id="confirmNo"><bright>N</bright>o</button>
        `;

        const handleChoice = (choice) => {
            abandonDiv.innerHTML = '';
            resolve(choice);
        };

        document.getElementById('confirmYes').onclick = () => handleChoice(true);
        document.getElementById('confirmNo').onclick = () => handleChoice(false);
    });
}

function showError(message) {
    const errorDiv = document.getElementById('warningArea');
    errorDiv.innerHTML = `
        <span style="color: var(--vga-red)">&nbsp;* Error: ${message}</span>
    `;
    setTimeout(() => {
        if (errorDiv.innerText.includes('Error:')) errorDiv.innerHTML = '';
    }, 2000);
}

async function openFont() {
    if (editorData.isDirty) {
        updateTitle(true);
        return;
    }

    const proceed = await askIsAbandon();
    if (!proceed) return;

    const fileInput = document.getElementById('OpenFontInput');
    fileInput.click();

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const buffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(buffer);

        let result = "";

        for (let i = 0; i < uint8.length; i++) {
            result += uint8[i].toString(2).padStart(8, '0');
        }

        let charLen = result.length / 256;
        if (charLen % 1 !== 0) {
            showError("Font data error!");
            return;
        }

        let fontHeight = charLen / 8;
        if (fontHeight != 8 && fontHeight != 16) {
            showError(`Font data error!`);
            return;
        }
        fontInfo.height = fontHeight;

        for (let i = 0; i <= 255; i++) {
            let s = i * charLen;
            let e = (i + 1) * charLen;
            fontInfo.data[i] = result.slice(s, e);
        }

        updateAllPreviews();
        openChar(editorData.index);
        fileInput.value = '';
    };
}

function saveFont() {
    if (editorData.isDirty) {
        updateTitle(true);
        return;
    }

    const totalBytes = 256 * fontInfo.height;
    const byteArray = new Uint8Array(totalBytes);

    for (let i = 0; i < 256; i++) {
        const charData = fontInfo.data[i];
        for (let row = 0; row < fontInfo.height; row++) {
            const rowString = charData.substring(row * 8, (row + 1) * 8);
            byteArray[i * fontInfo.height + row] = parseInt(rowString, 2);
        }
    }

    const blob = new Blob([byteArray], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'FONT.RAW';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function debug() {
    console.log(fontInfo);
}

function updateTitle(isWarning = false) {
    const index = editorData.index;
    const charTitle = document.getElementById('charTitle');
    const actionButtons = !editorData.isDirty
        ? `|<button class="TitleButton" onclick="editChar()"><bright>E</bright>dit</button>`
        : `
            |
            <span style="color: var(${isWarning ? '--vga-brown)"> * ' : '--vga-white)">'}Save?</span>
            <button class="TitleButton" onclick="saveChanges()"><bright>Y</bright>es</button>
            <button class="TitleButton" onclick="undoChanges()"><bright>N</bright>o</button>
            |
            <button class="TitleButton" onclick="editCopy()"><bright>C</bright>opy</button>
            <button class="TitleButton" onclick="editPaste()"><bright>P</bright>aste</button>
            <button class="TitleButton" onclick="editReverse()"><bright>R</bright>everse</button>
        `;

    charTitle.innerHTML = `
        <span>&nbsp;#${index}: </span><span style="color: var(--vga-light-gray)">${charDescriptions[index]}</span>
        ${actionButtons}
    `;
}

function editCopy() {
    editorData.clipboard = editorData.changedData;
}

function editPaste() {
    editorData.changedData = editorData.clipboard;
    renderCanvas();
}

const reverse = data => data.replace(/[01]/g, (match) => (match === '1' ? '0' : '1'));

function editReverse() {
    editorData.changedData = reverse(editorData.changedData);
    renderCanvas();
}

async function openChar(index) {
    if (editorData.isDirty) {
        updateTitle(true);
        return;
    }

    const lastActive = document.querySelector('.charButton.active');
    if (lastActive) {
        lastActive.classList.remove('active');
    }

    const currentBtn = document.getElementById(`openChar${index}`);
    if (currentBtn) {
        currentBtn.classList.add('active');
    }

    editorData.index = index;
    renderCanvas();
    updateTitle();
}

function renderCanvas() {
    const index = editorData.index;
    const canvas = document.getElementById('pixelCanvas');
    const h = fontInfo.height;
    const charData = editorData.isDirty ? editorData.changedData : fontInfo.data[index];

    canvas.oncontextmenu = (e) => e.preventDefault();
    canvas.style.gridTemplateRows = `repeat(${h}, 32px)`;

    let pixelsHTML = '';
    for (let i = 0; i < charData.length; i++) {
        const color = Number(charData[i]) ? 'var(--vga-black)' : 'var(--vga-white)';
        pixelsHTML += `<div class="pixel" 
            style="background-color: ${color}" 
            onmousedown="pixelInput(${i}, event)" 
            onmouseenter="pixelInput(${i}, event)"></div>`;
    }
    canvas.innerHTML = pixelsHTML;
}

function updateAllPreviews() {
    const h = fontInfo.height;

    for (let i = 0; i < 256; i++) {
        const preview = document.getElementById(`prev${i}`);
        if (!preview) continue;

        const charData = fontInfo.data[i];

        preview.style.gridTemplateRows = `repeat(${h}, 2px)`;

        let pixelsHTML = '';
        for (let j = 0; j < charData.length; j++) {
            const isVisible = Number(charData[j]) ? '' : 'style="background-color: transparent"';
            pixelsHTML += `<div class="prevPixel" ${isVisible}></div>`;
        }
        preview.innerHTML = pixelsHTML;
    }
}

function pixelInput(i, e) {
    if (!editorData.isDirty) return;
    if (e.buttons !== 1 && e.buttons !== 2) return;

    const newValue = e.buttons === 1 ? "1" : "0";

    let dataArr = editorData.changedData.split('');
    dataArr[i] = newValue;
    editorData.changedData = dataArr.join('');

    e.target.style.backgroundColor = newValue === "1" ? 'var(--vga-black)' : 'var(--vga-white)';
}

function editChar() {
    editorData.isDirty = true;
    editorData.changedData = fontInfo.data[editorData.index];
    renderCanvas();
    updateTitle();
}

function saveChanges() {
    fontInfo.data[editorData.index] = editorData.changedData;
    editorData.isDirty = false;

    updateAllPreviews();
    renderCanvas();
    updateTitle();
}

function undoChanges() {
    editorData.isDirty = false;
    editorData.changedData = "";
    renderCanvas();
    updateTitle();
}

document.addEventListener('keydown', (e) => {
    const k = e.key.toUpperCase();
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