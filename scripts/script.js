let fontInfo = {
    height: 16,
    data: []
};

let editingIndex = 0

resetCharsData(16);
console.log(fontInfo);

function resetCharsData(h) {
    fontInfo.height = h;

    let emptyData = ((h) => {
        return "0".repeat(8 * h);
    })(h);

    for (let i = 0; i <= 255; i++) {
        fontInfo.data[i] = emptyData;
    }

    updateAllPreviews();
    openChar(editingIndex);
}

async function openFont() {
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

        charLen = result.length / 256;
        if (charLen % 1 !== 0) return;

        fontHeight = charLen / 8;
        if (fontHeight != 8 && fontHeight != 16) return;
        fontInfo.height = fontHeight;

        for (let i = 0; i <= 255; i++) {
            let s = i * charLen;
            let e = (i + 1) * charLen;
            fontInfo.data[i] = result.slice(s, e);
        }

        updateAllPreviews();
        openChar(editingIndex);
        fileInput.value = '';
    };
}

function saveFont() {

}

function debug() {
    console.log(fontInfo);
}

function openChar(index) {
    editingIndex = index;

    const canvas = document.getElementById('pixelCanvas');
    const h = fontInfo.height;
    const charData = fontInfo.data[index];

    const charTitle = document.getElementById('charTitle');
    charTitle.innerHTML = `<span>&nbsp;#${index}: </sapn><span style="color: var(--vga-light-gray)">${charDescriptions[index]}</span>`

    canvas.style.gridTemplateRows = `repeat(${h}, 32px)`;

    let pixelsHTML = '';
    for (let i = 0; i < charData.length; i++) {
        const color = Number(charData[i]) ? 'var(--vga-black)' : 'var(--vga-white)';
        pixelsHTML += `<div class="pixel" style="background-color: ${color}"></div>`;
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