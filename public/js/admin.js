document.addEventListener('DOMContentLoaded', async () => {
    // ── ADMIN PAGE GUARD ─────────────────────────────────────────────
    // Prevent normal users or unauthenticated users from accessing /admin.html directly via URL
    if (!isLoggedIn() || !isAdmin()) {
        window.location.href = "/index.html";
        return;
    }

    // ── BACK TO SHOP ─────────────────────────────────────────────────
    // Clicking "Back to Shop" ends the admin session entirely and returns to login.
    // Admin login requires a passkey (via login.js /admin-login route), so we fully
    // sign out rather than just navigating — forcing re-authentication on next visit.
    const backToShopBtn = document.getElementById("backToShopBtn");
    if (backToShopBtn) {
        backToShopBtn.addEventListener("click", () => {
            signOut();                              // clears JWT + user from localStorage
            window.location.href = "/index.html";  // redirect to homepage (auth guard will push to login.html if needed)
        });
    }

    // Set user info
    const user = auth.getUser();
    const adminLabel = document.querySelector('header span.text-primary-container');
    if (adminLabel && user) adminLabel.textContent = `ADMIN_ID: ${user.email}`;

    // ── TAB SWITCHING SYSTEM ─────────────────────────────────────────
    const tabs = {
        dashboard: { tabEl: document.getElementById('tabDashboard'), viewEl: document.getElementById('viewDashboard') },
        products: { tabEl: document.getElementById('tabProducts'), viewEl: document.getElementById('viewProducts') },
        orders: { tabEl: document.getElementById('tabOrders'), viewEl: document.getElementById('viewOrders') },
        categories: { tabEl: document.getElementById('tabCategories'), viewEl: document.getElementById('viewCategories') }
    };

    let activeTabKey = 'dashboard';

    function switchTab(targetTabKey) {
        Object.keys(tabs).forEach(key => {
            const { tabEl, viewEl } = tabs[key];
            if (!tabEl || !viewEl) return;

            if (key === targetTabKey) {
                // Active State styles
                tabEl.className = "flex items-center gap-3 px-4 py-3 bg-primary text-on-primary font-bold transition-colors duration-200 cursor-pointer";
                viewEl.classList.remove('hidden');
            } else {
                // Inactive State styles
                tabEl.className = "flex items-center gap-3 px-4 py-3 text-on-primary-fixed-variant hover:bg-surface-variant hover:text-on-surface-variant transition-colors duration-200 cursor-pointer";
                viewEl.classList.add('hidden');
            }
        });
        activeTabKey = targetTabKey;

        // Perform specific loads depending on the selected tab
        if (targetTabKey === 'orders') {
            loadAdminOrders();
        } else if (targetTabKey === 'categories') {
            loadCategories();
        }
    }

    // Bind tab clicks
    Object.keys(tabs).forEach(key => {
        const { tabEl } = tabs[key];
        if (tabEl) {
            tabEl.addEventListener('click', () => switchTab(key));
        }
    });

    // ── STATE ────────────────────────────────────────────────────────
    let currentProducts = [];
    let editingProductId = null;
    let productSearchText = "";
    let currentProductPage = 1;
    const productsPerPage = 10;

    let allOrders = [];
    let currentOrderStatusFilter = "";
    let orderSearchText = "";

    const form = document.querySelector("#productForm");

    // ── PRODUCTS & PAGINATION SYSTEM ──────────────────────────────────
    const loadProducts = async () => {
        const res = await api.getProducts();
        if (res.success) {
            currentProducts = res.data;
            
            // ── Update Dashboard Stats (if loaded) ──────────────────────
            const total = res.data.length;
            const inStock = res.data.filter(p => p.stock === 'In Stock').length;
            const outOfStock = res.data.filter(p => p.stock === 'Out of Stock').length;

            const statTotal = document.getElementById('stat-total');
            const statInStock = document.getElementById('stat-instock');
            const statInStockLabel = document.getElementById('stat-instock-label');
            const statOutOfStock = document.getElementById('stat-outofstock');
            const statOutOfStockLabel = document.getElementById('stat-outofstock-label');

            if (statTotal) statTotal.textContent = total;
            if (statInStock) statInStock.textContent = inStock;
            if (statInStockLabel) statInStockLabel.textContent = `${total > 0 ? Math.round((inStock/total)*100) : 0}% of total inventory`;
            if (statOutOfStock) statOutOfStock.textContent = outOfStock;
            if (statOutOfStockLabel) statOutOfStockLabel.textContent = outOfStock === 0 ? 'All items available' : `${outOfStock} item(s) need restocking`;

            // ── Render Category Breakdown Table on Dashboard ────────────
            const categoryTbody = document.getElementById('category-tbody');
            if (categoryTbody) {
                const categories = await api.getCategories();
                if (categories.success) {
                    categoryTbody.innerHTML = '';
                    categories.data.forEach(cat => {
                        const productsInCat = res.data.filter(p => p.category === cat.name);
                        const count = productsInCat.length;
                        const value = productsInCat.reduce((sum, p) => sum + Number(p.price || 0), 0);
                        
                        let statusText = 'OPTIMAL';
                        let statusClass = 'text-primary';
                        if (count === 0) {
                            statusText = 'OUT OF STOCK';
                            statusClass = 'text-error';
                        } else if (count < 3) {
                            statusText = 'LOW STOCK';
                            statusClass = 'text-[#E65100]';
                        }
                        
                        categoryTbody.innerHTML += `
                        <tr class="hover:bg-surface-container transition-colors">
                            <td class="p-4 border-b border-outline-variant font-label-md">${cat.name}</td>
                            <td class="p-4 border-b border-outline-variant">${count} units</td>
                            <td class="p-4 border-b border-outline-variant">₹${value.toLocaleString('en-IN')}</td>
                            <td class="p-4 border-b border-outline-variant font-bold ${statusClass}">${statusText}</td>
                        </tr>`;
                    });
                }
            }

            // ── Render Paginated Product table ────────────────────────
            renderProductsTable();
        }
    };

    function renderProductsTable() {
        const productsTbody = document.getElementById('products-tbody');
        if (!productsTbody) return;

        // Apply Search Filter
        const query = productSearchText.toLowerCase();
        const filtered = currentProducts.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.category.toLowerCase().includes(query)
        );

        // Apply Pagination
        const totalProducts = filtered.length;
        const totalPages = Math.ceil(totalProducts / productsPerPage) || 1;
        if (currentProductPage > totalPages) currentProductPage = totalPages;

        const startIdx = (currentProductPage - 1) * productsPerPage;
        const endIdx = startIdx + productsPerPage;
        const pageProducts = filtered.slice(startIdx, endIdx);

        productsTbody.innerHTML = '';
        if (pageProducts.length === 0) {
            productsTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-8 text-center text-on-surface-variant font-body-md">No products found.</td>
                </tr>
            `;
        } else {
            pageProducts.forEach(p => {
                productsTbody.innerHTML += `
                <tr class="border-b border-outline-variant hover:bg-surface-variant transition-colors group">
                    <td class="p-4 font-label-md text-label-md text-on-surface uppercase">${p._id.substring(0, 8)}</td>
                    <td class="p-4">
                        <div class="flex items-center gap-4">
                            <img src="${p.image || 'https://via.placeholder.com/40x40?text=IMG'}" class="w-10 h-10 object-cover border border-outline-variant" alt="${p.name}">
                            <span class="font-label-md text-label-md text-primary font-bold">${p.name}</span>
                        </div>
                    </td>
                    <td class="p-4 font-body-md text-on-surface-variant">${p.category}</td>
                    <td class="p-4 font-label-md text-label-md">₹${Number(p.price || 0).toLocaleString('en-IN')}</td>
                    <td class="p-4">
                        <span class="inline-block px-2 py-1 border border-outline-variant ${p.stock === 'In Stock' ? 'border-primary text-primary' : 'border-error text-error'} font-label-md text-[10px] uppercase tracking-wider">${p.stock}</span>
                    </td>
                    <td class="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="editProduct('${p._id}')" class="text-primary hover:text-primary-container mr-2"><span class="material-symbols-outlined text-sm">edit</span></button>
                        <button onclick="deleteProduct('${p._id}')" class="text-error hover:text-error-container mr-2"><span class="material-symbols-outlined text-sm">delete</span></button>
                    </td>
                </tr>`;
            });
        }

        // Update Pagination Controls
        const paginationInfo = document.getElementById('productPaginationInfo');
        if (paginationInfo) {
            if (totalProducts === 0) {
                paginationInfo.textContent = 'Showing 0 products';
            } else {
                paginationInfo.textContent = `Showing ${startIdx + 1}–${Math.min(endIdx, totalProducts)} of ${totalProducts} products`;
            }
        }

        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        if (prevBtn) prevBtn.disabled = currentProductPage === 1;
        if (nextBtn) nextBtn.disabled = currentProductPage === totalPages;
    }

    // Pagination Click Listeners
    const prevBtn = document.getElementById('prevPageBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentProductPage > 1) {
                currentProductPage--;
                renderProductsTable();
            }
        });
    }

    const nextBtn = document.getElementById('nextPageBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentProductPage++;
            renderProductsTable();
        });
    }

    // Search Input Listener
    const productSearchInput = document.getElementById('productSearchInput');
    if (productSearchInput) {
        productSearchInput.addEventListener('input', (e) => {
            productSearchText = e.target.value.trim();
            currentProductPage = 1;
            renderProductsTable();
        });
    }

    window.deleteProduct = async (id) => {
        if (confirm('Are you sure you want to delete this product?')) {
            await api.deleteProduct(id, auth.getToken());
            loadProducts();
        }
    };

    window.editProduct = (id) => {
        const product = currentProducts.find(p => p._id === id);
        if (!product) return;

        editingProductId = id;

        // Scroll to form
        const formEl = document.getElementById('productForm');
        if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });

        // Update form title
        const formTitle = document.getElementById('formTitle');
        if (formTitle) formTitle.textContent = `Edit Product: ${product.name}`;

        // Populate fields
        form.name.value = product.name || '';
        form.category.value = product.category || '';
        form.price.value = product.price || '';
        form.material.value = product.material || '';
        form.dimensions.value = product.dimensions || '';
        form.stock.value = product.stock || 'In Stock';
        form.description.value = product.description || '';
        form.imageUrl.value = product.image || '';
    };

    const resetForm = () => {
        editingProductId = null;
        if (form) form.reset();
        const formTitle = document.getElementById('formTitle');
        if (formTitle) formTitle.textContent = 'New Product Entry';
    };

    // ── ORDERS MANAGEMENT SYSTEM ─────────────────────────────────────
    const loadAdminOrders = async () => {
        const token = auth.getToken();
        const res = await api.getAdminOrders(token);
        if (res.success) {
            allOrders = res.data;
            renderOrdersTable();
        }
    };

    function renderOrdersTable() {
        const tbody = document.getElementById('orders-tbody');
        if (!tbody) return;

        // Filter client-side
        const query = orderSearchText.toLowerCase();
        const filtered = allOrders.filter(o => {
            const matchesStatus = !currentOrderStatusFilter || o.status === currentOrderStatusFilter;
            const matchesQuery = !query || 
                o.orderId.toLowerCase().includes(query) || 
                (o.userId && o.userId.name.toLowerCase().includes(query)) ||
                o.deliveryAddress.fullName.toLowerCase().includes(query);
            return matchesStatus && matchesQuery;
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-8 text-center text-on-surface-variant font-body-md">No orders found.</td>
                </tr>
            `;
            return;
        }

        filtered.forEach(o => {
            const date = new Date(o.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            const itemsText = o.items.map(i => `${i.name} (${i.quantity})`).join(', ');
            const customerName = o.userId ? `${o.userId.name} (${o.userId.email})` : o.deliveryAddress.fullName;

            // Status Badge styling class
            let badgeClass = 'border-primary text-primary';
            if (o.status === 'Pending') badgeClass = 'border-[#E65100] text-[#E65100]';
            else if (o.status === 'Confirmed') badgeClass = 'border-blue-600 text-blue-600';
            else if (o.status === 'Ready for Delivery') badgeClass = 'border-teal-600 text-teal-600';
            else if (o.status === 'Delivered') badgeClass = 'border-green-600 text-green-600';
            else if (o.status === 'Cancelled') badgeClass = 'border-red-600 text-red-600';

            tbody.innerHTML += `
                <tr class="border-b border-outline-variant hover:bg-surface-variant transition-colors">
                    <td class="p-4 font-label-md text-label-md text-primary font-bold uppercase">${o.orderId}</td>
                    <td class="p-4 font-body-md text-on-surface">
                        <div class="font-bold">${o.deliveryAddress.fullName}</div>
                        <div class="text-xs text-on-surface-variant">${o.deliveryAddress.phone}</div>
                        <div class="text-xs text-on-surface-variant">${o.deliveryAddress.address}, ${o.deliveryAddress.city}</div>
                    </td>
                    <td class="p-4 text-xs font-body-md text-on-surface-variant max-w-xs truncate" title="${itemsText}">${itemsText}</td>
                    <td class="p-4 font-label-md text-label-md font-bold">₹${o.totalAmount.toLocaleString('en-IN')}</td>
                    <td class="p-4 text-sm font-body-md">${date}</td>
                    <td class="p-4">
                        <select onchange="updateOrderStatus('${o._id}', this.value)" class="bg-surface border-2 border-outline-variant font-label-md text-xs uppercase px-2 py-1 ${badgeClass}">
                            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="Ready for Delivery" ${o.status === 'Ready for Delivery' ? 'selected' : ''}>Ready for Delivery</option>
                            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td class="p-4">
                        <button onclick="adminDownloadInvoice('${o._id}')" class="text-primary hover:text-on-primary hover:bg-primary p-1.5 border border-outline-variant transition-colors" title="Download Invoice">
                            <span class="material-symbols-outlined text-sm">receipt_long</span>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    window.updateOrderStatus = async (id, status) => {
        const token = auth.getToken();
        const res = await api.updateOrderStatus(id, status, token);
        if (res.success) {
            loadAdminOrders();
            pollPendingOrders(); // Update badge count immediately
        } else {
            alert(res.error || 'Failed to update order status.');
        }
    };

    // Orders Filter tabs click
    const filterContainer = document.getElementById('orderStatusFilters');
    if (filterContainer) {
        filterContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-status]');
            if (!btn) return;

            // Toggle active classes
            filterContainer.querySelectorAll('button').forEach(b => {
                b.className = "px-4 py-2 text-on-surface-variant hover:bg-surface-variant transition-colors font-label-md text-label-md uppercase";
            });
            btn.className = "px-4 py-2 bg-primary text-on-primary font-label-md text-label-md uppercase";

            currentOrderStatusFilter = btn.dataset.status;
            renderOrdersTable();
        });
    }

    // Orders Search input listener
    const orderSearchInput = document.getElementById('orderSearchInput');
    if (orderSearchInput) {
        orderSearchInput.addEventListener('input', (e) => {
            orderSearchText = e.target.value.trim();
            renderOrdersTable();
        });
    }

    // ── Real-Time Order Badge Count Polling ──────────────────────────
    async function pollPendingOrders() {
        const token = auth.getToken();
        if (!token) return;
        try {
            const res = await api.getAdminOrders(token, 'Pending');
            const pendingBadge = document.getElementById('pendingOrdersBadge');
            if (pendingBadge && res.success) {
                const count = res.data.length;
                if (count > 0) {
                    pendingBadge.textContent = count;
                    pendingBadge.classList.remove('hidden');
                } else {
                    pendingBadge.classList.add('hidden');
                }
            }
        } catch (err) {
            console.error('Pending orders poll error:', err);
        }
    }

    // Start poll loop (every 30 seconds)
    pollPendingOrders();
    setInterval(pollPendingOrders, 30000);

    // ── CATEGORIES MANAGEMENT SYSTEM ──────────────────────────────────
    const loadCategories = async () => {
        const res = await api.getCategories();
        if (res.success) {
            // Render Categories Table
            const tbody = document.getElementById('categories-tbody');
            if (tbody) {
                tbody.innerHTML = '';
                res.data.forEach(cat => {
                    tbody.innerHTML += `
                        <tr class="border-b border-outline-variant hover:bg-surface-variant transition-colors">
                            <td class="p-4"><span class="font-label-md text-lg"><i class="${cat.icon || 'fas fa-folder'}"></i></span></td>
                            <td class="p-4 font-label-md text-label-md text-on-surface">${cat.name}</td>
                            <td class="p-4 text-right">
                                <button onclick="deleteCategory('${cat._id}')" class="text-error hover:text-red-700 transition-colors flex items-center justify-end ml-auto">
                                    <span class="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }

            // Sync product entry form category dropdown
            const formCategorySelect = document.getElementById('productFormCategorySelect');
            if (formCategorySelect) {
                formCategorySelect.innerHTML = res.data.map(cat => `
                    <option value="${cat.name}">${cat.name}</option>
                `).join('');
            }
        }
    };

    window.deleteCategory = async (id) => {
        if (confirm('Are you sure you want to delete this category? This might affect products using it.')) {
            const token = auth.getToken();
            const res = await api.deleteCategory(id, token);
            if (res.success) {
                loadCategories();
                loadProducts(); // Reload products to sync dropdowns and table stats
            } else {
                alert(res.error || 'Failed to delete category.');
            }
        }
    };

    // Category Add Form Submit
    const addCatForm = document.getElementById('addCategoryForm');
    if (addCatForm) {
        addCatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('newCatName').value.trim();
            const icon = document.getElementById('newCatIcon').value.trim();
            const token = auth.getToken();

            try {
                const res = await api.createCategory({ name, icon }, token);
                if (res.success) {
                    addCatForm.reset();
                    loadCategories();
                    loadProducts();
                } else {
                    alert(res.error || 'Failed to add category.');
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred.');
            }
        });
    }

    // ── INITIAL LOADS ────────────────────────────────────────────────
    await loadProducts();
    await loadCategories();

    // Hook up Sign Out button
    const adminSignOutBtn = document.getElementById('adminSignOutBtn');
    if (adminSignOutBtn) {
        adminSignOutBtn.addEventListener('click', () => {
            auth.logout();
        });
    }

    if (form) {
        const discardBtn = document.getElementById('discardBtn');
        if (discardBtn) {
            discardBtn.addEventListener('click', (e) => {
                e.preventDefault();
                resetForm();
            });
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const token = auth.getToken();
            const formData = new FormData(form);

            try {
                let res;
                if (editingProductId) {
                    res = await api.updateProduct(editingProductId, formData, token);
                } else {
                    res = await api.createProduct(formData, token);
                }

                if (res.success) {
                    alert(editingProductId ? "✅ Product updated!" : "✅ Product added!");
                    resetForm();
                    loadProducts();
                } else {
                    alert(res.error);
                }
            } catch (err) {
                console.error(err);
                alert(editingProductId ? "❌ Failed to update product" : "❌ Failed to add product");
            }
        });
    }

    // ── ADMIN INVOICE DOWNLOAD ──────────────────────────────────────
    window.adminDownloadInvoice = async (orderId) => {
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
