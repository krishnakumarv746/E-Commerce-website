// ===================================================
// MY SHOPPING CART - APPLICATION LOGIC (js/script.js)
// ===================================================

// ================= GLOBAL STATE =================
let allCategories = [];
let cartItems = [];
let currentBuyProduct = null;
let currentBuyQty = 1;

// ================= SCROLL RESTORATION OVERRIDE =================
// Ensure that on page refresh or initial load, the browser resets scroll to the very top (0, 0)
// so that the Header Banner with the Orbiko logo and title is always prominently visible!
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

// ================= INIT =================
$(document).ready(function () {
  window.scrollTo(0, 0);
  loadProductData();
});

window.addEventListener("load", function () {
  window.scrollTo(0, 0);
});

// ================= LOAD PRODUCT DATA (FROM JSON) =================
async function loadProductData() {
  try {
    const response = await fetch("json/products.json");
    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }
    const data = await response.json();
    allCategories = data.categories;
    console.log("Loaded products from json/products.json successfully:", allCategories.length, "categories");
  } catch (error) {
    console.warn("Could not fetch json/products.json (e.g. file:// CORS protocol). Using fallback data.", error);
    allCategories = fallbackProductData.categories;
  }

  // Initialize UI components
  initStore();
}

let currentActiveCategoryIndex = 0;

function initStore() {
  renderNavMenu();
  renderCarousel(allCategories);
  // Note: Products below remain hidden initially until user touches/clicks navbar

  // Initialize Carousel with 10-second interval (10000ms) and start cycling banners
  $("#demo").carousel({
    interval: 10000,
    pause: "hover",
    ride: "carousel"
  });
  $("#demo").carousel("cycle");

  // Carousel auto-slide only cycles banner images; it does NOT update or reveal products below
  $("#demo").off("slid.bs.carousel");

  // 1. Load persistent cart from cookies/localStorage
  loadCartFromCookie();

  // 2. Prompt centered Cookie Consent Popup if user hasn't made a decision
  initCookieConsent();

  console.log("Store initialized with", allCategories.length, "categories. 6 Products will appear ONLY when navbar is touched.");
}

// ================= RENDER NAV MENU =================
// ================= NAV CATEGORY ICONS =================
const navCategoryIcons = {
  "APPLIANCES": "bi-tv",
  "CLOTHING": "bi-person-standing",
  "MEN'S WEAR": "bi-person",
  "WOMEN'S WEAR": "bi-person-heart",
  "ELECTRONICS": "bi-laptop",
  "SPORTS": "bi-trophy",
  "FURNITURE": "bi-house-heart",
  "BOOKS": "bi-book-half",
  "FOOD": "bi-egg-fried"
};

// ================= RENDER NAV MENU =================
function renderNavMenu() {
  const navMenu = document.getElementById("navMenu");
  if (!navMenu) return;

  let html = "";

  allCategories.forEach((cat, index) => {
    if (cat.name === "MEN'S WEAR" || cat.name === "MEN'S COSTUMES") {
      // Clothing Dropdown
      html += `
        <li class="nav-item dropdown">
          <a class="nav-link btn btn-primary dropdown-toggle" href="#"
             id="clothingDropdown" role="button" data-toggle="dropdown"
             aria-haspopup="true" aria-expanded="false">
            <i class="bi bi-person-standing mr-1"></i> CLOTHING
          </a>
          <div class="dropdown-menu" aria-labelledby="clothingDropdown">
            <a class="dropdown-item" href="#"
               onclick="goToCategory(${index}); return false;">
              <i class="bi bi-person mr-2"></i> MEN'S WEAR
            </a>
            <a class="dropdown-item" href="#"
               onclick="goToCategory(${index + 1}); return false;">
              <i class="bi bi-person-heart mr-2"></i> WOMEN'S WEAR
            </a>
          </div>
        </li>
      `;
    } else if (cat.name === "WOMEN'S WEAR" || cat.name === "WOMEN'S COSTUMES") {
      return; // Already part of CLOTHING dropdown
    } else {
      const iconClass = navCategoryIcons[cat.navName] || "bi-tag";
      html += `
        <li class="nav-item">
          <a class="nav-link btn btn-primary" href="#"
             data-nav-index="${index}"
             onclick="goToCategory(${index}); return false;">
            <i class="bi ${iconClass} mr-1"></i> ${cat.navName}
          </a>
        </li>
      `;
    }
  });

  navMenu.innerHTML = html;
}

// ================= HIGHLIGHT ACTIVE NAV =================
function highlightNav(index) {
  document.querySelectorAll(".nav-link").forEach((el) => {
    el.classList.remove("active-nav");
  });
  const active = document.querySelector(`.nav-link[data-nav-index="${index}"]`);
  if (active) {
    active.classList.add("active-nav");
  } else if (
    allCategories[index] &&
    (allCategories[index].name === "MEN'S WEAR" ||
      allCategories[index].name === "WOMEN'S WEAR" ||
      allCategories[index].name === "MEN'S COSTUMES" ||
      allCategories[index].name === "WOMEN'S COSTUMES")
  ) {
    const clothing = document.getElementById("clothingDropdown");
    if (clothing) clothing.classList.add("active-nav");
  }
}

// ================= RENDER CAROUSEL =================
function renderCarousel(categories) {
  const indicatorsEl = document.getElementById("carouselIndicators");
  const innerEl = document.getElementById("carouselInner");
  if (!indicatorsEl || !innerEl) return;

  let indicatorsHTML = "";
  let innerHTML = "";

  categories.forEach((cat, index) => {
    indicatorsHTML += `<li data-target="#demo" data-slide-to="${index}" ${index === 0 ? 'class="active"' : ""}></li>`;

    innerHTML += `
      <div class="carousel-item ${index === 0 ? "active" : ""}">
        <img src="${cat.banner}" class="carousel-banner-img" alt="${cat.name}">
        <div class="category-title">
          <h3 style="color:${cat.titleColor};">${cat.name}</h3>
        </div>
      </div>
    `;
  });

  indicatorsEl.innerHTML = indicatorsHTML;
  innerEl.innerHTML = innerHTML;
}

