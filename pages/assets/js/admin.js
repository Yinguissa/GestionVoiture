/**
 * ============================================
 * AutoLoc Pro - Admin Module
 * User management, KYC, vehicle validation, audit
 * ============================================
 */

// ---- Admin Dashboard ----
function loadAdminDashboard() {
    const totalUsers = AppData.users.filter(u => u.role !== 'admin').length;
    const totalVehicles = AppData.vehicules.length;
    const totalAgences = AppData.users.filter(u => u.role === 'agence').length;
    const pendingKyc = AppData.users.filter(u => u.kyc === 'en_attente').length;
    const pendingDocs = AppData.vehicules.filter(v => v.documents === 'en_attente' || v.statut === 'en_attente').length;
    const totalRevenue = AppData.locations.filter(l => l.paiement === 'payé').reduce((s, l) => s + l.prixTotal, 0);
    const activeRentals = AppData.locations.filter(l => l.statut === 'en_cours').length;

    const stats = {
        '#stat-users': totalUsers,
        '#stat-vehicles': totalVehicles,
        '#stat-agences': totalAgences,
        '#stat-pending-kyc': pendingKyc,
        '#stat-pending-docs': pendingDocs,
        '#stat-revenue': Format.currency(totalRevenue),
        '#stat-active-rentals': activeRentals,
    };

    Object.entries(stats).forEach(([sel, val]) => {
        const el = $(sel);
        if (el) el.textContent = val;
    });

    // Recent activity
    const activityPanel = $('#recentActivity');
    if (activityPanel) {
        activityPanel.innerHTML = AppData.auditLog.slice(0, 8).map(log => `
            <div class="flex items-center gap-3" style="padding:var(--space-3); border-bottom:1px solid var(--border-light);">
                <div style="width:32px;height:32px;border-radius:50%;background:var(--primary-50);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">
                    ${log.action === 'Connexion' ? '🔑' : log.action === 'Inscription' ? '👤' : log.action.includes('KYC') ? '✅' : log.action.includes('Suspension') ? '🚫' : '📋'}
                </div>
                <div class="flex-1">
                    <div class="text-sm font-medium">${log.action}</div>
                    <div class="text-xs text-tertiary">${log.details}</div>
                </div>
                <div class="text-xs text-tertiary">${Format.timeAgo(log.date)}</div>
            </div>
        `).join('');
    }

    // New users list
    const newUsersPanel = $('#newUsers');
    if (newUsersPanel) {
        const recent = [...AppData.users].filter(u => u.role !== 'admin').sort((a, b) => new Date(b.dateInscription) - new Date(a.dateInscription)).slice(0, 5);
        newUsersPanel.innerHTML = recent.map(u => `
            <div class="flex items-center justify-between" style="padding:var(--space-3); border-bottom:1px solid var(--border-light);">
                <div class="flex items-center gap-3">
                    <div class="table-user-avatar" style="background:${getAvatarColor(u.prenom + u.nom)}">${Format.initials(u.prenom + ' ' + u.nom)}</div>
                    <div>
                        <div class="text-sm font-medium">${u.prenom} ${u.nom}</div>
                        <div class="text-xs text-tertiary">${Format.capitalize(u.role)} · ${Format.dateShort(u.dateInscription)}</div>
                    </div>
                </div>
                ${getStatusBadge(u.statut)}
            </div>
        `).join('');
    }
}

