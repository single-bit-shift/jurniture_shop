// Central Shopping Cart Manager for Jurniture
(function () {
    const CART_KEY = 'jurniture_cart';

    // Helper to get cart from localStorage
    function getCart() {
        const cart = localStorage.getItem(CART_KEY);
        return cart ? JSON.parse(cart) : [];
    }

    // Helper to save cart to localStorage
    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartBadge();
    }

    // Update the live count badge in the header
    function updateCartBadge() {
        const cart = getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) {
            if (totalItems > 0) {
                cartBadge.textContent = totalItems;
                cartBadge.classList.remove('hidden');
            } else {
                cartBadge.classList.add('hidden');
            }
        }
    }

    // Inject Sidebar and Modal HTML into DOM if not present
    function injectCartUI() {
        if (document.getElementById('cartSidebar')) return;

        // Create Container
        const cartDiv = document.createElement('div');
        cartDiv.id = 'cartContainerWrapper';
        cartDiv.innerHTML = `
            <!-- Cart Sidebar -->
            <div id="cartSidebar" class="fixed top-0 right-0 h-full w-80 bg-surface shadow-2xl border-l border-outline transition-transform duration-300 translate-x-full z-50 flex flex-col" style="border-width: 1.5px;">
                <!-- Header -->
                <div class="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container">
                    <h3 class="font-headline-md text-label-md text-primary flex items-center gap-2 uppercase tracking-wider">
                        <span class="material-symbols-outlined">shopping_cart</span> Shopping Cart
                    </h3>
                    <button id="cartCloseBtn" class="text-on-surface hover:text-primary transition-colors flex items-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <!-- Item List -->
                <div id="cartItemsContainer" class="flex-grow overflow-y-auto p-4 space-y-4">
                    <!-- Dynamically populated -->
                </div>
                <!-- Footer -->
                <div class="p-4 border-t border-outline-variant bg-surface-container-low space-y-4">
                    <div class="flex justify-between items-center font-label-md text-label-md">
                        <span class="uppercase tracking-wider">Subtotal:</span>
                        <span id="cartSubtotal" class="font-bold text-primary">₹0</span>
                    </div>
                    <button id="cartCheckoutBtn" class="w-full bg-primary-container text-on-primary-container py-3 font-label-md uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors">
                        Proceed to Checkout
                    </button>
                </div>
            </div>
            <!-- Cart Backdrop -->
            <div id="cartBackdrop" class="fixed inset-0 bg-black/50 z-40 hidden transition-opacity duration-300 opacity-0"></div>

            <!-- Checkout Modal -->
            <div id="checkoutModal" class="fixed inset-0 z-50 flex items-center justify-center hidden">
                <!-- Backdrop -->
                <div id="checkoutBackdrop" class="absolute inset-0 bg-black/55"></div>
                <!-- Content -->
                <div class="relative bg-surface border-2 border-outline p-6 max-w-md w-full mx-4 z-10 space-y-4 shadow-2xl">
                    <div class="flex justify-between items-center border-b border-outline-variant pb-2">
                        <h3 class="font-headline-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2">
                            <span class="material-symbols-outlined">local_shipping</span> Delivery Details
                        </h3>
                        <button id="checkoutCloseBtn" class="text-on-surface hover:text-primary flex items-center">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <form id="checkoutForm" class="space-y-4">
                        <div>
                            <label class="block font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant mb-1">Full Name</label>
                            <input id="checkoutName" required class="w-full bg-surface border border-outline-variant px-3 py-2 font-body-md focus:outline-none focus:border-primary transition-colors text-on-surface" type="text" placeholder="John Doe">
                        </div>
                        <div>
                            <label class="block font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant mb-1">Phone Number</label>
                            <input id="checkoutPhone" required class="w-full bg-surface border border-outline-variant px-3 py-2 font-body-md focus:outline-none focus:border-primary transition-colors text-on-surface" type="tel" placeholder="+91 98765 43210">
                        </div>
                        <div>
                            <label class="block font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant mb-1">Delivery Address</label>
                            <textarea id="checkoutAddress" required rows="2" class="w-full bg-surface border border-outline-variant px-3 py-2 font-body-md focus:outline-none focus:border-primary transition-colors text-on-surface" placeholder="Door No, Street Name, Locality"></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant mb-1">City</label>
                                <input id="checkoutCity" required class="w-full bg-surface border border-outline-variant px-3 py-2 font-body-md focus:outline-none focus:border-primary transition-colors text-on-surface" type="text" placeholder="Pathanamthitta">
                            </div>
                            <div>
                                <label class="block font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant mb-1">Pincode</label>
                                <input id="checkoutPincode" required class="w-full bg-surface border border-outline-variant px-3 py-2 font-body-md focus:outline-none focus:border-primary transition-colors text-on-surface" type="text" placeholder="689645">
                            </div>
                        </div>
                        <div id="checkoutError" class="text-error font-label-md text-[12px] hidden"></div>
                        <button type="submit" class="w-full bg-primary text-on-primary py-3 font-label-md uppercase tracking-widest hover:opacity-90 transition-opacity">
                            Place Order (COD)
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(cartDiv);

        // Bind DOM events
        document.getElementById('cartCloseBtn').addEventListener('click', cartClose);
        document.getElementById('cartBackdrop').addEventListener('click', cartClose);
        document.getElementById('cartCheckoutBtn').addEventListener('click', () => {
            if (getCart().length === 0) {
                alert('Your cart is empty!');
                return;
            }
            cartClose();
            checkoutOpen();
        });
        document.getElementById('checkoutCloseBtn').addEventListener('click', checkoutClose);
        document.getElementById('checkoutBackdrop').addEventListener('click', checkoutClose);
        document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);
    }

    // Toggle Sidebar
    function cartOpen() {
        injectCartUI();
        renderCart();
        const sidebar = document.getElementById('cartSidebar');
        const backdrop = document.getElementById('cartBackdrop');
        if (sidebar && backdrop) {
            backdrop.classList.remove('hidden');
            setTimeout(() => {
                sidebar.classList.remove('translate-x-full');
                backdrop.classList.remove('opacity-0');
            }, 10);
        }
    }

    function cartClose() {
        const sidebar = document.getElementById('cartSidebar');
        const backdrop = document.getElementById('cartBackdrop');
        if (sidebar && backdrop) {
            sidebar.classList.add('translate-x-full');
            backdrop.classList.add('opacity-0');
            setTimeout(() => {
                backdrop.classList.add('hidden');
            }, 300);
        }
    }

    // Checkout Modal Open/Close
    function checkoutOpen() {
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function checkoutClose() {
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.classList.add('hidden');
            const errEl = document.getElementById('checkoutError');
            if (errEl) errEl.classList.add('hidden');
        }
    }

    // Render Items
    function renderCart() {
        const container = document.getElementById('cartItemsContainer');
        const subtotalEl = document.getElementById('cartSubtotal');
        if (!container) return;

        const cart = getCart();
        let subtotal = 0;

        if (cart.length === 0) {
            container.innerHTML = `
                <div class="h-64 flex flex-col items-center justify-center text-on-surface-variant text-center space-y-2">
                    <span class="material-symbols-outlined text-4xl opacity-50">shopping_cart_off</span>
                    <p class="font-label-md text-caption uppercase tracking-wider">Your cart is empty</p>
                </div>
            `;
            if (subtotalEl) subtotalEl.textContent = '₹0';
            return;
        }

        container.innerHTML = cart.map(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            return `
                <div class="flex gap-3 border-b border-outline-variant/50 pb-4 last:border-b-0">
                    <img src="${item.image || 'https://dummyimage.com/100x100/cccccc/000000&text=No+Image'}" alt="${item.name}" class="w-16 h-16 object-cover border border-outline-variant">
                    <div class="flex-grow min-w-0">
                        <h4 class="font-label-md text-[13px] truncate text-on-surface">${item.name}</h4>
                        <p class="font-label-md text-caption text-primary mb-2">₹${item.price.toLocaleString('en-IN')}</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center border border-outline-variant">
                                <button onclick="updateQuantity('${item.productId}', -1)" class="px-2 py-0.5 hover:bg-surface-container transition-colors flex items-center">-</button>
                                <span class="px-3 font-label-md text-caption">${item.quantity}</span>
                                <button onclick="updateQuantity('${item.productId}', 1)" class="px-2 py-0.5 hover:bg-surface-container transition-colors flex items-center">+</button>
                            </div>
                            <button onclick="removeFromCart('${item.productId}')" class="text-error hover:text-red-700 transition-colors flex items-center">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (subtotalEl) {
            subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
        }
    }

    // Add to Cart Action
    function addToCart(productId, name, price, image) {
        injectCartUI();
        let cart = getCart();
        const existing = cart.find(item => item.productId === productId);

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ productId, name, price, image, quantity: 1 });
        }

        saveCart(cart);
        cartOpen();
    }

    // Remove from Cart
    function removeFromCart(productId) {
        let cart = getCart();
        cart = cart.filter(item => item.productId !== productId);
        saveCart(cart);
        renderCart();
    }

    // Update Quantity
    function updateQuantity(productId, change) {
        let cart = getCart();
        const item = cart.find(item => item.productId === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.productId !== productId);
            }
        }
        saveCart(cart);
        renderCart();
    }

    // Checkout Submit
    async function handleCheckoutSubmit(e) {
        e.preventDefault();
        const errEl = document.getElementById('checkoutError');
        if (errEl) errEl.classList.add('hidden');

        const cart = getCart();
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const deliveryAddress = {
            fullName: document.getElementById('checkoutName').value,
            phone: document.getElementById('checkoutPhone').value,
            address: document.getElementById('checkoutAddress').value,
            city: document.getElementById('checkoutCity').value,
            pincode: document.getElementById('checkoutPincode').value
        };

        const orderData = {
            items: cart.map(i => ({
                productId: i.productId,
                name: i.name,
                price: i.price,
                quantity: i.quantity
            })),
            totalAmount,
            deliveryAddress
        };

        const token = auth.getToken();
        if (!token) {
            alert('Your session has expired. Please log in again.');
            window.location.href = '/login.html';
            return;
        }

        try {
            const res = await api.createOrder(orderData, token);
            if (res.success) {
                alert(`Order placed successfully! Reference ID: ${res.data.orderId}`);
                localStorage.removeItem(CART_KEY);
                updateCartBadge();
                checkoutClose();
                window.location.href = '/orders.html';
            } else {
                if (errEl) {
                    errEl.textContent = res.error || 'Failed to place order.';
                    errEl.classList.remove('hidden');
                }
            }
        } catch (err) {
            console.error('Checkout error:', err);
            if (errEl) {
                errEl.textContent = 'An error occurred. Please try again.';
                errEl.classList.remove('hidden');
            }
        }
    }

    // Export helpers globally
    window.cartOpen = cartOpen;
    window.cartClose = cartClose;
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.renderCart = renderCart;
    window.updateCartBadge = updateCartBadge;

    // Run badge update on DOM Load
    document.addEventListener('DOMContentLoaded', () => {
        injectCartUI();
        updateCartBadge();

        const toggleBtn = document.getElementById('cartToggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', cartOpen);
        }
    });
})();
