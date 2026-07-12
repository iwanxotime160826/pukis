// app.js

// Available toppings
const TOPPINGS = ['Ceres', 'Kacang', 'Keju', 'Stroberi', 'Redvelvet', 'Oreo'];

// Cart state
let cart = JSON.parse(localStorage.getItem('pukis_cart')) || [];

// Customizer state
let customBox = {
  Ceres: 0,
  Kacang: 0,
  Keju: 0,
  Stroberi: 0,
  Redvelvet: 0,
  Oreo: 0
};

// DOM Elements
const cartIconBtn = document.getElementById('cart-icon-btn');
const cartBadge = document.getElementById('cart-badge');
const cartOverlay = document.getElementById('cart-overlay');
const cartDrawer = document.getElementById('cart-drawer');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalVal = document.getElementById('cart-total-val');
const emptyCartMsg = document.getElementById('empty-cart-msg');
const checkoutBtn = document.getElementById('checkout-btn');

// Checkout Modal Elements
const checkoutModalOverlay = document.getElementById('checkout-modal-overlay');
const closeCheckoutBtn = document.getElementById('close-checkout-btn');
const checkoutForm = document.getElementById('checkout-form');

// Mobile Navbar elements
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');

// Initialize Website
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    
    // Close nav on link click
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  // Scroll effect on Navbar
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Cart Drawer open/close
  if (cartIconBtn) cartIconBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // Checkout modal open/close
  if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutModal);
  if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
  if (checkoutModalOverlay) {
    checkoutModalOverlay.addEventListener('click', (e) => {
      if (e.target === checkoutModalOverlay) closeCheckoutModal();
    });
  }

  // Bind Form Submit
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  // Initialize Customizer UI & Cart
  setupCustomizer();
  setupPresetListeners();
  updateCartUI();
});

// CART FUNCTIONS
function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
}

function openCheckoutModal() {
  if (cart.length === 0) {
    alert('Keranjang belanja Anda masih kosong!');
    return;
  }
  closeCart();
  checkoutModalOverlay.classList.add('open');
}

function closeCheckoutModal() {
  checkoutModalOverlay.classList.remove('open');
}

function saveCart() {
  localStorage.setItem('pukis_cart', JSON.stringify(cart));
  updateCartUI();
}

function addToCart(item) {
  // Check if identical item is already in cart
  const existingItemIndex = cart.findIndex(cartItem => {
    if (cartItem.id !== item.id) return false;
    
    // For single flavor, check selected topping
    if (item.id === 'single-flavor') {
      return cartItem.topping === item.topping;
    }
    
    // For custom box, check detailed topping mapping
    if (item.id === 'custom-box') {
      return JSON.stringify(cartItem.toppings) === JSON.stringify(item.toppings);
    }
    
    return true; // Preset Paket Campur is identical if IDs match
  });

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }

  saveCart();
  
  // Show notification
  showToast(`${item.name} berhasil ditambahkan ke keranjang!`);
  
  // Open Cart drawer after adding
  setTimeout(openCart, 500);
}

function updateCartItemQuantity(index, quantity) {
  if (quantity <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = quantity;
  }
  saveCart();
}

function removeCartItem(index) {
  const removedItem = cart[index];
  cart.splice(index, 1);
  saveCart();
  showToast(`${removedItem.name} dihapus dari keranjang`);
}

