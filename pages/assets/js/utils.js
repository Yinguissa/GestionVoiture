/**
 * ============================================
 * AutoLoc Pro - Utility Functions
 * Helpers, DOM utils, data simulation
 * ============================================
 */

// ---- DOM Helpers ----
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') el.className = value;
        else if (key === 'innerHTML') el.innerHTML = value;
        else if (key === 'textContent') el.textContent = value;
        else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
        else el.setAttribute(key, value);
    });
    children.forEach(child => {
        if (typeof child === 'string') el.appendChild(document.createTextNode(child));
        else if (child) el.appendChild(child);
    });
    return el;
}

// ---- Local Storage Helpers ----
const Storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`autoloc_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch { return defaultValue; }
    },
    set(key, value) {
        try { localStorage.setItem(`autoloc_${key}`, JSON.stringify(value)); }
        catch (e) { console.warn('Storage error:', e); }
    },
    remove(key) { localStorage.removeItem(`autoloc_${key}`); },
    clear() {
        Object.keys(localStorage)
            .filter(k => k.startsWith('autoloc_'))
            .forEach(k => localStorage.removeItem(k));
    }
};

// ---- Toast Notifications ----
const Toast = {
    container: null,
    init() {
        if (!this.container) {
            this.container = createElement('div', { className: 'toast-container', id: 'toast-container' });
            document.body.appendChild(this.container);
        }
    },
    show(type, title, message, duration = 4000) {
        this.init();
        const icons = {
            success: '✓', error: '✕', warning: '⚠', info: 'ℹ'
        };
        const toast = createElement('div', { className: `toast toast-${type}` });
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || 'ℹ'}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.closest('.toast').remove()">×</button>
            <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
        `;
        this.container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    success(title, msg) { this.show('success', title, msg); },
    error(title, msg) { this.show('error', title, msg); },
    warning(title, msg) { this.show('warning', title, msg); },
    info(title, msg) { this.show('info', title, msg); }
};

