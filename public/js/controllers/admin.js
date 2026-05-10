Object.assign(window.App, {
    async initAdmin() {
        if (!this.user || this.user.role !== 'admin') {
            this.navigate('/');
            return;
        }
        
        const form = document.getElementById('add-post-form');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn  = e.target.querySelector('button[type="submit"]');
                const msg  = document.getElementById('status-msg');
                const title   = document.getElementById('post-title').value.trim();
                const content = document.getElementById('post-content').value.trim();
                const isPremium = document.getElementById('post-premium') ? document.getElementById('post-premium').checked : false;

                btn.disabled = true;
                btn.innerText = 'Publikowanie...';
                msg.innerText = '';

                try {
                    await API.addPost(title, content, isPremium);
                    msg.style.color = 'var(--accent)';
                    msg.innerText = '✨ Post opublikowany pomyślnie!';
                    e.target.reset();
                    this.loadAdminPosts();
                } catch (err) {
                    msg.style.color = 'var(--danger)';
                    msg.innerText = `❌ ${err.message}`;
                } finally {
                    btn.disabled = false;
                    btn.innerText = '🚀 Opublikuj Post';
                }
            });
        }
        
        document.getElementById('admin-name').innerText = this.user.username;
        this.loadAdminPosts();
        this.loadUsers();
    },

    async loadAdminPosts() {
        const list = document.getElementById('admin-posts-list');
        if (!list) return;
        list.innerHTML = '<div style="text-align:center; color:var(--text-muted);">Ładowanie...</div>';

        try {
            const posts = await API.getPosts();
            document.getElementById('stat-posts').innerText = posts.length;
            list.innerHTML = '';

            if (posts.length === 0) {
                list.innerHTML = '<div style="text-align:center; color:var(--text-muted);">Brak postów.</div>';
                return;
            }

            posts.forEach(post => {
                const item = document.createElement('div');
                item.className = 'admin-list-item fade-in';
                item.style = 'background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1.2rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;';
                item.innerHTML = `
                    <div>
                        <h3 style="color: var(--text-main); font-size: 1rem; margin-bottom: 0.2rem;">
                            ${post.is_premium ? '⭐ ' : ''}${this.escapeHtml(post.title)}
                        </h3>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">
                            Autor: ${this.escapeHtml(post.author)} • ${new Date(post.created_at).toLocaleDateString('pl-PL')}
                        </p>
                    </div>
                    <button class="danger" style="padding: 6px 14px; font-size: 0.75rem;">🗑 Usuń</button>
                `;
                item.querySelector('button').addEventListener('click', () => this.deletePost(post.id));
                list.appendChild(item);
            });
        } catch (err) {
            list.innerHTML = `<div style="color:var(--danger);">❌ Błąd ładowania postów.</div>`;
        }
    },

    async deletePost(id) {
        if (!confirm('Zniszczyć ten post bezpowrotnie?')) return;
        try {
            await API.deletePost(id);
            this.loadAdminPosts();
        } catch (err) {
            alert('Błąd podczas usuwania: ' + err.message);
        }
    },

    async loadUsers() {
        const list = document.getElementById('users-list');
        if (!list) return;
        list.innerHTML = '<div style="text-align:center; color:var(--text-muted);">Ładowanie...</div>';

        try {
            const users = await API.fetch('/api/users');
            document.getElementById('stat-users').innerText = users.length;
            list.innerHTML = '';

            if (users.length === 0) {
                list.innerHTML = '<div style="text-align:center; color:var(--text-muted);">Brak użytkowników.</div>';
                return;
            }

            users.forEach(user => {
                const isSelf = user.username === this.user.username;
                const div = document.createElement('div');
                div.className = 'admin-list-item fade-in';
                div.style = 'background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1.2rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;';
                div.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <strong style="color:var(--text-main);">${this.escapeHtml(user.username)}</strong>
                        <span class="badge badge-${this.escapeHtml(user.role)}" style="font-size: 0.6rem;">${this.escapeHtml(user.role)}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${isSelf
                            ? '<span style="font-size:0.7rem; color:var(--accent); font-weight:700; opacity:0.8;">TO TY</span>'
                            : `
                            <select class="role-select" style="background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border); border-radius: 8px; padding: 4px 8px; outline: none; cursor: pointer; font-size: 0.75rem;">
                                <option value="user" ${user.role === 'user' ? 'selected' : ''} style="background: #020617;">User</option>
                                <option value="premium" ${user.role === 'premium' ? 'selected' : ''} style="background: #020617;">Premium</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''} style="background: #020617;">Admin</option>
                            </select>
                            <button style="padding: 6px 14px; font-size: 0.75rem;">Zapisz</button>
                            `
                        }
                    </div>
                `;

                if (!isSelf) {
                    const select = div.querySelector('.role-select');
                    const btn = div.querySelector('button');
                    btn.addEventListener('click', () => this.changeRole(user.id, select.value));
                }

                list.appendChild(div);
            });
        } catch (err) {
            list.innerHTML = `<div style="color:var(--danger);">❌ Błąd ładowania użytkowników.</div>`;
        }
    },

    async changeRole(userId, newRole) {
        try {
            await API.fetch(`/api/users/${userId}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole })
            });
            this.loadUsers();
        } catch (err) {
            alert('Błąd zmiany roli: ' + err.message);
        }
    }
});
