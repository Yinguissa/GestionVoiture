/**
 * ============================================
 * AutoLoc Pro - Interactive Calendar Module
 * Availability calendar for vehicle management
 * ============================================
 */

class Calendar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = options.events || [];
        this.onDateClick = options.onDateClick || null;
        this.onMonthChange = options.onMonthChange || null;
        this.vehicleId = options.vehicleId || null;
        this.mode = options.mode || 'month'; // month, week

        this.dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        this.monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];

        this.render();
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        this.container.innerHTML = `
            <div class="calendar">
                <div class="calendar-header">
                    <button class="btn btn-ghost btn-sm" onclick="calendar.prevMonth()">◀</button>
                    <h3 class="calendar-title">${this.monthNames[month]} ${year}</h3>
                    <button class="btn btn-ghost btn-sm" onclick="calendar.nextMonth()">▶</button>
                </div>
                <div class="calendar-grid">
                    ${this.dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
                    ${this.renderDays(year, month)}
                </div>
            </div>
            <div id="calendar-legend" class="flex gap-4 mt-4" style="padding:0 var(--space-4);">
                <div class="flex items-center gap-2 text-xs">
                    <div style="width:12px;height:12px;border-radius:3px;background:var(--success-100);"></div>
                    Disponible
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <div style="width:12px;height:12px;border-radius:3px;background:var(--primary-100);"></div>
                    Réservé
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <div style="width:12px;height:12px;border-radius:3px;background:var(--error-100);"></div>
                    Bloqué
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <div style="width:12px;height:12px;border-radius:3px;background:var(--warning-100);"></div>
                    Maintenance
                </div>
            </div>
        `;
    }

    renderDays(year, month) {
        const firstDay = new Date(year, month, 1);
        let startDay = firstDay.getDay() - 1;
        if (startDay < 0) startDay = 6;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const today = new Date();

        let html = '';
        let dayCount = 0;

        // Previous month days
        for (let i = startDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            html += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
            dayCount++;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const isSelected = this.selectedDate === dateStr;
            const dayEvents = this.getEventsForDate(dateStr);

            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';

            html += `
                <div class="${classes}" onclick="calendar.selectDate('${dateStr}')" data-date="${dateStr}">
                    <span class="day-number">${day}</span>
                    ${dayEvents.map(e => `<div class="calendar-event ${e.type}">${e.label}</div>`).join('')}
                </div>
            `;
            dayCount++;
        }

        // Next month days
        const remaining = 42 - dayCount;
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="calendar-day other-month"><span class="day-number">${i}</span></div>`;
        }

        return html;
    }

    getEventsForDate(dateStr) {
        return this.events.filter(e => {
            if (e.date === dateStr) return true;
            if (e.startDate && e.endDate) {
                return dateStr >= e.startDate && dateStr <= e.endDate;
            }
            return false;
        });
    }

    selectDate(dateStr) {
        this.selectedDate = dateStr;
        this.render();
        if (this.onDateClick) this.onDateClick(dateStr);
    }

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
        if (this.onMonthChange) this.onMonthChange(this.currentDate);
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
        if (this.onMonthChange) this.onMonthChange(this.currentDate);
    }

    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    addEvent(event) {
        this.events.push(event);
        this.render();
    }

    removeEvent(eventId) {
        this.events = this.events.filter(e => e.id !== eventId);
        this.render();
    }

    setEvents(events) {
        this.events = events;
        this.render();
    }
}

// ---- Global calendar instance ----
let calendar = null;

// ---- Init Calendar for Availability Page ----
function initAvailabilityCalendar(vehicleId) {
    // Build events from locations
    const events = [];
    const vehicleLocations = AppData.locations.filter(l => l.vehiculeId === vehicleId);

    vehicleLocations.forEach(loc => {
        events.push({
            id: loc.id,
            startDate: loc.dateDebut,
            endDate: loc.dateFin,
            type: loc.statut === 'en_cours' ? 'rental' : loc.statut === 'annule' ? 'blocked' : 'rental',
            label: loc.statut === 'en_cours' ? 'Loué' : 'Réservé'
        });
    });

    // Add some sample blocked/maintenance dates
    events.push(
        { id: 'maint1', date: '2026-03-15', type: 'maintenance', label: 'Entretien' },
        { id: 'block1', startDate: '2026-03-20', endDate: '2026-03-22', type: 'blocked', label: 'Bloqué' }
    );

    calendar = new Calendar('calendarContainer', {
        vehicleId,
        events,
        onDateClick: (date) => {
            const dateDisplay = $('#selectedDate');
            if (dateDisplay) dateDisplay.textContent = Format.date(date);

            const dayEvents = calendar.getEventsForDate(date);
            const eventsList = $('#dateEvents');
            if (eventsList) {
                if (dayEvents.length === 0) {
                    eventsList.innerHTML = `
                        <div class="text-sm text-success" style="padding:var(--space-3);">
                            ✅ Cette date est disponible
                        </div>
                        <div style="padding:var(--space-3);">
                            <button class="btn btn-outline-danger btn-sm" onclick="blockDate('${date}')">🚫 Bloquer cette date</button>
                        </div>
                    `;
                } else {
                    eventsList.innerHTML = dayEvents.map(e => `
                        <div class="flex items-center justify-between" style="padding:var(--space-3); border-bottom:1px solid var(--border-light);">
                            <div class="flex items-center gap-2">
                                <div class="calendar-event ${e.type}" style="margin:0;">${e.label}</div>
                            </div>
                            ${e.type !== 'rental' ? `<button class="btn btn-ghost btn-xs" onclick="calendar.removeEvent('${e.id}')">✕</button>` : ''}
                        </div>
                    `).join('');
                }
            }
        }
    });
}

function blockDate(date) {
    if (!calendar) return;
    calendar.addEvent({
        id: generateId(),
        date: date,
        type: 'blocked',
        label: 'Bloqué'
    });
    Toast.info('Date bloquée', `Le ${Format.date(date)} a été bloqué.`);
}

// ---- Init Calendar for Vehicle Detail Page ----
function initDetailCalendar(vehicleId) {
    const events = [];
    const vehicleLocations = AppData.locations.filter(l => l.vehiculeId === vehicleId);

    vehicleLocations.forEach(loc => {
        events.push({
            id: loc.id,
            startDate: loc.dateDebut,
            endDate: loc.dateFin,
            type: 'rental',
            label: 'Réservé'
        });
    });

    calendar = new Calendar('vehicleCalendar', {
        vehicleId,
        events,
        onDateClick: (date) => {
            const startInput = $('#dateDebut');
            const endInput = $('#dateFin');
            if (startInput && !startInput.value) {
                startInput.value = date;
            } else if (endInput && !endInput.value) {
                endInput.value = date;
                updatePriceCalculation();
            }
        }
    });
}

function updatePriceCalculation() {
    const startDate = $('#dateDebut')?.value;
    const endDate = $('#dateFin')?.value;
    const vehicleId = new URLSearchParams(window.location.search).get('id');

    if (!startDate || !endDate || !vehicleId) return;

    const vehicle = AppData.vehicules.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const calc = calculateRentalPrice(vehicle, startDate, endDate);
    const priceDisplay = $('#priceCalculation');
    if (priceDisplay) {
        priceDisplay.innerHTML = `
            <div class="flex justify-between text-sm mb-2">
                <span>${calc.days} jour(s) × ${Format.currency(calc.perDay)}</span>
            </div>
            <div class="flex justify-between font-bold text-lg" style="border-top:1px solid var(--border-color); padding-top:var(--space-3);">
                <span>Total</span>
                <span style="color:var(--primary-600);">${Format.currency(calc.total)}</span>
            </div>
        `;
    }
}
