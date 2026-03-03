/**
 * ============================================
 * AutoLoc Pro - Authentication Module
 * Login with OTP, Register, Password Reset
 * OTP is simulated for all roles
 * ============================================
 */

// ---- Registration ----
function handleRegistration(e) {
    e.preventDefault();
    const form = e.target;
    Validator.clearErrors(form);

    const nom = form.querySelector('#nom').value.trim();
    const prenom = form.querySelector('#prenom').value.trim();
    const email = form.querySelector('#email').value.trim();
    const telephone = form.querySelector('#telephone').value.trim();
    const password = form.querySelector('#password').value;
    const confirmPassword = form.querySelector('#confirmPassword').value;
    const role = form.querySelector('#role') ? form.querySelector('#role').value : 'client';
    const terms = form.querySelector('#terms');

    let hasError = false;

    if (!nom) { Validator.showError(form.querySelector('#nom'), 'Le nom est obligatoire'); hasError = true; }
    if (!prenom) { Validator.showError(form.querySelector('#prenom'), 'Le prénom est obligatoire'); hasError = true; }
    if (!Validator.rules.email(email)) { Validator.showError(form.querySelector('#email'), 'Email invalide'); hasError = true; }
    if (!Validator.rules.phone(telephone)) { Validator.showError(form.querySelector('#telephone'), 'Téléphone invalide'); hasError = true; }
    if (!Validator.rules.password(password)) { Validator.showError(form.querySelector('#password'), 'Min. 8 caractères, une majuscule et un chiffre'); hasError = true; }
    if (password !== confirmPassword) { Validator.showError(form.querySelector('#confirmPassword'), 'Les mots de passe ne correspondent pas'); hasError = true; }
    if (terms && !terms.checked) { Toast.warning('Conditions', 'Veuillez accepter les conditions d\'utilisation'); hasError = true; }

    // Check existing email
    const existing = AppData.users.find(u => u.email === email);
    if (existing) { Validator.showError(form.querySelector('#email'), 'Cet email est déjà utilisé'); hasError = true; }

    if (hasError) return;

    // Show loading state
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.classList.add('btn-loading');
    btn.innerHTML = 'Inscription en cours...';

    setTimeout(() => {
        const newUser = {
            id: generateId(),
            nom, prenom, email, telephone, password, role,
            statut: 'actif',
            kyc: 'non_soumis',
            dateInscription: new Date().toISOString().split('T')[0],
            avatar: '',
            ville: '',
            adresse: ''
        };

        if (role === 'proprietaire' || role === 'agence') {
            newUser.nomAgence = form.querySelector('#nomAgence') ? form.querySelector('#nomAgence').value : '';
        }

        AppData.users.push(newUser);
        saveData();

        // Store email for OTP page
        const otpCode = generateOTP();
        Storage.set('pendingOTP', { email, otp: otpCode, type: 'registration' });

        Toast.success('Inscription réussie !', `Un code de vérification a été envoyé. Code OTP: ${otpCode}`);
        btn.classList.remove('btn-loading');
        btn.innerHTML = originalText;

        setTimeout(() => {
            window.location.href = 'otp.html';
        }, 1500);
    }, 2000);
}

// ---- Login (Step 1: email + password → go to OTP) ----
function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    Validator.clearErrors(form);

    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const remember = form.querySelector('#remember');

    let hasError = false;

    if (!email) { Validator.showError(form.querySelector('#email'), 'L\'email est obligatoire'); hasError = true; }
    if (!password) { Validator.showError(form.querySelector('#password'), 'Le mot de passe est obligatoire'); hasError = true; }

    if (hasError) return;

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.classList.add('btn-loading');
    btn.innerHTML = 'Vérification...';

    setTimeout(() => {
        const user = AppData.users.find(u => u.email === email && u.password === password);

        if (!user) {
            btn.classList.remove('btn-loading');
            btn.innerHTML = originalText;
            Toast.error('Échec', 'Email ou mot de passe incorrect');
            return;
        }

        if (user.statut === 'suspendu') {
            btn.classList.remove('btn-loading');
            btn.innerHTML = originalText;
            Toast.error('Compte suspendu', 'Votre compte a été suspendu. Contactez le support.');
            return;
        }

        // Generate or use predefined OTP
        const otpCode = getOTPForEmail(email);
        Storage.set('pendingOTP', {
            email,
            otp: otpCode,
            type: 'login',
            userId: user.id
        });

        btn.classList.remove('btn-loading');
        btn.innerHTML = originalText;

        Toast.info('Code OTP envoyé', `Un code de vérification a été envoyé à ${email}. Code: ${otpCode}`);

        setTimeout(() => {
            window.location.href = 'otp.html';
        }, 1500);
    }, 1500);
}

