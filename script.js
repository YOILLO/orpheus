document.addEventListener('DOMContentLoaded', () => {
    const notesListEl = document.getElementById('notes-list');
    const dateInput = document.getElementById('note-date');
    const textInput = document.getElementById('note-text');
    const addBtn = document.getElementById('add-btn');
    const resetBtn = document.getElementById('reset-btn');
    const entryCountSpan = document.getElementById('entry-count');

    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    const STORAGE_KEY = 'conspiracyNotes';
    let localNotes = [];

    function loadLocalNotes() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try { localNotes = JSON.parse(stored); } catch(e) { localNotes = []; }
        } else { localNotes = []; }
    }

    function saveLocalNotes() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localNotes));
    }

    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        const dateIndex = headers.indexOf('date');
        const textIndex = headers.indexOf('text');
        if (dateIndex === -1 || textIndex === -1) return [];
        const result = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = line.split(',');
            if (values.length >= 2) {
                result.push({
                    date: values[dateIndex]?.trim() || '',
                    text: values[textIndex]?.trim() || ''
                });
            }
        }
        return result;
    }

    async function loadCSVNotes() {
        try {
            const response = await fetch('data.csv');
            if (!response.ok) throw new Error(`Ошибка загрузки CSV: ${response.status}`);
            const csvText = await response.text();
            return parseCSV(csvText);
        } catch (error) {
            console.error('Не удалось загрузить CSV:', error);
            return [];
        }
    }

    function renderNotes(csvNotes) {
        const allNotes = [...csvNotes, ...localNotes];
        entryCountSpan.textContent = allNotes.length;

        if (allNotes.length === 0) {
            notesListEl.innerHTML = '<div class="empty-message">📁 Досье пусто. Добавьте первое наблюдение.</div>';
            return;
        }

        allNotes.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        let html = '';
        allNotes.forEach(note => {
            html += `
                <div class="note-item">
                    <span class="note-date">${escapeHtml(note.date) || '—'}</span>
                    <span class="note-text">${escapeHtml(note.text) || '—'}</span>
                </div>
            `;
        });
        notesListEl.innerHTML = html;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function addLocalNote() {
        const date = dateInput.value.trim();
        const text = textInput.value.trim();
        if (!date || !text) {
            alert('[СИСТЕМА] Необходимо указать дату и описание.');
            return;
        }
        localNotes.push({ date, text });
        saveLocalNotes();
        textInput.value = '';
        dateInput.value = today;
        refreshNotesList();
    }

    function resetLocalNotes() {
        if (localNotes.length === 0) return;
        if (!confirm('Удалить все локальные записи? Данные из основного CSV-досье останутся нетронутыми.')) return;
        localNotes = [];
        saveLocalNotes();
        refreshNotesList();
    }

    async function refreshNotesList() {
        const csvNotes = await loadCSVNotes();
        renderNotes(csvNotes);
    }

    async function init() {
        loadLocalNotes();
        await refreshNotesList();
        addBtn.addEventListener('click', addLocalNote);
        resetBtn.addEventListener('click', resetLocalNotes);
        textInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addLocalNote(); });
    }

    init();
});
