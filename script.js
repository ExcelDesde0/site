document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const startBtn = document.getElementById('start-btn');
    const mainContent = document.getElementById('main-content');
    const grid = document.getElementById('grid');
    const columnHeaders = document.getElementById('column-headers');
    const rowHeaders = document.getElementById('row-headers');
    const cellNameBox = document.getElementById('cell-name-box');
    const formulaInput = document.getElementById('formula-input');
    const exerciseTitle = document.getElementById('exercise-title');
    const exerciseQuestion = document.getElementById('exercise-question');
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackText = document.getElementById('feedback-text');
    const prevExerciseBtn = document.getElementById('prev-exercise-btn');
    const nextExerciseBtn = document.getElementById('next-exercise-btn');
    const restartBtn = document.getElementById('restart-btn');
    const fontFamilySelect = document.getElementById('font-family-select');
    const fontSizeSelect = document.getElementById('font-size-select');
    const boldBtn = document.getElementById('font-bold-btn');
    const italicBtn = document.getElementById('font-italic-btn');
    const underlineBtn = document.getElementById('font-underline-btn');
    const fontColorBtn = document.getElementById('font-color-btn');
    const bgColorBtn = document.getElementById('bg-color-btn');
    const tooltip = document.getElementById('tooltip');
    const completionScreen = document.getElementById('completion-screen');
    const completionMessage = document.getElementById('completion-message');
    const completionCounter = document.getElementById('completion-counter');
    const userNameInput = document.getElementById('user-name-input');
    const restartCourseBtn = document.getElementById('restart-course-btn');
    const adminButton = document.getElementById('admin-button');

    // --- State ---
    const ROWS = 6;
    const COLS = 4;
    let selectedCell = null;
    let editingCell = null;
    let currentExercise = 0;
    let isSelectingRange = false;
    let selectionStartCell = null;
    let tooltipTimeout;

    // --- Color Palette ---
    const colors = {
        'red': '#FF0000',
        'blue': '#0000FF',
        'yellow': '#FFFF00',
        'gray': '#808080',
        'white': '#FFFFFF',
        'black': '#000000',
        'orange': '#FFA500',
        'purple': '#800080'
    };

    // --- Initialization ---
    function init() {
        startBtn.addEventListener('click', startApp);
        setupRibbon();
        initializeGrid();
        restartCourseBtn.addEventListener('click', restartCourse);
        adminButton.addEventListener('click', () => {
            currentExercise = 17; // Jump to Paso 18 (index 17)
            loadExercise(currentExercise);
            mainContent.style.display = 'flex';
            completionScreen.style.display = 'none';
        });
    }

    function startApp() {
        welcomeScreen.style.display = 'none';
        mainContent.style.display = 'flex';
        loadExercise(currentExercise);
    }

    function setupRibbon() {
        const fontColorPalette = createColorPalette('font-color');
        const bgColorPalette = createColorPalette('bg-color');
        fontColorBtn.parentElement.appendChild(fontColorPalette);
        bgColorBtn.parentElement.appendChild(bgColorPalette);

        fontColorBtn.addEventListener('click', () => {
            togglePalette(fontColorPalette);
            animateButtonClick(fontColorBtn);
        });
        bgColorBtn.addEventListener('click', () => {
            togglePalette(bgColorPalette);
            animateButtonClick(bgColorBtn);
        });

        document.querySelectorAll('[data-tooltip]').forEach(el => {
            el.addEventListener('mouseenter', showTooltip);
            el.addEventListener('mouseleave', hideTooltip);
        });
    }

    function createColorPalette(type) {
        const palette = document.createElement('div');
        palette.className = 'color-palette';
        palette.id = `${type}-palette`;
        for (const colorName in colors) {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = colors[colorName];
            swatch.dataset.colorName = colorName;
            swatch.addEventListener('click', () => {
                const styleProperty = type === 'font-color' ? 'color' : 'backgroundColor';
                applyStyle(styleProperty, colors[colorName]);
                palette.style.display = 'none';
            });
            palette.appendChild(swatch);
        }
        return palette;
    }

    function togglePalette(palette) {
        palette.style.display = palette.style.display === 'grid' ? 'none' : 'grid';
    }

    function initializeGrid() {
        grid.innerHTML = '';
        columnHeaders.innerHTML = '';
        rowHeaders.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${COLS}, 120px)`;

        for (let i = 0; i < COLS; i++) {
            const header = document.createElement('div');
            header.className = 'column-header';
            header.textContent = String.fromCharCode(65 + i);
            columnHeaders.appendChild(header);
        }

        for (let i = 1; i <= ROWS; i++) {
            const header = document.createElement('div');
            header.className = 'row-header';
            header.textContent = i;
            rowHeaders.appendChild(header);
        }

        for (let row = 1; row <= ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = document.createElement('div');
                const colName = String.fromCharCode(65 + col);
                cell.className = 'cell';
                cell.dataset.cellId = `${colName}${row}`;
                grid.appendChild(cell);

                cell.addEventListener('mousedown', (e) => handleMouseDown(e, cell));
                cell.addEventListener('mouseover', (e) => handleMouseOver(e, cell));
                cell.addEventListener('dblclick', () => makeCellEditable(cell, true));
            }
        }
        document.addEventListener('mouseup', handleMouseUp);
    }

    // --- Tooltips ---
    function showTooltip(e) {
        const el = e.currentTarget;
        const tooltipText = el.dataset.tooltip;
        if (!tooltipText) return;

        tooltipTimeout = setTimeout(() => {
            tooltip.textContent = tooltipText;
            const rect = el.getBoundingClientRect();
            tooltip.style.display = 'block';
            tooltip.style.left = `${rect.left}px`;
            tooltip.style.top = `${rect.bottom + 5}px`;
        }, 1000);
    }

    function hideTooltip() {
        clearTimeout(tooltipTimeout);
        tooltip.style.display = 'none';
    }

    // --- Cell Interaction & Selection ---
    function handleCellSelection(cell) {
        if (editingCell && editingCell !== cell) {
            finishEditing(editingCell);
        }
        if (selectedCell) {
            selectedCell.classList.remove('selected');
        }
        clearRangeSelection();
        selectedCell = cell;
        selectedCell.classList.add('selected');
        cellNameBox.textContent = selectedCell.dataset.cellId;
        syncFormulaBar(cell);
        updateToolbarUI(cell);
        checkAnswer();
    }

    function handleMouseDown(e, cell) {
        e.preventDefault();
        isSelectingRange = true;
        selectionStartCell = cell;
        handleCellSelection(cell);
    }

    function handleMouseOver(e, cell) {
        if (isSelectingRange) {
            clearRangeSelection();
            highlightRange(selectionStartCell, cell);
        }
    }

    function handleMouseUp() {
        if (isSelectingRange) {
            isSelectingRange = false;
            checkAnswer();
        }
    }

    function makeCellEditable(cell, clearContent = false) {
        if (editingCell) {
            finishEditing(editingCell);
        }
        editingCell = cell;
        cell.contentEditable = 'true';
        if (clearContent) {
            cell.textContent = '';
        }
        cell.focus();
        const range = document.createRange();
        range.selectNodeContents(cell);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function finishEditing(cell) {
        if (!cell || !cell.isContentEditable) return;
        cell.contentEditable = 'false';
        if (editingCell === cell) {
            editingCell = null;
        }
        checkAnswer();
    }

    document.addEventListener('keydown', (e) => {
        // Allow backspace/delete in userNameInput
        if ((e.key === 'Backspace' || e.key === 'Delete') && document.activeElement === userNameInput) {
            return; // Allow default behavior for input field
        }

        if (e.key === 'Enter' && editingCell) {
            e.preventDefault();
            finishEditing(editingCell);
        } else if (selectedCell && (e.key === 'Backspace' || e.key === 'Delete')) {
            selectedCell.textContent = '';
            e.preventDefault();
            checkAnswer();
        } else if (!selectedCell || editingCell) {
            return;
        }

        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            if (!editingCell) {
                makeCellEditable(selectedCell, true);
            }
        } else if (e.key === 'F2') {
            e.preventDefault();
            makeCellEditable(selectedCell);
        }
    });

    // --- Toolbar & Formula Bar Logic ---
    formulaInput.addEventListener('input', (e) => {
        if (selectedCell) {
            selectedCell.textContent = e.target.value;
        }
    });
    formulaInput.addEventListener('blur', (e) => {
        if (selectedCell) {
            checkAnswer();
        }
    });

    function applyStyle(style, value) {
        getSelectedCells().forEach(cell => {
            cell.style[style] = value;
        });
        checkAnswer();
    }

    function toggleStyle(style, activeValue, inactiveValue) {
        const cells = getSelectedCells();
        if (cells.length === 0) return;
        const isAllActive = Array.from(cells).every(cell => {
            const computedStyle = window.getComputedStyle(cell);
            return computedStyle[style] === activeValue;
        });
        const newValue = isAllActive ? inactiveValue : activeValue;
        cells.forEach(cell => {
            cell.style[style] = newValue;
        });
        checkAnswer();
    }

    function updateToolbarUI(cell) {
        if (!cell) return;
        const computedStyle = window.getComputedStyle(cell);
        boldBtn.classList.toggle('active', computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700);
        italicBtn.classList.toggle('active', computedStyle.fontStyle === 'italic');
        underlineBtn.classList.toggle('active', computedStyle.textDecoration.includes('underline'));
        fontFamilySelect.value = computedStyle.fontFamily.split(',')[0].replace(/"/g, '').trim() || 'Calibri';
        fontSizeSelect.value = Math.round(parseFloat(computedStyle.fontSize) * 0.75) + '' || '11';
    }

    function animateButtonClick(button) {
        button.classList.add('clicked');
        setTimeout(() => {
            button.classList.remove('clicked');
        }, 200);
    }

    boldBtn.addEventListener('click', () => {
        toggleStyle('fontWeight', 'bold', 'normal');
        animateButtonClick(boldBtn);
    });
    italicBtn.addEventListener('click', () => {
        toggleStyle('fontStyle', 'italic', 'normal');
        animateButtonClick(italicBtn);
    });
    underlineBtn.addEventListener('click', () => {
        toggleStyle('textDecoration', 'underline', 'none');
        animateButtonClick(underlineBtn);
    });
    fontFamilySelect.addEventListener('change', () => applyStyle('fontFamily', fontFamilySelect.value));
    fontSizeSelect.addEventListener('change', () => applyStyle('fontSize', `${fontSizeSelect.value}pt`));

    // --- Exercises ---
    const exercises = [
        { title: "Paso 1: Seleccionar una Celda", question: "Haz clic en la celda B2.",
            check: () => selectedCell && selectedCell.dataset.cellId === 'B2' },
        { title: "Paso 2: Seleccionar un Rango", question: "Haz clic en A1 y arrastra el ratón hasta B3 para seleccionar el rango.",
            check: () => {
                const range = getSelectedRange();
                const expected = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
                return range.length === expected.length && expected.every(id => range.includes(id));
            }
        },
        { title: "Paso 3: Escribir en una Celda", question: "Haz clic en la celda C1, escribe 'Excel' y presiona Enter.",
            check: () => {
                const cell = getCell('C1');
                return cell && cell.textContent.toLowerCase() === 'excel';
            }
        },
        { title: "Paso 4: Aplicar Negrita", question: "Selecciona la celda A2 y aplica el formato de negrita.",
            setup: () => getCell('A2').textContent = 'Estilo',
            check: () => {
                const cell = getCell('A2');
                const style = window.getComputedStyle(cell);
                return cell && (style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700);
            }
        },
        { title: "Paso 5: Aplicar Cursiva", question: "Selecciona la celda A3 y aplica el formato de cursiva.",
            setup: () => getCell('A3').textContent = 'Texto',
            check: () => {
                const cell = getCell('A3');
                const style = window.getComputedStyle(cell);
                return cell && style.fontStyle === 'italic';
            }
        },
        { title: "Paso 6: Subrayar Texto", question: "Selecciona la celda A4 y subraya el texto.",
            setup: () => getCell('A4').textContent = 'Importante',
            check: () => {
                const cell = getCell('A4');
                const style = window.getComputedStyle(cell);
                return cell && style.textDecoration.includes('underline');
            }
        },
        { title: "Paso 7: Cambiar Fuente", question: "Cambia el tipo de letra de la celda B1 a Arial.",
            setup: () => getCell('B1').textContent = 'Fuente',
            check: () => {
                const cell = getCell('B1');
                const style = window.getComputedStyle(cell);
                return cell && style.fontFamily.includes('Arial');
            }
        },
        { title: "Paso 8: Cambiar Tamaño", question: "Cambia el tamaño de la fuente de la celda B2 a 16pt.",
            setup: () => getCell('B2').textContent = 'Grande',
            check: () => {
                const cell = getCell('B2');
                return cell && cell.style.fontSize === '16pt';
            }
        },
        { title: "Paso 9: Color de Fuente", question: "Cambia el color del texto de la celda C3 a rojo.",
            setup: () => getCell('C3').textContent = 'Rojo',
            check: () => {
                const cell = getCell('C3');
                const style = window.getComputedStyle(cell);
                return cell && style.color === 'rgb(255, 0, 0)';
            }
        },
        { title: "Paso 10: Color de Relleno", question: "Rellena la celda D1 con color amarillo.",
            check: () => {
                const cell = getCell('D1');
                const style = window.getComputedStyle(cell);
                return cell && style.backgroundColor === 'rgb(255, 255, 0)';
            }
        },
        { title: "Paso 11: Seleccionar Rango y Cambiar Fuente", question: "Selecciona el rango de A2 a C3 y cambia el tipo de letra a Arial.",
            check: () => {
                const range = ['A2', 'B2', 'C2', 'A3', 'B3', 'C3'];
                return range.every(id => {
                    const cell = getCell(id);
                    const style = window.getComputedStyle(cell);
                    return cell && style.fontFamily.includes('Arial');
                });
            }
        },
        { title: "Paso 12: Escribir y Aplicar Negrita", question: "Escribe 'Hola' en la celda B2 y aplícale negrita.",
            check: () => {
                const cell = getCell('B2');
                const style = window.getComputedStyle(cell);
                return cell && cell.textContent.toLowerCase() === 'hola' && (style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700);
            }
        },
        { title: "Paso 13: Cambiar Color de Fondo y Texto", question: "Cambia el color de fondo de la celda A1 a amarillo y el color de texto a negro.",
            check: () => {
                const cell = getCell('A1');
                const style = window.getComputedStyle(cell);
                return cell && style.backgroundColor === 'rgb(255, 255, 0)' && style.color === 'rgb(0, 0, 0)';
            }
        },
        { title: "Paso 14: Seleccionar y Subrayar Celdas", question: "Selecciona las celdas A3, B3 y C3, y subráyalas.",
            check: () => {
                const range = ['A3', 'B3', 'C3'];
                return range.every(id => {
                    const cell = getCell(id);
                    const style = window.getComputedStyle(cell);
                    return cell && style.textDecoration.includes('underline');
                });
            }
        },
        { title: "Paso 15: Escribir y Cambiar Color de Fuente", question: "Haz clic en la celda B2 y escribe la palabra ‘Hola’, luego cambia el color de la fuente a azul.",
            check: () => {
                const cell = getCell('B2');
                const style = window.getComputedStyle(cell);
                return cell && cell.textContent.toLowerCase() === 'hola' && (style.color === 'rgb(0, 0, 255)' || style.color === 'blue');
            }
        },
        { title: "Paso 16: Seleccionar Rango y Aplicar Fondo", question: "Selecciona el rango A1:D1 y aplícale fondo gris.",
            check: () => {
                const range = ['A1', 'B1', 'C1', 'D1'];
                return range.every(id => {
                    const cell = getCell(id);
                    const style = window.getComputedStyle(cell);
                    return cell && style.backgroundColor === 'rgb(128, 128, 128)';
                });
            }
        },
        { title: "Paso 17: Aplicar Cursiva a Celda con Texto", question: "Aplica cursiva (K) a cualquier celda del rango A2:B2 que contenga texto.",
            setup: () => { getCell('A2').textContent = 'Texto'; getCell('B2').textContent = 'Otro Texto'; },
            check: () => {
                const range = ['A2', 'B2'];
                return range.some(id => {
                    const cell = getCell(id);
                    const style = window.getComputedStyle(cell);
                    return cell && cell.textContent.trim().length > 0 && style.fontStyle === 'italic';
                });
            }
        },
        { title: "Paso 18: Seleccionar, Cambiar Fuente y Subrayar", question: "Selecciona la celda D4, cambia la fuente a Arial y aplica subrayado.",
            check: () => {
                const cell = getCell('D4');
                const style = window.getComputedStyle(cell);
                return cell && style.fontFamily.includes('Arial') && style.textDecoration.includes('underline');
            }
        },
        { title: "Paso 19: Seleccionar y Cambiar Fondo de Celdas", question: "Selecciona de B2 a B5 y cambia el fondo de todas esas celdas a rojo.",
            check: () => {
                const range = ['B2', 'B3', 'B4', 'B5'];
                return range.every(id => {
                    const cell = getCell(id);
                    const style = window.getComputedStyle(cell);
                    return cell && style.backgroundColor === 'rgb(255, 0, 0)';
                });
            }
        },
        { title: "Paso 20: Escribir, Negrita y Relleno", question: "Escribe la palabra 'Listo' en D3, colócala en negrita y rellena de azul.",
            check: () => {
                const cell = getCell('D3');
                const style = window.getComputedStyle(cell);
                return cell && cell.textContent.toLowerCase() === 'listo' && (style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700) && style.backgroundColor === 'rgb(0, 0, 255)';
            }
        }
    ];

    function getCell(cellId) { return document.querySelector(`[data-cell-id='${cellId}']`); }

    function getSelectedCells() {
        const range = document.querySelectorAll('.selection-range');
        return range.length > 0 ? Array.from(range) : (selectedCell ? [selectedCell] : []);
    }

    function getSelectedRange() {
        const cells = document.querySelectorAll('.selection-range');
        return cells.length > 0 ? Array.from(cells).map(c => c.dataset.cellId) : (selectedCell ? [selectedCell.dataset.cellId] : []);
    }

    function clearGridState() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.style = '';
            cell.classList.remove('selection-range', 'selected');
        });
    }

    function loadExercise(index) {
        clearGridState();
        const exercise = exercises[index];
        if (!exercise) return;

        exerciseTitle.textContent = exercise.title;
        exerciseQuestion.textContent = exercise.question;
        feedbackText.textContent = '';
        feedbackContainer.className = '';

        if (exercise.setup) exercise.setup();

        handleCellSelection(getCell('A1'));
        updateNavButtons();
        checkAnswer();
    }

    function checkAnswer() {
        const exercise = exercises[currentExercise];
        if (!exercise) return;

        const isCorrect = exercise.check();

        if (isCorrect) {
            feedbackContainer.className = 'correct';
            feedbackText.innerHTML = '✅ ¡Correcto! Bien hecho, puedes continuar.';
            nextExerciseBtn.disabled = false;
        } else {
            feedbackContainer.className = 'incorrect';
            feedbackText.innerHTML = '❌ Incorrecto. Intenta nuevamente.';
            nextExerciseBtn.disabled = true;
        }
    }

    function updateNavButtons() {
        prevExerciseBtn.style.display = currentExercise === 0 ? 'none' : 'inline-block';
        nextExerciseBtn.style.display = 'inline-block';
        restartBtn.style.display = 'none';

        if (currentExercise >= exercises.length) {
            mainContent.style.display = 'none';
            completionScreen.style.display = 'flex';
            completionMessage.textContent = '🎉 ¡Felicidades! Has completado el Nivel 1 de “Excel desde 0” 🎉';
            let completions = localStorage.getItem('excelCourseCompletions') || 0;
            completions++;
            localStorage.setItem('excelCourseCompletions', completions);
            completionCounter.textContent = `¡Ya completaste el Nivel 1 de Excel desde 0: ${completions} veces!`;
            completionScreen.classList.add('confetti-bg');
        }
    }

    function restartCourse() {
        currentExercise = 0;
        loadExercise(currentExercise);
        mainContent.style.display = 'flex';
        completionScreen.style.display = 'none';
        completionScreen.classList.remove('confetti-bg');
        updateNavButtons();
    }

    prevExerciseBtn.addEventListener('click', () => {
        if (currentExercise > 0) {
            currentExercise--;
            loadExercise(currentExercise);
        }
    });

    nextExerciseBtn.addEventListener('click', () => {
        if (!nextExerciseBtn.disabled) {
            if (currentExercise < exercises.length - 1) {
                currentExercise++;
                loadExercise(currentExercise);
            } else if (currentExercise === exercises.length - 1) {
                // Last exercise completed, show completion screen
                mainContent.style.display = 'none';
                completionScreen.style.display = 'flex';
                completionMessage.textContent = '🎉 ¡Felicidades! Has completado el Nivel 1 de “Excel desde 0” 🎉';
                let completions = parseInt(localStorage.getItem('excelCourseCompletions') || '0');
                completions++;
                localStorage.setItem('excelCourseCompletions', completions);
                completionCounter.textContent = `¡Ya completaste el Nivel 1 de Excel desde 0: ${completions} veces!`;
                completionScreen.classList.add('confetti-bg');
            }
        }
    });

    restartBtn.addEventListener('click', () => {
        currentExercise = 0;
        loadExercise(currentExercise);
        prevExerciseBtn.style.display = 'inline-block';
        nextExerciseBtn.style.display = 'inline-block';
        restartBtn.style.display = 'none';
    });

    // --- Utilities ---
    function getCellCoords(cellId) {
        const col = cellId.charCodeAt(0) - 65;
        const row = parseInt(cellId.substring(1), 10) - 1;
        return { col, row };
    }

    function highlightRange(startCell, endCell) {
        const startCoords = getCellCoords(startCell.dataset.cellId);
        const endCoords = getCellCoords(endCell.dataset.cellId);

        const minRow = Math.min(startCoords.row, endCoords.row);
        const maxRow = Math.max(startCoords.row, endCoords.row);
        const minCol = Math.min(startCoords.col, endCoords.col);
        const maxCol = Math.max(startCoords.col, endCoords.col);

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
                const cell = document.querySelector(`[data-cell-id='${cellId}']`);
                if (cell) {
                    cell.classList.add('selection-range');
                }
            }
        }
    }

    function clearRangeSelection() {
        document.querySelectorAll('.cell.selection-range').forEach(c => {
            c.classList.remove('selection-range');
        });
    }

    function syncFormulaBar(cell) {
        if (cell) {
            formulaInput.value = cell.textContent;
        }
    }

    // --- Initial Load ---
    init();
});