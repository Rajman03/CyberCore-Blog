Object.assign(window.App, {
    async initHome() {
        const heroActions = document.getElementById('hero-actions');
        if (heroActions) {
            if (this.user) {
                heroActions.innerHTML = `
                    <button class="hero-btn-primary" onclick="App.navigate('/profile')">Przejdź do Profilu</button>
                    <button class="hero-btn-secondary" onclick="document.getElementById('posts-container').scrollIntoView({ behavior: 'smooth' })">Czytaj Wpisy ↓</button>
                `;
            } else {
                heroActions.innerHTML = `
                    <button class="hero-btn-primary" onclick="App.navigate('/register')">Rozpocznij Teraz</button>
                    <button class="hero-btn-secondary" onclick="document.getElementById('posts-container').scrollIntoView({ behavior: 'smooth' })">Przeglądaj jako Gość ↓</button>
                `;
            }
        }
        await this.loadPosts();
    },

    async loadPosts() {
        const container = document.getElementById('posts-container');
        if (!container) return;
        try {
            const posts = await API.getPosts();
            container.innerHTML = '';
            if (posts.length === 0) {
                container.innerHTML = '<div class="glass-card" style="grid-column:1/-1; text-align:center;">Brak postów.</div>';
                return;
            }
            for (const post of posts) {
                const card = document.createElement('article');
                card.className = 'glass-card post-card fade-in';
                card.innerHTML = `
                    <div class="post-meta">${new Date(post.created_at).toLocaleDateString('pl-PL')} • ${this.escapeHtml(post.author)}</div>
                    <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
                    <p class="post-excerpt">${this.escapeHtml(post.content)}</p>
                    <div class="comments-section">
                        <h4 class="comments-label">💬 Komentarze</h4>
                        <div id="comments-${post.id}" class="comments-list">Ładowanie...</div>
                        ${this.user
                            ? `<div class="comment-form">
                                   <input type="text" id="input-${post.id}" placeholder="Napisz komentarz...">
                                   <button class="comment-submit-btn" onclick="App.postComment(${post.id})">Wyślij</button>
                               </div>`
                            : `<p class="comments-login-prompt"><a href="/login" style="color:var(--primary);">Zaloguj się</a>, aby dodać komentarz.</p>`
                        }
                    </div>
                `;
                container.appendChild(card);
                this.loadComments(post.id);
            }
        } catch (err) {
            container.innerHTML = `<div class="glass-card" style="color:var(--danger); text-align:center;">❌ Błąd ładowania postów.</div>`;
        }
    },

    async loadComments(postId) {
        const container = document.getElementById(`comments-${postId}`);
        if (!container) return;
        try {
            const comments = await API.getComments(postId);
            if (comments.length === 0) {
                container.innerHTML = '<p class="comments-empty">Brak komentarzy. Bądź pierwszy!</p>';
                return;
            }
            container.innerHTML = comments.map(c => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-author">${this.escapeHtml(c.username)}</span>
                        <span class="comment-date">${new Date(c.created_at).toLocaleDateString('pl-PL')}</span>
                    </div>
                    <div class="comment-content">${this.escapeHtml(c.content)}</div>
                </div>
            `).join('');
        } catch (err) {
            container.innerHTML = '<p style="color:var(--danger); font-size:0.8rem;">Błąd ładowania komentarzy.</p>';
        }
    },

    async postComment(postId) {
        const input = document.getElementById(`input-${postId}`);
        const content = input.value.trim();
        if (!content) return;
        try {
            await API.addComment(postId, content);
            input.value = '';
            this.loadComments(postId);
        } catch (err) {
            alert('Błąd: ' + err.message);
        }
    }
});
