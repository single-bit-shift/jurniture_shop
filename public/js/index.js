document.addEventListener('DOMContentLoaded', async () => {
    // Check auth
    if(!auth.isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }

    const user = auth.getUser();
    
    // Setup sign out
    const signOutBtn = document.querySelector('button.uppercase.tracking-widest'); // The Sign Out button
    if(signOutBtn && signOutBtn.textContent.includes('Sign Out')) {
        signOutBtn.addEventListener('click', () => {
            auth.logout();
        });
    }

    // Replace the profile link text with user's name
    const profileLink = document.querySelector('a[href="#"]');
    if(profileLink && profileLink.textContent === 'Profile') {
        profileLink.textContent = user.name;
    }

    // Load products into the grid
    try {
        const res = await api.getProducts();
        if(res.success) {
            const products = res.data;
            const grid = document.querySelector('.grid.grid-cols-2.lg\\:grid-cols-4');
            if(grid) {
                products.slice(0, 4).forEach(product => {
                    const isOutOfStock = product.stock === 'Out of Stock';
                    let badgeBg = 'bg-tertiary';
                    if (product.stock === 'In Stock') {
                        badgeBg = 'bg-primary';
                    } else if (isOutOfStock) {
                        badgeBg = 'bg-error';
                    }

                    grid.innerHTML += `
                    <div class="blueprint-border group cursor-pointer bg-surface product-card ${isOutOfStock ? 'grayscale opacity-60' : ''}" data-id="${product._id}">
                        <div class="aspect-[4/5] bg-surface-variant relative overflow-hidden">
                            <img alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${product.image || 'https://via.placeholder.com/400x500?text=No+Image'}">
                            <div class="absolute top-4 left-4 ${badgeBg} px-3 py-1">
                                <span class="font-label-md text-[10px] text-on-primary uppercase font-bold">${product.stock}</span>
                            </div>
                        </div>
                        <div class="p-4">
                            <span class="font-caption text-caption text-on-surface-variant uppercase tracking-widest mb-1 block">${product.category}</span>
                            <h3 class="font-label-md text-label-md mb-2 group-hover:text-primary transition-colors">${product.name}</h3>
                            <p class="font-body-md text-sm text-on-surface-variant mb-4 line-clamp-2">${product.description}</p>
                            <div class="flex justify-between items-center border-t-border-width border-outline-variant pt-4">
                                <span class="font-headline-md text-headline-md text-on-surface">₹${product.price}</span>
                                ${isOutOfStock ? `
                                    <span class="material-symbols-outlined text-outline opacity-40 cursor-not-allowed" 
                                          title="Out of Stock"
                                          data-icon="remove_shopping_cart">remove_shopping_cart</span>
                                ` : `
                                    <span class="material-symbols-outlined text-primary-container add-to-cart-btn cursor-pointer hover:scale-110 transition-transform" 
                                          data-icon="add_shopping_cart"
                                          data-id="${product._id}"
                                          data-name="${product.name}"
                                          data-price="${product.price || 0}"
                                          data-image="${product.image || ''}">add_shopping_cart</span>
                                `}
                            </div>
                        </div>
                    </div>`;
                });

                // Attach click → detail page
                grid.querySelectorAll(".product-card").forEach(card => {
                    card.addEventListener("click", () => {
                        window.location.href = `/product.html?id=${card.dataset.id}`;
                    });
                });

                // Attach click → add to cart directly
                grid.querySelectorAll(".add-to-cart-btn").forEach(btn => {
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
            }
        }
    } catch(err) {
        console.error(err);
    }
});
