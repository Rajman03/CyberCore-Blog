/**
 * SECURE.BLOG — Admin Logic
 * Korzysta z globalnej biblioteki API zdefiniowanej w core.js
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Escapuje HTML, zapobiegając XSS przy wstawianiu danych użytkownika do innerHTML */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

function renderEmptyState(message) {
    return `<div style="text-align:center; padding:2rem; color:var(--text-muted);">${escapeHtml(message)}</div>`;
}

function renderLoading() {
    return `<div style="text-align:center; padding:1.5rem; color:var(--text-muted);">Ładowanie...</div>`;
}

// ─── Post Form ────────────────────────────────────────────────────────────────

document.getElementById('add-post-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn  = e.target.querySelector('button[type="submit"]');
    const msg  = document.getElementById('status-msg');
    const title   = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();

    btn.disabled = true;
    btn.innerText = 'Publikowanie...';
    msg.innerText = '';

    try {
        await API.addPost(title, content);
        msg.style.color = 'var(--accent)';
        msg.innerText = '✨ Post opublikowany pomyślnie!';
        e.target.reset();
        loadAdminPosts();
    } catch (err) {
        msg.style.color = 'var(--danger)';
        msg.innerText = `❌ ${err.message}`;
    } finally {
        btn.disabled = false;
        btn.innerText = '🚀 Opublikuj Post';
    }
};

// ─── Posts ────────────────────────────────────────────────────────────────────

async function loadAdminPosts() {
    const list = document.getElementById('admin-posts-list');
    list.innerHTML = renderLoading();

    try {
        const posts = await API.getPosts();
        document.getElementById('stat-posts').innerText = posts.length;
        list.innerHTML = '';

        if (posts.length === 0) {
            list.innerHTML = renderEmptyState('Brak postów w systemie.');
            return;
        }

        posts.forEach(post => {
            const item = document.createElement('div');
            item.className = 'admin-list-item fade-in';
            item.innerHTML = `
                <div>
                    <h3 class="admin-list-title">${escapeHtml(post.title)}</h3>
                    <p class="admin-list-meta">
                        Autor: ${escapeHtml(post.author)} •
                        ${new Date(post.created_at).toLocaleDateString('pl-PL')}
                    </p>
                </div>
                <button class="danger admin-list-btn">🗑 Usuń</button>
            `;
            item.querySelector('button').addEventListener('click', () => deletePost(post.id));
            list.appendChild(item);
        });
    } catch (err) {
        list.innerHTML = `<div style="color:var(--danger);">❌ Błąd ładowania postów: ${escapeHtml(err.message)}</div>`;
    }
}

async function deletePost(id) {
    if (!confirm('Zniszczyć ten post bezpowrotnie?')) return;
    try {
        await API.deletePost(id);
        loadAdminPosts();
    } catch (err) {
        alert('Błąd podczas usuwania: ' + err.message);
    }
}

// ─── Users ────────────────────────────────────────────────────────────────────

async function loadUsers() {
    const list = document.getElementById('users-list');
    list.innerHTML = renderLoading();

    try {
        const users = await API.fetch('/api/users');
        document.getElementById('stat-users').innerText = users.length;
        list.innerHTML = '';

        if (users.length === 0) {
            list.innerHTML = renderEmptyState('Brak użytkowników w systemie.');
            return;
        }

        const currentUsername = localStorage.getItem('username');

        users.forEach(user => {
            const isSelf     = user.username === currentUsername;
            const targetRole = user.role === 'admin' ? 'user' : 'admin';

            const div = document.createElement('div');
            div.className = 'admin-list-item fade-in';
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <strong style="color:var(--text-main);">${escapeHtml(user.username)}</strong>
                    <span class="badge badge-${escapeHtml(user.role)}" style="font-size: 0.6rem;">${escapeHtml(user.role)}</span>
                </div>
                <div>
                    ${isSelf
                        ? '<span style="font-size:0.7rem; color:var(--accent); font-weight:700; opacity:0.8;">TO TY</span>'
                        : `<button class="admin-list-btn">Zmień na ${escapeHtml(targetRole === 'admin' ? 'Admin' : 'User')}</button>`
                    }
                </div>
            `;

            if (!isSelf) {
                div.querySelector('button').addEventListener('click', () => changeRole(user.id, targetRole));
            }

            list.appendChild(div);
        });
    } catch (err) {
        list.innerHTML = `<div style="color:var(--danger);">❌ Błąd ładowania użytkowników.</div>`;
        console.error('loadUsers error:', err);
    }
}

async function changeRole(userId, newRole) {
    try {
        await API.fetch(`/api/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRole })
        });
        loadUsers();
    } catch (err) {
        alert('Błąd zmiany roli: ' + err.message);
    }
}

// ─── CSS klasy dla elementów listy ───────────────────────────────────────────
// Dodaj do style.css jeśli jeszcze nie ma:
// .admin-list-item { background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border);
//   border-radius: 12px; padding: 1.2rem; display: flex; justify-content: space-between; align-items: center; }
// .admin-list-title { color: var(--text-main); font-size: 1rem; margin-bottom: 0.2rem; }
// .admin-list-meta  { font-size: 0.75rem; color: var(--text-muted); }
// .admin-list-btn   { padding: 6px 14px; font-size: 0.75rem; }

// ─── Init ─────────────────────────────────────────────────────────────────────

window.initAdmin = () => {
    loadAdminPosts();
    loadUsers();
};