// ================= RENDER PRODUCTS BELOW =================
function renderProductsBelow(index) {
  const category = allCategories[index];
  if (!category) return;

  const gridEl = document.getElementById("productsGrid");
  const titleEl = document.getElementById("productsCategoryTitle");
  if (!gridEl || !titleEl) return;

  let cardsHTML = "";
  category.products.forEach((product) => {
    cardsHTML += `
      <div class="product-card">
        <img src="${product.image}" class="product-img" alt="${product.name}">
        <span class="badge-fashion">${product.category}</span>
        <h6 class="product-name" title="${product.name}">${product.name}</h6>
        <div class="product-price">
          <span class="price-current">₹${formatPrice(product.price)}</span>
          <span class="price-original">₹${formatPrice(product.originalPrice)}</span>
        </div>
        <div class="product-actions">
          <button class="btn btn-cart" onclick="addToCart(${product.id})">
            <i class="bi bi-cart-plus-fill"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
  });

  gridEl.innerHTML = cardsHTML;
  titleEl.innerHTML = `<h3 style="color:${category.titleColor};">${category.name}</h3>`;
}

// ================= FORMAT PRICE =================
function formatPrice(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ================= NAV MENU — GO TO CATEGORY =================
function goToCategory(index, shouldSave = true) {
  console.log("goToCategory called with index:", index);

  if (index < 0 || index >= allCategories.length) {
    console.warn("Invalid category index:", index);
    return;
  }

  currentActiveCategoryIndex = index;

  try {
    $("#demo").carousel(index);
    $("#demo").carousel("cycle");
  } catch (err) {
    console.error("Carousel error:", err);
  }

  // Reveal the 6 products container ONLY when a navbar category is touched/clicked
  const productsBelowEl = document.getElementById("productsBelow");
  if (productsBelowEl) {
    productsBelowEl.style.display = "block";
  }

  renderProductsBelow(index);
  highlightNav(index);

  const navCollapse = document.getElementById("collapsibleNavBar");
  if (navCollapse && navCollapse.classList.contains("show")) {
    $(navCollapse).collapse("hide");
  }

  // Smoothly scroll down so user immediately sees the 6 products ONLY when clicked by user
  if (shouldSave) {
    setTimeout(() => {
      if (productsBelowEl) {
        productsBelowEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
    saveSessionState(index, window.scrollY);
  }

  console.log("Navigated to:", allCategories[index].name);
}

// ================= ADD TO CART & CART DRAWER =================
function addToCart(productInput) {
  let product = null;
  if (typeof productInput === "number") {
    product = findProductById(productInput);
  } else if (typeof productInput === "string") {
    product = findProductByName(productInput);
  }

  if (!product && typeof productInput === "string") {
    product = {
      id: Date.now(),
      name: productInput,
      price: 0,
      image: "images/Cart_icon.png",
      category: "General",
    };
  }

  if (!product) return;

  const existing = cartItems.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || Math.round(product.price * 1.3),
      discount: product.discount || "",
      image: product.image,
      category: product.category,
      quantity: 1,
    });
  }

  updateCartBadge();
  saveCartToCookie();

  // Open right-side corner small window pop up immediately when Add to Cart is clicked
  openCartWindow();
  console.log("Cart Items:", cartItems);
}

function toggleCartWindow() {
  const win = document.getElementById("rightCornerCartWindow");
  if (!win) return;
  if (win.classList.contains("open")) {
    closeCartWindow();
  } else {
    openCartWindow();
  }
}

function openCartWindow() {
  renderCartItems();
  const win = document.getElementById("rightCornerCartWindow");
  if (win) {
    win.classList.add("open");
  }
}

function closeCartWindow() {
  const win = document.getElementById("rightCornerCartWindow");
  if (win) {
    win.classList.remove("open");
  }
}

// Close right corner cart window when clicking outside
document.addEventListener("click", function (e) {
  const cartWin = document.getElementById("rightCornerCartWindow");
  if (!cartWin || !cartWin.classList.contains("open")) return;

  // Never close cart window if Buy modal or Order success modal is open (both must remain visible!)
  const isBuyModalOpen =
    (window.jQuery && $("#buyNowModal").hasClass("show")) ||
    (window.jQuery && $("#orderSuccessModal").hasClass("show"));
  if (isBuyModalOpen) return;

  // If clicked element was detached during re-render (e.g. qty +/- buttons or delete), DO NOT close!
  if (!e.target.isConnected) return;

  // If click is inside the cart window, DO NOT close!
  if (cartWin.contains(e.target) || e.target.closest("#rightCornerCartWindow")) return;

  // Don't close if clicking Add to Cart buttons, Buy buttons, qty buttons, or inside modal
  if (
    e.target.closest(".btn-cart") ||
    e.target.closest(".btn-cart-buy") ||
    e.target.closest(".cart-qty-btn") ||
    e.target.closest(".modal") ||
    e.target.closest(".modal-backdrop")
  ) {
    return;
  }

  closeCartWindow();
});

function openCartModal() {
  openCartWindow();
}

function getCartTotalCount() {
  return cartItems.reduce((acc, item) => acc + item.quantity, 0);
}

function updateCartBadge() {
  const badge = document.getElementById("cartCountBadge");
  if (badge) {
    badge.textContent = getCartTotalCount();
  }
}

function renderCartItems() {
  const container = document.getElementById("cartItemsContainer");
  const footer = document.getElementById("cartFooterSection");
  const totalEl = document.getElementById("cartModalTotal");
  const subtextEl = document.getElementById("cartWindowSubtext");

  if (!container) return;

  const totalCount = getCartTotalCount();
  if (subtextEl) {
    subtextEl.textContent = totalCount === 1 ? "1 item in cart" : `${totalCount} items in cart`;
  }

  if (cartItems.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 px-2">
        <i class="bi bi-cart-x text-muted" style="font-size: 2.8rem;"></i>
        <h6 class="text-dark font-weight-bold mt-2 mb-1">Your cart is empty!</h6>
        <p class="text-secondary small mb-3">Touch category in navbar to add items and buy them.</p>
        <button type="button" class="btn btn-primary btn-sm px-3 font-weight-bold" onclick="closeCartWindow()">Shop Now</button>
      </div>
    `;
    if (footer) footer.classList.add("d-none");
    if (totalEl) totalEl.textContent = "₹0";
    return;
  }

  let grandTotal = 0;
  let html = `<div class="cart-items-list">`;

  cartItems.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    grandTotal += itemTotal;
    html += `
      <div class="cart-item-card">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="d-flex justify-content-between align-items-start">
            <div class="cart-item-title" title="${item.name}">${item.name}</div>
            <button type="button" class="btn btn-link text-danger p-0 ml-1" onclick="removeCartItem(event, ${index})" title="Remove item">
              <i class="bi bi-trash" style="font-size: 13px;"></i>
            </button>
          </div>
          <div class="d-flex align-items-center justify-content-between mt-1">
            <span class="cart-item-price">₹${formatPrice(item.price)}</span>
            <div class="cart-qty-ctrl">
              <button type="button" class="cart-qty-btn" onclick="changeCartItemQty(event, ${index}, -1)" title="Decrease quantity">-</button>
              <span class="cart-qty-val">${item.quantity}</span>
              <button type="button" class="cart-qty-btn" onclick="changeCartItemQty(event, ${index}, 1)" title="Increase quantity">+</button>
            </div>
          </div>
          <div class="d-flex align-items-center justify-content-between mt-2 pt-1 border-top">
            <span class="cart-item-subtotal">Subtotal: <strong>₹${formatPrice(itemTotal)}</strong></span>
            <button type="button" class="btn btn-cart-buy btn-sm" onclick="buyCartItem(event, ${index})" title="Buy this product">
              <i class="bi bi-lightning-fill"></i> Buy
            </button>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;

  if (footer) footer.classList.remove("d-none");
  if (totalEl) totalEl.textContent = "₹" + formatPrice(grandTotal);

  const checkoutBtn = document.getElementById("cartCheckoutBtn");
  if (checkoutBtn) {
    checkoutBtn.innerHTML = `<i class="bi bi-bag-check-fill mr-1"></i> Proceed to Buy (${totalCount} Items • ₹${formatPrice(grandTotal)})`;
  }
}

function buyCartItem(e, index) {
  if (e && e.stopPropagation) {
    e.stopPropagation();
  }
  let actualIndex = index;
  if (typeof e === "number") {
    actualIndex = e;
  }
  if (!cartItems[actualIndex]) return;
  const item = cartItems[actualIndex];

  // Keep the Cart Window open in the top-right corner so BOTH windows are visible!
  openCartWindow();

  const productToBuy = {
    id: item.id,
    name: item.name,
    price: item.price,
    originalPrice: item.originalPrice || Math.round(item.price * 1.3),
    discount: item.discount || "Cart Special",
    image: item.image,
    _fromCartIndex: actualIndex
  };

  buyNow(productToBuy, item.price, item.image, item.quantity);
}

function changeCartItemQty(e, index, delta) {
  if (e && e.stopPropagation) {
    e.stopPropagation();
  }
  let actualIndex = index;
  let actualDelta = delta;
  if (typeof e === "number") {
    actualIndex = e;
    actualDelta = index;
  }
  if (cartItems[actualIndex]) {
    cartItems[actualIndex].quantity += actualDelta;
    if (cartItems[actualIndex].quantity <= 0) {
      cartItems.splice(actualIndex, 1);
    }
    updateCartBadge();
    renderCartItems();
    saveCartToCookie();
  }
}

function removeCartItem(e, index) {
  if (e && e.stopPropagation) {
    e.stopPropagation();
  }
  let actualIndex = index;
  if (typeof e === "number") {
    actualIndex = e;
  }
  if (cartItems[actualIndex]) {
    cartItems.splice(actualIndex, 1);
    updateCartBadge();
    renderCartItems();
    saveCartToCookie();
  }
}

function clearCart(e) {
  if (e && e.stopPropagation) {
    e.stopPropagation();
  }
  if (confirm("Are you sure you want to clear all items from your cart?")) {
    cartItems = [];
    updateCartBadge();
    renderCartItems();
    saveCartToCookie();
  }
}

function checkoutCart() {
  if (cartItems.length === 0) return;

  // Keep the Cart Window open in the top-right corner!
  openCartWindow();

  const grandTotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalCount = getCartTotalCount();

  buyNow({
    id: 99999,
    name: `Cart Order (${totalCount} Items)`,
    price: grandTotal,
    originalPrice: Math.round(grandTotal * 1.3),
    discount: "Combo Savings",
    image: cartItems[0] ? cartItems[0].image : "images/Cart_icon.png",
  }, grandTotal, null, 1);
}

// ================= BUY NOW & CHECKOUT =================
function findProductById(id) {
  for (const cat of allCategories) {
    const found = cat.products.find((p) => p.id === id);
    if (found) return found;
  }
  return null;
}

function findProductByName(name) {
  for (const cat of allCategories) {
    const found = cat.products.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (found) return found;
  }
  return null;
}

function buyNow(productInput, price, image, initialQty = 1) {
  let product = null;
  if (typeof productInput === "object" && productInput !== null) {
    product = productInput;
  } else if (typeof productInput === "number") {
    product = findProductById(productInput);
  } else if (typeof productInput === "string") {
    product = findProductByName(productInput);
  }

  if (!product && typeof productInput === "string") {
    product = {
      name: productInput,
      price: price || 0,
      originalPrice: price || 0,
      discount: "",
      image: image || "images/Cart_icon.png",
    };
  }

  if (!product) {
    alert("Product not found!");
    return;
  }

  currentBuyProduct = product;
  currentBuyQty = initialQty || 1;

  const modalImg = document.getElementById("buyModalImg");
  const modalTitle = document.getElementById("buyModalTitle");
  const modalPrice = document.getElementById("buyModalPrice");
  const modalOrigPrice = document.getElementById("buyModalOriginalPrice");
  const modalDiscount = document.getElementById("buyModalDiscount");
  const modalQty = document.getElementById("buyModalQty");

  if (modalImg) modalImg.src = product.image;
  if (modalTitle) modalTitle.textContent = product.name;
  if (modalPrice) modalPrice.textContent = "₹" + formatPrice(product.price);
  if (modalOrigPrice)
    modalOrigPrice.textContent = product.originalPrice
      ? "₹" + formatPrice(product.originalPrice)
      : "";
  if (modalDiscount)
    modalDiscount.textContent = product.discount || "Special Offer";
  if (modalQty) modalQty.value = currentBuyQty;

  updateBuyTotal();

  const nameInput = document.getElementById("buyCustomerName");
  const phoneInput = document.getElementById("buyCustomerPhone");
  const addrInput = document.getElementById("buyCustomerAddress");
  const codRadio = document.getElementById("payCOD");

  if (nameInput) nameInput.value = "";
  if (phoneInput) phoneInput.value = "";
  if (addrInput) addrInput.value = "";
  if (codRadio) codRadio.checked = true;

  if (window.jQuery && $("#buyNowModal").length) {
    $("#buyNowModal").modal("show");
  } else {
    const confirmed = confirm(
      `Buy Now: ${product.name}\nPrice: ₹${formatPrice(product.price)}\n\nProceed to place order?`,
    );
    if (confirmed) {
      alert(`🎉 Order Placed Successfully for ${product.name}!`);
    }
  }
}

function changeBuyQty(delta) {
  currentBuyQty = Math.max(1, currentBuyQty + delta);
  const qtyInput = document.getElementById("buyModalQty");
  if (qtyInput) qtyInput.value = currentBuyQty;
  updateBuyTotal();
}

function updateBuyTotal() {
  if (!currentBuyProduct) return;
  const total = currentBuyProduct.price * currentBuyQty;
  const summaryItem = document.getElementById("buySummaryItemTotal");
  const summaryGrand = document.getElementById("buySummaryGrandTotal");
  if (summaryItem) summaryItem.textContent = "₹" + formatPrice(total);
  if (summaryGrand) summaryGrand.textContent = "₹" + formatPrice(total);
}

function confirmOrder(event) {
  if (event) event.preventDefault();
  if (!currentBuyProduct) return;

  const nameInput = document.getElementById("buyCustomerName");
  const phoneInput = document.getElementById("buyCustomerPhone");
  const addrInput = document.getElementById("buyCustomerAddress");

  const name =
    nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Valued Customer";
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const address = addrInput ? addrInput.value.trim() : "";
  const paymentMethod =
    document.querySelector('input[name="paymentMethod"]:checked')?.value ||
    "Cash on Delivery";
  const total = currentBuyProduct.price * currentBuyQty;
  const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);

  if (window.jQuery && $("#buyNowModal").length) {
    $("#buyNowModal").modal("hide");
  }

  // If this was a full cart checkout order, clear cart items and update cookie
  if (currentBuyProduct && currentBuyProduct.id === 99999) {
    cartItems = [];
    updateCartBadge();
    saveCartToCookie();
  } else if (currentBuyProduct && currentBuyProduct._fromCartIndex !== undefined) {
    // If user bought a single item directly from cart, remove that item from cart
    const idx = currentBuyProduct._fromCartIndex;
    if (cartItems[idx] && cartItems[idx].id === currentBuyProduct.id) {
      cartItems.splice(idx, 1);
    } else {
      const foundIdx = cartItems.findIndex(i => i.id === currentBuyProduct.id);
      if (foundIdx !== -1) cartItems.splice(foundIdx, 1);
    }
    updateCartBadge();
    saveCartToCookie();
  }

  // Refresh open cart window so it shows the updated cart state
  renderCartItems();

  setTimeout(() => {
    const successMsg = document.getElementById("successOrderMessage");
    const successDetails = document.getElementById("successOrderDetails");

    if (successMsg) {
      successMsg.textContent = `Thank you, ${name}! Your order has been placed successfully.`;
    }

    if (successDetails) {
      successDetails.innerHTML = `
        <div class="small mb-1"><strong>Order ID:</strong> <span class="badge badge-primary">${orderId}</span></div>
        <div class="small mb-1"><strong>Product:</strong> ${currentBuyProduct.name}</div>
        <div class="small mb-1"><strong>Quantity:</strong> ${currentBuyQty}</div>
        <div class="small mb-1"><strong>Total Paid:</strong> ₹${formatPrice(total)}</div>
        <div class="small mb-1"><strong>Payment Method:</strong> ${paymentMethod}</div>
        <div class="small"><strong>Delivery To:</strong> ${address} ${phone ? "(" + phone + ")" : ""}</div>
      `;
    }

    if (window.jQuery && $("#orderSuccessModal").length) {
      $("#orderSuccessModal").modal("show");
    } else {
      alert(
        `🎉 Order Confirmed!\nOrder ID: ${orderId}\nProduct: ${currentBuyProduct.name}\nQuantity: ${currentBuyQty}\nTotal: ₹${formatPrice(total)}`,
      );
    }
  }, 400);
}

// ================= FALLBACK PRODUCT DATA (FOR FILE:// PROTOCOL) =================
const fallbackProductData = {
  "categories": [
    {
      "id": 1,
      "name": "HOME APPLIANCES",
      "navName": "APPLIANCES",
      "titleColor": "#0d47a1",
      "banner": "images/ac.jpg",
      "products": [
        {
          "id": 101,
          "name": "Double Door Refrigerator (French Door)",
          "category": "Appliances",
          "image": "images/a (4).jpg",
          "price": 28990,
          "originalPrice": 39990,
          "discount": "28% off"
        },
        {
          "id": 102,
          "name": "55-Inch 4K Ultra HD Smart LED TV",
          "category": "Appliances",
          "image": "images/a (3).jpg",
          "price": 32499,
          "originalPrice": 49990,
          "discount": "35% off"
        },
        {
          "id": 103,
          "name": "1.5 Ton 5-Star Split Inverter AC",
          "category": "Appliances",
          "image": "images/ac.jpg",
          "price": 34990,
          "originalPrice": 48000,
          "discount": "27% off"
        },
        {
          "id": 104,
          "name": "28L Convection Microwave Oven",
          "category": "Appliances",
          "image": "images/a (5).jpg",
          "price": 11490,
          "originalPrice": 16990,
          "discount": "32% off"
        },
        {
          "id": 105,
          "name": "Canister Vacuum Cleaner (1900W)",
          "category": "Appliances",
          "image": "images/a (2).jpg",
          "price": 4999,
          "originalPrice": 7999,
          "discount": "38% off"
        },
        {
          "id": 106,
          "name": "High-Speed Oscillating Table Fan",
          "category": "Appliances",
          "image": "images/a (6).jpg",
          "price": 1899,
          "originalPrice": 2899,
          "discount": "34% off"
        }
      ]
    },
    {
      "id": 2,
      "name": "MEN'S WEAR",
      "navName": "MEN'S WEAR",
      "titleColor": "#b71c1c",
      "banner": "images/f (3).jpg",
      "products": [
        {
          "id": 201,
          "name": "Men's Formal Leather Shoes (Black)",
          "category": "Footwear",
          "image": "images/f (1).jpg",
          "price": 1799,
          "originalPrice": 3499,
          "discount": "49% off"
        },
        {
          "id": 202,
          "name": "Nike Men's Free Run Sports Shoes (Red)",
          "category": "Footwear",
          "image": "images/f (2).jpg",
          "price": 4295,
          "originalPrice": 7995,
          "discount": "46% off"
        },
        {
          "id": 203,
          "name": "Men's Navy Blue Casual Linen Shirt",
          "category": "Fashion",
          "image": "images/f (3).jpg",
          "price": 799,
          "originalPrice": 1599,
          "discount": "50% off"
        },
        {
          "id": 204,
          "name": "Men's Cotton Plain T-Shirt (Beige)",
          "category": "Fashion",
          "image": "images/f (4).jpg",
          "price": 449,
          "originalPrice": 999,
          "discount": "55% off"
        },
        {
          "id": 205,
          "name": "Formal Shirts & Ties Combo Pack (Set of 4)",
          "category": "Fashion",
          "image": "images/f (5).jpg",
          "price": 2499,
          "originalPrice": 4999,
          "discount": "50% off"
        },
        {
          "id": 206,
          "name": "Men's Slim Fit Formal Trousers (Black)",
          "category": "Fashion",
          "image": "images/f (6).jpg",
          "price": 899,
          "originalPrice": 1899,
          "discount": "53% off"
        }
      ]
    },
    {
      "id": 3,
      "name": "WOMEN'S WEAR",
      "navName": "WOMEN'S WEAR",
      "titleColor": "#880e4f",
      "banner": "images/w (6).png",
      "products": [
        {
          "id": 301,
          "name": "Women's Designer Shoulder Tote Handbag",
          "category": "Fashion",
          "image": "images/w (1).jpg",
          "price": 1299,
          "originalPrice": 2699,
          "discount": "52% off"
        },
        {
          "id": 302,
          "name": "Women's Casual Slip-On Loafers (Navy Blue)",
          "category": "Footwear",
          "image": "images/w (2).jpg",
          "price": 899,
          "originalPrice": 1799,
          "discount": "50% off"
        },
        {
          "id": 303,
          "name": "Kanjivaram Silk Zari Saree (Yellow & Blue)",
          "category": "Ethnic Wear",
          "image": "images/w (3).jpg",
          "price": 2999,
          "originalPrice": 6999,
          "discount": "57% off"
        },
        {
          "id": 304,
          "name": "Women's Striped Casual Crop Shirt",
          "category": "Fashion",
          "image": "images/w (4).jpg",
          "price": 599,
          "originalPrice": 1299,
          "discount": "54% off"
        },
        {
          "id": 305,
          "name": "Women's High-Rise Straight Fit Denim Jeans",
          "category": "Fashion",
          "image": "images/w (5).png",
          "price": 1199,
          "originalPrice": 2499,
          "discount": "52% off"
        },
        {
          "id": 306,
          "name": "Designer Georgette Embroidered Party Saree",
          "category": "Ethnic Wear",
          "image": "images/w (6).png",
          "price": 2499,
          "originalPrice": 5499,
          "discount": "55% off"
        }
      ]
    },
    {
      "id": 4,
      "name": "ELECTRONICS & GADGETS",
      "navName": "ELECTRONICS",
      "titleColor": "#00695c",
      "banner": "images/e (2).jpg",
      "products": [
        {
          "id": 401,
          "name": "Apple iPhone 15 (128GB, White)",
          "category": "Electronics",
          "image": "images/e (1).jpg",
          "price": 65999,
          "originalPrice": 79900,
          "discount": "17% off"
        },
        {
          "id": 402,
          "name": "5.1 Dolby Surround Soundbar with Subwoofer",
          "category": "Electronics",
          "image": "images/e (2).jpg",
          "price": 8999,
          "originalPrice": 15999,
          "discount": "44% off"
        },
        {
          "id": 403,
          "name": "Wireless Noise Cancelling Over-Ear Headphones",
          "category": "Electronics",
          "image": "images/e (3).jpg",
          "price": 3499,
          "originalPrice": 6999,
          "discount": "50% off"
        },
        {
          "id": 404,
          "name": "Professional 24.2 MP DSLR Camera with Lens",
          "category": "Electronics",
          "image": "images/e (4).jpg",
          "price": 42990,
          "originalPrice": 54990,
          "discount": "22% off"
        },
        {
          "id": 405,
          "name": "1.69-Inch Bluetooth Calling Smartwatch",
          "category": "Electronics",
          "image": "images/e (5).jpg",
          "price": 1499,
          "originalPrice": 3999,
          "discount": "63% off"
        },
        {
          "id": 406,
          "name": "Apple AirPods Pro (2nd Gen) with MagSafe Case",
          "category": "Electronics",
          "image": "images/a (1).jpg",
          "price": 18999,
          "originalPrice": 24900,
          "discount": "24% off"
        }
      ]
    },
    {
      "id": 5,
      "name": "SPORTS & GAMES",
      "navName": "SPORTS",
      "titleColor": "#e65100",
      "banner": "images/s (1).jpg",
      "products": [
        {
          "id": 501,
          "name": "Sony PlayStation 5 Console (Disc Edition + Game)",
          "category": "Gaming",
          "image": "images/s (1).jpg",
          "price": 49990,
          "originalPrice": 54990,
          "discount": "9% off"
        },
        {
          "id": 502,
          "name": "Badminton Set (2 Rackets + Shuttlecock)",
          "category": "Sports",
          "image": "images/s (2).jpg",
          "price": 699,
          "originalPrice": 1299,
          "discount": "46% off"
        },
        {
          "id": 503,
          "name": "Handcrafted Wooden Chess Board Set (32 Pieces)",
          "category": "Board Games",
          "image": "images/s (3).jpg",
          "price": 1199,
          "originalPrice": 2199,
          "discount": "45% off"
        },
        {
          "id": 504,
          "name": "Tournament Carrom Board with Coins & Striker",
          "category": "Board Games",
          "image": "images/s (4).jpg",
          "price": 1899,
          "originalPrice": 3299,
          "discount": "42% off"
        },
        {
          "id": 505,
          "name": "Full Cricket Kit (Kashmir Willow Bat & Stumps)",
          "category": "Sports",
          "image": "images/s (5).jpg",
          "price": 2299,
          "originalPrice": 4199,
          "discount": "45% off"
        },
        {
          "id": 506,
          "name": "Professional Captain Size-5 Match Football",
          "category": "Sports",
          "image": "images/s (6).jpg",
          "price": 599,
          "originalPrice": 1199,
          "discount": "50% off"
        }
      ]
    },
    {
      "id": 6,
      "name": "HOME DECOR & FURNITURE",
      "navName": "FURNITURE",
      "titleColor": "#4e342e",
      "banner": "images/h (5).jpg",
      "products": [
        {
          "id": 601,
          "name": "Antique Anchor Wooden Wall Clock",
          "category": "Home Decor",
          "image": "images/h (1).jpg",
          "price": 1299,
          "originalPrice": 2499,
          "discount": "48% off"
        },
        {
          "id": 602,
          "name": "Ajanta Living Room Minimalist Wall Clock",
          "category": "Home Decor",
          "image": "images/h (2).jpg",
          "price": 799,
          "originalPrice": 1499,
          "discount": "47% off"
        },
        {
          "id": 603,
          "name": "Nordic Ceramic Flower Vases (Set of 3)",
          "category": "Home Decor",
          "image": "images/h (3).jpg",
          "price": 999,
          "originalPrice": 1899,
          "discount": "47% off"
        },
        {
          "id": 604,
          "name": "Ergonomic Office Table with Mesh Chair Set",
          "category": "Furniture",
          "image": "images/h (4).jpg",
          "price": 7499,
          "originalPrice": 12999,
          "discount": "42% off"
        },
        {
          "id": 605,
          "name": "Luxury 5-Seater Living Room Sofa with Coffee Table",
          "category": "Furniture",
          "image": "images/h (5).jpg",
          "price": 34999,
          "originalPrice": 52000,
          "discount": "33% off"
        },
        {
          "id": 606,
          "name": "Traditional Printed Living Room Floor Rug Carpet",
          "category": "Home Decor",
          "image": "images/h(6).jpg",
          "price": 1499,
          "originalPrice": 2999,
          "discount": "50% off"
        }
      ]
    },
    {
      "id": 7,
      "name": "BOOKS & BESTSELLERS",
      "navName": "BOOKS",
      "titleColor": "#6a1b9a",
      "banner": "images/b1.jpg",
      "products": [
        {
          "id": 701,
          "name": "The Psychology of Money",
          "category": "Finance & Wealth",
          "image": "images/b1.jpg",
          "price": 299,
          "originalPrice": 499,
          "discount": "40% off"
        },
        {
          "id": 702,
          "name": "The ONE Thing",
          "category": "Productivity",
          "image": "images/b2.jpg",
          "price": 349,
          "originalPrice": 550,
          "discount": "36% off"
        },
        {
          "id": 703,
          "name": "Letting Go: The Pathway of Surrender",
          "category": "Mindfulness",
          "image": "images/b3.jpg",
          "price": 399,
          "originalPrice": 650,
          "discount": "38% off"
        },
        {
          "id": 704,
          "name": "Atomic Habits (James Clear)",
          "category": "Self Growth",
          "image": "images/b4.jpg",
          "price": 449,
          "originalPrice": 799,
          "discount": "44% off"
        },
        {
          "id": 705,
          "name": "The Art of Being Alone",
          "category": "Mental Health",
          "image": "images/b5.jpg",
          "price": 279,
          "originalPrice": 450,
          "discount": "38% off"
        },
        {
          "id": 706,
          "name": "Master Your Emotions",
          "category": "Emotional Mastery",
          "image": "images/b6.png",
          "price": 289,
          "originalPrice": 499,
          "discount": "42% off"
        }
      ]
    },
    {
      "id": 8,
      "name": "DELICIOUS FOOD & SNACKS",
      "navName": "FOOD",
      "titleColor": "#d84315",
      "banner": "images/food1.jpg",
      "products": [
        {
          "id": 801,
          "name": "Special Hyderabadi Dum Chicken Biryani",
          "category": "Biryani & Rice",
          "image": "images/food1.jpg",
          "price": 299,
          "originalPrice": 420,
          "discount": "29% off"
        },
        {
          "id": 802,
          "name": "Crispy Hot Poori with Aloo Masala Bhaji",
          "category": "Breakfast",
          "image": "images/food2.jpg",
          "price": 119,
          "originalPrice": 170,
          "discount": "30% off"
        },
        {
          "id": 803,
          "name": "Crispy Golgappe / Pani Puri Platter (8 Pcs)",
          "category": "Street Food",
          "image": "images/food3.png",
          "price": 89,
          "originalPrice": 130,
          "discount": "32% off"
        },
        {
          "id": 804,
          "name": "Royal North Indian Deluxe Thali Special",
          "category": "North Indian",
          "image": "images/food4.jpg",
          "price": 249,
          "originalPrice": 350,
          "discount": "29% off"
        },
        {
          "id": 805,
          "name": "Soft Steamed Idli Platter with Sambar & Chutney",
          "category": "South Indian",
          "image": "images/food5.jpg",
          "price": 109,
          "originalPrice": 150,
          "discount": "27% off"
        },
        {
          "id": 806,
          "name": "Crispy Masala Dosa with Sambar & Chutneys",
          "category": "South Indian",
          "image": "images/food6.jpg",
          "price": 139,
          "originalPrice": 199,
          "discount": "30% off"
        }
      ]
    }
  ]
};

// ===================================================
// COOKIE MANAGEMENT & SESSION RESTORE SYSTEM
// ===================================================

// ===================================================
// SESSION EXPIRATION CONFIGURATION (2-3 MINUTES)
// ===================================================
// Session state (where you left off & cart) is saved for exactly 3 minutes.
// If the user reopens the website after 3 minutes, it starts completely fresh!
const SESSION_EXPIRY_MINUTES = 3;
const SESSION_EXPIRY_MS = SESSION_EXPIRY_MINUTES * 60 * 1000;

/**
 * Sets a cookie with specified name, value, and expiration in days.
 * Includes localStorage mirroring with expiration timestamp for file:/// support.
 */
function setCookie(cname, cvalue, exdays = 30) {
  try {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${encodeURIComponent(cname)}=${encodeURIComponent(cvalue)};${expires};path=/;SameSite=Lax`;
  } catch (err) {
    console.warn("Could not set cookie via document.cookie:", err);
  }

  // Fallback / mirror to localStorage with TTL expiration
  try {
    const itemWithExpiry = {
      value: cvalue,
      expiresAt: Date.now() + Math.round(exdays * 24 * 60 * 60 * 1000)
    };
    localStorage.setItem("orbiko_cookie_" + cname, JSON.stringify(itemWithExpiry));
  } catch (e) {}
}

