/**
 * ============================================
 * AutoLoc Pro - App Core
 * Navigation, component loading, sidebar mgmt
 * Roles: Admin, Propriétaire, Client, Agence
 * ============================================
 */

// ---- Simulated Data Store ----
const AppData = {
    currentUser: Storage.get('currentUser', null),

    users: Storage.get('users', [
        { id: 'u1', nom: 'Diallo', prenom: 'Mamadou', email: 'mamadou@email.com', telephone: '+224 621 00 00 00', role: 'client', password: 'Test1234', statut: 'actif', kyc: 'valide', dateInscription: '2025-11-15', avatar: '', ville: 'Conakry', adresse: '123 Rue de la République' },
        { id: 'u2', nom: 'Camara', prenom: 'Aissatou', email: 'aissatou@email.com', telephone: '+224 622 00 00 00', role: 'client', password: 'Test1234', statut: 'actif', kyc: 'en_attente', dateInscription: '2025-12-01', avatar: '', ville: 'Conakry', adresse: '45 Avenue de la Gare' },
        { id: 'u3', nom: 'Bah', prenom: 'Ibrahima', email: 'ibrahima@email.com', telephone: '+224 623 00 00 00', role: 'proprietaire', password: 'Test1234', statut: 'actif', kyc: 'valide', dateInscription: '2025-10-20', avatar: '', nomAgence: 'Bah Auto Location', ville: 'Conakry', adresse: '78 Boulevard du Commerce' },
        { id: 'u4', nom: 'Soumah', prenom: 'Mohamed', email: 'mohamed@email.com', telephone: '+224 624 00 00 00', role: 'proprietaire', password: 'Test1234', statut: 'actif', kyc: 'valide', dateInscription: '2025-09-10', avatar: '', nomAgence: 'Soumah Cars', ville: 'Conakry', adresse: '22 Rue du Port' },
        { id: 'u5', nom: 'Admin', prenom: 'Super', email: 'admin@autoloc.com', telephone: '+224 625 00 00 00', role: 'admin', password: 'Admin1234', statut: 'actif', kyc: 'valide', dateInscription: '2025-01-01', avatar: '' },
        { id: 'u6', nom: 'Barry', prenom: 'Fatoumata', email: 'fatoumata@email.com', telephone: '+224 626 00 00 00', role: 'client', password: 'Test1234', statut: 'suspendu', kyc: 'refuse', dateInscription: '2025-12-15', avatar: '', ville: 'Labé', adresse: '12 Rue Centrale' },
        { id: 'u7', nom: 'Condé', prenom: 'Alpha', email: 'alpha@email.com', telephone: '+224 627 00 00 00', role: 'client', password: 'Test1234', statut: 'actif', kyc: 'non_soumis', dateInscription: '2026-01-05', avatar: '', ville: 'Kankan', adresse: '5 Avenue Principale' },
        { id: 'u8', nom: 'Sylla', prenom: 'Oumar', email: 'oumar@email.com', telephone: '+224 628 00 00 00', role: 'proprietaire', password: 'Test1234', statut: 'actif', kyc: 'valide', dateInscription: '2025-08-25', avatar: '', nomAgence: 'Sylla Motors', ville: 'Conakry', adresse: '90 Route du Niger' },
        // Agence role user
        { id: 'u9', nom: 'Touré', prenom: 'Abdoulaye', email: 'agence@autoloc.com', telephone: '+224 629 00 00 00', role: 'agence', password: 'Agence1234', statut: 'actif', kyc: 'valide', dateInscription: '2025-06-15', avatar: '', nomAgence: 'AutoLoc Conakry', ville: 'Conakry', adresse: '100 Boulevard de la Paix' },
        { id: 'u10', nom: 'Keita', prenom: 'Mariama', email: 'mariama.agence@email.com', telephone: '+224 630 00 00 00', role: 'agence', password: 'Agence1234', statut: 'actif', kyc: 'valide', dateInscription: '2025-07-01', avatar: '', nomAgence: 'Keita Location Services', ville: 'Kindia', adresse: '15 Rue Commerciale' },
    ]),

    vehicules: Storage.get('vehicules', [
        { id: 'v1', proprietaireId: 'u3', marque: 'Toyota', modele: 'Land Cruiser', annee: 2024, categorie: 'SUV', carburant: 'Diesel', transmission: 'Automatique', places: 7, climatisation: true, prixJour: 350000, prixSemaine: 2100000, prixMois: 7500000, disponible: true, statut: 'valide', ville: 'Conakry', couleur: 'Blanc', kilometrage: 15000, immatriculation: 'RC 1234 A', description: 'Toyota Land Cruiser V8 en excellent état, climatisé, GPS intégré.', images: [], documents: 'valide', rating: 4.8, totalLocations: 45 },
        { id: 'v2', proprietaireId: 'u3', marque: 'Mercedes', modele: 'Classe E', annee: 2023, categorie: 'Berline', carburant: 'Essence', transmission: 'Automatique', places: 5, climatisation: true, prixJour: 500000, prixSemaine: 3000000, prixMois: 10000000, disponible: true, statut: 'valide', ville: 'Conakry', couleur: 'Noir', kilometrage: 22000, immatriculation: 'RC 5678 B', description: 'Mercedes Classe E 300, intérieur cuir, toit ouvrant.', images: [], documents: 'valide', rating: 4.9, totalLocations: 32 },
        { id: 'v3', proprietaireId: 'u4', marque: 'Hyundai', modele: 'Tucson', annee: 2024, categorie: 'SUV', carburant: 'Essence', transmission: 'Automatique', places: 5, climatisation: true, prixJour: 250000, prixSemaine: 1500000, prixMois: 5000000, disponible: true, statut: 'valide', ville: 'Conakry', couleur: 'Gris', kilometrage: 8000, immatriculation: 'RC 9012 C', description: 'Hyundai Tucson N Line, caméra 360°, aide au stationnement.', images: [], documents: 'valide', rating: 4.6, totalLocations: 28 },
        { id: 'v4', proprietaireId: 'u4', marque: 'Toyota', modele: 'Hilux', annee: 2023, categorie: 'Pick-up', carburant: 'Diesel', transmission: 'Manuelle', places: 5, climatisation: true, prixJour: 200000, prixSemaine: 1200000, prixMois: 4000000, disponible: false, statut: 'valide', ville: 'Conakry', couleur: 'Rouge', kilometrage: 35000, immatriculation: 'RC 3456 D', description: 'Toyota Hilux double cabine, parfait pour tous terrains.', images: [], documents: 'valide', rating: 4.5, totalLocations: 56 },
        { id: 'v5', proprietaireId: 'u3', marque: 'BMW', modele: 'X5', annee: 2024, categorie: 'SUV', carburant: 'Diesel', transmission: 'Automatique', places: 5, climatisation: true, prixJour: 450000, prixSemaine: 2700000, prixMois: 9000000, disponible: true, statut: 'en_attente', ville: 'Conakry', couleur: 'Bleu', kilometrage: 5000, immatriculation: 'RC 7890 E', description: 'BMW X5 M Sport, écran panoramique, son Harman Kardon.', images: [], documents: 'en_attente', rating: 0, totalLocations: 0 },
        { id: 'v6', proprietaireId: 'u8', marque: 'Renault', modele: 'Duster', annee: 2023, categorie: 'SUV', carburant: 'Essence', transmission: 'Manuelle', places: 5, climatisation: true, prixJour: 150000, prixSemaine: 900000, prixMois: 3000000, disponible: true, statut: 'valide', ville: 'Conakry', couleur: 'Vert', kilometrage: 42000, immatriculation: 'RC 2345 F', description: 'Renault Duster 4x4, idéal pour les routes difficiles.', images: [], documents: 'valide', rating: 4.3, totalLocations: 67 },
        { id: 'v7', proprietaireId: 'u8', marque: 'Toyota', modele: 'Corolla', annee: 2024, categorie: 'Berline', carburant: 'Hybride', transmission: 'Automatique', places: 5, climatisation: true, prixJour: 180000, prixSemaine: 1100000, prixMois: 3500000, disponible: true, statut: 'valide', ville: 'Conakry', couleur: 'Argent', kilometrage: 12000, immatriculation: 'RC 6789 G', description: 'Toyota Corolla Hybride, économique et confortable.', images: [], documents: 'valide', rating: 4.7, totalLocations: 38 },
        { id: 'v8', proprietaireId: 'u4', marque: 'Ford', modele: 'Ranger', annee: 2023, categorie: 'Pick-up', carburant: 'Diesel', transmission: 'Automatique', places: 5, climatisation: true, prixJour: 280000, prixSemaine: 1700000, prixMois: 5500000, disponible: true, statut: 'valide', ville: 'Conakry', couleur: 'Noir', kilometrage: 28000, immatriculation: 'RC 0123 H', description: 'Ford Ranger Wildtrak, puissant et robuste.', images: [], documents: 'valide', rating: 4.4, totalLocations: 41 },
        // Véhicules gérés par l'agence
        { id: 'v9', proprietaireId: 'u9', marque: 'Peugeot', modele: '3008', annee: 2024, categorie: 'SUV', carburant: 'Diesel', transmission: 'Automatique', places: 5, climatisation: true, prixJour: 300000, prixSemaine: 1800000, prixMois: 6000000, disponible: true, statut: 'valide', ville: 'Conakry', couleur: 'Bleu', kilometrage: 10000, immatriculation: 'RC 4567 I', description: 'Peugeot 3008 GT Line, très confortable.', images: [], documents: 'valide', rating: 4.6, totalLocations: 15 },
        { id: 'v10', proprietaireId: 'u10', marque: 'Kia', modele: 'Sportage', annee: 2024, categorie: 'SUV', carburant: 'Essence', transmission: 'Automatique', places: 5, climatisation: true, prixJour: 220000, prixSemaine: 1300000, prixMois: 4500000, disponible: true, statut: 'valide', ville: 'Kindia', couleur: 'Blanc', kilometrage: 7000, immatriculation: 'KA 1234 A', description: 'Kia Sportage dernière génération, moderne et économique.', images: [], documents: 'valide', rating: 4.5, totalLocations: 22 },
    ]),

    locations: Storage.get('locations', [
        { id: 'l1', vehiculeId: 'v1', clientId: 'u1', dateDebut: '2026-02-10', dateFin: '2026-02-15', prixTotal: 1750000, statut: 'termine', paiement: 'payé', createdAt: '2026-02-08' },
        { id: 'l2', vehiculeId: 'v3', clientId: 'u1', dateDebut: '2026-02-20', dateFin: '2026-02-25', prixTotal: 1250000, statut: 'en_cours', paiement: 'payé', createdAt: '2026-02-18' },
        { id: 'l3', vehiculeId: 'v2', clientId: 'u2', dateDebut: '2026-01-15', dateFin: '2026-01-20', prixTotal: 2500000, statut: 'termine', paiement: 'payé', createdAt: '2026-01-13' },
        { id: 'l4', vehiculeId: 'v6', clientId: 'u7', dateDebut: '2026-03-01', dateFin: '2026-03-07', prixTotal: 900000, statut: 'en_attente', paiement: 'en_attente', createdAt: '2026-02-25' },
        { id: 'l5', vehiculeId: 'v4', clientId: 'u1', dateDebut: '2025-12-20', dateFin: '2025-12-27', prixTotal: 1200000, statut: 'termine', paiement: 'payé', createdAt: '2025-12-18' },
        { id: 'l6', vehiculeId: 'v7', clientId: 'u2', dateDebut: '2026-02-28', dateFin: '2026-03-05', prixTotal: 1100000, statut: 'en_cours', paiement: 'payé', createdAt: '2026-02-26' },
        { id: 'l7', vehiculeId: 'v9', clientId: 'u1', dateDebut: '2026-03-01', dateFin: '2026-03-04', prixTotal: 900000, statut: 'en_cours', paiement: 'payé', createdAt: '2026-02-28' },
    ]),

    agences: Storage.get('agences', [
        { id: 'ag1', userId: 'u9', nom: 'AutoLoc Conakry', adresse: '100 Boulevard de la Paix', ville: 'Conakry', telephone: '+224 629 00 00 00', email: 'agence@autoloc.com', vehiculesCount: 3, statut: 'actif', dateCreation: '2025-06-15' },
        { id: 'ag2', userId: 'u10', nom: 'Keita Location Services', adresse: '15 Rue Commerciale', ville: 'Kindia', telephone: '+224 630 00 00 00', email: 'mariama.agence@email.com', vehiculesCount: 2, statut: 'actif', dateCreation: '2025-07-01' },
    ]),

    favoris: Storage.get('favoris', ['v1', 'v3', 'v7']),

    incidents: Storage.get('incidents', [
        { id: 'inc1', locationId: 'l1', clientId: 'u1', type: 'panne', description: 'Pneu crevé durant le trajet', statut: 'en_cours', dateDeclaration: '2026-02-12', photos: [] },
        { id: 'inc2', locationId: 'l3', clientId: 'u2', type: 'accident', description: 'Léger accrochage sur le parking', statut: 'termine', dateDeclaration: '2026-01-18', photos: [] },
    ]),

    auditLog: Storage.get('auditLog', [
        { id: 'a1', action: 'Connexion', utilisateur: 'admin@autoloc.com', details: 'Connexion réussie', date: '2026-02-28T10:30:00', ip: '192.168.1.1' },
        { id: 'a2', action: 'Validation KYC', utilisateur: 'admin@autoloc.com', details: 'KYC validé pour Mamadou Diallo', date: '2026-02-27T14:15:00', ip: '192.168.1.1' },
        { id: 'a3', action: 'Suspension', utilisateur: 'admin@autoloc.com', details: 'Compte de Fatoumata Barry suspendu', date: '2026-02-26T09:45:00', ip: '192.168.1.1' },
        { id: 'a4', action: 'Validation véhicule', utilisateur: 'admin@autoloc.com', details: 'Documents BMW X5 validés', date: '2026-02-25T16:20:00', ip: '192.168.1.1' },
        { id: 'a5', action: 'Inscription', utilisateur: 'alpha@email.com', details: 'Nouvel utilisateur inscrit', date: '2026-01-05T11:00:00', ip: '192.168.1.50' },
    ]),
};

