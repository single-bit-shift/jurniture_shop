document.addEventListener('DOMContentLoaded', async () => {
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

    // Basic product detail fetching
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if(id) {
        try {
            const res = await api.getProductById(id);
            if(res.success) {
                const p = res.data;
                
                // Bind Breadcrumb
                const activeCat = sessionStorage.getItem("activeCategory") || "";
                const breadcrumbCategory = document.getElementById('breadcrumbCategory');
                if (breadcrumbCategory) {
                    breadcrumbCategory.textContent = p.category;
                    breadcrumbCategory.href = `/index.html?category=${activeCat || p.category}`;
                }
                const breadcrumbHome = document.querySelector('nav a'); // first anchor in breadcrumb is Home
                if (breadcrumbHome) {
                    breadcrumbHome.href = `/index.html?category=${activeCat}`;
                }
                const breadcrumbProductName = document.getElementById('breadcrumbProductName');
                if (breadcrumbProductName) {
                    breadcrumbProductName.textContent = p.name;
                }

                // Bind Image
                const productImage = document.getElementById('productImage');
                if (productImage && p.image) {
                    productImage.src = p.image;
                    productImage.alt = p.name;
                }

                // Bind Right Details
                const detailsCategoryTag = document.getElementById('detailsCategoryTag');
                if (detailsCategoryTag) {
                    detailsCategoryTag.textContent = p.category;
                }
                
                 const detailsStockStatus = document.getElementById('detailsStockStatus');
                 if (detailsStockStatus) {
                     const isAvailable = p.stock === 'In Stock';
                     const iconName = isAvailable ? 'check_circle' : 'error';
                     const qtyStr = p.stock === 'In Stock' ? ` (${p.quantity !== undefined ? p.quantity : 10})` : '';
                     detailsStockStatus.innerHTML = `
                         <span class="material-symbols-outlined text-[14px]" data-icon="${iconName}" data-weight="fill">${iconName}</span>
                         ${p.stock.toUpperCase()}${qtyStr}
                     `;
                     if (p.stock === 'In Stock') {
                         detailsStockStatus.className = "flex items-center gap-1 font-label-md text-[12px] text-primary";
                     } else if (p.stock === 'Out of Stock') {
                         detailsStockStatus.className = "flex items-center gap-1 font-label-md text-[12px] text-error";
                     } else {
                         detailsStockStatus.className = "flex items-center gap-1 font-label-md text-[12px] text-secondary";
                     }
                 }
 
                 const detailsTitle = document.getElementById('detailsTitle');
                 if (detailsTitle) {
                     detailsTitle.textContent = p.name;
                 }
 
                 const detailsPrice = document.getElementById('detailsPrice');
                 if (detailsPrice) {
                     detailsPrice.textContent = `₹${Number(p.price || 0).toLocaleString('en-IN')}`;
                 }
 
                 const detailsDescription = document.getElementById('detailsDescription');
                 if (detailsDescription) {
                     detailsDescription.textContent = p.description || 'No description available.';
                 }
 
                 // Bind Technical Specifications
                 const specMaterial = document.getElementById('specMaterial');
                 if (specMaterial) {
                     specMaterial.textContent = p.material || 'N/A';
                 }
 
                 const specDimensions = document.getElementById('specDimensions');
                 if (specDimensions) {
                     specDimensions.textContent = p.dimensions || 'N/A';
                 }
 
                 const specAvailability = document.getElementById('specAvailability');
                 if (specAvailability) {
                     const availableQuantity = p.quantity !== undefined ? p.quantity : 10;
                     specAvailability.textContent = p.stock === 'In Stock' 
                         ? `Immediate Delivery - ${availableQuantity} units available (Pathanamthitta Region)` 
                         : (p.stock === 'Made to Order' ? 'Made to Order (2-3 weeks)' : 'Currently Unavailable');
                 }

                const specCategory = document.getElementById('specCategory');
                if (specCategory) {
                    specCategory.textContent = p.category;
                }

                // Bind Add to Cart
                const addToCartBtn = document.getElementById('addToCartBtn');
                if (addToCartBtn) {
                    if (p.stock === 'Out of Stock') {
                        addToCartBtn.disabled = true;
                        addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
                        addToCartBtn.innerHTML = `
                            <span class="material-symbols-outlined text-sm">remove_shopping_cart</span> Out of Stock
                        `;
                    } else {
                        addToCartBtn.disabled = false;
                        addToCartBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                        addToCartBtn.innerHTML = `
                            <span class="material-symbols-outlined text-sm">add_shopping_cart</span> Add to Cart
                        `;
                        addToCartBtn.addEventListener('click', () => {
                            addToCart(p._id, p.name, p.price, p.image);
                        });
                    }
                }

                // Bind Inquiry Modal Toggle
                const enquireModal = document.getElementById('enquireModal');
                const enquireBtn = document.getElementById('enquireBtn');
                const enquireCloseBtn = document.getElementById('enquireCloseBtn');
                const enquireBackdrop = document.getElementById('enquireBackdrop');
                const enquireProductName = document.getElementById('enquireProductName');
                const enquireForm = document.getElementById('enquireForm');
                const enquireError = document.getElementById('enquireError');
                const enquireSuccess = document.getElementById('enquireSuccess');

                if (enquireBtn && enquireModal) {
                    enquireBtn.addEventListener('click', () => {
                        if (!auth.isLoggedIn()) {
                            alert('Please log in to submit a product inquiry.');
                            window.location.href = '/login.html';
                            return;
                        }
                        if (enquireProductName) enquireProductName.value = p.name;
                        if (enquireError) enquireError.classList.add('hidden');
                        if (enquireSuccess) enquireSuccess.classList.add('hidden');
                        enquireModal.classList.remove('hidden');
                    });
                }

                const closeEnquireModal = () => {
                    if (enquireModal) enquireModal.classList.add('hidden');
                };

                if (enquireCloseBtn) enquireCloseBtn.addEventListener('click', closeEnquireModal);
                if (enquireBackdrop) enquireBackdrop.addEventListener('click', closeEnquireModal);

                // Bind Inquiry Form Submit
                if (enquireForm) {
                    enquireForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        if (enquireError) enquireError.classList.add('hidden');
                        if (enquireSuccess) enquireSuccess.classList.add('hidden');

                        const message = document.getElementById('enquireMessage').value.trim();
                        const token = auth.getToken();

                        if (!token) {
                            alert('Session expired. Please log in.');
                            window.location.href = '/login.html';
                            return;
                        }

                        try {
                            const submitBtn = document.getElementById('enquireSubmitBtn');
                            if (submitBtn) submitBtn.disabled = true;

                            const res = await api.createInquiry({
                                productId: p._id,
                                productName: p.name,
                                message
                            }, token);

                            if (res.success) {
                                if (enquireSuccess) {
                                    enquireSuccess.textContent = "Your inquiry has been submitted. We'll get back to you soon.";
                                    enquireSuccess.classList.remove('hidden');
                                }
                                enquireForm.reset();
                                setTimeout(closeEnquireModal, 2000);
                            } else {
                                if (enquireError) {
                                    enquireError.textContent = res.error || 'Failed to submit inquiry.';
                                    enquireError.classList.remove('hidden');
                                }
                            }
                        } catch (err) {
                            console.error(err);
                            if (enquireError) {
                                enquireError.textContent = 'An error occurred. Please try again.';
                                enquireError.classList.remove('hidden');
                            }
                        } finally {
                            const submitBtn = document.getElementById('enquireSubmitBtn');
                            if (submitBtn) submitBtn.disabled = false;
                        }
                    });
                }
            }
        } catch(err) {
            console.error(err);
        }
    }
});