/**
 * Gets a cookie value by name.
 * Fallbacks to localStorage if document.cookie is empty and checks expiration.
 */
function getCookie(cname) {
  try {
    const name = encodeURIComponent(cname) + "=";
    const decodedCookie = decodeURIComponent(document.cookie || "");
    const ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
  } catch (err) {}

  // Fallback to localStorage
  try {
    const localRaw = localStorage.getItem("orbiko_cookie_" + cname);
    if (localRaw !== null && localRaw !== undefined) {
      try {
        const item = JSON.parse(localRaw);
        // Check if item has TTL and expired
        if (item && item.expiresAt && Date.now() > item.expiresAt) {
          localStorage.removeItem("orbiko_cookie_" + cname);
          return "";
        }
        if (item && item.value !== undefined) {
          return item.value;
        }
      } catch (jsonErr) {
        return localRaw;
      }
    }
  } catch (e) {}

  return "";
}

/**
 * Erases a cookie by setting expiration in the past and clearing localStorage.
 */
function eraseCookie(cname) {
  try {
    document.cookie = `${encodeURIComponent(cname)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;SameSite=Lax`;
  } catch (err) {}
  try {
    localStorage.removeItem("orbiko_cookie_" + cname);
  } catch (e) {}
}

// ===================================================
// RESUME WHERE YOU LEFT OFF (3-MINUTE SESSION PERSISTENCE)
// ===================================================

