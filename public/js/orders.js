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

    // ── 3. FETCH AND RENDER ORDERS ────────────────────────────────
    const container = document.getElementById('ordersContainer');
    const token = auth.getToken();

    if (!container) return;

    try {
        const res = await api.getMyOrders(token);

        if (res.success) {
            const orders = res.data;

            if (orders.length === 0) {
                container.innerHTML = `
                    <div class="blueprint-border p-12 text-center bg-surface space-y-6">
                        <span class="material-symbols-outlined text-5xl opacity-40">local_shipping</span>
                        <h3 class="font-headline-md text-headline-md text-on-surface">You have no orders yet</h3>
                        <p class="text-on-surface-variant font-body-md max-w-sm mx-auto">Browse our collection of handcrafted wood furniture and place your first order.</p>
                        <a href="/index.html" class="inline-block bg-primary text-on-primary px-6 py-3 font-label-md uppercase tracking-wider hover:opacity-90 transition-opacity">
                            Start Shopping
                        </a>
                    </div>
                `;
                return;
            }

            container.innerHTML = orders.map(order => {
                const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });

                // Status Badge Color Map
                let badgeClass = 'border-primary text-primary';
                if (order.status === 'Pending') badgeClass = 'border-[#E65100] text-[#E65100] bg-[#FFF3E0]';
                else if (order.status === 'Confirmed') badgeClass = 'border-blue-600 text-blue-600 bg-blue-50';
                else if (order.status === 'Ready for Delivery') badgeClass = 'border-teal-600 text-teal-600 bg-teal-50';
                else if (order.status === 'Delivered') badgeClass = 'border-green-600 text-green-600 bg-green-50';
                else if (order.status === 'Cancelled') badgeClass = 'border-red-600 text-red-600 bg-red-50';

                return `
                    <div class="blueprint-border bg-surface overflow-hidden">
                        <!-- Top details -->
                        <div class="p-6 border-b border-outline-variant bg-surface-container flex flex-wrap justify-between items-center gap-4">
                            <div>
                                <span class="font-caption text-caption text-on-surface-variant uppercase tracking-wider">Order ID</span>
                                <h4 class="font-label-md text-label-md text-primary font-bold uppercase">${order.orderId}</h4>
                            </div>
                            <div>
                                <span class="font-caption text-caption text-on-surface-variant uppercase tracking-wider block">Date Placed</span>
                                <span class="font-label-md text-sm">${date}</span>
                            </div>
                            <div>
                                <span class="font-caption text-caption text-on-surface-variant uppercase tracking-wider block">Total Amount</span>
                                <span class="font-headline-md text-headline-md text-on-surface font-bold">₹${Number(order.totalAmount).toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                                <span class="inline-block px-3 py-1 border-2 ${badgeClass} font-label-md text-caption uppercase tracking-wider font-bold">
                                    ${order.status}
                                </span>
                            </div>
                        </div>

                        <!-- Items and Delivery Address -->
                        <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <!-- Items List -->
                            <div class="md:col-span-2 space-y-4">
                                <h5 class="font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/30 pb-2">Items ordered</h5>
                                <div class="space-y-3">
                                    ${order.items.map(item => `
                                        <div class="flex justify-between items-center gap-4">
                                            <div class="min-w-0">
                                                <h6 class="font-label-md text-sm truncate text-on-surface">${item.name}</h6>
                                                <p class="text-caption text-on-surface-variant">Qty: ${item.quantity} × ₹${item.price.toLocaleString('en-IN')}</p>
                                            </div>
                                            <span class="font-label-md text-sm text-primary">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Delivery Address -->
                            <div class="bg-surface-container-low p-4 space-y-2">
                                <h5 class="font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/30 pb-2">Delivery Address</h5>
                                <div class="font-body-md text-xs space-y-1 text-on-surface-variant">
                                    <p class="font-bold text-on-surface">${order.deliveryAddress.fullName}</p>
                                    <p>${order.deliveryAddress.address}</p>
                                    <p>${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}</p>
                                    <p class="pt-2">Phone: ${order.deliveryAddress.phone}</p>
                                </div>
                            </div>
                        </div>

                        ${['Confirmed', 'Ready for Delivery', 'Delivered'].includes(order.status) ? `
                        <!-- Invoice Download -->
                        <div class="px-6 pb-4 pt-0 border-t border-outline-variant/30 flex justify-end">
                            <button onclick="downloadInvoice('${order._id}')" class="flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary hover:bg-primary hover:text-on-primary transition-colors font-label-md text-caption uppercase tracking-wider">
                                <span class="material-symbols-outlined text-sm">receipt_long</span>
                                Download Invoice
                            </button>
                        </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `<div class="text-center text-error p-8">Failed to load orders. Please try again.</div>`;
        }
    } catch (err) {
        console.error('Failed to load orders:', err);
        container.innerHTML = `<div class="text-center text-error p-8">An error occurred while loading orders.</div>`;
    }

    // ── INVOICE DOWNLOAD ─────────────────────────────────────────
    window.downloadInvoice = async (orderId) => {
        const token = auth.getToken();
        if (!token) {
            alert('Session expired. Please log in.');
            window.location.href = '/login.html';
            return;
        }
        try {
            const res = await fetch(api.getInvoiceUrl(orderId), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                alert('Failed to download invoice.');
                return;
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            console.error('Invoice download error:', err);
            alert('An error occurred while downloading the invoice.');
        }
    };
});
