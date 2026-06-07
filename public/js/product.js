document.addEventListener('DOMContentLoaded', async () => {
    // Check auth
    if (!auth.isLoggedIn()) {
        window.location.href = "/login.html";
        return;
    }

    // Bind Profile Header
    const user = auth.getUser();
    const profileNameEl = document.getElementById("profileName");
    if (profileNameEl && user) {
        profileNameEl.textContent = user.name;
        if (user.isAdmin) {
            profileNameEl.href = "/admin.html";
        } else {
            profileNameEl.href = "/login.html";
        }
    }
    const signOutBtn = document.getElementById("signOutBtn");
    if (signOutBtn) {
        signOutBtn.addEventListener("click", () => {
            auth.logout();
        });
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
                    detailsStockStatus.innerHTML = `
                        <span class="material-symbols-outlined text-[14px]" data-icon="${iconName}" data-weight="fill">${iconName}</span>
                        ${p.stock.toUpperCase()}
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
                    specAvailability.textContent = p.stock === 'In Stock' 
                        ? 'Immediate Delivery (Pathanamthitta Region)' 
                        : (p.stock === 'Made to Order' ? 'Made to Order (2-3 weeks)' : 'Currently Unavailable');
                }

                const specCategory = document.getElementById('specCategory');
                if (specCategory) {
                    specCategory.textContent = p.category;
                }

                // Bind Add to Cart
                const addToCartBtn = document.getElementById('addToCartBtn');
                if (addToCartBtn) {
                    addToCartBtn.addEventListener('click', () => {
                        addToCart(p._id, p.name, p.price, p.image);
                    });
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