// ---- Predefined OTP codes for each role (simulated) ----
const OTP_CODES = {
    'admin@autoloc.com': '123456',
    'mamadou@email.com': '111111',
    'aissatou@email.com': '222222',
    'ibrahima@email.com': '333333',
    'mohamed@email.com': '444444',
    'alpha@email.com': '555555',
    'fatoumata@email.com': '666666',
    'oumar@email.com': '777777',
    'agence@autoloc.com': '888888',
    'mariama.agence@email.com': '999999',
    // Default fallback for any registered user
    '_default': '000000'
};

// Get OTP for an email (simulated)
function getOTPForEmail(email) {
    return OTP_CODES[email] || OTP_CODES['_default'];
}

// ---- Save data to storage ----
function saveData() {
    Storage.set('users', AppData.users);
    Storage.set('vehicules', AppData.vehicules);
    Storage.set('locations', AppData.locations);
    Storage.set('agences', AppData.agences);
    Storage.set('favoris', AppData.favoris);
    Storage.set('incidents', AppData.incidents);
    Storage.set('auditLog', AppData.auditLog);
}

// ---- Collapsible Sidebar Toggle ----
function initCollapsibleSidebar() {
    const sidebar = $('.sidebar');
    const collapseBtn = $('.sidebar-collapse-btn');
    if (!sidebar || !collapseBtn) return;

    // Restore collapsed state from storage
    const isCollapsed = Storage.get('sidebarCollapsed', false);
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
    }

    collapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        Storage.set('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });
}

