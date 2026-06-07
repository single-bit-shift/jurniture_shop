document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const submitBtn = document.querySelector('button[type="submit"]');
    const tabs = document.querySelectorAll('button.flex-1');
    const customerTab = tabs[0];
    const adminTab = tabs[1];

    let currentMode = 'customer'; // 'customer', 'admin', 'register'

    // Add passkey input for admin
    const passkeyDiv = document.createElement('div');
    passkeyDiv.className = 'group hidden';
    passkeyDiv.innerHTML = `
        <label class="block font-label-md text-label-md text-on-surface mb-2 uppercase tracking-wider mt-4">Admin Passkey</label>
        <input id="passkeyInput" class="w-full bg-surface border-border-width border-outline-variant px-4 py-3 font-body-md focus:outline-none focus:border-primary transition-colors text-on-surface placeholder:text-outline-variant" placeholder="••••••••" type="password">
    `;
    passwordInput.parentElement.after(passkeyDiv);
    const passkeyInput = document.getElementById('passkeyInput');

    // Add name input for register
    const nameDiv = document.createElement('div');
    nameDiv.className = 'group hidden';
    nameDiv.innerHTML = `
        <label class="block font-label-md text-label-md text-on-surface mb-2 uppercase tracking-wider mb-4">Full Name</label>
        <input id="nameInput" class="w-full bg-surface border-border-width border-outline-variant px-4 py-3 font-body-md focus:outline-none focus:border-primary transition-colors text-on-surface placeholder:text-outline-variant" placeholder="John Doe" type="text">
    `;
    emailInput.parentElement.before(nameDiv);
    const nameInput = document.getElementById('nameInput');

    // Register toggle
    const resetLink = document.querySelector('a[href="#"]');
    if (resetLink) {
        resetLink.textContent = "Create Account";
        resetLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentMode === 'customer') {
                currentMode = 'register';
                nameDiv.classList.remove('hidden');
                submitBtn.textContent = 'Register Account';
                resetLink.textContent = 'Back to Login';
            } else {
                currentMode = 'customer';
                nameDiv.classList.add('hidden');
                submitBtn.textContent = 'Sign In to Workshop';
                resetLink.textContent = 'Create Account';
            }
        });
    }

    if (customerTab && adminTab) {
        customerTab.addEventListener('click', () => {
            currentMode = 'customer';
            customerTab.classList.remove('text-on-surface-variant', 'hover:bg-surface-variant');
            customerTab.classList.add('bg-primary', 'text-on-primary');
            adminTab.classList.remove('bg-primary', 'text-on-primary');
            adminTab.classList.add('text-on-surface-variant', 'hover:bg-surface-variant');

            passkeyDiv.classList.add('hidden');
            nameDiv.classList.add('hidden');
            submitBtn.textContent = 'Sign In to Workshop';
            if (resetLink) resetLink.classList.remove('hidden');
        });

        adminTab.addEventListener('click', () => {
            currentMode = 'admin';
            adminTab.classList.remove('text-on-surface-variant', 'hover:bg-surface-variant');
            adminTab.classList.add('bg-primary', 'text-on-primary');
            customerTab.classList.remove('bg-primary', 'text-on-primary');
            customerTab.classList.add('text-on-surface-variant', 'hover:bg-surface-variant');

            passkeyDiv.classList.remove('hidden');
            nameDiv.classList.add('hidden');
            submitBtn.textContent = 'Admin Sign In';
            if (resetLink) resetLink.classList.add('hidden');
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;

            try {
                let res;
                if (currentMode === 'customer') {
                    res = await api.login(email, password);
                } else if (currentMode === 'admin') {
                    const passkey = passkeyInput.value;
                    res = await api.adminLogin(email, password, passkey);
                } else if (currentMode === 'register') {
                    const name = nameInput.value;
                    res = await api.register(name, email, password);
                }

                if (res.success) {
                    auth.setToken(res.token);
                    auth.setUser(res.user);
                    console.log(res.user);
                    if (res.user.isAdmin) {
                        window.location.href = '/admin.html';
                    } else {
                        window.location.href = '/index.html';
                    }
                } else {
                    alert(res.error || 'Authentication failed');
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred');
            }
        });
    }
});
