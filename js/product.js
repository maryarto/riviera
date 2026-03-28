/**
 * Управление страницей товара
 * Загрузка данных, галерея, отзывы, добавление в корзину
 */

class ProductManager {
    constructor() {
        this.productId = null;
        this.product = null;
        this.currentImageIndex = 0;
        this.selectedRating = 0;
        this.reviewsPage = 1;
        this.reviewsPerPage = 5;
        this.hasMoreReviews = true;
        
        this.init();
    }

    /**
     * Инициализация
     */
    async init() {
        this.cacheElements();
        this.bindEvents();
        await this.getProductId();
        await this.loadProduct();
        this.checkFavoriteStatus();
        this.setupZoom();
    }

    /**
     * Кэширование DOM элементов
     */
    cacheElements() {
        this.loading = document.getElementById('productLoading');
        this.content = document.getElementById('productContent');
        this.notFound = document.getElementById('productNotFound');
        
        // Основные элементы
        this.productTitle = document.getElementById('productTitle');
        this.productBrand = document.getElementById('productBrand');
        this.productPrice = document.getElementById('productPrice');
        this.productOldPrice = document.getElementById('productOldPrice');
        this.productDiscount = document.getElementById('productDiscount');
        this.productDescription = document.querySelector('#productDescription p');
        this.productAvailability = document.getElementById('productAvailability');
        this.productBadge = document.getElementById('productBadge');
        
        // Галерея
        this.mainImage = document.getElementById('mainProductImage');
        this.thumbnails = document.getElementById('productThumbnails');
        
        // Количество
        this.quantityInput = document.getElementById('productQuantity');
        this.decreaseBtn = document.getElementById('decreaseQuantity');
        this.increaseBtn = document.getElementById('increaseQuantity');
        
        // Кнопки
        this.addToCartBtn = document.getElementById('addToCartBtn');
        this.favoriteBtn = document.getElementById('favoriteBtn');
        
        // Табы
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabPanes = document.querySelectorAll('.tab-pane');
        
        // Отзывы
        this.reviewsList = document.getElementById('reviewsList');
        this.reviewsCount = document.getElementById('reviewsCount');
        this.tabReviewsCount = document.getElementById('tabReviewsCount');
        this.totalReviews = document.getElementById('totalReviews');
        this.averageRating = document.getElementById('averageRating');
        this.averageStars = document.getElementById('averageStars');
        this.ratingDistribution = document.getElementById('ratingDistribution');
        this.starRating = document.getElementById('starRating');
        this.reviewText = document.getElementById('reviewText');
        this.submitReviewBtn = document.getElementById('submitReviewBtn');
        this.reviewLoginMessage = document.getElementById('reviewLoginMessage');
        this.loadMoreReviewsBtn = document.getElementById('loadMoreReviews');
        
        // Модальное окно
        this.successModal = document.getElementById('successModal');
        this.continueShoppingBtn = document.getElementById('continueShoppingBtn');
        
        // Хлебные крошки
        this.productCategory = document.getElementById('productCategory');
    }

