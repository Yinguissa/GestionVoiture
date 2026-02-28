/**
 * ============================================
 * AutoLoc Pro - Proprietaire Module
 * Vehicle management, tariffs, availability
 * ============================================
 */

// ---- Owner Dashboard ----
function loadOwnerDashboard() {
    const user = AppData.currentUser;
    if (!user) return;

    const myVehicles = AppData.vehicules.filter(v => v.proprietaireId === user.id);
    const activeRentals = AppData.locations.filter(l => {
        const v = AppData.vehicules.find(v => v.id === l.vehiculeId);
        return v && v.proprietaireId === user.id && l.statut === 'en_cours';
    });
    const totalRevenue = AppData.locations.filter(l => {
        const v = AppData.vehicules.find(v => v.id === l.vehiculeId);
        return v && v.proprietaireId === user.id && l.paiement === 'payé';
    }).reduce((sum, l) => sum + l.prixTotal, 0);
    const avgRating = myVehicles.filter(v => v.rating > 0).reduce((sum, v) => sum + v.rating, 0) / (myVehicles.filter(v => v.rating > 0).length || 1);

    const stats = {
        '#stat-vehicles': myVehicles.length,
        '#stat-active-rentals': activeRentals.length,
        '#stat-revenue': Format.currency(totalRevenue),
        '#stat-rating': avgRating.toFixed(1),
    };

    Object.entries(stats).forEach(([sel, val]) => {
        const el = $(sel);
        if (el) el.textContent = val;
    });

    // Recent rentals panel
    const recentPanel = $('#recentRentals');
    if (recentPanel) {
        const ownerLocations = AppData.locations.filter(l => {
            const v = AppData.vehicules.find(v => v.id === l.vehiculeId);
            return v && v.proprietaireId === user.id;
        }).slice(0, 5);

        if (ownerLocations.length === 0) {
            recentPanel.innerHTML = '<p class="text-sm text-tertiary" style="padding:var(--space-4);">Aucune location pour le moment.</p>';
        } else {
            recentPanel.innerHTML = ownerLocations.map(loc => {
                const vehicle = AppData.vehicules.find(v => v.id === loc.vehiculeId);
                const client = AppData.users.find(u => u.id === loc.clientId);
                return `
                    <div class="flex items-center justify-between" style="padding:var(--space-4); border-bottom: 1px solid var(--border-light);">
                        <div class="flex items-center gap-3">
                            <div class="table-user-avatar" style="background:${getAvatarColor(client?.prenom || 'U')}">${Format.initials((client?.prenom || 'U') + ' ' + (client?.nom || ''))}</div>
                            <div>
                                <div class="font-medium text-sm">${client?.prenom} ${client?.nom}</div>
                                <div class="text-xs text-tertiary">${vehicle?.marque} ${vehicle?.modele} · ${Format.dateShort(loc.dateDebut)}</div>
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

    // Vehicles overview
    const vehiclesPanel = $('#vehiclesOverview');
    if (vehiclesPanel) {
        vehiclesPanel.innerHTML = myVehicles.slice(0, 4).map(v => `
            <div class="flex items-center gap-3" style="padding: var(--space-3); cursor:pointer;" onclick="editVehicle('${v.id}')">
                <img src="${getCarPlaceholder(v.marque)}" style="width:56px;height:38px;border-radius:8px;object-fit:cover;">
                <div class="flex-1">
                    <div class="text-sm font-medium">${v.marque} ${v.modele}</div>
                    <div class="text-xs text-tertiary">${Format.currency(v.prixJour)}/jour</div>
                </div>
                ${getStatusBadge(v.disponible ? 'disponible' : 'loue')}
            </div>
        `).join('');
    }
}

// ---- Load Vehicle List ----
function loadOwnerVehicles() {
    const user = AppData.currentUser;
    if (!user) return;

    const tbody = $('#vehicleListBody');
    if (!tbody) return;

    const myVehicles = AppData.vehicules.filter(v => v.proprietaireId === user.id);

    if (myVehicles.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7">
                <div class="empty-state">
                    <div class="empty-state-icon">🚗</div>
                    <h3 class="empty-state-title">Aucun véhicule</h3>
                    <p class="empty-state-description">Commencez par ajouter votre premier véhicule.</p>
                    <a href="ajouter-vehicule.html" class="btn btn-primary">+ Ajouter un véhicule</a>
                </div>
            </td></tr>
        `;
        return;
    }

    tbody.innerHTML = myVehicles.map(v => renderOwnerVehicleRow(v)).join('');
}

// ---- Multi-step Vehicle Form ----
let currentStep = 1;
const totalSteps = 4;

function nextStep() {
    if (currentStep >= totalSteps) return;
    if (!validateStep(currentStep)) return;

    $$('.form-step').forEach(s => s.classList.remove('active'));
    currentStep++;
    const nextStepEl = $(`#step-${currentStep}`);
    if (nextStepEl) nextStepEl.classList.add('active');
    updateStepIndicators();
}

function prevStep() {
    if (currentStep <= 1) return;
    $$('.form-step').forEach(s => s.classList.remove('active'));
    currentStep--;
    const prevStepEl = $(`#step-${currentStep}`);
    if (prevStepEl) prevStepEl.classList.add('active');
    updateStepIndicators();
}

function validateStep(step) {
    const stepEl = $(`#step-${step}`);
    if (!stepEl) return true;

    const requiredInputs = stepEl.querySelectorAll('[required]');
    let valid = true;

    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            Validator.showError(input, 'Ce champ est obligatoire');
            valid = false;
        } else {
            Validator.showSuccess(input);
        }
    });

    return valid;
}