/**
 * Saves current category index and scroll position into cookies & localStorage.
 * Automatically set to expire in 3 minutes.
 */
function saveSessionState(categoryIndex, scrollY) {
  try {
    if (typeof categoryIndex === "number") {
      currentActiveCategoryIndex = categoryIndex;
    }
    const y = typeof scrollY === "number" ? scrollY : (window.scrollY || 0);
    const catObj = allCategories[currentActiveCategoryIndex];
    const now = Date.now();
    const state = {
      categoryIndex: currentActiveCategoryIndex,
      categoryName: catObj ? (catObj.navName || catObj.name) : "",
      scrollY: Math.round(y),
      timestamp: now,
      expiresAt: now + SESSION_EXPIRY_MS
    };

    // Expiration in fraction of a day (3 minutes = 3 / (24 * 60) days)
    const exDays = SESSION_EXPIRY_MINUTES / (24 * 60);
    setCookie("orbiko_last_session", JSON.stringify(state), exDays);
    console.log(`Session saved -> Category: ${currentActiveCategoryIndex}, Scroll: ${Math.round(y)} (Valid for ${SESSION_EXPIRY_MINUTES} mins)`);
  } catch (e) {
    console.warn("Could not save session state:", e);
  }
}

/**
 * Restores the user's last visited category and scroll position on page load.
 * Only restores if within 3 minutes; after 3 minutes it starts completely fresh!
 */
