/**
 * Управление личным кабинетом пользователя
 * Профиль, заказы, избранное, настройки
 */

class ProfileManager {
    constructor() {
        this.user = null;
        this.orders = [];
        this.favorites = [];
        this.reviews = [];
        this.bonusHistory = [];
        
        this.init();
    }

    /**
     * Инициализация профиля
     */
    async init() {
        this.cacheElements();
        this.bindEvents();
        await this.loadUserData();
        this.checkAuth();
    }

    /**
     * Кэширование DOM элементов
     */
    cacheElements() {
        // Табы
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabPanes = document.querySelectorAll('.tab-pane');
        
        // Элементы профиля
        this.welcomeName = document.getElementById('welcomeName');
        this.welcomeEmail = document.getElementById('welcomeEmail');
        this.profileAvatar = document.getElementById('profileAvatar');
        
        // Кнопки
        this.editProfileBtn = document.getElementById('editProfileBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        
        // Формы
        this.profileSettingsForm = document.getElementById('profileSettingsForm');
        this.quickEditForm = document.getElementById('quickEditForm');
        
        // Модальные окна
        this.editProfileModal = document.getElementById('editProfileModal');
        this.orderModal = document.getElementById('orderModal');
        
        // Поля настроек
        this.profileName = document.getElementById('profileName');
        this.profileSurname = document.getElementById('profileSurname');
        this.profileEmail = document.getElementById('profileEmail');
        this.profilePhone = document.getElementById('profilePhone');
        this.profileBirthdate = document.getElementById('profileBirthdate');
        this.profileCity = document.getElementById('profileCity');
        this.profileAddress = document.getElementById('profileAddress');
        this.profilePostalCode = document.getElementById('profilePostalCode');
        
        // Фильтры заказов
        this.orderStatusFilter = document.getElementById('orderStatusFilter');
        this.orderSearch = document.getElementById('orderSearch');
        
        // Элементы статистики
        this.totalOrders = document.getElementById('totalOrders');
        this.totalReviews = document.getElementById('totalReviews');
        this.totalFavorites = document.getElementById('totalFavorites');
        this.bonusPoints = document.getElementById('bonusBalance');
    }

    /**
     * Привязка обработчиков событий
     */
    bindEvents() {
        // Переключение табов
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Редактирование профиля
        if (this.editProfileBtn) {
            this.editProfileBtn.addEventListener('click', () => {
                this.showEditModal();
            });
        }

        // Закрытие модальных окон
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal);
                }
            });
        });

        // Отмена редактирования
        const cancelEdit = document.getElementById('cancelEdit');
        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => {
                this.hideModal(this.editProfileModal);
            });
        }

        // Быстрое редактирование
        if (this.quickEditForm) {
            this.quickEditForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.quickUpdateProfile();
            });
        }

        // Сохранение настроек
        if (this.profileSettingsForm) {
            this.profileSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfileSettings();
            });
        }

        // Фильтры заказов
        if (this.orderStatusFilter) {
            this.orderStatusFilter.addEventListener('change', () => {
                this.filterOrders();
            });
        }

        if (this.orderSearch) {
            this.orderSearch.addEventListener('input', () => {
                this.filterOrders();
            });
        }

        // Закрытие модальных окон по клику вне
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target);
            }
        });

        // Просмотр всех заказов
        document.querySelectorAll('[data-tab="orders"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab('orders');
            });
        });
    }

    /**
     * Проверка авторизации
     */
    checkAuth() {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        if (!this.user) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
        }
    }

    /**
     * Загрузка данных пользователя
     */
    async loadUserData() {
        try {
            // В реальном приложении загрузка с сервера
            const userData = localStorage.getItem('currentUser');
            
            if (userData) {
                this.user = JSON.parse(userData);
                this.updateUserInfo();
                await this.loadUserOrders();
                await this.loadUserFavorites();
                await this.loadUserReviews();
                await this.loadBonusHistory();
                this.updateStatistics();
            } else {
                // Демо-данные для тестирования
                this.user = {
                    id: 1,
                    name: 'Анна',
                    surname: 'Иванова',
                    email: 'anna.ivanova@example.com',
                    phone: '+7 (999) 123-45-67',
                    birthdate: '1995-05-15',
                    city: 'Москва',
                    address: 'ул. Тверская, д. 15, кв. 42',
                    postalCode: '101000',
                    avatar: null,
                    bonus: 500
                };
                
                this.updateUserInfo();
                this.loadDemoOrders();
                this.loadDemoFavorites();
                this.loadDemoReviews();
                this.loadDemoBonusHistory();
                this.updateStatistics();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    /**
     * Обновление информации о пользователе
     */
    updateUserInfo() {
        if (!this.user) return;

        if (this.welcomeName) {
            this.welcomeName.textContent = `Здравствуйте, ${this.user.name}!`;
        }

        if (this.welcomeEmail) {
            this.welcomeEmail.textContent = this.user.email;
        }

        // Заполнение полей настроек
        if (this.profileName) this.profileName.value = this.user.name || '';
        if (this.profileSurname) this.profileSurname.value = this.user.surname || '';
        if (this.profileEmail) this.profileEmail.value = this.user.email || '';
        if (this.profilePhone) this.profilePhone.value = this.user.phone || '';
        if (this.profileBirthdate) this.profileBirthdate.value = this.user.birthdate || '';
        if (this.profileCity) this.profileCity.value = this.user.city || '';
        if (this.profileAddress) this.profileAddress.value = this.user.address || '';
        if (this.profilePostalCode) this.profilePostalCode.value = this.user.postalCode || '';
        
        // Поля быстрого редактирования
        const editName = document.getElementById('editName');
        const editPhone = document.getElementById('editPhone');
        const editCity = document.getElementById('editCity');
        
        if (editName) editName.value = this.user.name || '';
        if (editPhone) editPhone.value = this.user.phone || '';
        if (editCity) editCity.value = this.user.city || '';
    }

    /**
     * Обновление статистики
     */
    updateStatistics() {
        if (this.totalOrders) {
            this.totalOrders.textContent = this.orders.length;
        }
        
        if (this.totalReviews) {
            this.totalReviews.textContent = this.reviews.length;
        }
        
        if (this.totalFavorites) {
            this.totalFavorites.textContent = this.favorites.length;
        }
        
        if (this.bonusPoints) {
            this.bonusPoints.textContent = this.user?.bonus || 0;
        }
    }

    /**
     * Загрузка заказов пользователя
     */
    async loadUserOrders() {
        try {
            // В реальном приложении загрузка с сервера
            // const response = await fetch('/api/user/orders');
            // this.orders = await response.json();
            
            this.loadDemoOrders();
            this.renderRecentOrders();
            this.renderAllOrders();
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    /**
     * Загрузка демо-заказов
     */
    loadDemoOrders() {
        this.orders = [
            {
                id: 1001,
                number: 'ORD-2024-001',
                date: '2024-01-15',
                total: 4590,
                status: 'delivered',
                items: [
                    { name: 'Увлажняющий крем', quantity: 1, price: 2499 },
                    { name: 'Помада матовая', quantity: 2, price: 1299 }
                ],
                address: 'Москва, ул. Тверская, д. 15, кв. 42',
                paymentMethod: 'card',
                deliveryMethod: 'courier'
            },
            {
                id: 1002,
                number: 'ORD-2024-002',
                date: '2024-02-03',
                total: 3200,
                status: 'processing',
                items: [
                    { name: 'Сыворотка с витамином C', quantity: 1, price: 3200 }
                ],
                address: 'Москва, ул. Тверская, д. 15, кв. 42',
                paymentMethod: 'card',
                deliveryMethod: 'pickup'
            },
            {
                id: 1003,
                number: 'ORD-2024-003',
                date: '2024-02-20',
                total: 5800,
                status: 'shipped',
                items: [
                    { name: 'Туалетная вода "Lumière"', quantity: 1, price: 5800 }
                ],
                address: 'Москва, ул. Тверская, д. 15, кв. 42',
                paymentMethod: 'cash',
                deliveryMethod: 'courier'
            }
        ];
    }

    /**
     * Отрисовка недавних заказов
     */
    renderRecentOrders() {
        const container = document.getElementById('recentOrdersList');
        if (!container) return;

        if (this.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <p>У вас пока нет заказов</p>
                    <a href="catalog.html" class="btn btn-primary">Перейти в каталог</a>
                </div>
            `;
            return;
        }

        const recentOrders = this.orders.slice(0, 3);
        
        container.innerHTML = recentOrders.map(order => `
            <div class="order-item" onclick="profileManager.viewOrderDetails(${order.id})">
                <div class="order-number">
                    Заказ #${order.number}
                    <span>от ${new Date(order.date).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="order-total">${order.total.toLocaleString()} ₽</div>
                <div class="order-status status-${order.status}">
                    ${this.getStatusText(order.status)}
                </div>
            </div>
        `).join('');
    }

    /**
     * Отрисовка всех заказов
     */
    renderAllOrders() {
        const container = document.getElementById('allOrdersList');
        if (!container) return;

        if (this.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <p>У вас пока нет заказов</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.orders.map(order => `
            <div class="order-item" onclick="profileManager.viewOrderDetails(${order.id})">
                <div class="order-number">
                    Заказ #${order.number}
                </div>
                <div class="order-date">${new Date(order.date).toLocaleDateString('ru-RU')}</div>
                <div class="order-total">${order.total.toLocaleString()} ₽</div>
                <div class="order-status status-${order.status}">
                    ${this.getStatusText(order.status)}
                </div>
            </div>
        `).join('');
    }

    /**
     * Фильтрация заказов
     */
    filterOrders() {
        const status = this.orderStatusFilter?.value;
        const search = this.orderSearch?.value.toLowerCase();

        let filteredOrders = [...this.orders];

        if (status && status !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.status === status);
        }

        if (search) {
            filteredOrders = filteredOrders.filter(order => 
                order.number.toLowerCase().includes(search)
            );
        }

        const container = document.getElementById('allOrdersList');
        if (container) {
            if (filteredOrders.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>Заказы не найдены</p>
                    </div>
                `;
            } else {
                container.innerHTML = filteredOrders.map(order => `
                    <div class="order-item" onclick="profileManager.viewOrderDetails(${order.id})">
                        <div class="order-number">Заказ #${order.number}</div>
                        <div class="order-date">${new Date(order.date).toLocaleDateString('ru-RU')}</div>
                        <div class="order-total">${order.total.toLocaleString()} ₽</div>
                        <div class="order-status status-${order.status}">
                            ${this.getStatusText(order.status)}
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    /**
     * Получение текста статуса
     */
    getStatusText(status) {
        const statuses = {
            'pending': 'Ожидает оплаты',
            'processing': 'В обработке',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменён'
        };
        return statuses[status] || status;
    }

    /**
     * Просмотр деталей заказа
     */
    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const detailsContainer = document.getElementById('orderDetails');
        if (!detailsContainer) return;

        const itemsList = order.items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toLocaleString()} ₽</td>
                <td>${(item.price * item.quantity).toLocaleString()} ₽</td>
            </tr>
        `).join('');

        detailsContainer.innerHTML = `
            <div class="order-details-header">
                <h2>Заказ #${order.number}</h2>
                <div class="order-status status-${order.status}">
                    ${this.getStatusText(order.status)}
                </div>
            </div>
            
            <div class="order-details-info">
                <p><strong>Дата заказа:</strong> ${new Date(order.date).toLocaleDateString('ru-RU')}</p>
                <p><strong>Способ оплаты:</strong> ${order.paymentMethod === 'card' ? 'Картой онлайн' : 'Наличными при получении'}</p>
                <p><strong>Способ доставки:</strong> ${order.deliveryMethod === 'courier' ? 'Курьером' : 'Самовывоз'}</p>
                <p><strong>Адрес доставки:</strong> ${order.address}</p>
            </div>
            
            <div class="order-details-items">
                <h3>Состав заказа</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Товар</th>
                            <th>Кол-во</th>
                            <th>Цена</th>
                            <th>Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsList}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3"><strong>Итого:</strong></td>
                            <td><strong>${order.total.toLocaleString()} ₽</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="order-details-actions">
                <button class="btn btn-outline" onclick="profileManager.repeatOrder(${order.id})">
                    <i class="fas fa-redo-alt"></i>
                    Повторить заказ
                </button>
                <button class="btn btn-outline" onclick="profileManager.downloadInvoice(${order.id})">
                    <i class="fas fa-download"></i>
                    Скачать чек
                </button>
            </div>
        `;

        this.showModal(this.orderModal);
    }

    /**
     * Повтор заказа
     */
    repeatOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        // Добавляем все товары из заказа в корзину
        if (window.shop) {
            order.items.forEach(item => {
                // В реальном приложении нужно получить полный объект товара
                const product = {
                    id: item.id || Math.random(),
                    name: item.name,
                    price: item.price
                };
                window.shop.addToCart(product, item.quantity);
            });
            
            shop.showNotification('Товары добавлены в корзину', 'success');
            
            // Закрываем модальное окно
            this.hideModal(this.orderModal);
            
            // Предлагаем перейти в корзину
            setTimeout(() => {
                if (confirm('Товары добавлены в корзину. Перейти к оформлению?')) {
                    window.location.href = 'cart.html';
                }
            }, 500);
        }
    }

    /**
     * Скачать чек
     */
    downloadInvoice(orderId) {
        // В реальном приложении генерация PDF
        shop.showNotification('Чек будет отправлен на ваш email', 'info');
    }

    /**
     * Загрузка избранного
     */
    async loadUserFavorites() {
        try {
            this.loadDemoFavorites();
            this.renderFavorites();
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }

    /**
     * Загрузка демо-избранного
     */
    loadDemoFavorites() {
        this.favorites = [
            {
                id: 1,
                name: 'Увлажняющий крем "Гидрация"',
                price: 2499,
                image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=300'
            },
            {
                id: 2,
                name: 'Матовые помады "Velvet"',
                price: 1299,
                image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300'
            },
            {
                id: 4,
                name: 'Сыворотка с витамином C',
                price: 3200,
                image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=300'
            }
        ];
    }

    /**
     * Отрисовка избранного
     */
    renderFavorites() {
        const container = document.getElementById('favoritesList');
        if (!container) return;

        if (this.favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <p>В избранном пока нет товаров</p>
                    <a href="catalog.html" class="btn btn-primary">Перейти в каталог</a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.favorites.map(item => `
            <div class="favorite-card">
                <button class="favorite-remove" onclick="profileManager.removeFromFavorites(${item.id})">
                    <i class="fas fa-times"></i>
                </button>
                <img src="${item.image}" alt="${item.name}" class="favorite-image">
                <div class="favorite-info">
                    <h4 class="favorite-name">${item.name}</h4>
                    <div class="favorite-price">${item.price.toLocaleString()} ₽</div>
                    <button class="btn btn-primary btn-sm" onclick="profileManager.addToCartFromFavorites(${item.id})">
                        В корзину
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Удаление из избранного
     */
    removeFromFavorites(productId) {
        this.favorites = this.favorites.filter(item => item.id !== productId);
        this.renderFavorites();
        this.updateStatistics();
        shop.showNotification('Товар удален из избранного', 'info');
    }

    /**
     * Добавление в корзину из избранного
     */
    addToCartFromFavorites(productId) {
        const product = this.favorites.find(item => item.id === productId);
        if (product && window.shop) {
            window.shop.addToCart(product);
        }
    }

    /**
     * Загрузка отзывов
     */
    async loadUserReviews() {
        try {
            this.loadDemoReviews();
            this.renderReviews();
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }

    /**
     * Загрузка демо-отзывов
     */
    loadDemoReviews() {
        this.reviews = [
            {
                id: 101,
                productId: 1,
                productName: 'Увлажняющий крем "Гидрация"',
                productImage: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=300',
                rating: 5,
                date: '2024-01-20',
                text: 'Отличный крем! Кожа стала мягкой и увлажненной. Использую уже месяц, очень довольна результатом.'
            },
            {
                id: 102,
                productId: 2,
                productName: 'Матовые помады "Velvet"',
                productImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300',
                rating: 4,
                date: '2024-02-05',
                text: 'Хорошая помада, долго держится, цвет насыщенный. Немного сушит губы, но с бальзамом отлично.'
            }
        ];
    }

    /**
     * Отрисовка отзывов
     */
    renderReviews() {
        const container = document.getElementById('userReviewsList');
        if (!container) return;

        if (this.reviews.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <p>У вас пока нет отзывов</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-product">
                        <img src="${review.productImage}" alt="${review.productName}">
                        <h4>${review.productName}</h4>
                    </div>
                    <div class="review-rating">
                        ${this.generateStars(review.rating)}
                    </div>
                </div>
                <div class="review-date">${new Date(review.date).toLocaleDateString('ru-RU')}</div>
                <p class="review-text">${review.text}</p>
                <div class="review-actions">
                    <button class="btn btn-outline btn-sm" onclick="profileManager.editReview(${review.id})">
                        <i class="fas fa-edit"></i>
                        Редактировать
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Редактирование отзыва
     */
    editReview(reviewId) {
        const review = this.reviews.find(r => r.id === reviewId);
        if (!review) return;

        // В реальном приложении открыть форму редактирования
        shop.showNotification('Функция редактирования отзыва будет доступна позже', 'info');
    }

    /**
     * Загрузка бонусной истории
     */
    async loadBonusHistory() {
        try {
            this.loadDemoBonusHistory();
            this.renderBonusHistory();
        } catch (error) {
            console.error('Error loading bonus history:', error);
        }
    }

    /**
     * Загрузка демо-бонусной истории
     */
    loadDemoBonusHistory() {
        this.bonusHistory = [
            { date: '2024-02-20', description: 'Покупка в магазине', amount: 150, balance: 650 },
            { date: '2024-02-15', description: 'Отзыв на товар', amount: 50, balance: 500 },
            { date: '2024-02-10', description: 'День рождения', amount: 200, balance: 450 },
            { date: '2024-02-05', description: 'Покупка в магазине', amount: 250, balance: 250 },
            { date: '2024-02-01', description: 'Регистрация', amount: 100, balance: 100 }
        ];
    }

    /**
     * Отрисовка бонусной истории
     */
    renderBonusHistory() {
        const container = document.getElementById('bonusHistoryTable');
        if (!container) return;

        container.innerHTML = this.bonusHistory.map(item => `
            <tr>
                <td>${new Date(item.date).toLocaleDateString('ru-RU')}</td>
                <td>${item.description}</td>
                <td class="positive">+${item.amount}</td>
                <td>${item.balance}</td>
            </tr>
        `).join('');
    }

    /**
     * Генерация звезд рейтинга
     */
    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }

    /**
     * Показать модальное окно
     */
    showModal(modal) {
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Скрыть модальное окно
     */
    hideModal(modal) {
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    /**
     * Показать модальное окно редактирования
     */
    showEditModal() {
        if (this.editProfileModal) {
            this.showModal(this.editProfileModal);
        }
    }

    /**
     * Быстрое обновление профиля
     */
    quickUpdateProfile() {
        const name = document.getElementById('editName')?.value;
        const phone = document.getElementById('editPhone')?.value;
        const city = document.getElementById('editCity')?.value;

        if (this.user) {
            this.user.name = name || this.user.name;
            this.user.phone = phone || this.user.phone;
            this.user.city = city || this.user.city;

            // Сохраняем в localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.user));

            // Обновляем отображение
            this.updateUserInfo();

            shop.showNotification('Профиль обновлен', 'success');
            this.hideModal(this.editProfileModal);
        }
    }

    /**
     * Сохранение настроек профиля
     */
    async saveProfileSettings() {
        if (!this.user) return;

        const formData = {
            name: this.profileName?.value,
            surname: this.profileSurname?.value,
            email: this.profileEmail?.value,
            phone: this.profilePhone?.value,
            birthdate: this.profileBirthdate?.value,
            city: this.profileCity?.value,
            address: this.profileAddress?.value,
            postalCode: this.profilePostalCode?.value
        };

        // Валидация
        if (!formData.name) {
            shop.showNotification('Введите имя', 'error');
            return;
        }

        if (!formData.email) {
            shop.showNotification('Введите email', 'error');
            return;
        }

        // Проверка пароля если введен
        const currentPass = document.getElementById('currentPassword')?.value;
        const newPass = document.getElementById('newPassword')?.value;
        const confirmPass = document.getElementById('confirmNewPassword')?.value;

        if (newPass || confirmPass || currentPass) {
            if (!currentPass) {
                shop.showNotification('Введите текущий пароль', 'error');
                return;
            }

            if (newPass !== confirmPass) {
                shop.showNotification('Пароли не совпадают', 'error');
                return;
            }

            if (newPass && newPass.length < 6) {
                shop.showNotification('Пароль должен содержать минимум 6 символов', 'error');
                return;
            }

            // В реальном приложении здесь проверка текущего пароля
            formData.newPassword = newPass;
        }

        // Сохраняем данные
        Object.assign(this.user, formData);
        localStorage.setItem('currentUser', JSON.stringify(this.user));

        // Обновляем отображение
        this.updateUserInfo();

        shop.showNotification('Настройки сохранены', 'success');

        // Очищаем поля пароля
        if (document.getElementById('currentPassword')) {
            document.getElementById('currentPassword').value = '';
        }
        if (document.getElementById('newPassword')) {
            document.getElementById('newPassword').value = '';
        }
        if (document.getElementById('confirmNewPassword')) {
            document.getElementById('confirmNewPassword').value = '';
        }
    }

    /**
     * Переключение вкладок
     */
    switchTab(tabId) {
        // Обновление кнопок
        this.tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Обновление панелей
        this.tabPanes.forEach(pane => {
            if (pane.id === tabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        // Обновление URL (опционально)
        const url = new URL(window.location);
        url.searchParams.set('tab', tabId);
        window.history.replaceState({}, '', url);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.profile-section')) {
        window.profileManager = new ProfileManager();
    }
});