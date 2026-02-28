/**
 * ============================================
 * AutoLoc Pro - Vehicle Management Module
 * Search, filter, sort, favorites, details
 * ============================================
 */

// ---- Vehicle Search & Filter ----
function getFilteredVehicles(filters = {}) {
    let vehicles = [...AppData.vehicules].filter(v => v.statut === 'valide');

    if (filters.search) {
        const q = filters.search.toLowerCase();
        vehicles = vehicles.filter(v =>
            v.marque.toLowerCase().includes(q) ||
            v.modele.toLowerCase().includes(q) ||
            v.description.toLowerCase().includes(q)
        );
    }

    if (filters.marque) vehicles = vehicles.filter(v => v.marque === filters.marque);
    if (filters.categorie) vehicles = vehicles.filter(v => v.categorie === filters.categorie);
    if (filters.carburant) vehicles = vehicles.filter(v => v.carburant === filters.carburant);
    if (filters.transmission) vehicles = vehicles.filter(v => v.transmission === filters.transmission);
    if (filters.ville) vehicles = vehicles.filter(v => v.ville === filters.ville);
    if (filters.disponible !== undefined) vehicles = vehicles.filter(v => v.disponible === filters.disponible);
    if (filters.prixMin) vehicles = vehicles.filter(v => v.prixJour >= filters.prixMin);
    if (filters.prixMax) vehicles = vehicles.filter(v => v.prixJour <= filters.prixMax);
    if (filters.places) vehicles = vehicles.filter(v => v.places >= filters.places);
    if (filters.anneeMin) vehicles = vehicles.filter(v => v.annee >= filters.anneeMin);

    // Sort
    switch (filters.sort) {
        case 'prix-asc': vehicles.sort((a, b) => a.prixJour - b.prixJour); break;
        case 'prix-desc': vehicles.sort((a, b) => b.prixJour - a.prixJour); break;
        case 'recent': vehicles.sort((a, b) => b.annee - a.annee); break;
        case 'rating': vehicles.sort((a, b) => b.rating - a.rating); break;
        case 'populaire': vehicles.sort((a, b) => b.totalLocations - a.totalLocations); break;
        default: vehicles.sort((a, b) => b.rating - a.rating);
    }

    return vehicles;
}