// ---- Modal Helpers ----
const Modal = {
    open(id) {
        const overlay = $(`#${id}`);
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    close(id) {
        const overlay = $(`#${id}`);
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    closeAll() {
        $$('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = '';
    }
};

// ---- Form Validation ----
const Validator = {
    rules: {
        required: (v) => !!v && v.trim() !== '',
        email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        phone: (v) => /^[\+]?[0-9\s\-]{8,15}$/.test(v),
        minLength: (v, min) => v.length >= min,
        maxLength: (v, max) => v.length <= max,
        numeric: (v) => /^\d+$/.test(v),
        password: (v) => v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v),
        match: (v, target) => v === target,
    },
    messages: {
        required: 'Ce champ est obligatoire',
        email: 'Adresse email invalide',
        phone: 'Numéro de téléphone invalide',
        minLength: (min) => `Minimum ${min} caractères requis`,
        maxLength: (max) => `Maximum ${max} caractères autorisés`,
        numeric: 'Ce champ doit contenir uniquement des chiffres',
        password: 'Min. 8 caractères, une majuscule et un chiffre',
        match: 'Les champs ne correspondent pas',
    },
    validate(input, rules) {
        const value = input.value;
        const errors = [];
        rules.forEach(rule => {
            if (typeof rule === 'string') {
                if (!this.rules[rule](value)) {
                    errors.push(typeof this.messages[rule] === 'function' ? this.messages[rule]() : this.messages[rule]);
                }
            } else if (typeof rule === 'object') {
                const [name, param] = Object.entries(rule)[0];
                if (!this.rules[name](value, param)) {
                    errors.push(typeof this.messages[name] === 'function' ? this.messages[name](param) : this.messages[name]);
                }
            }
        });
        return errors;
    },
    showError(input, message) {
        input.classList.add('error');
        input.classList.remove('success');
        let errorEl = input.parentElement.querySelector('.form-error');
        if (!errorEl) {
            errorEl = createElement('div', { className: 'form-error' });
            input.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    },
    showSuccess(input) {
        input.classList.remove('error');
        input.classList.add('success');
        const errorEl = input.parentElement.querySelector('.form-error');
        if (errorEl) errorEl.remove();
    },
    clearErrors(form) {
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.form-error').forEach(el => el.remove());
    }
};

// ---- Format Utilities ----
const Format = {
    currency(amount, currency = 'FCFA') {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + currency;
    },
    date(dateStr) {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    },
    dateShort(dateStr) {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    },
    dateTime(dateStr) {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    },
    timeAgo(dateStr) {
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        const intervals = [
            { label: 'an', seconds: 31536000 },
            { label: 'mois', seconds: 2592000 },
            { label: 'jour', seconds: 86400 },
            { label: 'heure', seconds: 3600 },
            { label: 'minute', seconds: 60 },
        ];
        for (const i of intervals) {
            const count = Math.floor(seconds / i.seconds);
            if (count > 0) return `Il y a ${count} ${i.label}${count > 1 && i.label !== 'mois' ? 's' : ''}`;
        }
        return "À l'instant";
    },
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    truncate(str, len = 50) {
        return str.length > len ? str.substring(0, len) + '...' : str;
    },
    initials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
};

// ---- Debounce & Throttle ----
function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function throttle(fn, limit = 300) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ---- Generate IDs ----
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ---- Badge HTML by status ----
function getStatusBadge(status) {
    const config = {
        'non_soumis': { class: 'badge-neutral', label: 'Non soumis', dot: true },
        'en_attente': { class: 'badge-warning', label: 'En attente', dot: true },
        'valide': { class: 'badge-success', label: 'Validé', dot: true },
        'refuse': { class: 'badge-danger', label: 'Refusé', dot: true },
        'expire': { class: 'badge-dark', label: 'Expiré', dot: true },
        'actif': { class: 'badge-success', label: 'Actif', dot: true },
        'suspendu': { class: 'badge-danger', label: 'Suspendu', dot: true },
        'inactif': { class: 'badge-neutral', label: 'Inactif', dot: true },
        'disponible': { class: 'badge-success', label: 'Disponible', dot: true },
        'loue': { class: 'badge-primary', label: 'Loué', dot: true },
        'en_maintenance': { class: 'badge-warning', label: 'En maintenance', dot: true },
        'en_cours': { class: 'badge-info', label: 'En cours', dot: true },
        'termine': { class: 'badge-success', label: 'Terminé', dot: true },
        'annule': { class: 'badge-danger', label: 'Annulé', dot: true },
    };
    const c = config[status] || { class: 'badge-neutral', label: status, dot: false };
    return `<span class="badge ${c.class} ${c.dot ? 'badge-dot' : ''}">${c.label}</span>`;
}

// ---- Image Placeholder (SVG) ----
function getPlaceholderImage(width = 400, height = 300, text = 'AutoLoc') {
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#2563EB;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#g)"/>
            <text x="50%" y="50%" fill="white" font-family="Inter,sans-serif" font-size="24" 
                  font-weight="600" text-anchor="middle" dominant-baseline="central">${text}</text>
        </svg>
    `)}`;
}

function getCarPlaceholder(make = 'Auto') {
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#F1F5F9"/>
                    <stop offset="100%" style="stop-color:#E2E8F0"/>
                </linearGradient>
            </defs>
            <rect width="400" height="250" fill="url(#bg)"/>
            <g transform="translate(150, 85)">
                <rect x="10" y="30" width="80" height="35" rx="8" fill="#94A3B8"/>
                <rect x="0" y="45" width="100" height="25" rx="5" fill="#64748B"/>
                <circle cx="20" cy="72" r="10" fill="#334155"/>
                <circle cx="80" cy="72" r="10" fill="#334155"/>
                <circle cx="20" cy="72" r="4" fill="#94A3B8"/>
                <circle cx="80" cy="72" r="4" fill="#94A3B8"/>
                <rect x="55" y="38" width="20" height="12" rx="2" fill="#CBD5E1" opacity="0.8"/>
                <rect x="25" y="38" width="20" height="12" rx="2" fill="#CBD5E1" opacity="0.8"/>
            </g>
            <text x="200" y="190" fill="#94A3B8" font-family="Inter,sans-serif" font-size="14" 
                  font-weight="500" text-anchor="middle">${make}</text>
        </svg>
    `)}`;
}

// ---- Random Color for Avatars ----
const avatarColors = [
    'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    'linear-gradient(135deg, #10B981, #047857)',
    'linear-gradient(135deg, #F59E0B, #D97706)',
    'linear-gradient(135deg, #EF4444, #B91C1C)',
    'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    'linear-gradient(135deg, #EC4899, #BE185D)',
    'linear-gradient(135deg, #06B6D4, #0891B2)',
];

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
}