// ---- Users Management ----
function loadAdminUsers(filter = 'all') {
    const tbody = $('#usersTableBody');
    if (!tbody) return;

    let users = AppData.users.filter(u => u.role !== 'admin');

    if (filter === 'client') users = users.filter(u => u.role === 'client');
    else if (filter === 'proprietaire') users = users.filter(u => u.role === 'proprietaire');
    else if (filter === 'actif') users = users.filter(u => u.statut === 'actif');
    else if (filter === 'suspendu') users = users.filter(u => u.statut === 'suspendu');

    const search = $('#userSearchInput')?.value?.toLowerCase();
    if (search) {
        users = users.filter(u =>
            u.nom.toLowerCase().includes(search) ||
            u.prenom.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search)
        );
    }

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">👥</div><h3 class="empty-state-title">Aucun utilisateur trouvé</h3></div></td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(u => `
        <tr>
            <td>
                <div class="table-user">
                    <div class="table-user-avatar" style="background:${getAvatarColor(u.prenom + u.nom)}">${Format.initials(u.prenom + ' ' + u.nom)}</div>
                    <div class="table-user-info">
                        <span class="table-user-name">${u.prenom} ${u.nom}</span>
                        <span class="table-user-email">${u.email}</span>
                    </div>
                </div>
            </td>
            <td>${u.telephone}</td>
            <td><span class="badge badge-${u.role === 'client' ? 'primary' : 'purple'}">${Format.capitalize(u.role)}</span></td>
            <td>${getStatusBadge(u.statut)}</td>
            <td>${getStatusBadge(u.kyc)}</td>
            <td>${Format.dateShort(u.dateInscription)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-ghost btn-xs" onclick="viewUserDetail('${u.id}')">👁</button>
                    <button class="btn btn-ghost btn-xs" onclick="toggleUserStatus('${u.id}')">${u.statut === 'actif' ? '🚫' : '✅'}</button>
                </div>
            </td>
        </tr>
    `).join('');

    // Update count
    const count = $('#userCount');
    if (count) count.textContent = `${users.length} utilisateur(s)`;
}

function viewUserDetail(userId) {
    window.location.href = `detail-utilisateur.html?id=${userId}`;
}

function toggleUserStatus(userId) {
    const user = AppData.users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.statut === 'actif' ? 'suspendu' : 'actif';
    const action = newStatus === 'suspendu' ? 'Suspension' : 'Réactivation';

    if (!confirm(`${action} du compte de ${user.prenom} ${user.nom} ?`)) return;

    user.statut = newStatus;
    saveData();

    AppData.auditLog.unshift({
        id: generateId(),
        action: action,
        utilisateur: AppData.currentUser?.email || 'admin',
        details: `${action} du compte de ${user.prenom} ${user.nom}`,
        date: new Date().toISOString(),
        ip: '192.168.1.1'
    });
    saveData();

    Toast.success(action, `Le compte a été ${newStatus === 'suspendu' ? 'suspendu' : 'réactivé'}.`);
    loadAdminUsers();
}

// ---- User Detail ----
function loadUserDetail() {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
    if (!userId) return;

    const user = AppData.users.find(u => u.id === userId);
    if (!user) return;

    const container = $('#userDetailContent');
    if (!container) return;

    const userVehicles = AppData.vehicules.filter(v => v.proprietaireId === userId);
    const userLocations = AppData.locations.filter(l => l.clientId === userId);

    container.innerHTML = `
        <div class="card mb-6">
            <div class="card-body">
                <div class="flex items-center gap-6">
                    <div class="avatar avatar-xl" style="background:${getAvatarColor(user.prenom + user.nom)}">${Format.initials(user.prenom + ' ' + user.nom)}</div>
                    <div class="flex-1">
                        <h2>${user.prenom} ${user.nom}</h2>
                        <p class="text-secondary">${user.email} · ${user.telephone}</p>
                        <div class="flex gap-2 mt-2">
                            <span class="badge badge-${user.role === 'client' ? 'primary' : 'purple'}">${Format.capitalize(user.role)}</span>
                            ${getStatusBadge(user.statut)}
                            ${getStatusBadge(user.kyc)}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-${user.statut === 'actif' ? 'outline-danger' : 'success'} btn-sm" onclick="toggleUserStatus('${user.id}'); loadUserDetail();">
                            ${user.statut === 'actif' ? '🚫 Suspendre' : '✅ Réactiver'}
                        </button>
                        ${user.kyc === 'en_attente' ? `
                            <button class="btn btn-success btn-sm" onclick="validateKYC('${user.id}', 'valide')">✅ Valider KYC</button>
                            <button class="btn btn-danger btn-sm" onclick="validateKYC('${user.id}', 'refuse')">✕ Refuser KYC</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>

        <div class="two-column mb-6">
            <div class="card">
                <div class="card-header"><h4 class="panel-title">Informations personnelles</h4></div>
                <div class="card-body">
                    <p><strong>Ville:</strong> ${user.ville || 'Non renseigné'}</p>
                    <p><strong>Adresse:</strong> ${user.adresse || 'Non renseigné'}</p>
                    <p><strong>Date d'inscription:</strong> ${Format.date(user.dateInscription)}</p>
                    ${user.nomAgence ? `<p><strong>Agence:</strong> ${user.nomAgence}</p>` : ''}
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h4 class="panel-title">Statistiques</h4></div>
                <div class="card-body">
                    <div class="grid grid-cols-2 gap-4">
                        <div><div class="text-2xl font-bold">${userLocations.length}</div><div class="text-sm text-secondary">Locations</div></div>
                        <div><div class="text-2xl font-bold">${userVehicles.length}</div><div class="text-sm text-secondary">Véhicules</div></div>
                    </div>
                </div>
            </div>
        </div>

        ${userLocations.length > 0 ? `
        <div class="panel mb-6">
            <div class="panel-header"><h4 class="panel-title">Historique des locations</h4></div>
            <div class="table-wrapper" style="border:none;">
                <table class="data-table">
                    <thead><tr><th>Véhicule</th><th>Début</th><th>Fin</th><th>Montant</th><th>Statut</th></tr></thead>
                    <tbody>
                        ${userLocations.map(l => {
        const v = AppData.vehicules.find(v => v.id === l.vehiculeId);
        return `<tr><td>${v ? v.marque + ' ' + v.modele : 'N/A'}</td><td>${Format.dateShort(l.dateDebut)}</td><td>${Format.dateShort(l.dateFin)}</td><td>${Format.currency(l.prixTotal)}</td><td>${getStatusBadge(l.statut)}</td></tr>`;
    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>` : ''}
    `;
}

// ---- KYC Validation ----
function loadKYCValidation() {
    const tbody = $('#kycTableBody');
    if (!tbody) return;

    const pendingUsers = AppData.users.filter(u => u.kyc === 'en_attente');

    if (pendingUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">✅</div><h3 class="empty-state-title">Aucune demande en attente</h3><p class="empty-state-description">Toutes les demandes KYC ont été traitées.</p></div></td></tr>`;
        return;
    }

    tbody.innerHTML = pendingUsers.map(u => `
        <tr>
            <td>
                <div class="table-user">
                    <div class="table-user-avatar" style="background:${getAvatarColor(u.prenom + u.nom)}">${Format.initials(u.prenom + ' ' + u.nom)}</div>
                    <div class="table-user-info">
                        <span class="table-user-name">${u.prenom} ${u.nom}</span>
                        <span class="table-user-email">${u.email}</span>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-${u.role === 'client' ? 'primary' : 'purple'}">${Format.capitalize(u.role)}</span></td>
            <td>${Format.dateShort(u.dateInscription)}</td>
            <td>${getStatusBadge(u.kyc)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-success btn-xs" onclick="validateKYC('${u.id}', 'valide')">✅ Valider</button>
                    <button class="btn btn-danger btn-xs" onclick="validateKYC('${u.id}', 'refuse')">✕ Refuser</button>
                    <button class="btn btn-ghost btn-xs" onclick="viewUserDetail('${u.id}')">👁 Voir</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function validateKYC(userId, status) {
    const user = AppData.users.find(u => u.id === userId);
    if (!user) return;

    user.kyc = status;
    saveData();

    AppData.auditLog.unshift({
        id: generateId(),
        action: 'Validation KYC',
        utilisateur: AppData.currentUser?.email || 'admin',
        details: `KYC ${status === 'valide' ? 'validé' : 'refusé'} pour ${user.prenom} ${user.nom}`,
        date: new Date().toISOString(),
        ip: '192.168.1.1'
    });
    saveData();

    Toast.success('KYC mis à jour', `Le KYC de ${user.prenom} ${user.nom} a été ${status === 'valide' ? 'validé' : 'refusé'}.`);

    if (typeof loadKYCValidation === 'function') loadKYCValidation();
}

// ---- Vehicle Validation ----
function loadVehicleValidation() {
    const tbody = $('#vehicleValidationBody');
    if (!tbody) return;

    const pendingVehicles = AppData.vehicules.filter(v => v.statut === 'en_attente' || v.documents === 'en_attente');

    if (pendingVehicles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">🚗</div><h3 class="empty-state-title">Aucun véhicule en attente</h3></div></td></tr>`;
        return;
    }

    tbody.innerHTML = pendingVehicles.map(v => {
        const owner = AppData.users.find(u => u.id === v.proprietaireId);
        return `
            <tr>
                <td>
                    <div class="flex items-center gap-3">
                        <img src="${getCarPlaceholder(v.marque)}" style="width:48px;height:32px;border-radius:6px;object-fit:cover;">
                        <div><div class="font-medium">${v.marque} ${v.modele}</div><div class="text-xs text-tertiary">${v.immatriculation}</div></div>
                    </div>
                </td>
                <td>${owner ? owner.prenom + ' ' + owner.nom : 'N/A'}</td>
                <td>${v.categorie}</td>
                <td>${getStatusBadge(v.statut)}</td>
                <td>${getStatusBadge(v.documents)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-success btn-xs" onclick="validateVehicle('${v.id}', 'valide')">✅ Valider</button>
                        <button class="btn btn-danger btn-xs" onclick="validateVehicle('${v.id}', 'refuse')">✕ Refuser</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function validateVehicle(vehicleId, status) {
    const vehicle = AppData.vehicules.find(v => v.id === vehicleId);
    if (!vehicle) return;

    vehicle.statut = status;
    vehicle.documents = status;
    saveData();

    AppData.auditLog.unshift({
        id: generateId(),
        action: 'Validation véhicule',
        utilisateur: AppData.currentUser?.email || 'admin',
        details: `${vehicle.marque} ${vehicle.modele} ${status === 'valide' ? 'validé' : 'refusé'}`,
        date: new Date().toISOString(),
        ip: '192.168.1.1'
    });
    saveData();

    Toast.success('Véhicule mis à jour', `Le véhicule a été ${status === 'valide' ? 'validé' : 'refusé'}.`);
    loadVehicleValidation();
}

// ---- Admin Vehicle List ----
function loadAdminVehicles() {
    const tbody = $('#adminVehicleBody');
    if (!tbody) return;

    let vehicles = [...AppData.vehicules];

    const search = $('#vehicleSearchInput')?.value?.toLowerCase();
    if (search) {
        vehicles = vehicles.filter(v =>
            v.marque.toLowerCase().includes(search) ||
            v.modele.toLowerCase().includes(search) ||
            v.immatriculation.toLowerCase().includes(search)
        );
    }

    const statusFilter = $('#filterStatus')?.value;
    if (statusFilter) vehicles = vehicles.filter(v => v.statut === statusFilter);

    tbody.innerHTML = vehicles.map(v => {
        const owner = AppData.users.find(u => u.id === v.proprietaireId);
        return `
            <tr>
                <td>
                    <div class="flex items-center gap-3">
                        <img src="${getCarPlaceholder(v.marque)}" style="width:48px;height:32px;border-radius:6px;object-fit:cover;">
                        <div><div class="font-medium">${v.marque} ${v.modele}</div><div class="text-xs text-tertiary">${v.immatriculation}</div></div>
                    </div>
                </td>
                <td>${owner ? owner.prenom + ' ' + owner.nom : 'N/A'}</td>
                <td>${v.categorie}</td>
                <td>${Format.currency(v.prixJour)}</td>
                <td>${getStatusBadge(v.statut)}</td>
                <td>${getStatusBadge(v.documents)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-ghost btn-xs" onclick="viewVehicleDetail('${v.id}')">👁</button>
                        ${v.statut === 'en_attente' ? `<button class="btn btn-success btn-xs" onclick="validateVehicle('${v.id}', 'valide')">✅</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ---- Audit Log ----
function loadAuditLog() {
    const tbody = $('#auditLogBody');
    if (!tbody) return;

    const logs = AppData.auditLog;

    tbody.innerHTML = logs.map(log => `
        <tr>
            <td class="text-xs text-tertiary">${Format.dateTime(log.date)}</td>
            <td><span class="badge badge-info">${log.action}</span></td>
            <td>${log.utilisateur}</td>
            <td>${log.details}</td>
            <td class="text-xs text-tertiary">${log.ip}</td>
        </tr>
    `).join('');
}

// ---- Roles Management ----
function loadRoles() {
    const container = $('#rolesContainer');
    if (!container) return;

    const roles = [
        { name: 'Client', icon: 'ph-user-circle', description: 'Rechercher, louer et gérer ses réservations de véhicules', permissions: ['Rechercher des véhicules', 'Réserver un véhicule', 'Gérer ses favoris', 'Voir son historique', 'Déclarer un incident', 'Soumettre KYC'], color: 'primary', count: AppData.users.filter(u => u.role === 'client').length },
        { name: 'Propriétaire', icon: 'ph-buildings', description: 'Gérer sa flotte de véhicules et suivre les locations', permissions: ['Ajouter des véhicules', 'Gérer les tarifs', 'Voir les réservations', 'Gérer les disponibilités', 'Soumettre des documents', 'Suivi exploitation'], color: 'purple', count: AppData.users.filter(u => u.role === 'proprietaire').length },
        { name: 'Agence', icon: 'ph-storefront', description: 'Gérer une flotte pour le compte de propriétaires multiples', permissions: ['Gérer la flotte véhicules', 'Gérer les réservations', 'Voir les clients', 'Gérer les tarifs', 'Statistiques agence', 'Profil agence'], color: 'success', count: AppData.users.filter(u => u.role === 'agence').length },
        { name: 'Administrateur', icon: 'ph-gear-six', description: 'Gérer l\'ensemble de la plateforme et ses utilisateurs', permissions: ['Gérer les utilisateurs', 'Valider les KYC', 'Valider les véhicules', 'Gérer les agences', 'Gérer les rôles', 'Journal d\'audit'], color: 'warning', count: AppData.users.filter(u => u.role === 'admin').length },
    ];

    container.innerHTML = roles.map(role => `
        <div class="card">
            <div class="card-body">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="stat-card-icon ${role.color === 'primary' ? 'blue' : role.color === 'success' ? 'green' : role.color === 'warning' ? 'amber' : 'purple'}">
                            <i class="ph ${role.icon}" style="font-size: 22px;"></i>
                        </div>
                        <h3>${role.name}</h3>
                    </div>
                    <span class="badge badge-${role.color}">${role.count} utilisateur(s)</span>
                </div>
                <p class="text-sm text-secondary mb-4">${role.description}</p>
                <h5 class="text-sm font-semibold mb-2">Permissions :</h5>
                <ul style="list-style:none;">
                    ${role.permissions.map(p => `<li class="text-sm text-secondary" style="padding:var(--space-1) 0;display:flex;align-items:center;gap:6px;"><i class="ph ph-check-circle" style="color:var(--emerald-500);font-size:16px;"></i> ${p}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');
}