// ---- Sidebar Mobile Toggle & Submenus ----
function initSidebar() {
    const sidebar = $('.sidebar');
    const toggle = $('.sidebar-toggle');
    const overlay = $('.sidebar-overlay');

    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('active');
            toggle.innerHTML = sidebar.classList.contains('open') ? '✕' : '☰';
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('open');
            overlay.classList.remove('active');
            if (toggle) toggle.innerHTML = '☰';
        });
    }

    // Submenu Toggles
    $$('.sidebar-link.has-submenu').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            link.classList.toggle('open');
            const submenu = link.nextElementSibling;
            if (submenu && submenu.classList.contains('sidebar-submenu')) {
                submenu.classList.toggle('open');
            }
        });
    });

    // Set active link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    $$('.sidebar-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage) && !link.classList.contains('has-submenu')) {
            link.classList.add('active');
            const parentSubmenu = link.closest('.sidebar-submenu');
            if (parentSubmenu) {
                parentSubmenu.classList.add('open');
                const parentLink = parentSubmenu.previousElementSibling;
                if (parentLink && parentLink.classList.contains('has-submenu')) {
                    parentLink.classList.add('open');
                    parentLink.classList.add('active');
                }
            }
        }
    });

    // Initialize collapsible sidebar
    initCollapsibleSidebar();
}

