function generateRandomHex() {
    const randomColor = Math.floor(Math.random() * 16777215); 
    
    let hex = randomColor.toString(16);

    while (hex.length < 6) {
        hex = "0" + hex;
    }
    
    return "#" + hex.toUpperCase();
}

let currentPalette = []; 
const PALETTE_SIZE = 5;

const paletteContainer = document.querySelector('.palette-container');
const generateBtn = document.getElementById('generate-btn');
const colorModeSelect = document.getElementById('color-mode'); 
const saveBtn = document.getElementById('save-btn');
const savedPalettesList = document.getElementById('saved-palettes-list');
const LOCAL_STORAGE_KEY = 'colorPalettes';

async function fetchHarmonicColors(baseHex, mode) {
    const API_URL = 'https://www.thecolorapi.com/scheme';
    const url = `${API_URL}?hex=${baseHex.substring(1)}&mode=${mode}&count=${PALETTE_SIZE}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.statusText}`);
        }
        const data = await response.json();
        
        return data.colors.map(color => color.hex.value);

    } catch (error) {
        return Array.from({ length: PALETTE_SIZE }, () => generateRandomHex()); 
    }
}

function renderPalette() {
    paletteContainer.innerHTML = '';
    currentPalette.forEach((colorObj, index) => {
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = colorObj.hex;
        swatch.setAttribute('data-index', index);

        const hexDisplay = document.createElement('span');
        hexDisplay.classList.add('color-hex');
        hexDisplay.textContent = colorObj.hex;
        
        const lockBtn = document.createElement('button');
        lockBtn.classList.add('lock-btn');
        const iconClass = colorObj.isLocked ? 'fas fa-lock' : 'fas fa-lock-open';
        lockBtn.innerHTML = `<i class="${iconClass}"></i>`;

        swatch.appendChild(hexDisplay);
        swatch.appendChild(lockBtn);
        paletteContainer.appendChild(swatch);
        
        lockBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            colorObj.isLocked = !colorObj.isLocked; 
            
            const newIconClass = colorObj.isLocked ? 'fas fa-lock' : 'fas fa-lock-open';
            lockBtn.querySelector('i').className = newIconClass;
        });

        swatch.addEventListener('click', () => {
            copyToClipboard(colorObj.hex, swatch);
        });
    });
}

function copyToClipboard(hex, element) {
    navigator.clipboard.writeText(hex).then(() => {
        const originalText = element.querySelector('.color-hex').textContent;
        element.querySelector('.color-hex').textContent = 'COPIADO!';
        
        setTimeout(() => {
            element.querySelector('.color-hex').textContent = originalText;
        }, 1000);
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
    });
}

async function generatePalette() {
    let baseColorHex = null;
    let mode = colorModeSelect.value;
    
    const lockedColor = currentPalette.find(color => color.isLocked);
    
    if (lockedColor) {
        baseColorHex = lockedColor.hex;
    } else {
        baseColorHex = generateRandomHex();
    }
    
    const newHexColors = await fetchHarmonicColors(baseColorHex, mode);

    if (currentPalette.length === 0) {
        currentPalette = newHexColors.map(hex => ({
            hex: hex,
            isLocked: false 
        }));
    } else {
        let newColorIndex = 0;
        
        for (let i = 0; i < PALETTE_SIZE; i++) {
            if (!currentPalette[i].isLocked) {
                currentPalette[i].hex = newHexColors[newColorIndex];
            }
            newColorIndex++;
        }
    }

    renderPalette();
}

function savePalette() {
    const existingPalettes = getSavedPalettes();
    const newPalette = currentPalette.map(color => color.hex);

    existingPalettes.push(newPalette);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingPalettes));
    
    displaySavedPalettes();
    
    alert('Paleta salva com sucesso!');
}

saveBtn.addEventListener('click', savePalette);

function getSavedPalettes() {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
}

function deletePalette(index) {
    if (!confirm('Tem certeza que deseja excluir esta paleta?')) {
        return;
    }

    const existingPalettes = getSavedPalettes();

    existingPalettes.splice(index, 1);

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingPalettes));

    displaySavedPalettes();
    alert('Paleta excluída com sucesso!');
}

function displaySavedPalettes() {
    savedPalettesList.innerHTML = '';
    const saved = getSavedPalettes();

    if (saved.length === 0) {
        savedPalettesList.innerHTML = '<p>Nenhuma paleta favorita salva ainda.</p>';
        return;
    }

    saved.forEach((palette, index) => {
        const savedItem = document.createElement('div');
        savedItem.classList.add('saved-item');
        
        const miniPalette = document.createElement('div');
        miniPalette.classList.add('mini-palette');

        palette.forEach(hex => {
            const miniSwatch = document.createElement('div');
            miniSwatch.style.backgroundColor = hex;
            miniPalette.appendChild(miniSwatch);
        });

        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('saved-item-actions');

        const loadBtn = document.createElement('button');
        loadBtn.classList.add('load-btn');
        loadBtn.textContent = 'Carregar';

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.textContent = 'Excluir';

        actionsContainer.appendChild(loadBtn);
        actionsContainer.appendChild(deleteBtn);

        savedItem.appendChild(miniPalette);
        savedItem.appendChild(actionsContainer);

        loadBtn.addEventListener('click', () => {
            loadSavedPalette(palette);
        });

        deleteBtn.addEventListener('click', () => {
            deletePalette(index); 
        });
        
        savedPalettesList.appendChild(savedItem);
    });
}

function loadSavedPalette(paletteArray) {
    currentPalette = []; 
    
    paletteArray.forEach(hex => {
        currentPalette.push({
            hex: hex,
            isLocked: false 
        });
    });
    
    renderPalette();
    alert('Paleta carregada!');
}


generateBtn.addEventListener('click', generatePalette);

(async () => {
    displaySavedPalettes();
    await generatePalette(); 
})();