    /**
     * Привязка обработчиков событий
     */
    bindEvents() {
        // Количество
        if (this.decreaseBtn) {
            this.decreaseBtn.addEventListener('click', () => this.changeQuantity(-1));
        }
        
        if (this.increaseBtn) {
            this.increaseBtn.addEventListener('click', () => this.changeQuantity(1));
        }
        
        if (this.quantityInput) {
            this.quantityInput.addEventListener('change', () => this.validateQuantity());
        }
        
        // Добавление в корзину
        if (this.addToCartBtn) {
            this.addToCartBtn.addEventListener('click', () => this.addToCart());
        }
        
        // Избранное
        if (this.favoriteBtn) {
            this.favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        }
        
        // Табы
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // Звезды рейтинга
        if (this.starRating) {
            const stars = this.starRating.querySelectorAll('i');
            stars.forEach(star => {
                star.addEventListener('mouseenter', () => this.highlightStars(parseInt(star.dataset.rating)));
                star.addEventListener('mouseleave', () => this.resetStars());
                star.addEventListener('click', () => this.setRating(parseInt(star.dataset.rating)));
            });
        }
        
        // Отправка отзыва
        if (this.submitReviewBtn) {
            this.submitReviewBtn.addEventListener('click', () => this.submitReview());
        }
        
        // Загрузка еще отзывов
        if (this.loadMoreReviewsBtn) {
            this.loadMoreReviewsBtn.addEventListener('click', () => this.loadMoreReviews());
        }
        
        // Закрытие модального окна
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideModal());
        }
        
        if (this.continueShoppingBtn) {
            this.continueShoppingBtn.addEventListener('click', () => this.hideModal());
        }
        
        // Закрытие по клику вне
        window.addEventListener('click', (e) => {
            if (e.target === this.successModal) {
                this.hideModal();
            }
        });
    }

    /**
     * Получение ID товара из URL
     */
    async getProductId() {
        const params = new URLSearchParams(window.location.search);
        this.productId = parseInt(params.get('id'));
        
        if (!this.productId) {
            this.showNotFound();
        }
    }

    /**
     * Загрузка данных товара
     */
    async loadProduct() {
        try {
            // В реальном приложении запрос к API
            // const response = await fetch(`/api/products/${this.productId}`);
            // this.product = await response.json();
            
            // Демо-данные
            await this.loadDemoProduct();
            this.displayProduct();
            this.loadSimilarProducts();
            this.loadReviews();
            
        } catch (error) {
            console.error('Error loading product:', error);
            this.showNotFound();
        }
    }

    /**
     * Загрузка демо-товара
     */
    async loadDemoProduct() {
        // Имитация задержки
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.product = {
            id: this.productId || 1,
            name: 'Увлажняющий крем "Гидрация"',
            brand: 'Lumière',
            price: 2499,
            originalPrice: 3299,
            description: 'Интенсивное увлажнение на 24 часа с гиалуроновой кислотой и экстрактом алоэ. Крем нежной текстуры быстро впитывается, не оставляя жирного блеска. Подходит для всех типов кожи, включая чувствительную.',
            images: [
                'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=600',
                'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=600&h=600&fit=crop&sat=-100'
            ],
            category: 'Уход за лицом',
            categorySlug: 'skincare',
            inStock: true,
            isNew: true,
            isPopular: true,
            rating: 4.8,
            reviewsCount: 156,
            specs: {
                'Объем': '50 мл',
                'Тип кожи': 'Все типы',
                'Активные компоненты': 'Гиалуроновая кислота, алоэ вера, витамин Е',
                'Срок годности': '24 месяца',
                'Страна производства': 'Россия'
            },
            ingredients: [
                'Aqua', 'Glycerin', 'Sodium Hyaluronate', 'Aloe Barbadensis Leaf Juice',
                'Tocopheryl Acetate', 'Caprylic/Capric Triglyceride', 'Cetearyl Alcohol',
                'Cetearyl Glucoside', 'Parfum', 'Phenoxyethanol', 'Ethylhexylglycerin'
            ],
            howToUse: [
                'Нанесите крем на очищенную кожу лица',
                'Распределите легкими массирующими движениями',
                'Используйте утром и вечером',
                'Для лучшего эффекта комбинируйте с сывороткой'
            ]
        };
    }

    /**
     * Отображение товара
     */
    displayProduct() {
        if (!this.product) return;
        
        this.loading.style.display = 'none';
        this.content.style.display = 'block';
        
        // Основная информация
        this.productTitle.textContent = this.product.name;
        this.productBrand.textContent = this.product.brand;
        this.productPrice.textContent = `${this.product.price.toLocaleString()} ₽`;
        this.productDescription.textContent = this.product.description;
        
        // Скидка
        if (this.product.originalPrice && this.product.originalPrice > this.product.price) {
            const discount = Math.round((1 - this.product.price / this.product.originalPrice) * 100);
            this.productOldPrice.style.display = 'inline';
            this.productOldPrice.textContent = `${this.product.originalPrice.toLocaleString()} ₽`;
            this.productDiscount.style.display = 'inline-block';
            this.productDiscount.textContent = `-${discount}%`;
        }
        
        // Наличие
        if (this.product.inStock) {
            this.productAvailability.innerHTML = '<i class="fas fa-check-circle"></i><span>В наличии</span>';
            this.productAvailability.classList.add('in-stock');
            this.addToCartBtn.disabled = false;
        } else {
            this.productAvailability.innerHTML = '<i class="fas fa-times-circle"></i><span>Нет в наличии</span>';
            this.productAvailability.classList.add('out-of-stock');
            this.addToCartBtn.disabled = true;
        }
        
        // Бейдж
        if (this.product.isNew) {
            this.productBadge.style.display = 'block';
            this.productBadge.textContent = 'Новинка';
            this.productBadge.classList.add('new');
        } else if (this.product.originalPrice && this.product.originalPrice > this.product.price) {
            this.productBadge.style.display = 'block';
            this.productBadge.textContent = 'Скидка';
            this.productBadge.classList.add('sale');
        }
        
        // Хлебные крошки
        this.productCategory.textContent = this.product.category;
        
        // Галерея
        this.displayGallery();
        
        // Характеристики
        this.displaySpecs();
        
        // Состав
        this.displayIngredients();
        
        // Применение
        this.displayHowToUse();
        
        // Обновляем заголовок страницы
        document.title = `${this.product.name} - Lumière`;
    }

    /**
     * Отображение галереи
     */
    displayGallery() {
        if (!this.product.images || this.product.images.length === 0) return;
        
        // Основное изображение
        this.mainImage.src = this.product.images[0];
        this.mainImage.alt = this.product.name;
        
        // Миниатюры
        this.thumbnails.innerHTML = this.product.images.map((img, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img src="${img}" alt="Фото ${index + 1}">
            </div>
        `).join('');
        
        // Обработчики миниатюр
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                const index = parseInt(thumb.dataset.index);
                this.switchImage(index);
            });
        });
    }

    /**
     * Переключение изображения
     */
    switchImage(index) {
        this.currentImageIndex = index;
        this.mainImage.src = this.product.images[index];
        
        // Обновляем активную миниатюру
        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            if (i === index) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }

    /**
     * Отображение характеристик
     */
    displaySpecs() {
        const container = document.getElementById('specsTable');
        if (!container || !this.product.specs) return;
        
        container.innerHTML = Object.entries(this.product.specs).map(([key, value]) => `
            <div class="spec-row">
                <div class="spec-label">${key}</div>
                <div class="spec-value">${value}</div>
            </div>
        `).join('');
    }

    /**
     * Отображение состава
     */
    displayIngredients() {
        const container = document.getElementById('ingredientsList');
        if (!container || !this.product.ingredients) return;
        
        container.innerHTML = this.product.ingredients.map(ingredient => `
            <span class="ingredient-item">${ingredient}</span>
        `).join('');
    }

    /**
     * Отображение инструкции по применению
     */
    displayHowToUse() {
        const container = document.getElementById('howtoContent');
        if (!container || !this.product.howToUse) return;
        
        container.innerHTML = `
            <ul>
                ${this.product.howToUse.map(step => `<li>${step}</li>`).join('')}
            </ul>
            <p>Результат виден уже после первого применения. Для достижения максимального эффекта рекомендуется использовать курсом 30 дней.</p>
        `;
    }

    /**
     * Изменение количества
     */
    changeQuantity(delta) {
        let value = parseInt(this.quantityInput.value) + delta;
        value = Math.max(1, Math.min(99, value));
        this.quantityInput.value = value;
    }

    /**
     * Валидация количества
     */
    validateQuantity() {
        let value = parseInt(this.quantityInput.value);
        if (isNaN(value) || value < 1) {
            value = 1;
        } else if (value > 99) {
            value = 99;
        }
        this.quantityInput.value = value;
    }

    /**
     * Добавление в корзину
     */
    addToCart() {
        if (!this.product.inStock) {
            shop.showNotification('Товар временно отсутствует', 'error');
            return;
        }
        
        const quantity = parseInt(this.quantityInput.value);
        
        // Добавляем в корзину через глобальный объект shop
        if (window.shop) {
            const productToAdd = {
                id: this.product.id,
                name: this.product.name,
                price: this.product.price,
                originalPrice: this.product.originalPrice,
                image: this.product.images[0],
                brand: this.product.brand,
                inStock: this.product.inStock
            };
            
            window.shop.addToCart(productToAdd, quantity);
            
            // Показываем модальное окно
            this.showModal();
        }
    }

    /**
     * Проверка статуса избранного
     */
    checkFavoriteStatus() {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFavorite = favorites.includes(this.productId);
        
        if (isFavorite) {
            this.favoriteBtn.classList.add('active');
            this.favoriteBtn.querySelector('i').classList.remove('far');
            this.favoriteBtn.querySelector('i').classList.add('fas');
        }
    }

    /**
     * Переключение избранного
     */
    toggleFavorite() {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const index = favorites.indexOf(this.productId);
        
        if (index === -1) {
            favorites.push(this.productId);
            this.favoriteBtn.classList.add('active');
            this.favoriteBtn.querySelector('i').classList.remove('far');
            this.favoriteBtn.querySelector('i').classList.add('fas');
            shop.showNotification('Добавлено в избранное', 'success');
        } else {
            favorites.splice(index, 1);
            this.favoriteBtn.classList.remove('active');
            this.favoriteBtn.querySelector('i').classList.remove('fas');
            this.favoriteBtn.querySelector('i').classList.add('far');
            shop.showNotification('Удалено из избранного', 'info');
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    /**
     * Загрузка похожих товаров
     */
    async loadSimilarProducts() {
        try {
            // В реальном приложении запрос к API
            // const response = await fetch(`/api/products/similar/${this.productId}`);
            // const products = await response.json();
            
            // Демо-данные
            const products = [
                {
                    id: 2,
                    name: 'Ночной крем "Восстановление"',
                    price: 2890,
                    image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=300',
                    rating: 4.7
                },
                {
                    id: 3,
                    name: 'Сыворотка с гиалуроном',
                    price: 3500,
                    image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=300',
                    rating: 4.9
                },
                {
                    id: 4,
                    name: 'Тоник увлажняющий',
                    price: 1290,
                    image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=300',
                    rating: 4.5
                },
                {
                    id: 5,
                    name: 'Маска для лица',
                    price: 1890,
                    image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=300',
                    rating: 4.8
                }
            ];
            
            this.displaySimilarProducts(products);
            
        } catch (error) {
            console.error('Error loading similar products:', error);
        }
    }

    /**
     * Отображение похожих товаров
     */
    displaySimilarProducts(products) {
        const container = document.getElementById('similarProducts');
        if (!container) return;
        
        container.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-rating">
                        ${this.generateStars(product.rating)}
                    </div>
                    <div class="product-price">${product.price.toLocaleString()} ₽</div>
                    <button class="btn btn-primary add-to-cart" data-id="${product.id}">
                        В корзину
                    </button>
                </div>
            </div>
        `).join('');
        
        // Добавляем обработчики
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const product = products.find(p => p.id === id);
                if (product && window.shop) {
                    window.shop.addToCart(product);
                }
            });
        });
        
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                window.location.href = `product.html?id=${id}`;
            });
        });
    }

    /**
     * Загрузка отзывов
     */
    async loadReviews() {
        try {
            // Демо-отзывы
            const reviews = [
                {
                    id: 1,
                    userId: 1,
                    userName: 'Анна Иванова',
                    userAvatar: null,
                    rating: 5,
                    date: '2024-02-15',
                    text: 'Отличный крем! Кожа стала мягкой и увлажненной. Пользуюсь уже месяц, очень довольна результатом. Рекомендую!',
                    helpful: 12
                },
                {
                    id: 2,
                    userId: 2,
                    userName: 'Мария Петрова',
                    userAvatar: null,
                    rating: 4,
                    date: '2024-02-10',
                    text: 'Хороший крем, приятная текстура, быстро впитывается. Не жирнит. Единственное - запах немного резковат, но это на любителя.',
                    helpful: 8
                },
                {
                    id: 3,
                    userId: 3,
                    userName: 'Елена Смирнова',
                    userAvatar: null,
                    rating: 5,
                    date: '2024-02-05',
                    text: 'Лучший крем, который я пробовала! Увлажнение на весь день, кожа сияет. Обязательно куплю еще!',
                    helpful: 15
                },
                {
                    id: 4,
                    userId: 4,
                    userName: 'Ольга Кузнецова',
                    userAvatar: null,
                    rating: 4,
                    date: '2024-01-28',
                    text: 'Хороший увлажняющий крем. Подходит для зимы, защищает от обветривания. Цена качеству соответствует.',
                    helpful: 5
                }
            ];
            
            this.allReviews = reviews;
            this.updateReviewStats();
            this.renderReviews();
            
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }

    /**
     * Обновление статистики отзывов
     */
    updateReviewStats() {
        if (!this.allReviews || this.allReviews.length === 0) return;
        
        const total = this.allReviews.length;
        const average = this.allReviews.reduce((sum, r) => sum + r.rating, 0) / total;
        
        // Обновляем счетчики
        if (this.reviewsCount) this.reviewsCount.textContent = total;
        if (this.tabReviewsCount) this.tabReviewsCount.textContent = total;
        if (this.totalReviews) this.totalReviews.textContent = `${total} отзывов`;
        if (this.averageRating) this.averageRating.textContent = average.toFixed(1);
        
        // Звезды среднего рейтинга
        if (this.averageStars) {
            this.averageStars.innerHTML = this.generateStars(average);
        }
        
        // Распределение оценок
        this.renderRatingDistribution();
    }

    /**
     * Отрисовка распределения оценок
     */
    renderRatingDistribution() {
        if (!this.ratingDistribution || !this.allReviews) return;
        
        const distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
        this.allReviews.forEach(review => {
            distribution[review.rating]++;
        });
        
        const total = this.allReviews.length;
        
        this.ratingDistribution.innerHTML = '';
        for (let i = 5; i >= 1; i--) {
            const count = distribution[i];
            const percentage = total > 0 ? (count / total) * 100 : 0;
            
            this.ratingDistribution.innerHTML += `
                <div class="distribution-row">
                    <div class="distribution-stars">${i} ★</div>
                    <div class="distribution-bar">
                        <div class="distribution-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="distribution-count">${count}</div>
                </div>
            `;
        }
    }

    /**
     * Отрисовка отзывов
     */
    renderReviews() {
        if (!this.reviewsList) return;
        
        const start = 0;
        const end = this.reviewsPage * this.reviewsPerPage;
        const reviewsToShow = this.allReviews.slice(start, end);
        
        this.hasMoreReviews = end < this.allReviews.length;
        
        if (this.loadMoreReviewsBtn) {
            this.loadMoreReviewsBtn.style.display = this.hasMoreReviews ? 'block' : 'none';
        }
        
        if (reviewsToShow.length === 0) {
            this.reviewsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comment"></i>
                    <p>Пока нет отзывов. Будьте первым!</p>
                </div>
            `;
            return;
        }
        
        this.reviewsList.innerHTML = reviewsToShow.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            ${review.userAvatar ? `<img src="${review.userAvatar}">` : '<i class="fas fa-user-circle"></i>'}
                        </div>
                        <div>
                            <div class="reviewer-name">${review.userName}</div>
                            <div class="review-date">${new Date(review.date).toLocaleDateString('ru-RU')}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${this.generateStars(review.rating)}
                    </div>
                </div>
                <div class="review-text">${review.text}</div>
                <div class="review-helpful">
                    <button class="helpful-btn" data-id="${review.id}">
                        <i class="far fa-thumbs-up"></i>
                        <span>Полезно (${review.helpful})</span>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Обработчики полезности
        document.querySelectorAll('.helpful-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.markHelpful(id);
            });
        });
    }

    /**
     * Загрузка еще отзывов
     */
    loadMoreReviews() {
        this.reviewsPage++;
        this.renderReviews();
    }

    /**
     * Отметить отзыв полезным
     */
    markHelpful(reviewId) {
        const review = this.allReviews.find(r => r.id === reviewId);
        if (review) {
            review.helpful++;
            this.renderReviews();
            shop.showNotification('Спасибо за оценку!', 'success');
        }
    }

    /**
     * Генерация звезд
     */
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i === fullStars + 1 && hasHalf) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        
        return stars;
    }

    /**
     * Подсветка звезд
     */
    highlightStars(rating) {
        const stars = this.starRating.querySelectorAll('i');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('hover');
            } else {
                star.classList.remove('hover');
            }
        });
    }

    /**
     * Сброс звезд
     */
    resetStars() {
        const stars = this.starRating.querySelectorAll('i');
        stars.forEach(star => {
            star.classList.remove('hover');
            if (parseInt(star.dataset.rating) <= this.selectedRating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    /**
     * Установка рейтинга
     */
    setRating(rating) {
        this.selectedRating = rating;
        const stars = this.starRating.querySelectorAll('i');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    /**
     * Отправка отзыва
     */
    async submitReview() {
        // Проверка авторизации
        if (!window.shop || !window.shop.currentUser) {
            shop.showNotification('Войдите в аккаунт, чтобы оставить отзыв', 'error');
            if (this.reviewLoginMessage) {
                this.reviewLoginMessage.style.display = 'block';
            }
            return;
        }
        
        if (this.selectedRating === 0) {
            shop.showNotification('Пожалуйста, поставьте оценку', 'error');
            return;
        }
        
        const text = this.reviewText.value.trim();
        if (!text) {
            shop.showNotification('Пожалуйста, напишите отзыв', 'error');
            return;
        }
        
        if (text.length < 10) {
            shop.showNotification('Отзыв должен содержать минимум 10 символов', 'error');
            return;
        }
        
        // В реальном приложении отправка на сервер
        const newReview = {
            id: this.allReviews.length + 1,
            userId: window.shop.currentUser.id,
            userName: window.shop.currentUser.name,
            userAvatar: null,
            rating: this.selectedRating,
            date: new Date().toISOString().split('T')[0],
            text: text,
            helpful: 0
        };
        
        this.allReviews.unshift(newReview);
        this.updateReviewStats();
        this.renderReviews();
        
        // Сброс формы
        this.selectedRating = 0;
        this.reviewText.value = '';
        this.resetStars();
        
        shop.showNotification('Спасибо за отзыв!', 'success');
    }

    /**
     * Переключение таба
     */
    switchTab(tabId) {
        this.tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.tabPanes.forEach(pane => {
            if (pane.id === tabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
        
        // Если переключились на вкладку отзывов, обновляем счетчик
        if (tabId === 'reviews') {
            this.updateReviewStats();
        }
    }

    /**
     * Показать модальное окно
     */
    showModal() {
        if (this.successModal) {
            this.successModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Скрыть модальное окно
     */
    hideModal() {
        if (this.successModal) {
            this.successModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    /**
     * Показать "товар не найден"
     */
    showNotFound() {
        this.loading.style.display = 'none';
        this.content.style.display = 'none';
        this.notFound.style.display = 'block';
    }

    /**
     * Настройка зума изображения
     */
    setupZoom() {
        if (!this.mainImage) return;
        
        this.mainImage.addEventListener('click', () => {
            // В реальном приложении открыть модальное окно с увеличенным изображением
            const modal = document.createElement('div');
            modal.className = 'image-zoom-modal';
            modal.innerHTML = `
                <div class="zoom-content">
                    <img src="${this.mainImage.src}" alt="${this.product.name}">
                    <button class="close-zoom">&times;</button>
                </div>
            `;
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('close-zoom')) {
                    modal.remove();
                }
            });
            
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.product-section')) {
        window.productManager = new ProductManager();
    }
});