// ---- Client Navbar (Mobile Menu) ----
function initClientNavbar() {
    const menuToggle = $('.client-menu-toggle');
    const navDrawer = $('.client-nav-drawer');
    if (!menuToggle || !navDrawer) return;

    menuToggle.addEventListener('click', () => {
        navDrawer.classList.toggle('open');
        menuToggle.innerHTML = navDrawer.classList.contains('open')
            ? '<i class="ph ph-x"></i>'
            : '<i class="ph ph-list"></i>';
    });

    // Set active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    $$('.client-nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage)) {
            link.classList.add('active');
        }
    });

    // Close drawer on link click
    $$('.client-nav-drawer .client-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navDrawer.classList.remove('open');
            if (menuToggle) menuToggle.innerHTML = '<i class="ph ph-list"></i>';
        });
    });
}

// ---- Dropdown Toggles ----
function initDropdowns() {
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-dropdown]');
        if (trigger) {
            const menu = $(`#${trigger.dataset.dropdown}`);
            if (menu) {
                $$('.dropdown-menu.active').forEach(m => { if (m !== menu) m.classList.remove('active'); });
                menu.classList.toggle('active');
            }
            e.stopPropagation();
            return;
        }
        $$('.dropdown-menu.active').forEach(m => m.classList.remove('active'));
    });
}

