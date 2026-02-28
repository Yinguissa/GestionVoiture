/**
 * ============================================
 * AutoLoc Pro - Client Module
 * Dashboard, profile, KYC, security
 * ============================================
 */

// ---- Client Dashboard Stats ----
function loadClientDashboard() {
    const user = AppData.currentUser;
    if (!user) return;

    const myLocations = AppData.locations.filter(l => l.clientId === user.id);
    const activeLocations = myLocations.filter(l => l.statut === 'en_cours');
    const totalSpent = myLocations.filter(l => l.paiement === 'payé').reduce((sum, l) => sum + l.prixTotal, 0);
    const favCount = AppData.favoris.length;

    // Update stat cards
    const stats = {
        '#stat-locations': myLocations.length,
        '#stat-active': activeLocations.length,
        '#stat-spent': Format.currency(totalSpent),
        '#stat-favoris': favCount,
    };

    Object.entries(stats).forEach(([sel, val]) => {
        const el = $(sel);
        if (el) el.textContent = val;
    });

    // Render recent locations
    const recentList = $('#recentLocations');
    if (recentList) {
        const recent = myLocations.slice(0, 5);
        if (recent.length === 0) {
            recentList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚗</div>
                    <h3 class="empty-state-title">Aucune location</h3>
                    <p class="empty-state-description">Vous n'avez pas encore effectué de location.</p>
                    <a href="recherche.html" class="btn btn-primary">Rechercher un véhicule</a>
                </div>
            `;
        } else {
            recentList.innerHTML = recent.map(loc => {
                const vehicle = AppData.vehicules.find(v => v.id === loc.vehiculeId);
                return `
                    <div class="flex items-center justify-between" style="padding: var(--space-4); border-bottom: 1px solid var(--border-light);">
                        <div class="flex items-center gap-3">
                            <img src="${getCarPlaceholder(vehicle?.marque || 'Auto')}" style="width:56px;height:38px;border-radius:8px;object-fit:cover;">
                            <div>
                                <div class="font-medium text-sm">${vehicle ? vehicle.marque + ' ' + vehicle.modele : 'Véhicule'}</div>
                                <div class="text-xs text-tertiary">${Format.dateShort(loc.dateDebut)} → ${Format.dateShort(loc.dateFin)}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold text-sm">${Format.currency(loc.prixTotal)}</div>
                            ${getStatusBadge(loc.statut)}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Render favorite vehicles in quick view
    const favGrid = $('#favoritesPreview');
    if (favGrid) {
        const favVehicles = AppData.vehicules.filter(v => AppData.favoris.includes(v.id)).slice(0, 3);
        if (favVehicles.length === 0) {
            favGrid.innerHTML = '<p class="text-sm text-tertiary" style="padding: var(--space-4);">Aucun favori pour le moment.</p>';
        } else {
            favGrid.innerHTML = favVehicles.map(v => `
                <div class="flex items-center gap-3" style="padding: var(--space-3); cursor:pointer;" onclick="viewVehicleDetail('${v.id}')">
                    <img src="${getCarPlaceholder(v.marque)}" style="width:48px;height:32px;border-radius:6px;object-fit:cover;">
                    <div class="flex-1">
                        <div class="text-sm font-medium">${v.marque} ${v.modele}</div>
                        <div class="text-xs text-tertiary">${Format.currency(v.prixJour)}/jour</div>
                    </div>
                    <span class="text-accent">⭐ ${v.rating}</span>
                </div>
            `).join('');
        }
    }
}

// ---- Profile Management ----
function handleProfileUpdate(e) {
    e.preventDefault();
    const form = e.target;
    const user = AppData.currentUser;
    if (!user) return;

    user.nom = form.querySelector('#nom').value.trim() || user.nom;
    user.prenom = form.querySelector('#prenom').value.trim() || user.prenom;
    user.telephone = form.querySelector('#telephone').value.trim() || user.telephone;
    user.ville = form.querySelector('#ville')?.value.trim() || user.ville;
    user.adresse = form.querySelector('#adresse')?.value.trim() || user.adresse;

    // Update in users array
    const idx = AppData.users.findIndex(u => u.id === user.id);
    if (idx > -1) AppData.users[idx] = { ...user };

    AppData.currentUser = user;
    Storage.set('currentUser', user);
    saveData();

    Toast.success('Profil mis à jour', 'Vos informations ont été sauvegardées.');
    updateUserDisplay();
}

// ---- KYC Submission ----
function handleKYCSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const user = AppData.currentUser;
    if (!user) return;

    const typeDoc = form.querySelector('#typeDocument')?.value;
    const numDoc = form.querySelector('#numDocument')?.value;

    if (!typeDoc || !numDoc) {
        Toast.warning('Champs requis', 'Veuillez remplir tous les champs obligatoires.');
        return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.classList.add('btn-loading');

    setTimeout(() => {
        user.kyc = 'en_attente';
        const idx = AppData.users.findIndex(u => u.id === user.id);
        if (idx > -1) AppData.users[idx].kyc = 'en_attente';
        AppData.currentUser = user;
        Storage.set('currentUser', user);
        saveData();

        btn.classList.remove('btn-loading');
        Toast.success('KYC soumis', 'Votre demande de vérification est en cours de traitement.');

        // Update UI
        const statusEl = $('#kycStatus');
        if (statusEl) statusEl.innerHTML = getStatusBadge('en_attente');
    }, 2000);
}

// ---- Security - Change Password ----
function handleChangePassword(e) {
    e.preventDefault();
    const form = e.target;
    Validator.clearErrors(form);
    const user = AppData.currentUser;
    if (!user) return;

    const currentPwd = form.querySelector('#currentPassword').value;
    const newPwd = form.querySelector('#newPassword').value;
    const confirmPwd = form.querySelector('#confirmPassword').value;

    if (currentPwd !== user.password) {
        Validator.showError(form.querySelector('#currentPassword'), 'Mot de passe actuel incorrect');
        return;
    }

    if (!Validator.rules.password(newPwd)) {
        Validator.showError(form.querySelector('#newPassword'), 'Min. 8 caractères, une majuscule et un chiffre');
        return;
    }

    if (newPwd !== confirmPwd) {
        Validator.showError(form.querySelector('#confirmPassword'), 'Les mots de passe ne correspondent pas');
        return;
    }

    user.password = newPwd;
    const idx = AppData.users.findIndex(u => u.id === user.id);
    if (idx > -1) AppData.users[idx].password = newPwd;
    Storage.set('currentUser', user);
    saveData();

    Toast.success('Mot de passe modifié', 'Votre mot de passe a été changé avec succès.');
    form.reset();
}

// ---- Load Devices ----
function loadDevices() {
    const container = $('#devicesList');
    if (!container) return;

    const devices = [
        { name: 'Chrome - Windows 11', ip: '192.168.1.10', lastActive: '2026-02-28T10:30:00', current: true, icon: '💻' },
        { name: 'Safari - iPhone 15', ip: '192.168.1.45', lastActive: '2026-02-27T18:00:00', current: false, icon: '📱' },
        { name: 'Firefox - MacOS', ip: '192.168.1.80', lastActive: '2026-02-25T09:15:00', current: false, icon: '🖥️' },
    ];

    container.innerHTML = devices.map(d => `
        <div class="flex items-center justify-between" style="padding: var(--space-4); border-bottom: 1px solid var(--border-light);">
            <div class="flex items-center gap-3">
                <div style="font-size: 1.5rem;">${d.icon}</div>
                <div>
                    <div class="font-medium text-sm">${d.name}</div>
                    <div class="text-xs text-tertiary">IP: ${d.ip} · ${Format.timeAgo(d.lastActive)}</div>
                </div>
            </div>
            <div>
                ${d.current
            ? '<span class="badge badge-success badge-dot">Actif</span>'
            : `<button class="btn btn-outline-danger btn-xs" onclick="revokeDevice(this)">Révoquer</button>`
        }
            </div>
        </div>
    `).join('');
}

function revokeDevice(btn) {
    const row = btn.closest('.flex');
    if (row) {
        row.style.opacity = '0.5';
        row.style.pointerEvents = 'none';
        Toast.success('Appareil révoqué', 'L\'appareil a été déconnecté.');
    }
}

// ---- Load Rental History ----
function loadRentalHistory() {
    const user = AppData.currentUser;
    if (!user) return;

    const tbody = $('#rentalHistoryBody');
    if (!tbody) return;

    const locations = AppData.locations.filter(l => l.clientId === user.id);

    if (locations.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6">
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3 class="empty-state-title">Aucun historique</h3>
                    <p class="empty-state-description">Vous n'avez pas encore de locations.</p>
                </div>
            </td></tr>
        `;
        return;
    }

    tbody.innerHTML = locations.map(loc => {
        const vehicle = AppData.vehicules.find(v => v.id === loc.vehiculeId);
        return `
            <tr>
                <td>
                    <div class="flex items-center gap-3">
                        <img src="${getCarPlaceholder(vehicle?.marque || '')}" style="width:48px;height:32px;border-radius:6px;object-fit:cover;">
                        <div>
                            <div class="font-medium">${vehicle ? vehicle.marque + ' ' + vehicle.modele : 'N/A'}</div>
                            <div class="text-xs text-tertiary">${vehicle?.immatriculation || ''}</div>
                        </div>
                    </div>
                </td>
                <td>${Format.dateShort(loc.dateDebut)}</td>
                <td>${Format.dateShort(loc.dateFin)}</td>
                <td class="font-semibold">${Format.currency(loc.prixTotal)}</td>
                <td>${getStatusBadge(loc.statut)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-ghost btn-xs" onclick="viewContract('${loc.id}')">📄 Contrat</button>
                        ${loc.statut === 'en_cours' ? `<button class="btn btn-outline-danger btn-xs" onclick="declareIncident('${loc.id}')">⚠ Incident</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function viewContract(locationId) {
    window.location.href = `contrat.html?id=${locationId}`;
}

function declareIncident(locationId) {
    window.location.href = `decincident.html?id=${locationId}`;
}

// ---- Load Favorites Page ----
function loadFavorites() {
    const grid = $('#favoritesGrid');
    if (!grid) return;

    const favVehicles = AppData.vehicules.filter(v => AppData.favoris.includes(v.id));

    if (favVehicles.length === 0) {
        grid.innerHTML = `
            <div class="empty-state col-span-full">
                <div class="empty-state-icon">❤️</div>
                <h3 class="empty-state-title">Aucun favori</h3>
                <p class="empty-state-description">Ajoutez des véhicules à vos favoris pour les retrouver facilement.</p>
                <a href="recherche.html" class="btn btn-primary">Explorer les véhicules</a>
            </div>
        `;
    } else {
        grid.innerHTML = favVehicles.map(v => renderVehicleCard(v, true)).join('');
    }
}

// ---- Load Contract Details ----
function loadContract() {
    const params = new URLSearchParams(window.location.search);
    const locationId = params.get('id');
    if (!locationId) return;

    const location = AppData.locations.find(l => l.id === locationId);
    if (!location) return;

    const vehicle = AppData.vehicules.find(v => v.id === location.vehiculeId);
    const client = AppData.users.find(u => u.id === location.clientId);
    const owner = vehicle ? AppData.users.find(u => u.id === vehicle.proprietaireId) : null;

    const container = $('#contractContent');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; margin-bottom: var(--space-8);">
            <div style="font-size: 2rem; margin-bottom: var(--space-2);">📋</div>
            <h2>Contrat de Location</h2>
            <p class="text-secondary">Réf: ${location.id.toUpperCase()}</p>
        </div>

        <div class="two-column" style="margin-bottom: var(--space-6);">
            <div class="card">
                <div class="card-body">
                    <h4 class="mb-4">🚗 Véhicule</h4>
                    <p><strong>Marque/Modèle:</strong> ${vehicle?.marque} ${vehicle?.modele}</p>
                    <p><strong>Immatriculation:</strong> ${vehicle?.immatriculation}</p>
                    <p><strong>Année:</strong> ${vehicle?.annee}</p>
                    <p><strong>Couleur:</strong> ${vehicle?.couleur}</p>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <h4 class="mb-4">👤 Client</h4>
                    <p><strong>Nom:</strong> ${client?.prenom} ${client?.nom}</p>
                    <p><strong>Email:</strong> ${client?.email}</p>
                    <p><strong>Téléphone:</strong> ${client?.telephone}</p>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: var(--space-6);">
            <div class="card-body">
                <h4 class="mb-4">📅 Détails de la location</h4>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <div class="text-sm text-secondary">Date de début</div>
                        <div class="font-semibold">${Format.date(location.dateDebut)}</div>
                    </div>
                    <div>
                        <div class="text-sm text-secondary">Date de fin</div>
                        <div class="font-semibold">${Format.date(location.dateFin)}</div>
                    </div>
                    <div>
                        <div class="text-sm text-secondary">Statut</div>
                        ${getStatusBadge(location.statut)}
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-body" style="text-align:center;">
                <h3 style="color: var(--primary-600);">Montant total: ${Format.currency(location.prixTotal)}</h3>
                <p class="text-sm text-secondary mt-2">Paiement: ${getStatusBadge(location.paiement === 'payé' ? 'valide' : 'en_attente')}</p>
            </div>
        </div>

        <div style="text-align:center; margin-top: var(--space-6);">
            <button class="btn btn-primary btn-lg" onclick="window.print()">🖨 Imprimer le contrat</button>
        </div>
    `;
}

// ---- Incident Declaration ----
function handleIncidentSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const params = new URLSearchParams(window.location.search);
    const locationId = params.get('id');
    const user = AppData.currentUser;

    const type = form.querySelector('#incidentType').value;
    const description = form.querySelector('#incidentDescription').value;

    if (!type || !description) {
        Toast.warning('Champs requis', 'Veuillez remplir tous les champs.');
        return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.classList.add('btn-loading');

    setTimeout(() => {
        const incident = {
            id: generateId(),
            locationId: locationId || 'unknown',
            clientId: user?.id || 'unknown',
            type,
            description,
            statut: 'en_cours',
            dateDeclaration: new Date().toISOString().split('T')[0],
            photos: []
        };

        AppData.incidents.push(incident);
        saveData();

        btn.classList.remove('btn-loading');
        Toast.success('Incident déclaré', 'Votre déclaration a bien été enregistrée. Nous vous contacterons sous 24h.');

        setTimeout(() => {
            window.location.href = 'historique-locations.html';
        }, 2000);
    }, 2000);
}
