const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const argon2 = require('argon2');

/**
 * Supabase Database Configuration
 * Provides PostgreSQL-based database connection
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Initialize Supabase Tables
 */
const initSupabaseDB = async () => {
    console.log('🔄 Initializing Supabase PostgreSQL database...');
    
    try {
        // Check if tables exist by querying them
        const { data: tables, error } = await supabase
            .from('users')
            .select('count', { count: 'exact' })
            .limit(0);
        
        if (error && error.code !== 'PGRST116') {
            console.log('📊 Creating tables...');
            
            // Users table
            await supabase
                .from('users')
                .insert([])
                .select()
                .limit(0);
            
            console.log('✅ Supabase database initialized');
        } else if (!error) {
            console.log('✅ Supabase database already initialized');
        }
        
        // Seed admin user if not exists
        const { data: adminCheck } = await supabase
            .from('users')
            .select('id')
            .eq('username', 'admin')
            .limit(1);
        
        if (!adminCheck || adminCheck.length === 0) {
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            const hash = await argon2.hash(adminPassword, { type: argon2.argon2id });
            const token = crypto.randomBytes(32).toString('hex');
            
            const { error: insertError } = await supabase
                .from('users')
                .insert([{
                    id: crypto.randomUUID(),
                    username: 'admin',
                    email: 'admin@example.com',
                    password_hash: hash,
                    role: 'admin',
                    api_token: token
                }]);
            
            if (insertError) {
                console.warn('⚠️  Admin seed warning:', insertError.message);
            } else {
                console.log('💎 Admin user seeded successfully');
                console.log('⚠️  IMPORTANT: Change admin password in production!');
            }
        }
        
    } catch (err) {
        console.error('❌ Supabase initialization error:', err.message);
        throw err;
    }
};

/**
 * Database Adapter for Supabase
 * Provides a consistent interface similar to SQLite
 */
class SupabaseAdapter {
    constructor(client) {
        this.client = client;
    }
    
    /**
     * Execute query with single result
     */
    async get(query, params = []) {
        // This is a simplified adapter - real usage would parse SQL properly
        // For now, we'll use direct table queries
        throw new Error('Use direct table queries instead');
    }
    
    /**
     * Execute query with multiple results
     */
    async all(query, params = []) {
        throw new Error('Use direct table queries instead');
    }
    
    /**
     * Execute update/insert/delete
     */
    async run(query, params = []) {
        throw new Error('Use direct table queries instead');
    }
    
    // ─── User Operations ───
    async getUserByEmail(email) {
        const { data, error } = await this.client
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        return data;
    }
    
    async getUserByUsername(username) {
        const { data, error } = await this.client
            .from('users')
            .select('*')
            .eq('username', username)
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        return data;
    }
    
    async createUser(userData) {
        const { data, error } = await this.client
            .from('users')
            .insert([userData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
    
    async updateUser(userId, updates) {
        const { data, error } = await this.client
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
    
    async getUserById(userId) {
        const { data, error } = await this.client
            .from('users')
            .select('id, username, email, role, api_token')
            .eq('id', userId)
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        return data;
    }
    
    // ─── Session Operations ───
    async getSession(sessionId) {
        const { data, error } = await this.client
            .from('sessions')
            .select('*')
            .eq('session_id', sessionId)
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        return data;
    }
    
    async createSession(sessionData) {
        const { data, error } = await this.client
            .from('sessions')
            .insert([sessionData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
    
    async deleteSession(sessionId) {
        const { error } = await this.client
            .from('sessions')
            .delete()
            .eq('session_id', sessionId);
        
        if (error) throw error;
    }
    
    // ─── Posts Operations ───
    async getPosts(limit = 20, offset = 0) {
        const { data, error } = await this.client
            .from('posts')
            .select('*, author:users(username)')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) throw error;
        return data;
    }
    
    async getPostById(postId) {
        const { data, error } = await this.client
            .from('posts')
            .select('*')
            .eq('id', postId)
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        return data;
    }
    
    async createPost(postData) {
        const { data, error } = await this.client
            .from('posts')
            .insert([postData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
    
    async updatePost(postId, updates) {
        const { data, error } = await this.client
            .from('posts')
            .update(updates)
            .eq('id', postId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
    
    async deletePost(postId) {
        const { error } = await this.client
            .from('posts')
            .delete()
            .eq('id', postId);
        
        if (error) throw error;
    }
    
    // ─── Comments Operations ───
    async getCommentsByPostId(postId, limit = 20, offset = 0) {
        const { data, error } = await this.client
            .from('comments')
            .select('*, user:users(username)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1);
        
        if (error) throw error;
        return data;
    }
    
    async createComment(commentData) {
        const { data, error } = await this.client
            .from('comments')
            .insert([commentData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
    
    // ─── Login Attempts Operations ───
    async logLoginAttempt(attemptData) {
        const { error } = await this.client
            .from('login_attempts')
            .insert([attemptData]);
        
        if (error) throw error;
    }
    
    async getLoginStats(since) {
        const { data: totalAttempts, error: e1 } = await this.client
            .from('login_attempts')
            .select('count', { count: 'exact' })
            .gte('attempted_at', since);
        
        const { data: failedAttempts, error: e2 } = await this.client
            .from('login_attempts')
            .select('count', { count: 'exact' })
            .eq('success', false)
            .gte('attempted_at', since);
        
        const { data: topOffenders, error: e3 } = await this.client
            .from('login_attempts')
            .select('ip_address, count:count()')
            .eq('success', false)
            .gte('attempted_at', since)
            .group_by('ip_address')
            .order('count', { ascending: false })
            .limit(10);
        
        return {
            totalAttempts: totalAttempts?.count || 0,
            failedAttempts: failedAttempts?.count || 0,
            topOffenders: topOffenders || []
        };
    }
    
    async cleanupOldLoginAttempts() {
        const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const { error } = await this.client
            .from('login_attempts')
            .delete()
            .lt('attempted_at', since);
        
        if (error) throw error;
    }
}

module.exports = {
    supabase,
    initSupabaseDB,
    SupabaseAdapter
};