// ---- Render Vehicle Card ----
function renderVehicleCard(vehicle, showFav = true) {
    const isFav = AppData.favoris.includes(vehicle.id);
    const owner = AppData.users.find(u => u.id === vehicle.proprietaireId);

    return `
        <div class="vehicle-card" onclick="viewVehicleDetail('${vehicle.id}')" data-vehicle-id="${vehicle.id}">
            <div class="vehicle-card-image">
                <img src="${getCarPlaceholder(vehicle.marque + ' ' + vehicle.modele)}" alt="${vehicle.marque} ${vehicle.modele}">
                <div class="vehicle-card-badges">
                    <span class="badge badge-primary">${vehicle.categorie}</span>
                    ${!vehicle.disponible ? '<span class="badge badge-danger">Indisponible</span>' : ''}
                </div>
                ${showFav ? `
                <button class="vehicle-card-favorite ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${vehicle.id}', this)" data-tooltip="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                    ${isFav ? '❤' : '♡'}
                </button>` : ''}
            </div>
            <div class="vehicle-card-body">
                <div class="vehicle-card-header">
                    <div>
                        <div class="vehicle-card-title">${vehicle.marque} ${vehicle.modele}</div>
                        <div class="vehicle-card-year">${vehicle.annee} · ${vehicle.couleur}</div>
                    </div>
                    ${vehicle.rating > 0 ? `
                    <div class="vehicle-card-rating">
                        ⭐ ${vehicle.rating}
                    </div>` : ''}
                </div>
                <div class="vehicle-card-specs">
                    <span class="vehicle-card-spec">⛽ ${vehicle.carburant}</span>
                    <span class="vehicle-card-spec">⚙️ ${vehicle.transmission}</span>
                    <span class="vehicle-card-spec">👥 ${vehicle.places} places</span>
                    ${vehicle.climatisation ? '<span class="vehicle-card-spec">❄️ Clim</span>' : ''}
                </div>
                <div class="vehicle-card-footer">
                    <div class="vehicle-card-price">
                        ${Format.currency(vehicle.prixJour)} <span>/ jour</span>
                    </div>
                    ${owner ? `<span class="text-xs text-tertiary">${owner.nomAgence || (owner.prenom + ' ' + owner.nom)}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// ---- View Vehicle Detail ----
function viewVehicleDetail(vehicleId) {
    const basePath = window.location.pathname.includes('/clients/') ? '' :
        window.location.pathname.includes('/pages/') ? 'clients/' : 'pages/clients/';
    window.location.href = `${basePath}detail-vehicule.html?id=${vehicleId}`;
}

// ---- Toggle Favorite ----
function toggleFavorite(vehicleId, btn) {
    const index = AppData.favoris.indexOf(vehicleId);
    if (index > -1) {
        AppData.favoris.splice(index, 1);
        if (btn) { btn.innerHTML = '♡'; btn.classList.remove('active'); }
        Toast.info('Retiré', 'Véhicule retiré des favoris');
    } else {
        AppData.favoris.push(vehicleId);
        if (btn) { btn.innerHTML = '❤'; btn.classList.add('active'); }
        Toast.success('Ajouté', 'Véhicule ajouté aux favoris');
    }
    Storage.set('favoris', AppData.favoris);
}

// ---- Calculate Rental Price ----
function calculateRentalPrice(vehicle, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (days <= 0) return { days: 0, total: 0, perDay: vehicle.prixJour };

    let total;
    if (days >= 30) {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        total = (months * vehicle.prixMois) + (remainingDays * vehicle.prixJour);
    } else if (days >= 7) {
        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;
        total = (weeks * vehicle.prixSemaine) + (remainingDays * vehicle.prixJour);
    } else {
        total = days * vehicle.prixJour;
    }

    return { days, total, perDay: Math.round(total / days) };
}

// ---- Render Vehicle List for Owner ----
function renderOwnerVehicleRow(vehicle) {
    return `
        <tr>
            <td>
                <div class="flex items-center gap-3">
                    <img src="${getCarPlaceholder(vehicle.marque)}" alt="${vehicle.marque}" 
                         style="width:60px;height:40px;border-radius:8px;object-fit:cover;">
                    <div>
                        <div class="font-medium">${vehicle.marque} ${vehicle.modele}</div>
                        <div class="text-xs text-tertiary">${vehicle.immatriculation}</div>
                    </div>
                </div>
            </td>
            <td>${vehicle.annee}</td>
            <td>${vehicle.categorie}</td>
            <td>${Format.currency(vehicle.prixJour)}</td>
            <td>${getStatusBadge(vehicle.disponible ? 'disponible' : 'loue')}</td>
            <td>${getStatusBadge(vehicle.statut)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-ghost btn-xs" onclick="editVehicle('${vehicle.id}')" data-tooltip="Modifier">✏️</button>
                    <button class="btn btn-ghost btn-xs" onclick="viewVehicleDetail('${vehicle.id}')" data-tooltip="Voir">👁</button>
                    <button class="btn btn-ghost btn-xs" onclick="deleteVehicle('${vehicle.id}')" data-tooltip="Supprimer">🗑️</button>
                </div>
            </td>
        </tr>
    `;
}

// ---- Get Unique Values for Filters ----
function getVehicleFilterOptions() {
    const vehicles = AppData.vehicules.filter(v => v.statut === 'valide');
    return {
        marques: [...new Set(vehicles.map(v => v.marque))].sort(),
        categories: [...new Set(vehicles.map(v => v.categorie))].sort(),
        carburants: [...new Set(vehicles.map(v => v.carburant))].sort(),
        transmissions: [...new Set(vehicles.map(v => v.transmission))].sort(),
        villes: [...new Set(vehicles.map(v => v.ville))].sort(),
        annees: [...new Set(vehicles.map(v => v.annee))].sort((a, b) => b - a),
    };
}

// ---- Build & Apply Filters from UI ----
function applyFilters() {
    const filters = {};
    const searchInput = $('#searchInput');
    const marqueSelect = $('#filterMarque');
    const categorieSelect = $('#filterCategorie');
    const carburantSelect = $('#filterCarburant');
    const transmissionSelect = $('#filterTransmission');
    const sortSelect = $('#sortSelect');
    const prixMinInput = $('#prixMin');
    const prixMaxInput = $('#prixMax');

    if (searchInput && searchInput.value) filters.search = searchInput.value;
    if (marqueSelect && marqueSelect.value) filters.marque = marqueSelect.value;
    if (categorieSelect && categorieSelect.value) filters.categorie = categorieSelect.value;
    if (carburantSelect && carburantSelect.value) filters.carburant = carburantSelect.value;
    if (transmissionSelect && transmissionSelect.value) filters.transmission = transmissionSelect.value;
    if (sortSelect && sortSelect.value) filters.sort = sortSelect.value;
    if (prixMinInput && prixMinInput.value) filters.prixMin = parseInt(prixMinInput.value);
    if (prixMaxInput && prixMaxInput.value) filters.prixMax = parseInt(prixMaxInput.value);

    filters.disponible = true;

    const vehicles = getFilteredVehicles(filters);
    const grid = $('#vehicleGrid');
    const count = $('#vehicleCount');

    if (grid) {
        if (vehicles.length === 0) {
            grid.innerHTML = `
                <div class="empty-state col-span-full">
                    <div class="empty-state-icon">🔍</div>
                    <h3 class="empty-state-title">Aucun véhicule trouvé</h3>
                    <p class="empty-state-description">Essayez de modifier vos critères de recherche.</p>
                    <button class="btn btn-primary" onclick="resetFilters()">Réinitialiser les filtres</button>
                </div>
            `;
        } else {
            grid.innerHTML = vehicles.map(v => renderVehicleCard(v)).join('');
        }
    }

    if (count) count.textContent = `${vehicles.length} véhicule${vehicles.length > 1 ? 's' : ''} trouvé${vehicles.length > 1 ? 's' : ''}`;
}

function resetFilters() {
    $$('.filter-bar select').forEach(s => s.value = '');
    $$('.filter-bar input').forEach(i => i.value = '');
    applyFilters();
}

// ---- Populate Filter Dropdowns ----
function populateFilters() {
    const options = getVehicleFilterOptions();

    const selects = {
        '#filterMarque': options.marques,
        '#filterCategorie': options.categories,
        '#filterCarburant': options.carburants,
        '#filterTransmission': options.transmissions,
    };

    Object.entries(selects).forEach(([selector, values]) => {
        const select = $(selector);
        if (!select) return;
        const currentVal = select.value;
        const firstOption = select.querySelector('option:first-child');
        select.innerHTML = '';
        if (firstOption) select.appendChild(firstOption);
        values.forEach(v => {
            const opt = createElement('option', { value: v, textContent: v });
            select.appendChild(opt);
        });
        select.value = currentVal;
    });
}
