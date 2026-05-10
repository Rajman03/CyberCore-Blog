Object.assign(window.App, {
    async initPaywall() {
        this.selectedPlan = 'monthly';
        this.updatePaywallBanner();
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('simulated_stripe_checkout') === 'true') {
            try {
                await API.fetch('/api/paywall/subscribe', {
                    method: 'POST',
                    body: JSON.stringify({ plan: urlParams.get('plan') })
                });
                alert("Pomyślnie powrócono ze Stripe Checkout i aktywowano konto!");
                window.history.replaceState({}, document.title, window.location.pathname);
                await this.checkAuth();
                this.updateNav();
                this.updatePaywallBanner();
            } catch(e) {
                alert("Błąd aktywacji Stripe: " + e.message);
            }
        }

        this.loadPremiumArticles();
    },

    updatePaywallBanner() {
        const cta = document.getElementById('subscribe-cta');
        if (!cta) return;
        if (!this.user) {
            cta.innerHTML = '<p style="color: var(--text-muted);"><a href="/login" style="color: var(--accent);">Zaloguj się</a> aby uzyskać dostęp.</p>';
        } else if (this.isAdminBypass) {
            cta.innerHTML = `
                <div style="display:inline-flex; align-items:center; gap:10px; background: rgba(99, 102, 241, 0.2); padding: 10px 20px; border-radius: 30px; border: 1px solid rgba(99, 102, 241, 0.4);">
                    <span style="font-size: 1.2rem;">🛠️</span>
                    <span style="font-weight: 700; color: #818cf8;">Jesteś Administratorem. Paywall jest domyślnie zdjęty.</span>
                </div>
            `;
        } else if (this.isPremium) {
            cta.innerHTML = `
                <div style="display:inline-flex; align-items:center; gap:10px; background: rgba(16, 185, 129, 0.2); padding: 10px 20px; border-radius: 30px; border: 1px solid rgba(16, 185, 129, 0.4);">
                    <span style="font-size: 1.2rem;">✨</span>
                    <span style="font-weight: 700; color: #10b981;">Twój status Premium jest aktywny</span>
                </div>
                <div style="margin-top: 1rem;">
                    <button class="secondary" onclick="App.cancelSubscription()" style="font-size: 0.8rem; padding: 6px 16px;">Anuluj Subskrypcję (Test)</button>
                </div>
            `;
        } else {
            cta.innerHTML = '<button class="btn-primary-small" onclick="App.openSubscribeModal()" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">⭐ Zostań Premium</button>';
        }
    },

    async loadPremiumArticles() {
        const container = document.getElementById('articles-container');
        if(!container) return;
        try {
            const res = await API.fetch('/api/paywall/articles');
            this.isPremium = res.isPremium;
            container.innerHTML = '';
            
            if (!res.articles || res.articles.length === 0) {
                container.innerHTML = '<div class="glass-card" style="text-align:center; padding: 3rem; grid-column: 1 / -1; color: var(--text-muted);">Brak dostępnych materiałów Premium w tej chwili. Zajrzyj później!</div>';
                return;
            }

            res.articles.forEach(article => {
                let badgeHtml = article.premium ? '<span class="badge-premium">Premium</span> ' : '';
                if (article.badge) badgeHtml += `<span class="badge badge-user" style="background: rgba(99, 102, 241, 0.2); color: var(--primary);">${this.escapeHtml(article.badge)}</span>`;

                container.innerHTML += `
                    <div class="article-card ${article.locked ? 'article-locked' : ''}">
                        <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                            <div>${badgeHtml}</div>
                            <span style="color: var(--text-muted); font-size: 0.8rem;">⏱ ${this.escapeHtml(article.readTime)}</span>
                        </div>
                        <h3 style="font-size: 1.2rem; margin-bottom: 0.8rem;">${this.escapeHtml(article.title)}</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem;">${this.escapeHtml(article.excerpt)}</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">📂 ${this.escapeHtml(article.category)}</span>
                            <button onclick="App.readPremiumArticle(${article.id})" class="secondary" style="padding: 6px 14px; font-size: 0.8rem;">Czytaj →</button>
                        </div>
                        
                        ${article.locked ? `
                            <div class="blur-overlay">
                                <div style="text-align: center;">
                                    <div class="lock-icon">🔒</div>
                                    <button onclick="App.openSubscribeModal()" style="background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #000; font-weight: 800; border: none; padding: 6px 16px; font-size: 0.8rem;">Odblokuj</button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        } catch (err) {
            container.innerHTML = '<div style="color: var(--danger);">Błąd ładowania artykułów.</div>';
        }
    },

    async readPremiumArticle(id) {
        try {
            const res = await API.fetch(`/api/paywall/article/${id}`);
            this.showArticle(res.article.title, res.article.content, false);
        } catch (err) {
            if (err.message === 'Dostęp wymaga subskrypcji Premium') {
                const rawRes = await fetch(`/api/paywall/article/${id}`, { credentials: 'same-origin' });
                const data = await rawRes.json();
                if (data.requiresPremium) {
                    this.showArticle("Zablokowany Artykuł", data.preview, true);
                }
            } else if(err.message === 'Session required' || err.message === 'Invalid session' || err.message === 'Invalid API Token') {
                alert("Musisz być zalogowany aby to przeczytać.");
                this.navigate('/login');
            } else {
                alert("Błąd: " + err.message);
            }
        }
    },

    showArticle(title, content, isLocked) {
        document.getElementById('article-view-title').innerText = title;
        document.getElementById('article-view-body').innerText = content;
        document.getElementById('article-view-locked-cta').style.display = isLocked ? 'block' : 'none';
        document.getElementById('article-modal').style.display = 'flex';
    },

    openSubscribeModal() {
        if (!this.user) return this.navigate('/login');
        document.getElementById('subscribe-modal').style.display = 'flex';
    },
    closeModals() {
        if(document.getElementById('subscribe-modal')) document.getElementById('subscribe-modal').style.display = 'none';
        if(document.getElementById('article-modal')) document.getElementById('article-modal').style.display = 'none';
    },
    selectPlan(plan) {
        this.selectedPlan = plan;
        document.getElementById('plan-monthly').classList.remove('selected');
        document.getElementById('plan-yearly').classList.remove('selected');
        document.getElementById(`plan-${plan}`).classList.add('selected');
    },

    async confirmSubscription() {
        const btn = document.getElementById('btn-confirm-sub');
        btn.innerText = 'Przetwarzanie...'; btn.disabled = true;
        try {
            const res = await API.fetch('/api/paywall/subscribe', { method: 'POST', body: JSON.stringify({ plan: this.selectedPlan }) });
            alert(res.message);
            this.closeModals();
            await this.checkAuth(); this.updateNav(); this.updatePaywallBanner(); this.loadPremiumArticles();
        } catch (err) {
            alert("Błąd płatności: " + err.message);
        } finally {
            btn.innerText = 'Testowe API Płatności'; btn.disabled = false;
        }
    },

    async stripeCheckout() {
        const btn = document.getElementById('btn-stripe-sub');
        btn.innerText = 'Przekierowywanie...'; btn.disabled = true;
        try {
            const res = await API.fetch('/api/paywall/create-checkout-session', { method: 'POST', body: JSON.stringify({ plan: this.selectedPlan }) });
            window.location.href = res.url;
        } catch (err) {
            alert("Błąd inicjalizacji Stripe: " + err.message);
            btn.innerText = '🔒 Płać przez Stripe'; btn.disabled = false;
        }
    },

    async cancelSubscription() {
        if (!confirm('Na pewno chcesz anulować premium?')) return;
        try {
            await API.fetch('/api/paywall/unsubscribe', { method: 'POST' });
            alert('Subskrypcja anulowana.');
            await this.checkAuth(); this.updateNav(); this.updatePaywallBanner(); this.loadPremiumArticles();
        } catch (err) { alert('Błąd: ' + err.message); }
    }
});