function restoreSessionState() {
  try {
    const raw = getCookie("orbiko_last_session");
    if (!raw) {
      console.log("No active session found (< 3 mins). Starting fresh from beginning.");
      return;
    }

    const state = JSON.parse(raw);
    const now = Date.now();
    const timePassedMs = now - (state.timestamp || 0);

    // If more than 3 minutes (180,000ms) have passed, expire and start brand new
    if (timePassedMs > SESSION_EXPIRY_MS) {
      console.log(`Session expired (${Math.round(timePassedMs / 1000)}s > 3 mins). Starting brand new.`);
      eraseCookie("orbiko_last_session");
      eraseCookie("orbiko_cart_items");
      return;
    }

    if (state && typeof state.categoryIndex === "number" && state.categoryIndex >= 0 && state.categoryIndex < allCategories.length) {
      console.log(`Restoring session (valid within 3 mins, saved ${Math.round(timePassedMs / 1000)}s ago) -> Category:`, state.categoryIndex, state.categoryName);

      // Navigate to saved category without overwriting with fresh 0 index
      goToCategory(state.categoryIndex, false);

      // Keep page at the top so the Header Banner is always visible on load/refresh
      window.scrollTo(0, 0);

      // Friendly resume toast showing time elapsed
      const catDisplayName = state.categoryName || (allCategories[state.categoryIndex] ? allCategories[state.categoryIndex].name : "Store");
      const secsAgo = Math.round(timePassedMs / 1000);
      const minsAgo = Math.floor(secsAgo / 60);
      const remainingSecs = secsAgo % 60;
      const timeStr = minsAgo > 0 ? `${minsAgo}m ${remainingSecs}s ago` : `${secsAgo}s ago`;

      setTimeout(() => {
        showCookieToast(`📍 Welcome back! Resumed at ${catDisplayName} (Saved ${timeStr})`);
      }, 700);
    }
  } catch (e) {
    console.warn("Could not restore session state:", e);
  }
}

