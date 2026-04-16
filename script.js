document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('posts-container');
    const refreshBtn = document.getElementById('refresh-btn');

    // Функция безопасного экранирования
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Парсинг CSV с учетом возможных запятых внутри полей (простой подход)
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        // Заголовки
        const headers = lines[0].split(',').map(h => h.trim());
        const dateIdx = headers.indexOf('date');
        const userIdx = headers.indexOf('user');
        const textIdx = headers.indexOf('text');

        if (dateIdx === -1 || userIdx === -1 || textIdx === -1) {
            throw new Error('CSV должен содержать колонки date, user, text');
        }

        const posts = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Упрощённый сплит: если в тексте есть запятые, это сломает парсинг,
            // но для демонстрации оставим так (можно улучшить через регулярки или библиотеку)
            const parts = line.split(',');
            // Восстановим текст, если он содержал запятые (предполагаем, что только текст может содержать запятые)
            let date = parts[dateIdx]?.trim() || '';
            let user = parts[userIdx]?.trim() || 'Аноним';
            // Текст — всё, что после первых двух колонок (если колонок >3)
            let text = '';
            if (parts.length > 3) {
                // Собираем оставшиеся части в одну строку через запятую
                text = parts.slice(2).join(',').trim();
            } else {
                text = parts[textIdx]?.trim() || '';
            }

            posts.push({ date, user, text });
        }
        return posts;
    }

    // Рендер постов
    function renderPosts(posts) {
        if (!posts.length) {
            container.innerHTML = '<div class="empty-message">📭 В досье пока нет записей. Добавьте их в data.csv</div>';
            return;
        }

        // Сортировка по дате (новые сверху)
        posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        let html = '';
        posts.forEach(post => {
            html += `
                <div class="post-item">
                    <div class="post-header">
                        <span class="post-date">${escapeHtml(post.date)}</span>
                        <span class="post-user">${escapeHtml(post.user)}</span>
                    </div>
                    <div class="post-text">${escapeHtml(post.text)}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    // Загрузка CSV
    async function loadAndRender() {
        container.innerHTML = '<div class="loading">⚡ Загрузка записей из архива...</div>';
        try {
            const response = await fetch('data.csv');
            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
            const csvText = await response.text();
            const posts = parseCSV(csvText);
            renderPosts(posts);
        } catch (err) {
            console.error(err);
            container.innerHTML = `<div class="error-message">⚠️ Не удалось загрузить досье: ${err.message}</div>`;
        }
    }

    // Обработчик кнопки обновления
    refreshBtn.addEventListener('click', loadAndRender);

    // Первоначальная загрузка
    loadAndRender();
});
