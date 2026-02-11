/**
 * Управление корзиной
 * Полнофункциональный модуль для работы с корзиной интернет-магазина
 */

class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.promoCode = null;
        this.promoDiscount = 0;
        this.validPromoCodes = {
            'WELCOME10': 10,
            'SUMMER20': 20,
            'LUMIERE15': 15,
            'COSMETIC30': 30,
            'FREESHIP': { type: 'free_shipping', value: 0 }
        };
        
        this.init();
    }

    /**
     * Инициализация корзины
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateCartDisplay();
        this.loadRecommendedProducts();
        this.updateCartCount();
    }

    /**
     * Кэширование DOM элементов
     */
    cacheElements() {
        this.emptyCart = document.getElementById('emptyCart');
        this.cartContent = document.getElementById('cartContent');
        this.cartItems = document.getElementById('cartItems');
        this.cartSubtotal = document.getElementById('cartSubtotal');
        this.cartDiscount = document.getElementById('cartDiscount');
        this.cartShipping = document.getElementById('cartShipping');
        this.cartTotal = document.getElementById('cartTotal');
        this.cartCount = document.getElementById('cartCount');
        this.promoInput = document.getElementById('promoCode');
        this.applyPromoBtn = document.getElementById('applyPromo');
        this.promoMessage = document.getElementById('promoMessage');
        this.orderNote = document.getElementById('orderNote');
        this.clearCartBtn = document.getElementById('clearCartBtn');
        this.checkoutBtn = document.getElementById('checkoutBtn');
        this.confirmModal = document.getElementById('confirmModal');
        this.cancelClear = document.getElementById('cancelClear');
        this.confirmClear = document.getElementById('confirmClear');
        this.closeModal = document.querySelector('.close-modal');
    }

    /**
     * Привязка обработчиков событий
     */
    bindEvents() {
        // Очистка корзины
        if (this.clearCartBtn) {
            this.clearCartBtn.addEventListener('click', () => this.showConfirmModal());
        }

        // Модальное окно
        if (this.cancelClear) {
            this.cancelClear.addEventListener('click', () => this.hideConfirmModal());
        }

        if (this.confirmClear) {
            this.confirmClear.addEventListener('click', () => {
                this.clearCart();
                this.hideConfirmModal();
            });
        }

        if (this.closeModal) {
            this.closeModal.addEventListener('click', () => this.hideConfirmModal());
        }

        // Применение промокода
        if (this.applyPromoBtn) {
            this.applyPromoBtn.addEventListener('click', () => this.applyPromoCode());
        }

        if (this.promoInput) {
            this.promoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyPromoCode();
                }
            });
        }

        // Сохранение заметки
        if (this.orderNote) {
            this.orderNote.addEventListener('change', () => {
                localStorage.setItem('orderNote', this.orderNote.value);
            });

            // Загрузка сохраненной заметки
            const savedNote = localStorage.getItem('orderNote');
            if (savedNote) {
                this.orderNote.value = savedNote;
            }
        }

        // Оформление заказа
        if (this.checkoutBtn) {
            this.checkoutBtn.addEventListener('click', (e) => {
                if (this.cart.length === 0) {
                    e.preventDefault();
                    shop.showNotification('Корзина пуста', 'error');
                }
            });
        }

        // Закрытие модального окна при клике вне его
        window.addEventListener('click', (e) => {
            if (e.target === this.confirmModal) {
                this.hideConfirmModal();
            }
        });
    }

    /**
     * Обновление отображения корзины
     */
    updateCartDisplay() {
        if (!this.cartItems) return;

        if (this.cart.length === 0) {
            this.showEmptyCart();
        } else {
            this.showCartContent();
            this.renderCartItems();
            this.updateCartSummary();
        }
    }

    /**
     * Показать пустую корзину
     */
    showEmptyCart() {
        if (this.emptyCart) this.emptyCart.style.display = 'block';
        if (this.cartContent) this.cartContent.style.display = 'none';
    }

    /**
     * Показать содержимое корзины
     */
    showCartContent() {
        if (this.emptyCart) this.emptyCart.style.display = 'none';
        if (this.cartContent) this.cartContent.style.display = 'block';
    }

    /**
     * Отрисовка товаров в корзине
     */
    renderCartItems() {
        if (!this.cartItems) return;

        this.cartItems.innerHTML = this.cart.map(item => {
            const itemTotal = item.price * item.quantity;
            const hasDiscount = item.originalPrice && item.originalPrice > item.price;
            
            return `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-product">
                        <div class="cart-item-image">
                            <img src="${item.image || 'https://via.placeholder.com/100'}" 
                                 alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <div class="cart-item-brand">${item.brand || 'Lumière'}</div>
                            <h4 class="cart-item-title">
                                <a href="product.html?id=${item.id}">${item.name}</a>
                            </h4>
                            ${item.attributes ? `
                                <div class="cart-item-attributes">
                                    ${Object.entries(item.attributes).map(([key, value]) => `
                                        <span>${key}: ${value}</span>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="cart-item-price" data-label="Цена:">
                        ${item.price.toLocaleString()} ₽
                        ${hasDiscount ? `
                            <span class="cart-item-old-price">
                                ${item.originalPrice.toLocaleString()} ₽
                            </span>
                        ` : ''}
                    </div>
                    
                    <div class="cart-item-quantity" data-label="Количество:">
                        <div class="quantity-selector">
                            <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" 
                                   min="1" max="99" data-id="${item.id}">
                            <button class="quantity-btn increase" data-id="${item.id}">+</button>
                        </div>
                    </div>
                    
                    <div class="cart-item-total" data-label="Сумма:">
                        ${itemTotal.toLocaleString()} ₽
                    </div>
                    
                    <div class="cart-item-remove">
                        <button class="remove-btn" data-id="${item.id}" 
                                title="Удалить товар">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Добавляем обработчики событий для элементов корзины
        this.attachCartItemEvents();
    }

    /**
     * Привязка событий к элементам корзины
     */
    attachCartItemEvents() {
        // Увеличение количества
        document.querySelectorAll('.increase').forEach(btn => {
            btn.removeEventListener('click', this.handleIncrease);
            btn.addEventListener('click', this.handleIncrease.bind(this));
        });

        // Уменьшение количества
        document.querySelectorAll('.decrease').forEach(btn => {
            btn.removeEventListener('click', this.handleDecrease);
            btn.addEventListener('click', this.handleDecrease.bind(this));
        });

        // Ручной ввод количества
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.removeEventListener('change', this.handleQuantityChange);
            input.addEventListener('change', this.handleQuantityChange.bind(this));
        });

        // Удаление товара
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.removeEventListener('click', this.handleRemove);
            btn.addEventListener('click', this.handleRemove.bind(this));
        });
    }

    /**
     * Обработчик увеличения количества
     */
    handleIncrease(e) {
        e.preventDefault();
        e.stopPropagation();
        const productId = parseInt(e.currentTarget.dataset.id);
        this.updateQuantity(productId, 1);
    }

    /**
     * Обработчик уменьшения количества
     */
    handleDecrease(e) {
        e.preventDefault();
        e.stopPropagation();
        const productId = parseInt(e.currentTarget.dataset.id);
        this.updateQuantity(productId, -1);
    }

    /**
     * Обработчик изменения количества
     */
    handleQuantityChange(e) {
        e.preventDefault();
        e.stopPropagation();
        const productId = parseInt(e.currentTarget.dataset.id);
        let quantity = parseInt(e.currentTarget.value);
        
        if (isNaN(quantity) || quantity < 1) {
            quantity = 1;
            e.currentTarget.value = 1;
        }
        
        if (quantity > 99) {
            quantity = 99;
            e.currentTarget.value = 99;
        }
        
        this.setQuantity(productId, quantity);
    }

    /**
     * Обработчик удаления товара
     */
    handleRemove(e) {
        e.preventDefault();
        e.stopPropagation();
        const productId = parseInt(e.currentTarget.dataset.id);
        
        shop.showNotification('Товар удален из корзины', 'info');
        this.removeItem(productId);
    }

    /**
     * Обновление количества товара
     */
    updateQuantity(productId, delta) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            const newQuantity = item.quantity + delta;
            if (newQuantity >= 1 && newQuantity <= 99) {
                item.quantity = newQuantity;
                this.saveCart();
                this.updateCartDisplay();
                this.updateCartCount();
            } else if (newQuantity < 1) {
                this.removeItem(productId);
            }
        }
    }

    /**
     * Установка количества товара
     */
    setQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            this.saveCart();
            this.updateCartDisplay();
            this.updateCartCount();
        }
    }

    /**
     * Удаление товара из корзины
     */
    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
        this.updateCartCount();
    }

    /**
     * Очистка корзины
     */
    clearCart() {
        this.cart = [];
        this.promoCode = null;
        this.promoDiscount = 0;
        this.saveCart();
        localStorage.removeItem('orderNote');
        
        if (this.orderNote) {
            this.orderNote.value = '';
        }
        
        if (this.promoInput) {
            this.promoInput.value = '';
        }
        
        if (this.promoMessage) {
            this.promoMessage.className = 'promo-message';
            this.promoMessage.style.display = 'none';
        }
        
        this.updateCartDisplay();
        this.updateCartCount();
        shop.showNotification('Корзина очищена', 'info');
    }

    /**
     * Обновление итогов корзины
     */
    updateCartSummary() {
        // Расчет общей суммы
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Применение скидки
        let discount = 0;
        if (this.promoDiscount) {
            if (typeof this.promoDiscount === 'object' && this.promoDiscount.type === 'free_shipping') {
                // Бесплатная доставка обрабатывается отдельно
            } else {
                discount = subtotal * (this.promoDiscount / 100);
            }
        }
        
        // Расчет доставки
        let shipping = subtotal > 3000 ? 0 : 300;
        
        // Бесплатная доставка по промокоду
        if (this.promoDiscount && typeof this.promoDiscount === 'object' && this.promoDiscount.type === 'free_shipping') {
            shipping = 0;
        }
        
        const total = subtotal - discount + shipping;
        
        // Обновление DOM
        if (this.cartSubtotal) {
            this.cartSubtotal.textContent = `${Math.round(subtotal).toLocaleString()} ₽`;
        }
        
        if (this.cartDiscount) {
            this.cartDiscount.textContent = discount > 0 ? `-${Math.round(discount).toLocaleString()} ₽` : '0 ₽';
        }
        
        if (this.cartShipping) {
            this.cartShipping.textContent = shipping === 0 ? 'Бесплатно' : `${shipping.toLocaleString()} ₽`;
        }
        
        if (this.cartTotal) {
            this.cartTotal.textContent = `${Math.round(total).toLocaleString()} ₽`;
        }
    }

    /**
     * Обновление счетчика в шапке
     */
    updateCartCount() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (this.cartCount) {
            this.cartCount.textContent = totalItems;
            
            // Анимация обновления
            this.cartCount.classList.add('pulse');
            setTimeout(() => {
                this.cartCount.classList.remove('pulse');
            }, 300);
        }
        
        // Обновляем в основном объекте shop
        if (window.shop) {
            window.shop.cart = this.cart;
            window.shop.updateCartCount();
        }
    }

    /**
     * Сохранение корзины в localStorage
     */
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    /**
     * Применение промокода
     */
    applyPromoCode() {
        if (!this.promoInput) return;
        
        const code = this.promoInput.value.trim().toUpperCase();
        
        if (!code) {
            this.showPromoMessage('Введите промокод', 'error');
            return;
        }
        
        // Проверка промокода
        if (this.validPromoCodes[code]) {
            this.promoCode = code;
            this.promoDiscount = this.validPromoCodes[code];
            
            let message = '';
            if (typeof this.promoDiscount === 'object') {
                message = 'Промокод применен! Бесплатная доставка.';
            } else {
                message = `Промокод применен! Скидка ${this.promoDiscount}%.`;
            }
            
            this.showPromoMessage(message, 'success');
            this.updateCartSummary();
            
            // Блокируем ввод
            this.promoInput.disabled = true;
            this.applyPromoBtn.disabled = true;
        } else {
            this.showPromoMessage('Неверный промокод', 'error');
        }
    }

    /**
     * Показ сообщения о промокоде
     */
    showPromoMessage(message, type) {
        if (!this.promoMessage) return;
        
        this.promoMessage.textContent = message;
        this.promoMessage.className = `promo-message ${type}`;
        this.promoMessage.style.display = 'block';
        
        // Автоматически скрываем сообщение об ошибке через 5 секунд
        if (type === 'error') {
            setTimeout(() => {
                if (this.promoMessage) {
                    this.promoMessage.style.display = 'none';
                }
            }, 5000);
        }
    }

    /**
     * Показ модального окна подтверждения
     */
    showConfirmModal() {
        if (this.confirmModal) {
            this.confirmModal.classList.add('show');
        }
    }

    /**
     * Скрытие модального окна подтверждения
     */
    hideConfirmModal() {
        if (this.confirmModal) {
            this.confirmModal.classList.remove('show');
        }
    }

    /**
     * Загрузка рекомендованных товаров
     */
    async loadRecommendedProducts() {
        try {
            // Получаем товары из API
            let products = [];
            
            if (window.productManager && window.productManager.allProducts) {
                products = window.productManager.allProducts;
            } else {
                // Заглушка для демонстрации
                products = [
                    {
                        id: 101,
                        name: 'Ночной крем для лица',
                        price: 2800,
                        image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=200',
                        category: 'Уход за лицом'
                    },
                    {
                        id: 102,
                        name: 'Сыворотка с гиалуроном',
                        price: 3500,
                        image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=200',
                        category: 'Уход за лицом'
                    },
                    {
                        id: 103,
                        name: 'Маска для волос',
                        price: 1200,
                        image: 'https://images.unsplash.com/photo-1608248242901-3c6b4c6c91e7?w=200',
                        category: 'Уход за волосами'
                    },
                    {
                        id: 104,
                        name: 'Палетка теней',
                        price: 2100,
                        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200',
                        category: 'Макияж'
                    }
                ];
            }
            
            // Берем 4 случайных товара для рекомендаций
            const recommended = products
                .filter(p => !this.cart.some(item => item.id === p.id))
                .sort(() => 0.5 - Math.random())
                .slice(0, 4);
            
            this.renderRecommendedProducts(recommended);
            
        } catch (error) {
            console.error('Error loading recommended products:', error);
        }
    }

    /**
     * Отрисовка рекомендованных товаров
     */
    renderRecommendedProducts(products) {
        const container = document.getElementById('recommendedProducts');
        if (!container) return;
        
        container.innerHTML = products.map(product => `
            <a href="product.html?id=${product.id}" class="recommended-card">
                <img src="${product.image}" alt="${product.name}" class="recommended-image">
                <div class="recommended-info">
                    <h4 class="recommended-title">${product.name}</h4>
                    <div class="recommended-price">${product.price.toLocaleString()} ₽</div>
                </div>
            </a>
        `).join('');
    }

    /**
     * Добавление товара в корзину (из других модулей)
     */
    addItem(product, quantity = 1, attributes = {}) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                image: product.image,
                brand: product.brand,
                attributes: attributes,
                quantity: quantity
            });
        }
        
        this.saveCart();
        this.updateCartCount();
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, находимся ли мы на странице корзины
    if (document.getElementById('cartItems')) {
        window.cartManager = new CartManager();
    }
});

// Добавляем анимацию для счетчика
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    .cart-count.pulse {
        animation: pulse 0.3s ease;
    }
`;
document.head.appendChild(style);