function getCartTotal() {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartItemCount() {
  return cart.reduce((count, item) => count + item.quantity, 0);
}

function formatRupiah(amount) {
  return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function updateCartUI() {
  // Badge
  const count = getCartItemCount();
  cartBadge.textContent = count;
  cartBadge.style.display = count > 0 ? 'flex' : 'none';

  // Items container
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    emptyCartMsg.style.display = 'flex';
    cartItemsContainer.style.display = 'none';
    checkoutBtn.style.display = 'none';
    cartTotalVal.textContent = formatRupiah(0);
  } else {
    emptyCartMsg.style.display = 'none';
    cartItemsContainer.style.display = 'block';
    checkoutBtn.style.display = 'flex';

    cart.forEach((item, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      
      let descHTML = '';
      if (item.id === 'single-flavor') {
        descHTML = `<div class="cart-item-desc">Topping: ${item.topping}</div>`;
      } else if (item.id === 'custom-box') {
        const toppingDetails = Object.entries(item.toppings)
          .filter(([_, qty]) => qty > 0)
          .map(([name, qty]) => `${name} (${qty})`)
          .join(', ');
        descHTML = `<div class="cart-item-desc">Kustom: ${toppingDetails}</div>`;
      } else {
        descHTML = `<div class="cart-item-desc">Campur 5 Varian Premium</div>`;
      }

      itemEl.innerHTML = `
        <img class="cart-item-img" src="${item.image}" alt="${item.name}">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          ${descHTML}
          <div class="cart-item-meta">
            <span class="cart-item-price">${formatRupiah(item.price * item.quantity)}</span>
            <div class="qty-control">
              <button class="qty-btn" onclick="adjustCartItemQty(${index}, -1)">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" onclick="adjustCartItemQty(${index}, 1)">+</button>
            </div>
          </div>
        </div>
        <button class="remove-cart-btn" onclick="removeCartItem(${index})"><i class="fas fa-trash-alt"></i></button>
      `;
      cartItemsContainer.appendChild(itemEl);
    });

    cartTotalVal.textContent = formatRupiah(getCartTotal());
  }
}

// Global functions for inline HTML events
window.adjustCartItemQty = function(index, change) {
  const newQty = cart[index].quantity + change;
  updateCartItemQuantity(index, newQty);
};

window.removeCartItem = function(index) {
  removeCartItem(index);
};

// CUSTOM BOX BUILDER LOGIC
const CUSTOM_BOX_MAX = 10;

function getCustomBoxTotalPcs() {
  return Object.values(customBox).reduce((sum, val) => sum + val, 0);
}

function setupCustomizer() {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const visualBox = document.getElementById('visual-box');
  const toppingControls = document.getElementById('topping-controls');
  const addCustomToCartBtn = document.getElementById('add-custom-to-cart');

  if (!progressFill || !toppingControls || !visualBox) return;

  function renderCustomizerUI() {
    const totalPcs = getCustomBoxTotalPcs();
    const percent = (totalPcs / CUSTOM_BOX_MAX) * 100;
    
    // Update progress bar
    progressFill.style.width = `${percent}%`;
    progressText.innerHTML = `<span>${totalPcs} dari 10 Pcs Terpilih</span><span>${percent}%</span>`;

    // Render Visual Pukis Box Representation
    visualBox.innerHTML = '';
    
    // Fill active pukis
    let pukisIndex = 0;
    Object.entries(customBox).forEach(([toppingName, qty]) => {
      for (let i = 0; i < qty; i++) {
        const pukis = document.createElement('div');
        pukis.className = 'visual-pukis filled';
        pukis.setAttribute('data-topping', toppingName);
        pukis.title = `Pukis Topping ${toppingName}`;
        visualBox.appendChild(pukis);
        pukisIndex++;
      }
    });

    // Fill empty spots
    for (let i = pukisIndex; i < CUSTOM_BOX_MAX; i++) {
      const emptyPukis = document.createElement('div');
      emptyPukis.className = 'visual-pukis empty';
      emptyPukis.title = 'Slot Kosong';
      visualBox.appendChild(emptyPukis);
    }

    // Render Controls
    toppingControls.innerHTML = '';
    TOPPINGS.forEach(topping => {
      const currentQty = customBox[topping];
      
      const row = document.createElement('div');
      row.className = 'topping-row';
      row.innerHTML = `
        <div class="topping-info">
          <span class="topping-color-dot dot-${topping.toLowerCase()}"></span>
          <span class="topping-name">${topping}</span>
        </div>
        <div class="qty-control">
          <button class="qty-btn" ${currentQty === 0 ? 'disabled' : ''} onclick="adjustTopping('${topping}', -1)">-</button>
          <span class="qty-val">${currentQty}</span>
          <button class="qty-btn" ${totalPcs >= CUSTOM_BOX_MAX ? 'disabled' : ''} onclick="adjustTopping('${topping}', 1)">+</button>
        </div>
      `;
      toppingControls.appendChild(row);
    });

    // Enable/Disable Add to Cart
    if (totalPcs === CUSTOM_BOX_MAX) {
      addCustomToCartBtn.disabled = false;
      addCustomToCartBtn.textContent = 'Tambahkan Box Kustom ke Keranjang';
    } else {
      addCustomToCartBtn.disabled = true;
      addCustomToCartBtn.textContent = `Pilih ${CUSTOM_BOX_MAX - totalPcs} Pukis Lagi`;
    }
  }

  // Make adjustTopping global so it can be called from inline events
  window.adjustTopping = function(topping, change) {
    const totalPcs = getCustomBoxTotalPcs();
    if (change > 0 && totalPcs >= CUSTOM_BOX_MAX) return;
    if (change < 0 && customBox[topping] <= 0) return;

    customBox[topping] += change;
    renderCustomizerUI();
  };

  // Bind custom box add to cart
  addCustomToCartBtn.addEventListener('click', () => {
    if (getCustomBoxTotalPcs() !== CUSTOM_BOX_MAX) return;

    const customItem = {
      id: 'custom-box',
      name: 'Box Kustom (10 Pcs)',
      price: 20000,
      quantity: 1,
      image: 'assets/images/pukis-box.jpg',
      toppings: { ...customBox }
    };

    addToCart(customItem);

    // Reset Customizer
    Object.keys(customBox).forEach(key => customBox[key] = 0);
    renderCustomizerUI();
  });

  // Initial render
  renderCustomizerUI();
}

// SETUP PRESET LISTENERS
function setupPresetListeners() {
  const addCampurBtn = document.getElementById('add-campur-btn');
  const addSingleBtn = document.getElementById('add-single-btn');
  const singleToppingSelect = document.getElementById('single-topping-select');

  if (addCampurBtn) {
    addCampurBtn.addEventListener('click', () => {
      const item = {
        id: 'campur-premium',
        name: 'Paket Campur Premium (5 Varian)',
        price: 20000,
        quantity: 1,
        image: 'assets/images/pukis-hero.jpg'
      };
      addToCart(item);
    });
  }

  if (addSingleBtn && singleToppingSelect) {
    addSingleBtn.addEventListener('click', () => {
      const selectedTopping = singleToppingSelect.value;
      const item = {
        id: 'single-flavor',
        name: `Paket Satu Rasa (${selectedTopping})`,
        topping: selectedTopping,
        price: 20000,
        quantity: 1,
        image: 'assets/images/pukis-menu.jpg'
      };
      addToCart(item);
    });
  }
}

// TOAST NOTIFICATION
function showToast(message) {
  // Create toast container if not exists
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '24px';
    toastContainer.style.left = '50%';
    toastContainer.style.transform = 'translateX(-50%)';
    toastContainer.style.zIndex = '9999';
    toastContainer.style.display = 'flex';
    toastContainer.style.flexDirection = 'column';
    toastContainer.style.gap = '8px';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.style.backgroundColor = '#3d2612';
  toast.style.color = '#fefae0';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '8px';
  toast.style.fontSize = '0.95rem';
  toast.style.fontWeight = '500';
  toast.style.boxShadow = '0 10px 20px rgba(0,0,0,0.15)';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'all 0.3s ease';
  toast.innerHTML = `<i class="fas fa-check-circle" style="color: #faedcd; margin-right: 8px;"></i> ${message}`;
  
  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  // Auto remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// CHECKOUT & WHATSAPP REDIRECT
function handleCheckoutSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('customer-name').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  const delivery = document.getElementById('delivery-method').value;
  const address = document.getElementById('customer-address').value.trim();
  const notes = document.getElementById('order-notes').value.trim();

  if (!name || !phone || !address) {
    alert('Harap isi semua kolom wajib (Nama, WhatsApp, dan Alamat)!');
    return;
  }

  // Format WhatsApp message
  let message = `Halo Pukis Delights! Saya ingin memesan Kue Pukis:\n\n`;
  message += `*🛒 DETAIL PESANAN:*\n`;

  cart.forEach((item, index) => {
    message += `${index + 1}. *${item.name}*\n`;
    if (item.id === 'single-flavor') {
      message += `   - Topping: ${item.topping}\n`;
    } else if (item.id === 'custom-box') {
      const toppingDetails = Object.entries(item.toppings)
        .filter(([_, qty]) => qty > 0)
        .map(([name, qty]) => `${name} (${qty})`)
        .join(', ');
      message += `   - Rincian: ${toppingDetails}\n`;
    }
    message += `   - Jumlah: ${item.quantity} Box\n`;
    message += `   - Subtotal: ${formatRupiah(item.price * item.quantity)}\n\n`;
  });

  message += `-----------------------------\n`;
  message += `*Total Belanja:* *${formatRupiah(getCartTotal())}*\n\n`;

  message += `*📍 DATA PENGIRIMAN:*\n`;
  message += `- *Nama:* ${name}\n`;
  message += `- *No. WhatsApp:* ${phone}\n`;
  message += `- *Metode:* ${delivery}\n`;
  message += `- *Alamat:* ${address}\n`;
  if (notes) {
    message += `- *Catatan:* ${notes}\n`;
  }
  
  message += `\nTerima kasih!`;

  // WhatsApp configuration
  const targetNumber = '6281299307958'; // User provided number
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?phone=${targetNumber}&text=${encodedText}`;

  // Open WhatsApp in a new tab
  window.open(waUrl, '_blank');

  // Clear cart and state
  cart = [];
  saveCart();
  closeCheckoutModal();

  // Reset form
  checkoutForm.reset();

  showToast('Pesanan dikirim! Anda sedang dialihkan ke WhatsApp...');
}
