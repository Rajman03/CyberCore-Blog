/**
 * SECURE.BLOG Core API Library
 * Zcentralizowana obsługa komunikacji z serwerem
 */

const API = {
    async fetch(url, options = {}) {
        try {
            const res = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (res.status === 401 && !url.includes('/auth/login')) {
                window.location.href = '/login.html';
                return null;
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Błąd serwera');
            return data;
        } catch (err) {
            console.error(`API Error [${url}]:`, err.message);
            throw err;
        }
    },

    async login(email, password) {
        const data = await this.fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (data) {
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role);
        }
        return data;
    },

    async logout() {
        await fetch('/auth/logout', { method: 'POST' });
        localStorage.clear();
        window.location.href = '/';
    },

    async getProfile() {
        return await this.fetch('/api/profile');
    },

    async updateProfile(formData) {
        return await this.fetch('/api/profile', {
            method: 'PATCH',
            body: JSON.stringify(formData)
        });
    },

    async changePassword(oldPassword, newPassword) {
        return await this.fetch('/api/profile/password', {
            method: 'PATCH',
            body: JSON.stringify({ oldPassword, newPassword })
        });
    },

    async getPosts() {
        return await this.fetch('/api/posts');
    },

    async addPost(title, content) {
        return await this.fetch('/api/posts', {
            method: 'POST',
            body: JSON.stringify({ title, content })
        });
    },

    async deletePost(id) {
        return await this.fetch(`/api/posts/${id}`, { method: 'DELETE' });
    },

    async getComments(postId) {
        return await this.fetch(`/api/posts/${postId}/comments`);
    },

    async addComment(postId, content) {
        return await this.fetch('/api/comments', {
            method: 'POST',
            body: JSON.stringify({ post_id: postId, content })
        });
    },

    async me() {
        try {
            return await this.fetch('/auth/me');
        } catch (err) {
            return null;
        }
    }
};

// Global Logout function for buttons
window.logout = () => API.logout();
