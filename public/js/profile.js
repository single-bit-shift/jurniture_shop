document.addEventListener('DOMContentLoaded', async () => {
    // ── 1. AUTH GUARD ──────────────────────────────────────────────
    if (!auth.isLoggedIn()) {
        window.location.href = "/login.html";
        return;
    }

    // ── 2. PROFILE HEADER ──────────────────────────────────────────
    const user = auth.getUser();
    const profileNameEl = document.getElementById("profileName");
    if (profileNameEl && user) {
        profileNameEl.textContent = user.name;
        if (user.isAdmin) {
            profileNameEl.href = "/admin.html";
        } else {
            profileNameEl.href = "/profile.html";
        }
    }

    // Admin button visibility
    const adminBtn = document.getElementById("adminBtn");
    if (isAdmin()) {
        if (adminBtn) {
            adminBtn.style.display = "inline-block";
            adminBtn.addEventListener("click", () => {
                window.location.href = "/admin.html";
            });
        }
    }

    const signOutBtn = document.getElementById("signOutBtn");
    if (signOutBtn) {
        signOutBtn.addEventListener("click", () => {
            auth.logout();
        });
    }

    // ── 3. BIND PROFILE INFO ──────────────────────────────────────
    if (user) {
        const profileFullName = document.getElementById('profileFullName');
        const profileEmail = document.getElementById('profileEmail');
        const profileRoleBadge = document.getElementById('profileRoleBadge');
        const profileMemberSince = document.getElementById('profileMemberSince');
        const avatarLetters = document.getElementById('avatarLetters');

        if (profileFullName) profileFullName.textContent = user.name;
        if (profileEmail) profileEmail.textContent = user.email;

        // Initials for avatar
        if (avatarLetters) {
            const names = user.name.split(' ');
            const initials = names.map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
            avatarLetters.textContent = initials || 'U';
        }

        if (profileRoleBadge) {
            if (user.isAdmin) {
                profileRoleBadge.textContent = 'Administrator';
                profileRoleBadge.className = 'inline-block px-2 py-0.5 border border-error text-error font-label-md text-[10px] uppercase tracking-wider mt-1';
            } else {
                profileRoleBadge.textContent = 'Customer';
                profileRoleBadge.className = 'inline-block px-2 py-0.5 border border-primary text-primary font-label-md text-[10px] uppercase tracking-wider mt-1';
            }
        }

        if (profileMemberSince) {
            // Check if user has createdAt date
            const dateStr = user.createdAt || new Date();
            const date = new Date(dateStr);
            profileMemberSince.textContent = date.toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long'
            });
        }
    }

    // ── 4. CHANGE PASSWORD FORM SUBMIT ────────────────────────────
    const form = document.getElementById('changePasswordForm');
    const errEl = document.getElementById('passwordError');
    const successEl = document.getElementById('passwordSuccess');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (errEl) errEl.classList.add('hidden');
            if (successEl) successEl.classList.add('hidden');

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                if (errEl) {
                    errEl.textContent = 'New passwords do not match.';
                    errEl.classList.remove('hidden');
                }
                return;
            }

            if (newPassword.length < 6) {
                if (errEl) {
                    errEl.textContent = 'Password must be at least 6 characters.';
                    errEl.classList.remove('hidden');
                }
                return;
            }

            const token = auth.getToken();
            if (!token) {
                alert('Session expired. Please log in.');
                window.location.href = '/login.html';
                return;
            }

            try {
                const res = await api.changePassword(currentPassword, newPassword, token);
                if (res.success) {
                    if (successEl) {
                        successEl.textContent = 'Password updated successfully!';
                        successEl.classList.remove('hidden');
                    }
                    form.reset();
                } else {
                    if (errEl) {
                        errEl.textContent = res.error || 'Failed to change password.';
                        errEl.classList.remove('hidden');
                    }
                }
            } catch (err) {
                console.error('Change password error:', err);
                if (errEl) {
                    errEl.textContent = 'An error occurred. Please try again.';
                    errEl.classList.remove('hidden');
                }
            }
        });
    }
});