// Throttled scroll listener to keep last position updated
let scrollSaveTimer = null;
window.addEventListener("scroll", function () {
  clearTimeout(scrollSaveTimer);
  scrollSaveTimer = setTimeout(() => {
    saveSessionState(currentActiveCategoryIndex, window.scrollY);
  }, 400);
}, { passive: true });

// Also save before tab close or navigation
window.addEventListener("beforeunload", function () {
  saveSessionState(currentActiveCategoryIndex, window.scrollY);
});

// ===================================================
// SHOPPING CART PERSISTENCE (3-MINUTE WINDOW)
// ===================================================

/**
 * Saves current shopping cart items into an essential cookie with 3-minute validity.
 */
function saveCartToCookie() {
  try {
    const compactCart = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
      quantity: item.quantity
    }));
    const payload = {
      items: compactCart,
      timestamp: Date.now()
    };
    const exDays = SESSION_EXPIRY_MINUTES / (24 * 60);
    setCookie("orbiko_cart_items", JSON.stringify(payload), exDays);
  } catch (e) {
    console.warn("Could not save cart to cookie:", e);
  }
}

/**
 * Loads cart items from cookie if within 3 minutes; resets if expired.
 */
function loadCartFromCookie() {
  try {
    const raw = getCookie("orbiko_cart_items");
    if (raw) {
      const parsed = JSON.parse(raw);
      let items = [];
      let savedTime = 0;

      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && parsed.items) {
        items = parsed.items;
        savedTime = parsed.timestamp || 0;
      }

      // Check if cart session expired (> 3 mins)
      if (savedTime && (Date.now() - savedTime > SESSION_EXPIRY_MS)) {
        console.log("Cart session expired after 3 minutes. Starting brand new.");
        eraseCookie("orbiko_cart_items");
        cartItems = [];
        updateCartBadge();
        return;
      }

      if (Array.isArray(items) && items.length > 0) {
        cartItems = items;
        updateCartBadge();
        console.log("Restored", cartItems.length, "cart item(s) within 3 minutes window.");
      }
    }
  } catch (e) {
    console.warn("Could not load cart from cookie:", e);
  }
}

