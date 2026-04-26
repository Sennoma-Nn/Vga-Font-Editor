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
const isProjDirty = () => {
    for (let i = 0; i < fontInfo.data.length; i++) {
        const str = fontInfo.data[i];
        if (str.includes('1')) {
            return true;
        }
    }
    return false;
}

const getEmptyData = () => "0".repeat(8 * fontInfo.height)

function setEmptyData(h) {
    fontInfo.height = h;
    editorData.clipboard = getEmptyData(fontInfo.height);

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
        if (isProjDirty()) {
            const abandonDiv = document.getElementById('warningArea');
            if (abandonDiv.querySelector('.menuButton')) {
                resolve(false);
                return;
            }

            abandonDiv.innerHTML = `
                <span style="color: var(--vga-red)">&nbsp;${lang('WarnLost', '&nbsp;* Current will be lost!!!')}</span>
                <button class="menuButton" id="confirmYes">${lang('Yes', '<bright>Y</bright>es')}</button>
                <button class="menuButton" id="confirmNo">${lang('No', '<bright>N</bright>o')}</button>
            `;

            const handleChoice = (choice) => {
                abandonDiv.innerHTML = '';
                resolve(choice);
            };

            document.getElementById('confirmYes').onclick = () => { if (!isDirty()) { handleChoice(true) } else { updateTitle(true) } };
            document.getElementById('confirmNo').onclick = () => { if (!isDirty()) { handleChoice(false) } else { updateTitle(true) } };
        } else resolve(true);
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
            showError(lang('ErrorFont', "Font data error!"));
            return;
        }

        let fontHeight = charLen / 8;
        if (!(fontHeight > 0 && fontHeight <= 32)) {
            showError(lang('ErrorFont', "Font data error!"));
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

async function saveFont() {
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

    if ('showSaveFilePicker' in window) {
        try {
            const opts = {
                suggestedName: 'FONT.RAW',
                types: [{
                    description: 'VGA Bitmap Font File',
                    accept: { 'application/octet-stream': ['.RAW'] }
                }]
            };
            const fileHandle = await window.showSaveFilePicker(opts);
            const writable = await fileHandle.createWritable();
            await writable.write(byteArray);
            await writable.close();
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
            }
        }
        return;
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
    const maxLen = Number(lang('TruncateTextMaxLen', '32'));
    if (text.length > maxLen) {
        return text.slice(0, maxLen).trim() + '...';
    }
    return text;
}

function updateTitle(isWarning = false) {
    const index = editorData.index;
    const charTitle = document.getElementById('charTitle');

    const descriptions = editorData.mode === 'normal' || editorData.mode === 'edit'
        ? `
            <span>&nbsp;#${index}:&nbsp;</span>
                <span style="color: var(--vga-light-gray)" title="${lang('CharDescriptions', charDescriptions, false)[index].replace(/"/g, '&quot;')}">
                    ${toUni(truncateText(lang('CharDescriptions', charDescriptions, false)[index]))}
                </span>
            &nbsp;&nbsp;|&nbsp;
        ` : '';

    const saveTexts = isEditing() ? `
        &nbsp;|&nbsp;&nbsp;
        <span style="color: var(${isWarning ? '--vga-brown' : '--vga-white'})">${isWarning ? '* ' : ''}${lang('SaveQ', 'Save?')}</span>
        &nbsp;
        <button class="TitleButton" onclick="saveChanges()">${lang('Yes', '<bright>Y</bright>es')}</button>
        <button class="TitleButton" onclick="undoChanges()">${lang('No', '<bright>N</bright>o')}</button>
    ` : '';

    let actionButtons;

    switch (editorData.mode) {
        case 'normal':
            actionButtons = `<button class="TitleButton" onclick="editChar()">${lang('Edit', '<bright>E</bright>dit')}</button>`;
            break;
        case 'edit':
            actionButtons = `
                <button class="TitleButton" onclick="editLayer()">${lang('Layer', '<bright>L</bright>ayer')}</button>
                <button class="TitleButton" onclick="editTransform()">${lang('Transform', '<bright>T</bright>ransform')}</button>
                <button class="TitleButton" onclick="editShift()">${lang('Shift', 'S<bright>h</bright>ift')}</button>
            `;
            break;
        case 'layer':
            actionButtons = `
                <button class="TitleButton" onclick="editBack()">${lang('Back', '<bright>B</bright>ack')}</button>
                &nbsp;|&nbsp;
                <button class="TitleButton" onclick="layerCopy()">${lang('Copy', '<bright>C</bright>opy')}</button>
                <button class="TitleButton" onclick="layerPaste()">${lang('Paste', '<bright>P</bright>aste')}</button>
                <button class="TitleButton" onclick="layerClear()">${lang('Clear', 'Cle<bright>a</bright>r')}</button>
            `;
            break;
        case 'transform':
            actionButtons = `
                <button class="TitleButton" onclick="editBack()">${lang('Back', '<bright>B</bright>ack')}</button>
                &nbsp;|&nbsp;
                <button class="TitleButton" onclick="transformReverse()">${lang('Reverse', '<bright>R</bright>everse')}</button>
                <button class="TitleButton" onclick="transformFlipHorizontal()">${lang('FlipH', '<bright>F</bright>lip(↔)')}</button>
                <button class="TitleButton" onclick="transformFlipVertical()">${lang('FlipV', 'F<bright>l</bright>ip(↕)')}</button>
            `;
            break;
        case 'shift':
            actionButtons = `
                <button class="TitleButton" onclick="editBack()">${lang('Back', '<bright>B</bright>ack')}</button>
                &nbsp;|&nbsp;
                <button class="TitleButton" onclick="shiftLeft()"><bright>←</bright></button>
                <button class="TitleButton" onclick="shiftDown()"><bright>↓</bright></button>
                <button class="TitleButton" onclick="shiftUp()"><bright>↑</bright></button>
                <button class="TitleButton" onclick="shiftRight()"><bright>→</bright></button>
            `
            break;
    }

    charTitle.innerHTML = `
        ${descriptions}${actionButtons}${saveTexts}
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
    const wh = h <= 24 ? 32 : 16;
    const charData = isEditing() ? editorData.changedData : fontInfo.data[index];

    canvas.oncontextmenu = (e) => e.preventDefault();
    canvas.style.gridTemplateColumns = `repeat(8, ${wh}px)`;
    canvas.style.gridTemplateRows = `repeat(${h}, ${wh}px)`;

    let pixelsHTML = '';
    for (let i = 0; i < charData.length; i++) {
        const color = Number(charData[i]) ? 'var(--vga-black)' : 'var(--vga-white)';
        pixelsHTML += `<div class="pixel" 
            style="background-color: ${color}; width: ${wh}px; height: ${wh}px" 
            onmousedown="pixelInput(${i}, event)" 
            onmouseenter="pixelInput(${i}, event)">
        </div>`;
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

function helpDisenable() {
    const helpDiv = document.getElementById('helpText');
    if (helpDiv) {
        helpDiv.style.display = 'none';
        localStorage.setItem('helpDisenable', 'true');
    }
}