// ---- OTP Verification ----
function handleOTP(e) {
    e.preventDefault();
    const form = e.target;
    const inputs = form.querySelectorAll('.otp-input');
    const otp = Array.from(inputs).map(i => i.value).join('');
    const pending = Storage.get('pendingOTP');

    if (otp.length !== 6) {
        Toast.warning('Code incomplet', 'Veuillez saisir les 6 chiffres');
        return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.classList.add('btn-loading');
    btn.innerHTML = 'Vérification...';

    setTimeout(() => {
        // Verify OTP code
        if (pending && otp !== pending.otp) {
            btn.classList.remove('btn-loading');
            btn.innerHTML = 'Vérifier';
            Toast.error('Code invalide', 'Le code OTP saisi est incorrect. Veuillez réessayer.');
            // Clear inputs
            inputs.forEach(i => i.value = '');
            inputs[0].focus();
            return;
        }

        if (pending && pending.type === 'login') {
            // Complete login
            const user = AppData.users.find(u => u.id === pending.userId);
            if (user) {
                AppData.currentUser = user;
                Storage.set('currentUser', user);

                // Log audit
                AppData.auditLog.unshift({
                    id: generateId(),
                    action: 'Connexion',
                    utilisateur: user.email,
                    details: `Connexion réussie (OTP vérifié) - Rôle: ${getRoleLabel(user.role)}`,
                    date: new Date().toISOString(),
                    ip: '192.168.1.' + Math.floor(Math.random() * 255)
                });
                saveData();

                Toast.success('Bienvenue !', `Bonjour ${user.prenom} ${user.nom}`);
                Storage.remove('pendingOTP');

                btn.classList.remove('btn-loading');

                setTimeout(() => {
                    window.location.href = getDashboardPath(user.role);
                }, 1000);
            }
        } else {
            // Registration OTP verification
            Toast.success('Vérifié !', 'Votre compte a été activé avec succès.');
            Storage.remove('pendingOTP');

            btn.classList.remove('btn-loading');
            btn.innerHTML = 'Connexion';

            setTimeout(() => {
                window.location.href = 'connexion.html';
            }, 1500);
        }
    }, 2000);
}

// ---- OTP Input Auto-Focus ----
function initOTPInputs() {
    const inputs = $$('.otp-input');
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            text.split('').forEach((char, i) => {
                if (inputs[i]) inputs[i].value = char;
            });
            if (inputs[text.length - 1]) inputs[text.length - 1].focus();
        });
    });

    // Display OTP hint
    const pending = Storage.get('pendingOTP');
    const hintEl = $('#otpHint');
    if (pending && hintEl) {
        hintEl.innerHTML = `
            <div class="alert alert-info" style="margin-top: var(--space-4);">
                <span class="alert-icon"><i class="ph ph-info"></i></span>
                <div>
                    <strong>Mode démo</strong> — Code OTP: <strong>${pending.otp}</strong>
                    <br><small>Email: ${pending.email}</small>
                </div>
            </div>
        `;
    }
}

// ---- Password Reset ----
function handleForgotPassword(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('#email').value.trim();

    if (!Validator.rules.email(email)) {
        Validator.showError(form.querySelector('#email'), 'Email invalide');
        return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.classList.add('btn-loading');
    btn.innerHTML = 'Envoi en cours...';

    setTimeout(() => {
        Storage.set('resetEmail', email);
        Toast.success('Email envoyé !', 'Un lien de réinitialisation a été envoyé.');
        btn.classList.remove('btn-loading');
        btn.innerHTML = 'Envoyer le lien';

        setTimeout(() => {
            window.location.href = 'reinitialisation.html';
        }, 1500);
    }, 2000);
}

// ---- Reset Password ----
function handleResetPassword(e) {
    e.preventDefault();
    const form = e.target;
    Validator.clearErrors(form);

    const password = form.querySelector('#password').value;
    const confirmPassword = form.querySelector('#confirmPassword').value;

    if (!Validator.rules.password(password)) {
        Validator.showError(form.querySelector('#password'), 'Min. 8 caractères, une majuscule et un chiffre');
        return;
    }

    if (password !== confirmPassword) {
        Validator.showError(form.querySelector('#confirmPassword'), 'Les mots de passe ne correspondent pas');
        return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.classList.add('btn-loading');

    setTimeout(() => {
        const email = Storage.get('resetEmail');
        const user = AppData.users.find(u => u.email === email);
        if (user) {
            user.password = password;
            saveData();
        }

        Storage.remove('resetEmail');
        Toast.success('Mot de passe modifié !', 'Vous pouvez vous connecter avec votre nouveau mot de passe.');
        btn.classList.remove('btn-loading');

        setTimeout(() => {
            window.location.href = 'connexion.html';
        }, 1500);
    }, 2000);
}

// ---- Toggle Password Visibility ----
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const btn = input.parentElement.querySelector('.input-action');
    if (input.type === 'password') {
        input.type = 'text';
        if (btn) btn.innerHTML = '<i class="ph ph-eye-slash"></i>';
    } else {
        input.type = 'password';
        if (btn) btn.innerHTML = '<i class="ph ph-eye"></i>';
    }
}

// ---- Resend OTP ----
function resendOTP() {
    const pending = Storage.get('pendingOTP');
    if (pending) {
        // Keep the same OTP for demo purposes
        Toast.info('Code renvoyé', `Un nouveau code de vérification a été envoyé. Code: ${pending.otp}`);
    } else {
        Toast.warning('Erreur', 'Aucune demande OTP en cours. Retournez à la page de connexion.');
    }
}
