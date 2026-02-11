// Основной JavaScript файл
class CosmeticsShop {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.products = [];
        this.categories = [];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadCategories();
        this.loadProducts();
        this.updateCartCount();
        this.checkAuthStatus();
    }
    
    setupEventListeners() {
        // Мобильное меню
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('show');
            });
        }
        
        // Закрытие меню при клике на ссылку
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('show');
            });
        });
        
        // Меню пользователя
        const userIcon = document.getElementById('userIcon');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userIcon && userDropdown) {
            userIcon.addEventListener('click', (e) => {
                e.preventDefault();
                userDropdown.classList.toggle('show');
            });
            
            // Закрытие меню при клике вне его
            document.addEventListener('click', (e) => {
                if (!userIcon.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('show');
                }
            });
        }
        
        // Быстрый вход
        const quickLoginForm = document.getElementById('quickLoginForm');
        if (quickLoginForm) {
            quickLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.quickLogin();
            });
        }
        
        // Выход
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }
    
    async loadCategories() {
        try {
            // В реальном приложении здесь будет запрос к API
            const response = await fetch('php/api/categories.php');
            this.categories = await response.json();
            this.displayCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
            // Заглушка для демонстрации
            this.categories = [
                { id: 1, name: 'Уход за лицом', slug: 'skincare', image: '/images/zaLico.png', description: 'Кремы, сыворотки, тоники' },
                { id: 2, name: 'Макияж', slug: 'makeup', image: '/images/make.jpg', description: 'Помады, тени, тональные средства' },
                { id: 3, name: 'Парфюмерия', slug: 'fragrance', image: '/images/parfum.jpg', description: 'Духи, туалетная вода' },
                { id: 4, name: 'Уход за волосами', slug: 'haircare', image: '/images/za_volosami.jpg', description: 'Шампуни, маски, масла' },
                { id: 5, name: 'Натуральная косметика', slug: 'natural', image: '/images/natuarl.jpg', description: 'Органические средства' },
                { id: 6, name: 'Для тела', slug: 'bodycare', image: '/images/telo.jpg', description: 'Лосьоны, скрабы, масла' }
            ];
            this.displayCategories();
        }
    }
    
    displayCategories() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (!categoriesGrid) return;
        
        categoriesGrid.innerHTML = this.categories.map(category => `
            <a href="catalog.html?category=${category.slug}" class="category-card">
                <img src="${category.image}" alt="${category.name}" class="category-image">
                <div class="category-info">
                    <h3>${category.name}</h3>
                    <p>${category.description}</p>
                </div>
            </a>
        `).join('');
    }
    
    async loadProducts() {
        try {
            // В реальном приложении здесь будет запрос к API
            const response = await fetch('php/api/products.php?limit=4');
            this.products = await response.json();
            this.displayFeaturedProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            // Заглушка для демонстрации
            this.products = [
                {
                    id: 1,
                    name: 'Увлажняющий крем "Гидрация"',
                    description: 'Интенсивное увлажнение на 24 часа',
                    price: 2499,
                    image: '/images/gidra.jpg',
                    category: 'skincare',
                    rating: 4.8,
                    isNew: true
                },
                {
                    id: 2,
                    name: 'Матовые помады "Velvet"',
                    description: 'Насыщенный матовый цвет, не сушит губы',
                    price: 1299,
                    image: '/images/pomad.jpg',
                    category: 'makeup',
                    rating: 4.9,
                    isPopular: true
                },
                {
                    id: 3,
                    name: 'Туалетная вода "rivieras"',
                    description: 'Нежный цветочный аромат',
                    price: 5800,
                    image: '/images/voda.jpeg',
                    category: 'fragrance',
                    rating: 4.7
                },
                {
                    id: 4,
                    name: 'Сыворотка с витамином C',
                    description: 'Осветляет тон кожи, придает сияние',
                    price: 3200,
                    image: '/images/vitaminc.jpg',
                    category: 'skincare',
                    rating: 4.6,
                    isNew: true
                }
            ];
            this.displayFeaturedProducts();
        }
    }
    
    displayFeaturedProducts() {
        const featuredProducts = document.getElementById('featuredProducts');
        if (!featuredProducts) return;
        
        featuredProducts.innerHTML = this.products.map(product => `
            <div class="product-card" data-id="${product.id}">
                ${product.isNew ? '<span class="product-badge">Новинка</span>' : ''}
                ${product.isPopular ? '<span class="product-badge" style="background: #e74c3c;">Популярное</span>' : ''}
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-rating">
                        ${this.generateStars(product.rating)}
                        <span style="color: #777; font-size: 0.9rem;">(${product.rating})</span>
                    </div>
                    <div class="product-price">${product.price.toLocaleString()} ₽</div>
                    <button class="btn btn-primary add-to-cart" data-id="${product.id}">В корзину</button>
                </div>
            </div>
        `).join('');
        
        // Добавляем обработчики для кнопок "В корзину"
        this.setupAddToCartButtons();
    }
    
    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i === Math.ceil(rating) && rating % 1 >= 0.5) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }
    
    setupAddToCartButtons() {
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.id);
                const product = this.products.find(p => p.id === productId);
                if (product) {
                    this.addToCart(product);
                    this.showNotification('Товар добавлен в корзину!', 'success');
                }
            });
        });
    }
    
    addToCart(product, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }
        
        this.saveCart();
        this.updateCartCount();
    }
    
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartCount();
    }
    
    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }
    
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }
    
    checkAuthStatus() {
        const userInfo = document.getElementById('userInfo');
        const profileLink = document.getElementById('profileLink');
        const logoutLink = document.getElementById('logoutLink');
        
        if (this.currentUser) {
            if (userInfo) {
                userInfo.innerHTML = `
                    <p><strong>${this.currentUser.name}</strong></p>
                    <p style="font-size: 0.9rem; color: #777;">${this.currentUser.email}</p>
                `;
            }
            if (profileLink) profileLink.style.display = 'block';
            if (logoutLink) logoutLink.style.display = 'block';
        } else {
            if (userInfo) {
                userInfo.innerHTML = '<p>Вы не авторизованы</p>';
            }
            if (profileLink) profileLink.style.display = 'none';
            if (logoutLink) logoutLink.style.display = 'none';
        }
    }
    
    quickLogin() {
        const email = document.getElementById('quickEmail').value;
        const password = document.getElementById('quickPassword').value;
        
        // В реальном приложении здесь будет запрос к API
        if (email && password) {
            this.currentUser = {
                id: 1,
                name: 'Анна Иванова',
                email: email
            };
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.checkAuthStatus();
            this.showNotification('Вы успешно вошли!', 'success');
            this.closeModal('loginModal');
        } else {
            this.showNotification('Пожалуйста, заполните все поля', 'error');
        }
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.checkAuthStatus();
        this.showNotification('Вы вышли из системы', 'info');
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    showNotification(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Кнопка закрытия
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Автоматическое закрытие
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
        updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
         }
        }
        syncCart() {
         if (window.cartManager) {
        this.cart = window.cartManager.cart;
        this.updateCartCount();
         }
        }
}

// Инициализация приложения
const shop = new CosmeticsShop();

// Экспортируем для использования в других файлах
window.shop = shop;