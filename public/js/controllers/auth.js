Object.assign(window.App, {
    initLogin() {
        if (this.user) return this.navigate('/');
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button');
                const errorDiv = document.getElementById('error-msg');
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                btn.disabled = true;
                btn.innerText = 'Logowanie...';
                if(errorDiv) {
                    errorDiv.style.color = 'var(--danger)';
                    errorDiv.innerText = '';
                }

                try {
                    await API.login(email, password);
                    await this.checkAuth();
                    this.updateNav();
                    this.navigate('/');
                } catch (err) {
                    if(errorDiv) errorDiv.innerText = err.message;
                    btn.disabled = false;
                    btn.innerText = 'Zaloguj się';
                }
            });
        }
    },

    initRegister() {
        if (this.user) return this.navigate('/');
        const form = document.getElementById('register-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button');
                const errorDiv = document.getElementById('error-msg');
                const username = document.getElementById('username').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                btn.disabled = true;
                btn.innerText = 'Tworzenie konta...';
                if(errorDiv) {
                    errorDiv.style.color = 'var(--danger)';
                    errorDiv.innerText = '';
                }

                try {
                    await API.fetch('/auth/register', {
                        method: 'POST',
                        body: JSON.stringify({ username, email, password })
                    });
                    if(errorDiv) {
                        errorDiv.style.color = 'var(--accent)';
                        errorDiv.innerText = 'Konto utworzone! Zaraz zostaniesz zalogowany...';
                    }
                    setTimeout(async () => {
                        await API.login(email, password);
                        await this.checkAuth();
                        this.updateNav();
                        this.navigate('/');
                    }, 1500);
                } catch (err) {
                    if(errorDiv) {
                        errorDiv.style.color = 'var(--danger)';
                        errorDiv.innerText = err.message;
                    }
                    btn.disabled = false;
                    btn.innerText = 'Utwórz konto';
                }
            });
        }
    }
});