function updateStepIndicators() {
    $$('.step').forEach((step, i) => {
        step.classList.remove('active', 'completed');
        if (i + 1 === currentStep) step.classList.add('active');
        else if (i + 1 < currentStep) step.classList.add('completed');
    });

    $$('.step-line').forEach((line, i) => {
        line.classList.toggle('completed', i + 1 < currentStep);
    });

    // Update progress bar
    const progress = $('#formProgress');
    if (progress) progress.style.width = `${(currentStep / totalSteps) * 100}%`;
}

function handleVehicleSubmit(e) {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    const user = AppData.currentUser;
    if (!user) return;

    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.classList.add('btn-loading');

    setTimeout(() => {
        const newVehicle = {
            id: generateId(),
            proprietaireId: user.id,
            marque: form.querySelector('#marque')?.value || '',
            modele: form.querySelector('#modele')?.value || '',
            annee: parseInt(form.querySelector('#annee')?.value) || 2024,
            categorie: form.querySelector('#categorie')?.value || 'Berline',
            carburant: form.querySelector('#carburant')?.value || 'Essence',
            transmission: form.querySelector('#transmission')?.value || 'Automatique',
            places: parseInt(form.querySelector('#places')?.value) || 5,
            climatisation: form.querySelector('#climatisation')?.checked || false,
            prixJour: parseInt(form.querySelector('#prixJour')?.value) || 0,
            prixSemaine: parseInt(form.querySelector('#prixSemaine')?.value) || 0,
            prixMois: parseInt(form.querySelector('#prixMois')?.value) || 0,
            disponible: true,
            statut: 'en_attente',
            ville: form.querySelector('#ville')?.value || 'Conakry',
            couleur: form.querySelector('#couleur')?.value || '',
            kilometrage: parseInt(form.querySelector('#kilometrage')?.value) || 0,
            immatriculation: form.querySelector('#immatriculation')?.value || '',
            description: form.querySelector('#description')?.value || '',
            images: [],
            documents: 'en_attente',
            rating: 0,
            totalLocations: 0
        };

        AppData.vehicules.push(newVehicle);
        saveData();

        btn.classList.remove('btn-loading');
        Toast.success('Véhicule ajouté !', 'Votre véhicule est en attente de validation.');

        setTimeout(() => {
            window.location.href = 'liste-vehicules.html';
        }, 1500);
    }, 2000);
}

function editVehicle(id) {
    window.location.href = `ajouter-vehicule.html?edit=${id}`;
}

function deleteVehicle(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return;

    const idx = AppData.vehicules.findIndex(v => v.id === id);
    if (idx > -1) {
        AppData.vehicules.splice(idx, 1);
        saveData();
        Toast.success('Supprimé', 'Le véhicule a été supprimé.');
        loadOwnerVehicles();
    }
}

