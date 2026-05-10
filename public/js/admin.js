/**
 * SECURE.BLOG Admin Logic
 * Wykorzystuje bibliotekę API z core.js
 */

async function checkAuth() {
    // API.fetch automatycznie obsłuży 401
    await API.fetch('/auth/me');
}

document.getElementById('add-post-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const msg = document.getElementById('status-msg');
    
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;

    try {
        btn.disabled = true;
        btn.innerText = 'Publikowanie...';
        
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
        btn.innerText = 'Opublikuj Post';
    }
};

async function loadAdminPosts() {
    const list = document.getElementById('admin-posts-list');
    try {
        const posts = await API.getPosts();
        document.getElementById('stat-posts').innerText = posts.length;
        list.innerHTML = '';

        if (posts.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">Brak postów w systemie.</div>';
            return;
        }

        posts.forEach(post => {
            const item = document.createElement('div');
            item.className = 'fade-in';
            item.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1.2rem; display: flex; justify-content: space-between; align-items: center;';
            
            item.innerHTML = `
                <div>
                    <h3 style="color: var(--text-main); font-size: 1rem; margin-bottom: 0.2rem;">${post.title}</h3>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">Autor: ${post.author} • ${new Date(post.created_at).toLocaleDateString()}</p>
                </div>
                <button class="danger" onclick="deletePost(${post.id})" style="padding: 6px 12px; font-size: 0.75rem; border-radius: 8px;">Usuń</button>
            `;
            list.appendChild(item);
        });
    } catch (err) {
        list.innerHTML = '<div style="color:var(--danger);">Błąd ładowania postów.</div>';
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

async function loadUsers() {
    const list = document.getElementById('users-list');
    try {
        const users = await API.fetch('/api/users');
        document.getElementById('stat-users').innerText = users.length;
        list.innerHTML = '';

        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'fade-in';
            div.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1rem 1.2rem; display: flex; justify-content: space-between; align-items: center;';
            
            const isSelf = user.username === localStorage.getItem('username');

            div.innerHTML = `
                <div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <strong style="color:var(--text-main);">${user.username}</strong>
                        <span class="badge badge-${user.role}" style="font-size: 0.6rem;">${user.role}</span>
                    </div>
                </div>
                <div>
                    ${!isSelf ? `
                        <button onclick="changeRole('${user.id}', '${user.role === 'admin' ? 'user' : 'admin'}')" 
                                style="background: ${user.role === 'admin' ? 'rgba(255,255,255,0.05)' : 'var(--primary)'}; font-size: 0.7rem; padding: 6px 12px; border: 1px solid var(--glass-border);">
                            Zmień na ${user.role === 'admin' ? 'User' : 'Admin'}
                        </button>
                    ` : '<span style="font-size: 0.7rem; color: var(--accent); font-weight:700; opacity:0.8;">TO TY</span>'}
                </div>
            `;
            list.appendChild(div);
        });
    } catch (err) {
        console.error('Error loading users:', err);
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

window.initAdmin = () => {
    loadAdminPosts();
    loadUsers();
};
