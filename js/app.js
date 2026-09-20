
const products = [];

storeData.categories.forEach(category => {

    category.subcategories.forEach(subcategory => {

        subcategory.products.forEach(product => {
            products.push(product);
        });

    });

});


// ==========================================
// CART + HISTORY
// ==========================================

let cart = [];

let undoStack = [];
let redoStack = [];

let operationHistory = [];


// ==========================================
// DOM ELEMENTS
// ==========================================

const productList = document.getElementById("product-list");

const cartItems = document.getElementById("cart-items");

const emptyCart = document.getElementById("empty-cart");

const itemCount = document.getElementById("item-count");

const summaryItems = document.getElementById("summary-items");

const cartTotal = document.getElementById("cart-total");

const undoBtn = document.getElementById("undo-btn");

const redoBtn = document.getElementById("redo-btn");

const historyList = document.getElementById("history-list");


// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function renderProducts() {

    productList.innerHTML = "";

    products.forEach(product => {

        const card = document.createElement("div");

        card.className = "product-card";

        card.innerHTML = `
            <h3>${product.name}</h3>

            <p class="product-brand">
                Brand: ${product.brand}
            </p>

            <p class="product-price">
                ₹${product.price.toLocaleString("en-IN")}
            </p>

            <p class="product-rating">
                ⭐ ${product.rating} (${product.reviews} reviews)
            </p>

            <p class="product-stock">
                Stock: ${product.stock}
            </p>

            <button
                class="add-btn"
                onclick="addToCart('${product.id}')"
            >
                Add to Cart
            </button>
        `;

        productList.appendChild(card);

    });

}


// ==========================================
// FIND PRODUCT
// ==========================================

function findProduct(productId) {

    return products.find(product => product.id === productId);

}


// ==========================================
// FIND CART ITEM
// ==========================================

function findCartItem(productId) {

    return cart.find(item => item.id === productId);

}


// ==========================================
// SAVE OPERATION
// ==========================================

function saveOperation(operation) {

    undoStack.push(operation);

    // New operation means old redo history
    // is no longer valid

    redoStack = [];

    addHistory(operation);

    updateButtons();

}


// ==========================================
// ADD TO CART
// ==========================================

function addToCart(productId, saveHistory = true) {

    const product = findProduct(productId);

    if (!product) {
        return;
    }

    const existingItem = findCartItem(productId);

    if (existingItem) {

        // Check stock
        if (existingItem.quantity >= product.stock) {

            alert("No more stock available.");

            return;
        }

        existingItem.quantity++;

        if (saveHistory) {

            saveOperation({
                type: "INCREASE",
                item: {
                    id: productId,
                    name: product.name
                }
            });

        }

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });

        if (saveHistory) {

            saveOperation({
                type: "ADD",
                item: {
                    id: product.id,
                    name: product.name
                }
            });

        }

    }

    renderCart();

}


// ==========================================
// REMOVE FROM CART
// ==========================================

function removeFromCart(productId, saveHistory = true) {

    const index = cart.findIndex(item => item.id === productId);

    if (index === -1) {
        return;
    }

    const removedItem = {
        ...cart[index]
    };

    cart.splice(index, 1);

    if (saveHistory) {

        saveOperation({
            type: "REMOVE",
            item: removedItem
        });

    }

    renderCart();

}


// ==========================================
// INCREASE QUANTITY
// ==========================================

function increaseQuantity(productId, saveHistory = true) {

    const cartItem = findCartItem(productId);

    const product = findProduct(productId);

    if (!cartItem || !product) {
        return;
    }

    if (cartItem.quantity >= product.stock) {

        alert("No more stock available.");

        return;
    }

    cartItem.quantity++;

    if (saveHistory) {

        saveOperation({
            type: "INCREASE",
            item: {
                id: productId,
                name: product.name
            }
        });

    }

    renderCart();

}


// ==========================================
// DECREASE QUANTITY
// ==========================================

function decreaseQuantity(productId, saveHistory = true) {

    const cartItem = findCartItem(productId);

    if (!cartItem) {
        return;
    }

    if (cartItem.quantity === 1) {

        removeFromCart(productId, saveHistory);

        return;
    }

    cartItem.quantity--;

    const product = findProduct(productId);

    if (saveHistory) {

        saveOperation({
            type: "DECREASE",
            item: {
                id: productId,
                name: product.name
            }
        });

    }

    renderCart();

}


// ==========================================
// UNDO
// ==========================================

function undo() {

    if (undoStack.length === 0) {
        return;
    }

    const operation = undoStack.pop();

    const productId = operation.item.id;


    // --------------------------------------
    // Undo ADD
    // --------------------------------------

    if (operation.type === "ADD") {

        removeFromCart(productId, false);

    }


    // --------------------------------------
    // Undo REMOVE
    // --------------------------------------

    else if (operation.type === "REMOVE") {

        cart.push({
            ...operation.item
        });

        renderCart();

    }


    // --------------------------------------
    // Undo INCREASE
    // --------------------------------------

    else if (operation.type === "INCREASE") {

        decreaseQuantity(productId, false);

    }


    // --------------------------------------
    // Undo DECREASE
    // --------------------------------------

    else if (operation.type === "DECREASE") {

        increaseQuantity(productId, false);

    }


    // Put operation into REDO stack

    redoStack.push(operation);

    addHistory({
        type: "UNDO",
        item: operation.item
    });

    updateButtons();

}


