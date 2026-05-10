Object.assign(window.App, {
    async initProfile() {
        if (!this.user) return this.navigate('/login');
        
        const usernameEl = document.getElementById('display-username');
        const emailEl = document.getElementById('display-email');
        const emailInput = document.getElementById('email');
        const nameInput = document.getElementById('username');
        const avatarInitials = document.getElementById('avatar-initials');
        const roleBadge = document.getElementById('role-badge-container');
        
        if (usernameEl) usernameEl.innerText = this.user.username;
        if (emailEl) emailEl.innerText = this.user.email || '---';
        if (avatarInitials) avatarInitials.innerText = this.user.username.substring(0,2).toUpperCase();
        if (roleBadge) roleBadge.innerHTML = `<span class="badge badge-${this.user.role}">${this.user.role.toUpperCase()}</span>`;
        
        try {
            const data = await API.getProfile();
            if (emailInput) emailInput.value = data.email;
            if (nameInput) nameInput.value = data.username;
            if (emailEl) emailEl.innerText = data.email;
        } catch (err) {
            console.error('Błąd profilu', err);
        }

        const updateForm = document.getElementById('profile-form');
        if (updateForm) {
            updateForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const msg = document.getElementById('profile-msg');
                msg.innerText = 'Zapisywanie...';
                try {
                    await API.updateProfile({
                        username: nameInput.value,
                        email: emailInput.value
                    });
                    msg.style.color = 'var(--accent)';
                    msg.innerText = 'Zaktualizowano profil!';
                    await this.checkAuth();
                    this.updateNav();
                } catch (err) {
                    msg.style.color = 'var(--danger)';
                    msg.innerText = err.message;
                }
            });
        }

        const passForm = document.getElementById('password-form');
        if (passForm) {
            passForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const msg = document.getElementById('password-msg');
                msg.innerText = 'Zmienianie...';
                try {
                    await API.changePassword(
                        document.getElementById('old-password').value,
                        document.getElementById('new-password').value
                    );
                    msg.style.color = 'var(--accent)';
                    msg.innerText = 'Hasło zostało zmienione.';
                    passForm.reset();
                } catch (err) {
                    msg.style.color = 'var(--danger)';
                    msg.innerText = err.message;
                }
            });
        }
    }
});