// ===================================================
// COOKIE CONSENT CENTER POPUP LOGIC
// ===================================================

/**
 * Initializes Cookie Consent Center Popup on page load.
 */
function initCookieConsent() {
  const consent = getCookie("orbiko_cookie_consent");
  if (!consent) {
    // Show center popup after 600ms delay so user clearly sees it
    setTimeout(() => {
      showCookiePopup();
    }, 600);
  } else {
    try {
      const prefs = JSON.parse(consent);
      syncCookieModalToggles(prefs);
    } catch (e) {}
  }
}

function showCookiePopup() {
  const overlay = document.getElementById("cookieConsentOverlay");
  if (overlay) {
    overlay.classList.add("show");
  }
}

function closeCookiePopup() {
  const overlay = document.getElementById("cookieConsentOverlay");
  if (overlay) {
    overlay.classList.remove("show");
  }
}

function openCookieModal() {
  closeCookiePopup();
  renderActiveCookiesList();
  if (window.jQuery && $("#cookieSettingsModal").length) {
    $("#cookieSettingsModal").modal("show");
  }
}

function syncCookieModalToggles(prefs) {
  const funcToggle = document.getElementById("cookieFunctionalToggle");
  const analToggle = document.getElementById("cookieAnalyticsToggle");
  const mktToggle = document.getElementById("cookieMarketingToggle");

  if (funcToggle) funcToggle.checked = prefs.functional !== false;
  if (analToggle) analToggle.checked = prefs.analytics !== false;
  if (mktToggle) mktToggle.checked = prefs.marketing === true;
}

