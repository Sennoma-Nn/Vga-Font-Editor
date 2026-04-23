let currentLangData = {}

function lang(key, defaultValue) {
    return currentLangData[key] || defaultValue;
}

async function loadLanguage() {
    const params = new URLSearchParams(window.location.search);
    const langCode = params.get('lang');

    const response = await fetch('scripts/local.json');
    const data = await response.json();
    if (data[langCode]) {
        currentLangData = data[langCode]
    }

}
