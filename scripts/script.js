let fontInfo = {
    height: 16,
    data: []
};

let editorData = {
    index: 0,
    changedData: '',
    mode: 'normal',
    clipboard: ''
}

const isEditing = () => editorData.mode !== 'normal';
const isDirty = () => isEditing() && editorData.changedData !== fontInfo.data[editorData.index];

const getEmptyData = () => "0".repeat(8 * fontInfo.height)

setEmptyData(16);

function setEmptyData(h) {
    fontInfo.height = h;

    const emptyData = getEmptyData();

    for (let i = 0; i <= 255; i++) {
        fontInfo.data[i] = emptyData;
    }

    editorData.mode = 'normal';
    updateAllPreviews();
    openChar(editorData.index);
}

async function resetCharsData(h) {
    if (isDirty()) {
        updateTitle(true);
        return;
    }

    editorData.mode = 'normal';

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
    if (isDirty()) {
        updateTitle(true);
        return;
    }

    editorData.mode = 'normal';

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
    if (isDirty()) {
        updateTitle(true);
        return;
    }

    editorData.mode = 'normal';

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

function truncateText(text) {
    if (text.length > 32) {
        return text.slice(0, 32).trim() + '...';
    }
    return text;
}

function updateTitle(isWarning = false) {
    const index = editorData.index;
    const charTitle = document.getElementById('charTitle');
    const descriptions = truncateText(charDescriptions[index]);
    const saveTexts = isEditing() ? `
        &nbsp;|&nbsp;&nbsp;
        <span style="color: var(${isWarning ? '--vga-brown)"> * ' : '--vga-white)">'}Save?</span>
        &nbsp;
        <button class="TitleButton" onclick="saveChanges()"><bright>Y</bright>es</button>
        <button class="TitleButton" onclick="undoChanges()"><bright>N</bright>o</button>
    ` : '';

    let actionButtons;

    switch (editorData.mode) {
        case 'normal':
            actionButtons = `<button class="TitleButton" onclick="editChar()"><bright>E</bright>dit</button>`;
            break;
        case 'edit':
            actionButtons = `
                <button class="TitleButton" onclick="editLayer()"><bright>L</bright>ayer</button>
                <button class="TitleButton" onclick="editTransform()"><bright>T</bright>ransform</button>
                <button class="TitleButton" onclick="editShift()">S<bright>h</bright>ift</button>
            `;
            break;
        case 'layer':
            actionButtons = `
                <button class="TitleButton" onclick="editBack()"><bright>B</bright>ack</button>
                &nbsp;|&nbsp;
                <button class="TitleButton" onclick="layerCopy()"><bright>C</bright>opy</button>
                <button class="TitleButton" onclick="layerPaste()"><bright>P</bright>aste</button>
                <button class="TitleButton" onclick="layerClear()">Cle<bright>a</bright>r</button>
            `;
            break;
        case 'transform':
            actionButtons = `
                <button class="TitleButton" onclick="editBack()"><bright>B</bright>ack</button>
                &nbsp;|&nbsp;
                <button class="TitleButton" onclick="transformReverse()"><bright>R</bright>everse</button>
                <button class="TitleButton" onclick="transformFlipHorizontal()"><bright>F</bright>lip(↔)</button>
                <button class="TitleButton" onclick="transformFlipVertical()">F<bright>l</bright>ip(↕)</button>
            `;
            break;
        case 'shift':
            actionButtons = `
                <button class="TitleButton" onclick="editBack()"><bright>B</bright>ack</button>
                &nbsp;|&nbsp;
                <button class="TitleButton" onclick="shiftLeft()"><bright>←</bright></button>
                <button class="TitleButton" onclick="shiftDown()"><bright>↓</bright></button>
                <button class="TitleButton" onclick="shiftUp()"><bright>↑</bright></button>
                <button class="TitleButton" onclick="shiftRight()"><bright>→</bright></button>
            `
            break;
    }

    charTitle.innerHTML = `
        <span>&nbsp;#${index}:&nbsp;</span><span style="color: var(--vga-light-gray)">${descriptions}</span>
        &nbsp;&nbsp;|&nbsp;${actionButtons}${saveTexts}
    `;
}

function transformFlipHorizontal() {
    const h = fontInfo.height;
    let newData = "";

    for (let row = 0; row < h; row++) {
        let start = row * 8;
        let rb = editorData.changedData.substring(start, start + 8);
        let fr = rb.split('').reverse().join('');
        newData += fr;
    }

    editorData.changedData = newData;
    renderCanvas();
}

function transformFlipVertical() {
    const h = fontInfo.height;
    let r = [];

    for (let row = 0; row < h; row++) {
        let start = row * 8;
        r.push(editorData.changedData.substring(start, start + 8));
    }

    r.reverse();
    let newData = r.join('');

    editorData.changedData = newData;
    renderCanvas();
}

function editBack() {
    editorData.mode = 'edit'
    updateTitle()
}

function editLayer() {
    editorData.mode = 'layer'
    updateTitle()
}

function editTransform() {
    editorData.mode = 'transform'
    updateTitle()
}

function editShift() {
    editorData.mode = 'shift'
    updateTitle()
}

function shiftUp() {
    const h = fontInfo.height;
    let r = [];

    for (let i = 0; i < h; i++) {
        r.push(editorData.changedData.substring(i * 8, (i + 1) * 8));
    }

    r.shift();
    r.push("0".repeat(8));

    editorData.changedData = r.join('');
    renderCanvas();
}

function shiftDown() {
    const h = fontInfo.height;
    let r = [];

    for (let i = 0; i < h; i++) {
        r.push(editorData.changedData.substring(i * 8, (i + 1) * 8));
    }

    r.pop();
    r.unshift("0".repeat(8));

    editorData.changedData = r.join('');
    renderCanvas();
}

function shiftLeft() {
    const h = fontInfo.height;
    let r = [];

    for (let i = 0; i < h; i++) {
        let s = editorData.changedData.substring(i * 8, (i + 1) * 8).slice(1) + "0";
        r.push(s);
    }

    editorData.changedData = r.join('');
    renderCanvas();
}

function shiftRight() {
    const h = fontInfo.height;
    let r = [];

    for (let i = 0; i < h; i++) {
        let s = "0" + editorData.changedData.substring(i * 8, (i + 1) * 8).slice(0, -1);
        r.push(s);
    }

    editorData.changedData = r.join('');
    renderCanvas();
}

function layerCopy() {
    editorData.clipboard = editorData.changedData;
}

function layerPaste() {
    editorData.changedData = editorData.clipboard;
    renderCanvas();
}

function layerClear() {
    editorData.changedData = getEmptyData();
    renderCanvas();
}

const reverse = data => data.replace(/[01]/g, (match) => (match === '1' ? '0' : '1'));

function transformReverse() {
    editorData.changedData = reverse(editorData.changedData);
    renderCanvas();
}

async function openChar(index) {
    if (isDirty()) {
        updateTitle(true);
        return;
    }

    editorData.mode = 'normal';

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
    const charData = isEditing() ? editorData.changedData : fontInfo.data[index];

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

function updatePreviews(i) {
    const preview = document.getElementById(`prev${i}`);
    const charData = fontInfo.data[i];
    const h = fontInfo.height;

    preview.style.gridTemplateRows = `repeat(${h}, 2px)`;

    let pixelsHTML = '';
    for (let j = 0; j < charData.length; j++) {
        const isVisible = Number(charData[j]) ? '' : 'style="background-color: transparent"';
        pixelsHTML += `<div class="prevPixel" ${isVisible}></div>`;
    }
    preview.innerHTML = pixelsHTML;
}

function updateAllPreviews() {
    for (let i = 0; i < 256; i++) {
        updatePreviews(i);
    }
}

function pixelInput(i, e) {
    if (!isEditing()) return;
    if (e.buttons !== 1 && e.buttons !== 2) return;

    const newValue = e.buttons === 1 ? "1" : "0";

    let dataArr = editorData.changedData.split('');
    dataArr[i] = newValue;
    editorData.changedData = dataArr.join('');

    e.target.style.backgroundColor = newValue === "1" ? 'var(--vga-black)' : 'var(--vga-white)';
}

function editChar() {
    editorData.mode = 'edit';
    editorData.changedData = fontInfo.data[editorData.index];
    renderCanvas();
    updateTitle();
}

function saveChanges() {
    fontInfo.data[editorData.index] = editorData.changedData;
    editorData.mode = 'normal';

    updatePreviews(editorData.index);
    renderCanvas();
    updateTitle();
}

function undoChanges() {
    editorData.mode = 'normal';
    editorData.changedData = "";
    renderCanvas();
    updateTitle();
}