function acceptAllCookies() {
  const consentData = {
    necessary: true,
    functional: true,
    analytics: true,
    marketing: true,
    timestamp: new Date().toISOString()
  };
  setCookie("orbiko_cookie_consent", JSON.stringify(consentData), 365);
  saveCartToCookie();
  saveSessionState(currentActiveCategoryIndex, window.scrollY);
  closeCookiePopup();
  if (window.jQuery && $("#cookieSettingsModal").length) {
    $("#cookieSettingsModal").modal("hide");
  }
  syncCookieModalToggles(consentData);
  showCookieToast("All cookies accepted! Thank you.");
}

function acceptEssentialCookies() {
  const consentData = {
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
    timestamp: new Date().toISOString()
  };
  setCookie("orbiko_cookie_consent", JSON.stringify(consentData), 365);
  closeCookiePopup();
  if (window.jQuery && $("#cookieSettingsModal").length) {
    $("#cookieSettingsModal").modal("hide");
  }
  syncCookieModalToggles(consentData);
  showCookieToast("Essential cookies saved.");
}

function saveCookiePreferences() {
  const funcToggle = document.getElementById("cookieFunctionalToggle");
  const analToggle = document.getElementById("cookieAnalyticsToggle");
  const mktToggle = document.getElementById("cookieMarketingToggle");

  const consentData = {
    necessary: true,
    functional: funcToggle ? funcToggle.checked : true,
    analytics: analToggle ? analToggle.checked : true,
    marketing: mktToggle ? mktToggle.checked : false,
    timestamp: new Date().toISOString()
  };

  setCookie("orbiko_cookie_consent", JSON.stringify(consentData), 365);
  closeCookiePopup();
  if (window.jQuery && $("#cookieSettingsModal").length) {
    $("#cookieSettingsModal").modal("hide");
  }
  showCookieToast("Your cookie preferences have been saved!");
}

function showCookieToast(msg) {
  const toast = document.getElementById("cookieToast");
  const msgEl = document.getElementById("cookieToastMsg");
  if (!toast) return;
  if (msgEl) msgEl.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

function renderActiveCookiesList() {
  const listEl = document.getElementById("activeCookiesList");
  if (!listEl) return;

  const cookieStr = document.cookie || "";
  let localKeys = [];
  try {
    localKeys = Object.keys(localStorage).filter(k => k.startsWith("orbiko_cookie_"));
  } catch (e) {}

  if (!cookieStr.trim() && localKeys.length === 0) {
    listEl.innerHTML = '<span class="text-muted">No cookies currently stored.</span>';
    return;
  }

  let html = '<div class="d-flex flex-column gap-1">';
  
  if (cookieStr.trim()) {
    const cookies = cookieStr.split(";").map(c => c.trim()).filter(Boolean);
    cookies.forEach(c => {
      const parts = c.split("=");
      const name = parts[0];
      const val = parts.slice(1).join("=");
      const displayVal = val.length > 50 ? val.substring(0, 50) + "..." : val;
      html += `
        <div class="d-flex justify-content-between border-bottom py-1">
          <span class="text-primary font-weight-bold">${escapeHtml(name)}:</span>
          <span class="text-secondary" style="max-width: 60%; word-break: break-all;">${escapeHtml(displayVal)}</span>
        </div>
      `;
    });
  }

  localKeys.forEach(k => {
    const val = localStorage.getItem(k) || "";
    const cleanName = k.replace("orbiko_cookie_", "");
    if (!cookieStr.includes(cleanName)) {
      const displayVal = val.length > 50 ? val.substring(0, 50) + "..." : val;
      html += `
        <div class="d-flex justify-content-between border-bottom py-1">
          <span class="text-info font-weight-bold">${escapeHtml(cleanName)} (Local):</span>
          <span class="text-secondary" style="max-width: 60%; word-break: break-all;">${escapeHtml(displayVal)}</span>
        </div>
      `;
    }
  });

  html += '</div>';
  listEl.innerHTML = html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clearAllOrbikoCookies() {
  eraseCookie("orbiko_cookie_consent");
  eraseCookie("orbiko_cart_items");
  eraseCookie("orbiko_last_session");
  renderActiveCookiesList();
  showCookieToast("All Orbiko cookies & saved session data cleared!");
}