// ---- Load Tariffs Page ----
function loadTariffs() {
    const user = AppData.currentUser;
    if (!user) return;

    const container = $('#tariffsContainer');
    if (!container) return;

    const myVehicles = AppData.vehicules.filter(v => v.proprietaireId === user.id);

    container.innerHTML = myVehicles.map(v => `
        <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-header">
                <div class="flex items-center gap-3">
                    <img src="${getCarPlaceholder(v.marque)}" style="width:48px;height:32px;border-radius:6px;object-fit:cover;">
                    <div>
                        <div class="font-medium">${v.marque} ${v.modele}</div>
                        <div class="text-xs text-tertiary">${v.immatriculation}</div>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="grid grid-cols-3 gap-4">
                    <div class="form-group">
                        <label class="form-label">Prix / Jour</label>
                        <input type="number" class="form-input" value="${v.prixJour}" 
                               onchange="updateTariff('${v.id}', 'prixJour', this.value)">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Prix / Semaine</label>
                        <input type="number" class="form-input" value="${v.prixSemaine}"
                               onchange="updateTariff('${v.id}', 'prixSemaine', this.value)">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Prix / Mois</label>
                        <input type="number" class="form-input" value="${v.prixMois}"
                               onchange="updateTariff('${v.id}', 'prixMois', this.value)">
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateTariff(vehicleId, field, value) {
    const vehicle = AppData.vehicules.find(v => v.id === vehicleId);
    if (vehicle) {
        vehicle[field] = parseInt(value) || 0;
        saveData();
        Toast.success('Tarif mis à jour', `Le ${field.replace('prix', 'prix ')} a été modifié.`);
    }
}

// ---- Owner Documents Page ----
function loadOwnerDocuments() {
    const user = AppData.currentUser;
    if (!user) return;

    const container = $('#documentsContainer');
    if (!container) return;

    const myVehicles = AppData.vehicules.filter(v => v.proprietaireId === user.id);

    container.innerHTML = myVehicles.map(v => `
        <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-body">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <img src="${getCarPlaceholder(v.marque)}" style="width:56px;height:38px;border-radius:8px;object-fit:cover;">
                        <div>
                            <div class="font-medium">${v.marque} ${v.modele}</div>
                            <div class="text-xs text-tertiary">${v.immatriculation}</div>
                        </div>
                    </div>
                    ${getStatusBadge(v.documents)}
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="file-upload" style="padding:var(--space-4);">
                        <input type="file" accept=".pdf,.jpg,.png" style="display:none;">
                        <div class="text-sm">📄 Carte grise</div>
                        <div class="text-xs text-tertiary mt-1">PDF, JPG ou PNG</div>
                    </div>
                    <div class="file-upload" style="padding:var(--space-4);">
                        <input type="file" accept=".pdf,.jpg,.png" style="display:none;">
                        <div class="text-sm">📄 Assurance</div>
                        <div class="text-xs text-tertiary mt-1">PDF, JPG ou PNG</div>
                    </div>
                    <div class="file-upload" style="padding:var(--space-4);">
                        <input type="file" accept=".pdf,.jpg,.png" style="display:none;">
                        <div class="text-sm">📄 Contrôle technique</div>
                        <div class="text-xs text-tertiary mt-1">PDF, JPG ou PNG</div>
                    </div>
                    <div class="file-upload" style="padding:var(--space-4);">
                        <input type="file" accept=".pdf,.jpg,.png" style="display:none;">
                        <div class="text-sm">📸 Photos véhicule</div>
                        <div class="text-xs text-tertiary mt-1">JPG ou PNG</div>
                    </div>
                </div>
                <div style="margin-top:var(--space-4); text-align:right;">
                    <button class="btn btn-primary btn-sm" onclick="submitDocuments('${v.id}')">Soumettre les documents</button>
                </div>
            </div>
        </div>
    `).join('');

    initFileUploads();
}

function submitDocuments(vehicleId) {
    const vehicle = AppData.vehicules.find(v => v.id === vehicleId);
    if (vehicle) {
        vehicle.documents = 'en_attente';
        saveData();
        Toast.success('Documents soumis', 'Vos documents sont en cours de vérification.');
        loadOwnerDocuments();
    }
}

// ---- Exploitation Tracking ----
function loadExploitation() {
    const user = AppData.currentUser;
    if (!user) return;

    const container = $('#exploitationBody');
    if (!container) return;

    const myVehicles = AppData.vehicules.filter(v => v.proprietaireId === user.id);

    container.innerHTML = myVehicles.map(v => {
        const vehicleLocations = AppData.locations.filter(l => l.vehiculeId === v.id);
        const revenue = vehicleLocations.filter(l => l.paiement === 'payé').reduce((s, l) => s + l.prixTotal, 0);
        const occupancy = vehicleLocations.length > 0 ? Math.min(Math.round((vehicleLocations.filter(l => l.statut === 'termine' || l.statut === 'en_cours').length / 12) * 100), 100) : 0;

        return `
            <tr>
                <td>
                    <div class="flex items-center gap-3">
                        <img src="${getCarPlaceholder(v.marque)}" style="width:48px;height:32px;border-radius:6px;object-fit:cover;">
                        <span class="font-medium">${v.marque} ${v.modele}</span>
                    </div>
                </td>
                <td>${vehicleLocations.length}</td>
                <td class="font-semibold">${Format.currency(revenue)}</td>
                <td>
                    <div class="flex items-center gap-2">
                        <div class="progress-bar" style="width: 100px;">
                            <div class="progress-bar-fill ${occupancy > 70 ? 'success' : occupancy > 40 ? '' : 'warning'}" style="width:${occupancy}%"></div>
                        </div>
                        <span class="text-sm">${occupancy}%</span>
                    </div>
                </td>
                <td>${getStatusBadge(v.disponible ? 'disponible' : 'loue')}</td>
                <td>⭐ ${v.rating || 'N/A'}</td>
            </tr>
        `;
    }).join('');
}
