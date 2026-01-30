// Управление корзиной
class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.init();
    }
    
    init() {
        this.displayCart();
        this.setupEventListeners();
        this.updateCartSummary();
    }
    
    displayCart() {
        const cartItems = document.getElementById('cartItems');
        const emptyCart = document.getElementById('emptyCart');
        const cartContent = document.getElementById('cartContent');
        
        if (!cartItems) return;
        
        if (this.cart.length === 0) {
            if (emptyCart) emptyCart.style.display = 'block';
            if (cartContent) cartContent.style.display = 'none';
            return;
        }
        
        if (emptyCart) emptyCart.style.display = 'none';
        if (cartContent) cartContent.style.display = 'block';
        
        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <div class="cart-item-price">${item.price.toLocaleString()} ₽</div>
                    <div class="cart-item-actions">
                        <div class="quantity-selector">
                            <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" 
                                   min="1" max="99" data-id="${item.id}">
                            <button class="quantity-btn increase" data-id="${item.id}">+</button>
                        </div>
                        <button class="btn btn-outline remove-item" data-id="${item.id}">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
                <div class="cart-item-total">
                    ${(item.price * item.quantity).toLocaleString()} ₽
                </div>
            </div>
        `).join('');
        
        this.updateCartSummary();
    }
    
    updateCartSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = 0; // Можно добавить систему скидок
        const shipping = subtotal > 3000 ? 0 : 300;
        const total = subtotal + shipping - discount;
        
        document.getElementById('cartSubtotal').textContent = `${subtotal.toLocaleString()} ₽`;
        document.getElementById('cartShipping').textContent = shipping === 0 ? 'Бесплатно' : `${shipping} ₽`;
        document.getElementById('cartTotal').textContent = `${total.toLocaleString()} ₽`;
        
        // Обновляем счетчик в шапке
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = totalItems;
        }
    }
    
    setupEventListeners() {
        // Увеличение количества
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('increase')) {
                const productId = parseInt(e.target.dataset.id);
                this.updateQuantity(productId, 1);
            }
            
            if (e.target.classList.contains('decrease')) {
                const productId = parseInt(e.target.dataset.id);
                this.updateQuantity(productId, -1);
            }
            
            if (e.target.classList.contains('remove-item')) {
                const productId = parseInt(e.target.dataset.id);
                this.removeItem(productId);
            }
        });
        
        // Ручной ввод количества
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                const productId = parseInt(e.target.dataset.id);
                const quantity = parseInt(e.target.value);
                
                if (quantity >= 1 && quantity <= 99) {
                    this.setQuantity(productId, quantity);
                } else {
                    this.displayCart(); // Восстановить предыдущее значение
                }
            }
        });
        
        // Очистка корзины
        const clearCartBtn = document.getElementById('clearCart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Вы уверены, что хотите очистить корзину?')) {
                    this.clearCart();
                }
            });
        }
        
        // Продолжить покупки
        const continueShopping = document.getElementById('continueShopping');
        if (continueShopping) {
            continueShopping.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.back();
            });
        }
        
        // Оформление заказа
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.checkout();
            });
        }
    }
    
    updateQuantity(productId, delta) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            const newQuantity = item.quantity + delta;
            if (newQuantity >= 1 && newQuantity <= 99) {
                item.quantity = newQuantity;
                this.saveCart();
                this.displayCart();
            } else if (newQuantity < 1) {
                this.removeItem(productId);
            }
        }
    }
    
    setQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            this.saveCart();
            this.displayCart();
        }
    }
    
    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.displayCart();
        shop.showNotification('Товар удален из корзины', 'info');
    }
    
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.displayCart();
        shop.showNotification('Корзина очищена', 'info');
    }
    
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }
    
    async checkout() {
        if (this.cart.length === 0) {
            shop.showNotification('Корзина пуста', 'error');
            return;
        }
        
        // Проверяем авторизацию
        if (!shop.currentUser) {
            shop.showNotification('Пожалуйста, войдите в систему', 'error');
            shop.showModal('loginModal');
            return;
        }
        
        // Собираем данные заказа
        const orderData = {
            userId: shop.currentUser.id,
            items: this.cart,
            shippingAddress: document.getElementById('shippingAddress').value,
            shippingMethod: document.getElementById('shippingMethod').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            notes: document.getElementById('orderNotes').value
        };
        
        try {
            // В реальном приложении здесь будет запрос к API
            const response = await fetch('php/api/orders.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Очищаем корзину
                this.clearCart();
                
                // Показываем сообщение об успехе
                shop.showNotification('Заказ успешно оформлен!', 'success');
                
                // Перенаправляем на страницу заказа
                setTimeout(() => {
                    window.location.href = `order.html?id=${result.orderId}`;
                }, 2000);
                
            } else {
                throw new Error('Ошибка при оформлении заказа');
            }
            
        } catch (error) {
            console.error('Checkout error:', error);
            shop.showNotification('Ошибка при оформлении заказа', 'error');
        }
    }
}

// Инициализация менеджера корзины
if (document.getElementById('cartItems')) {
    const cartManager = new CartManager();
    window.cartManager = cartManager;
}