// ---- Modal Click-Outside Close ----
function initModals() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') Modal.closeAll();
    });
}

// ---- Tabs ----
function initTabs() {
    $$('.tabs').forEach(tabGroup => {
        const tabs = tabGroup.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const parent = tabGroup.parentElement;
                parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                const content = parent.querySelector(`#${target}`);
                if (content) content.classList.add('active');
            });
        });
    });

    // Pill tabs
    $$('.pill-tabs').forEach(tabGroup => {
        const tabs = tabGroup.querySelectorAll('.pill-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const parent = tabGroup.closest('.panel, .card, .page-content, section');
                if (parent) {
                    parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    const content = parent.querySelector(`#${target}`);
                    if (content) content.classList.add('active');
                }
            });
        });
    });
}

// ---- File Upload Preview ----
function initFileUploads() {
    $$('.file-upload').forEach(area => {
        const input = area.querySelector('input[type="file"]');
        if (!input) return;

        area.addEventListener('click', () => input.click());
        area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('dragging'); });
        area.addEventListener('dragleave', () => area.classList.remove('dragging'));
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragging');
            if (e.dataTransfer.files.length) {
                input.files = e.dataTransfer.files;
                handleFilePreview(input, area);
            }
        });
        input.addEventListener('change', () => handleFilePreview(input, area));
    });
}

