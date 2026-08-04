document.addEventListener("DOMContentLoaded", async () => {
    console.log("MAIN JS RUNNING 🚀");

    // ── 1. DYNAMIC HEADER MANAGEMENT ─────────────────────────────────
    const isLoggedIn = auth.isLoggedIn();
    const profileNameEl = document.getElementById("profileName");
    const adminBtn = document.getElementById("adminBtn");
    const ordersLink = document.querySelector('header a[href="/orders.html"]');
    const signOutBtn = document.getElementById("signOutBtn");

    if (isLoggedIn) {
        const user = auth.getUser();
        
        // Show and format profile link
        if (profileNameEl && user) {
            profileNameEl.style.display = "inline-block";
            profileNameEl.textContent = `Profile (${user.name})`;
            profileNameEl.href = "/profile.html";
        }
        
        // Show orders link
        if (ordersLink) {
            ordersLink.style.display = "inline-block";
        }
        
        // Show admin button if admin
        if (auth.isAdmin() && adminBtn) {
            adminBtn.style.display = "inline-block";
            adminBtn.addEventListener("click", () => {
                window.location.href = "/admin.html";
            });
        } else if (adminBtn) {
            adminBtn.style.display = "none";
        }
        
        // Setup Sign Out
        if (signOutBtn) {
            signOutBtn.textContent = "Sign Out";
            signOutBtn.addEventListener("click", () => {
                auth.logout();
            });
        }
    } else {
        // Guest mode - hide user options
        if (profileNameEl) profileNameEl.style.display = "none";
        if (ordersLink) ordersLink.style.display = "none";
        if (adminBtn) adminBtn.style.display = "none";
        
        // Turn "Sign Out" into "Sign In"
        if (signOutBtn) {
            signOutBtn.textContent = "Sign In";
            signOutBtn.addEventListener("click", () => {
                window.location.href = "/login.html";
            });
        }
    }

    // ── 3. STATE ───────────────────────────────────────────────────
    let currentCategory = "";
    let currentSearch = "";
    const container = document.getElementById("productsContainer");

    if (!container) {
        console.error("Products container not found ❌");
        return;
    }

    // Helper function to keep department inventory counts live and accurate (in-stock items only)
    async function updateDepartmentInventory() {
        try {
            const res = await api.getProducts("", "");
            if (res.success && res.data) {
                const allProducts = res.data;
                const categories = ['Beds', 'Windows', 'Doors', 'Chairs', 'Dining Tables'];
                categories.forEach(cat => {
                    const inStockProducts = allProducts.filter(p => 
                        p.category === cat && 
                        p.stock !== 'Out of Stock' && 
                        (p.quantity === undefined || p.quantity > 0)
                    );
                    const count = inStockProducts.length;
                    const id = `catCount${cat.replace(' ', '')}`;
                    const el = document.getElementById(id);
                    if (el) {
                        el.textContent = `${count} ${count === 1 ? 'Item' : 'Items'}`;
                    }
                });
            }
        } catch (err) {
            console.error("Failed to update department inventory counts:", err);
        }
    }

    // ── 4. CORE LOAD FUNCTION ──────────────────────────────────────
    async function loadProducts() {
        // Keep top department inventory card counts up to date
        updateDepartmentInventory();

        // Loading state
        container.innerHTML = `<div class="col-span-full loading">Loading...</div>`;

        try {
            const res = await api.getProducts(currentCategory, currentSearch);

            if (res.success) {
                const products = res.data;

                if (products.length === 0) {
                    container.innerHTML = `<div class="col-span-full empty-state">No products found.</div>`;
                    return;
                }

                container.innerHTML = products.map(p => {
                    const isOutOfStock = p.stock === 'Out of Stock';
                    let badgeBg = 'bg-tertiary';
                    if (p.stock === 'In Stock') {
                        badgeBg = 'bg-primary';
                    } else if (isOutOfStock) {
                        badgeBg = 'bg-error';
                    }

                    return `
                    <div class="blueprint-border group cursor-pointer bg-surface product-card ${isOutOfStock ? 'grayscale opacity-60' : ''}" data-id="${p._id}">
                        <div class="aspect-[4/5] bg-surface-variant relative overflow-hidden">
                            <img src="${p.image || 'https://dummyimage.com/300x300/cccccc/000000&text=No+Image'}"
                                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${p.name}">
                            <div class="absolute top-4 left-4 ${badgeBg} px-3 py-1">
                                <span class="font-label-md text-[10px] text-on-primary uppercase font-bold">
                                    ${p.stock === 'In Stock' ? `${p.stock} (${p.quantity !== undefined ? p.quantity : 10})` : p.stock}
                                </span>
                            </div>
                        </div>
                        <div class="p-4">
                            <span class="font-caption text-caption text-on-surface-variant uppercase tracking-widest mb-1 block">
                                ${p.category}
                            </span>
                            <h3 class="font-label-md text-label-md mb-2 group-hover:text-primary transition-colors">
                                ${p.name}
                            </h3>
                            <p class="font-body-md text-sm text-on-surface-variant mb-4 line-clamp-2">
                                ${p.description || ""}
                            </p>
                            <div class="flex justify-between items-center border-t-border-width border-outline-variant pt-4">
                                <span class="font-headline-md text-headline-md text-on-surface">
                                    ₹${Number(p.price || 0).toLocaleString('en-IN')}
                                </span>
                                ${isOutOfStock ? `
                                    <span class="material-symbols-outlined text-outline opacity-40 cursor-not-allowed" 
                                          title="Out of Stock"
                                          data-icon="remove_shopping_cart">remove_shopping_cart</span>
                                ` : `
                                    <span class="material-symbols-outlined text-primary-container add-to-cart-btn cursor-pointer hover:scale-110 transition-transform" 
                                          data-icon="add_shopping_cart"
                                          data-id="${p._id}"
                                          data-name="${p.name}"
                                          data-price="${p.price || 0}"
                                          data-image="${p.image || ''}">add_shopping_cart</span>
                                `}
                            </div>
                        </div>
                    </div>
                    `;
                }).join("");

                // Attach click → detail page
                container.querySelectorAll(".product-card").forEach(card => {
                    card.addEventListener("click", () => {
                        window.location.href = `/product.html?id=${card.dataset.id}`;
                    });
                });

                // Attach click → add to cart directly
                container.querySelectorAll(".add-to-cart-btn").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        e.stopPropagation(); // Stop navigation to product.html
                        const id = btn.dataset.id;
                        const name = btn.dataset.name;
                        const price = Number(btn.dataset.price);
                        const image = btn.dataset.image;
                        if (typeof addToCart === "function") {
                            addToCart(id, name, price, image);
                        } else {
                            console.error("addToCart function not found!");
                        }
                    });
                });
            } else {
                console.error("API failed", res);
                container.innerHTML = `<div class="col-span-full error-state">Something went wrong. Please try again.</div>`;
            }
        } catch (err) {
            console.error("Failed to load products:", err);
            container.innerHTML = `<div class="col-span-full error-state">Something went wrong. Please try again.</div>`;
        }
    }

    // ── 5. SYNC HELPER ─────────────────────────────────────────────
    // Keeps the header dropdown and secondary nav visually in sync
    function syncCategoryUI(category) {
        // Update dropdown
        const headerCatSelect = document.getElementById("headerCategorySelect");
        if (headerCatSelect) {
            headerCatSelect.value = category;
        }

        // Update active nav link
        document.querySelectorAll("#navCategoryLinks a").forEach(link => {
            link.classList.toggle("active", link.dataset.category === category);
        });
    }

    // ── 6. EVENT LISTENERS ─────────────────────────────────────────

    // Header dropdown change
    const headerCatSelect = document.getElementById("headerCategorySelect");
    if (headerCatSelect) {
        headerCatSelect.addEventListener("change", (e) => {
            currentCategory = e.target.value;
            sessionStorage.setItem("activeCategory", currentCategory);
            syncCategoryUI(currentCategory);
            loadProducts();
        });
    }

    // Search button click
    const headerSearchBtn = document.getElementById("headerSearchBtn");
    if (headerSearchBtn) {
        headerSearchBtn.addEventListener("click", () => {
            const searchInput = document.getElementById("headerSearchInput");
            currentSearch = searchInput ? searchInput.value.trim() : "";
            loadProducts();
        });
    }

    // Enter key in search input
    const headerSearchInput = document.getElementById("headerSearchInput");
    if (headerSearchInput) {
        headerSearchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                currentSearch = e.target.value.trim();
                loadProducts();
            }
        });
    }

    // Secondary nav category links
    const navCategoryLinks = document.getElementById("navCategoryLinks");
    if (navCategoryLinks) {
        navCategoryLinks.addEventListener("click", (e) => {
            e.preventDefault();
            const link = e.target.closest("a[data-category]");
            if (!link) return;
            currentCategory = link.dataset.category;
            sessionStorage.setItem("activeCategory", currentCategory);
            syncCategoryUI(currentCategory);
            loadProducts();
        });
    }

    // Department Inventory card click listeners
    document.querySelectorAll(".department-card").forEach(card => {
        card.addEventListener("click", () => {
            const cat = card.dataset.category;
            if (cat) {
                currentCategory = cat;
                sessionStorage.setItem("activeCategory", currentCategory);
                syncCategoryUI(currentCategory);
                loadProducts();
            }
        });
    });

    // "All Categories" reset
    const navAllCategories = document.getElementById("navAllCategories");
    if (navAllCategories) {
        navAllCategories.addEventListener("click", () => {
            currentCategory = "";
            currentSearch = "";
            sessionStorage.removeItem("activeCategory");
            const searchInput = document.getElementById("headerSearchInput");
            if (searchInput) searchInput.value = "";
            syncCategoryUI("");
            loadProducts();
        });
    }

    // ── 7. INITIAL LOAD ────────────────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const urlCat = params.get("category");
    if (urlCat !== null) {
        currentCategory = urlCat;
        sessionStorage.setItem("activeCategory", currentCategory);
    } else {
        currentCategory = sessionStorage.getItem("activeCategory") || "";
    }
    syncCategoryUI(currentCategory);
    loadProducts();
});