// ==========================================
// REDO
// ==========================================

function redo() {

    if (redoStack.length === 0) {
        return;
    }

    const operation = redoStack.pop();

    const productId = operation.item.id;


    // --------------------------------------
    // Redo ADD
    // --------------------------------------

    if (operation.type === "ADD") {

        addToCart(productId, false);

    }


    // --------------------------------------
    // Redo REMOVE
    // --------------------------------------

    else if (operation.type === "REMOVE") {

        removeFromCart(productId, false);

    }


    // --------------------------------------
    // Redo INCREASE
    // --------------------------------------

    else if (operation.type === "INCREASE") {

        increaseQuantity(productId, false);

    }


    // --------------------------------------
    // Redo DECREASE
    // --------------------------------------

    else if (operation.type === "DECREASE") {

        decreaseQuantity(productId, false);

    }


    // Put operation back into UNDO stack

    undoStack.push(operation);

    addHistory({
        type: "REDO",
        item: operation.item
    });

    updateButtons();

}


// ==========================================
// RENDER CART
// ==========================================

function renderCart() {

    cartItems.innerHTML = "";

    if (cart.length === 0) {

        emptyCart.style.display = "block";

    } else {

        emptyCart.style.display = "none";

    }


    cart.forEach(item => {

        const cartItem = document.createElement("div");

        cartItem.className = "cart-item";

        cartItem.innerHTML = `

            <div class="cart-item-info">

                <h3>${item.name}</h3>

                <p class="cart-item-price">
                    ₹${item.price.toLocaleString("en-IN")}
                </p>

            </div>


            <div class="quantity-controls">

                <button
                    onclick="decreaseQuantity('${item.id}')"
                >
                    −
                </button>

                <span class="quantity">
                    ${item.quantity}
                </span>

                <button
                    onclick="increaseQuantity('${item.id}')"
                >
                    +
                </button>

            </div>


            <button
                class="remove-btn"
                onclick="removeFromCart('${item.id}')"
            >
                Remove
            </button>

        `;

        cartItems.appendChild(cartItem);

    });


    updateSummary();

}


// ==========================================
// UPDATE CART SUMMARY
// ==========================================

function updateSummary() {

    let totalItems = 0;

    let totalPrice = 0;


    cart.forEach(item => {

        totalItems += item.quantity;

        totalPrice += item.price * item.quantity;

    });


    itemCount.textContent =
        `${totalItems} item${totalItems !== 1 ? "s" : ""}`;


    summaryItems.textContent = totalItems;


    cartTotal.textContent =
        `₹${totalPrice.toLocaleString("en-IN")}`;

}


// ==========================================
// ENABLE / DISABLE UNDO REDO
// ==========================================

function updateButtons() {

    undoBtn.disabled = undoStack.length === 0;

    redoBtn.disabled = redoStack.length === 0;

}


// ==========================================
// OPERATION HISTORY
// ==========================================

function addHistory(operation) {

    let message = "";


    if (operation.type === "ADD") {

        message = `Added ${operation.item.name}`;

    }

    else if (operation.type === "REMOVE") {

        message = `Removed ${operation.item.name}`;

    }

    else if (operation.type === "INCREASE") {

        message = `Increased quantity of ${operation.item.name}`;

    }

    else if (operation.type === "DECREASE") {

        message = `Decreased quantity of ${operation.item.name}`;

    }

    else if (operation.type === "UNDO") {

        message = `↩ Undo: ${operation.item.name}`;

    }

    else if (operation.type === "REDO") {

        message = `↪ Redo: ${operation.item.name}`;

    }


    operationHistory.unshift(message);


    // Keep only latest 10 operations

    if (operationHistory.length > 10) {

        operationHistory.pop();

    }


    renderHistory();

}


// ==========================================
// DISPLAY HISTORY
// ==========================================

function renderHistory() {

    historyList.innerHTML = "";


    if (operationHistory.length === 0) {

        historyList.innerHTML = `
            <p class="no-history">
                No operations yet.
            </p>
        `;

        return;
    }


    operationHistory.forEach(operation => {

        const historyItem = document.createElement("div");

        historyItem.className = "history-item";

        historyItem.textContent = operation;

        historyList.appendChild(historyItem);

    });

}


// ==========================================
// BUTTON EVENTS
// ==========================================

undoBtn.addEventListener("click", undo);

redoBtn.addEventListener("click", redo);


// ==========================================
// INITIAL LOAD
// ==========================================

renderProducts();

renderCart();

updateButtons();