function handleFilePreview(input, area) {
    const preview = area.querySelector('.file-preview') || createElement('div', { className: 'file-preview' });
    preview.innerHTML = '';
    if (!area.contains(preview)) area.appendChild(preview);

    Array.from(input.files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = createElement('img', {
                    src: e.target.result,
                    style: 'max-width:120px;max-height:80px;border-radius:8px;margin:4px;object-fit:cover;'
                });
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        } else {
            preview.appendChild(createElement('div', {
                className: 'text-sm text-secondary',
                textContent: `📄 ${file.name}`
            }));
        }
    });
}

// ---- Landing Navbar Scroll Effect ----
function initLandingHeader() {
    const header = $('.landing-header');
    if (!header) return;
    window.addEventListener('scroll', throttle(() => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    }, 100));
}

// ---- Check Auth ----
function requireAuth(role = null) {
    const user = AppData.currentUser;
    if (!user) {
        window.location.href = getAuthPath('connexion.html');
        return false;
    }
    if (role && user.role !== role) {
        window.location.href = getDashboardPath(user.role);
        return false;
    }
    return true;
}

// Allow multiple roles
function requireAuthMulti(roles = []) {
    const user = AppData.currentUser;
    if (!user) {
        window.location.href = getAuthPath('connexion.html');
        return false;
    }
    if (roles.length > 0 && !roles.includes(user.role)) {
        window.location.href = getDashboardPath(user.role);
        return false;
    }
    return true;
}

function getAuthPath(page) {
    const depth = getPathDepth();
    if (depth === 0) return `pages/auth/${page}`;
    if (depth === 1) return `auth/${page}`;
    return `../auth/${page}`;
}

function getDashboardPath(role) {
    const depth = getPathDepth();
    const roleMap = {
        client: 'clients',
        proprietaire: 'proprietaire',
        admin: 'admin',
        agence: 'agence'
    };
    const folder = roleMap[role] || 'clients';
    if (depth === 0) return `pages/${folder}/dashboard.html`;
    if (depth === 1) return `${folder}/dashboard.html`;
    return `../${folder}/dashboard.html`;
}

function getPathDepth() {
    const path = window.location.pathname;
    if (path.includes('/pages/') && (path.includes('/auth/') || path.includes('/clients/') || path.includes('/proprietaire/') || path.includes('/admin/') || path.includes('/agence/'))) return 2;
    if (path.includes('/pages/')) return 1;
    return 0;
}

function logout() {
    AppData.currentUser = null;
    Storage.remove('currentUser');
    window.location.href = getAuthPath('connexion.html');
}

// ---- Update user info in sidebar / navbar ----
function updateUserDisplay() {
    const user = AppData.currentUser;
    if (!user) return;

    const nameEl = $('.sidebar-user-name');
    const roleEl = $('.sidebar-user-role');
    const avatarEl = $('.sidebar-user-avatar');
    const navAvatarEl = $('.navbar-avatar');

    // Also handle client navbar avatar
    const clientNavAvatar = $('.client-navbar-avatar');

    if (nameEl) nameEl.textContent = `${user.prenom} ${user.nom}`;
    if (roleEl) roleEl.textContent = getRoleLabel(user.role);
    const initials = Format.initials(`${user.prenom} ${user.nom}`);
    if (avatarEl) { avatarEl.textContent = initials; avatarEl.style.background = getAvatarColor(user.prenom + user.nom); }
    if (navAvatarEl) { navAvatarEl.textContent = initials; navAvatarEl.style.background = getAvatarColor(user.prenom + user.nom); }
    if (clientNavAvatar) { clientNavAvatar.textContent = initials; clientNavAvatar.style.background = getAvatarColor(user.prenom + user.nom); }
}

// Role labels in French
function getRoleLabel(role) {
    const labels = {
        admin: 'Administrateur',
        proprietaire: 'Propriétaire',
        client: 'Client',
        agence: 'Agence'
    };
    return labels[role] || Format.capitalize(role);
}

// ---- Global Init ----
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initClientNavbar();
    initDropdowns();
    initModals();
    initTabs();
    initFileUploads();
    initLandingHeader();
    updateUserDisplay();
});
