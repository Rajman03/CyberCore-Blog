// public/js/app.js
// GŁÓWNY SILNIK APLIKACJI (ROUTER + AUTORYZACJA)
// Ten plik odpowiada za nawigację pomiędzy podstronami oraz zarządzanie sesją.

window.App = {
    user: null,
    isAdminBypass: false,
    isPremium: false,
    routes: {
        '/': 'views/home.html',
        '/paywall': 'views/paywall.html',
        '/admin': 'views/admin.html',
        '/login': 'views/login.html',
        '/register': 'views/register.html',
        '/profile': 'views/profile.html'
    },

    // 1. Inicjalizacja Aplikacji (wywoływana przy starcie strony)
    async init() {
        await this.checkAuth();
        this.updateNav();
        
        window.onpopstate = () => this.handleRoute();
        
        document.body.addEventListener('click', e => {
            if (e.target.matches('[data-link]')) {
                e.preventDefault();
                this.navigate(e.target.href);
            }
        });
        
        await this.handleRoute();
    },

    // 2. Sprawdzanie Sesji Użytkownika
    async checkAuth() {
        try {
            const meData = await API.me();
            this.user = meData ? meData.user : null;
            if (this.user) {
                this.isAdminBypass = (this.user.role === 'admin');
                this.isPremium = (this.user.role === 'premium' || this.user.role === 'admin');
            } else {
                this.isAdminBypass = false;
                this.isPremium = false;
            }
        } catch(e) {
            this.user = null;
            this.isAdminBypass = false;
            this.isPremium = false;
        }
    },

    // 3. Zmiana widoku i zapis w historii przeglądarki
    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    },

    // 4. Załadowanie zawartości HTML i uruchomienie kontrolera
    async handleRoute() {
        let path = window.location.pathname;
        if (!this.routes[path]) path = '/';
        
        const appRoot = document.getElementById('app-root');
        appRoot.style.opacity = '0';
        appRoot.style.transform = 'translateY(10px)';
        
        try {
            const res = await fetch(this.routes[path]);
            const html = await res.text();
            appRoot.innerHTML = html;
            
            // Płynne wejście nowego widoku
            requestAnimationFrame(() => {
                appRoot.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                appRoot.style.opacity = '1';
                appRoot.style.transform = 'translateY(0)';
            });

            // Przewiń stronę na górę przy każdej nawigacji
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Zaktualizuj podświetlenie aktywnego linku w menu
            this.updateNav();
            
            // Inicjalizacja odpowiedniego skryptu (kontrolera) dla danego widoku
            if (path === '/') this.initHome();
            if (path === '/paywall') this.initPaywall();
            if (path === '/admin') this.initAdmin();
            if (path === '/login') this.initLogin();
            if (path === '/register') this.initRegister();
            if (path === '/profile') this.initProfile();
        } catch (err) {
            appRoot.innerHTML = '<div style="color:var(--danger); text-align:center; margin-top:50px;">Błąd ładowania strony.</div>';
            appRoot.style.opacity = '1';
            appRoot.style.transform = 'translateY(0)';
        }
    },

    // 5. Zaktualizowanie górnego menu nawigacji
    updateNav() {
        const nav = document.getElementById('nav-links');
        if (!nav) return;
        const currentPath = window.location.pathname;
        const isActive = (path) => currentPath === path ? 'active' : '';

        if (this.user) {
            nav.innerHTML = `
                <div class="nav-user-widget fade-in">
                    <span class="nav-user-greeting">Witaj,</span>
                    <span class="nav-user-name">${this.escapeHtml(this.user.username)}</span>
                    <span class="badge badge-${this.user.role}" style="margin-left: 8px;">${this.user.role.toUpperCase()}</span>
                </div>
                <a href="/" class="nav-link ${isActive('/')}" onclick="event.preventDefault(); App.navigate('/')">Home</a>
                <a href="/paywall" class="nav-link ${isActive('/paywall')}" onclick="event.preventDefault(); App.navigate('/paywall')">Premium</a>
                ${this.user.role === 'admin' ? `<a href="/admin" class="nav-link ${isActive('/admin')}" onclick="event.preventDefault(); App.navigate('/admin')">Admin</a>` : ''}
                <a href="/profile" class="nav-link ${isActive('/profile')}" onclick="event.preventDefault(); App.navigate('/profile')">Profil</a>
                <button class="btn-logout" onclick="App.logout()">Wyloguj</button>
            `;
        } else {
            nav.innerHTML = `
                <a href="/" class="nav-link ${isActive('/')}" onclick="event.preventDefault(); App.navigate('/')">Home</a>
                <a href="/paywall" class="nav-link ${isActive('/paywall')}" onclick="event.preventDefault(); App.navigate('/paywall')">Premium</a>
                <a href="/login" class="nav-link ${isActive('/login')}" onclick="event.preventDefault(); App.navigate('/login')">Logowanie</a>
                <a href="/register" class="btn-primary-small" onclick="event.preventDefault(); App.navigate('/register')">Dołącz</a>
            `;
        }
    },

    // 6. Wylogowanie
    async logout() {
        try {
            await API.logout();
            this.user = null;
            this.isAdminBypass = false;
            this.isPremium = false;
            this.updateNav();
            this.navigate('/');
        } catch (err) {
            console.error('Błąd wylogowywania:', err);
        }
    },

    // Pomocnicza funkcja do zabezpieczania tekstu
    escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(String(str ?? '')));
        return div.innerHTML;
    }
};

window.onload = () => App.init();
