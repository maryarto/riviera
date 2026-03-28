/**
 * Управление каталогом товаров
 * Фильтрация, сортировка, отображение товаров
 */

class CatalogManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.categories = [];
        this.brands = [];
        this.filters = {
            categories: [],
            minPrice: 0,
            maxPrice: 10000,
            brands: [],
            inStock: false,
            onSale: false,
            rating: 0,
            search: ''
        };
        this.sort = 'popular';
        this.view = 'grid';
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.totalPages = 1;
        
        this.init();
    }

    /**
     * Инициализация каталога
     */
    async init() {
        this.cacheElements();
        this.bindEvents();
        await this.loadCategories();
        await this.loadBrands();
        await this.loadProducts();
        this.getURLParams();
        this.applyFilters();
        this.setupView();
    }

    /**
     * Кэширование DOM элементов
     */
    cacheElements() {
        this.productsGrid = document.getElementById('productsGrid');
        this.categoryFilters = document.getElementById('categoryFilters');
        this.brandList = document.getElementById('brandList');
        this.resultsCount = document.getElementById('resultsCount');
        this.pagination = document.getElementById('pagination');
        this.noProducts = document.getElementById('noProducts');
        this.sortSelect = document.getElementById('sortSelect');
        this.minPriceInput = document.getElementById('minPrice');
        this.maxPriceInput = document.getElementById('maxPrice');
        this.priceRangeMin = document.getElementById('priceRangeMin');
        this.priceRangeMax = document.getElementById('priceRangeMax');
        this.applyPriceFilter = document.getElementById('applyPriceFilter');
        this.inStockFilter = document.getElementById('inStockFilter');
        this.discountFilter = document.getElementById('discountFilter');
        this.ratingRadios = document.querySelectorAll('input[name="rating"]');
        this.resetFiltersBtn = document.getElementById('resetFilters');
        this.resetFiltersNoProducts = document.getElementById('resetFiltersNoProducts');
        this.filterToggle = document.getElementById('filterToggle');
        this.sidebar = document.querySelector('.catalog-sidebar');
        this.viewBtns = document.querySelectorAll('.view-btn');
        this.brandSearch = document.getElementById('brandSearch');
        this.categoryTitle = document.getElementById('categoryTitle');
        this.categoryDescription = document.getElementById('categoryDescription');
        this.categoryBanner = document.getElementById('categoryBanner');
        this.categoryBreadcrumb = document.getElementById('categoryBreadcrumb');
    }

    /**
     * Привязка обработчиков событий
     */
    bindEvents() {
        // Сортировка
        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', () => {
                this.sort = this.sortSelect.value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }

        // Фильтр по цене
        if (this.applyPriceFilter) {
            this.applyPriceFilter.addEventListener('click', () => {
                this.applyPriceFilterHandler();
            });
        }

        // Ползунки цены
        if (this.priceRangeMin && this.priceRangeMax) {
            this.priceRangeMin.addEventListener('input', () => {
                const minVal = parseInt(this.priceRangeMin.value);
                const maxVal = parseInt(this.priceRangeMax.value);
                if (minVal > maxVal) {
                    this.priceRangeMin.value = maxVal;
                }
                this.minPriceInput.value = this.priceRangeMin.value;
            });

            this.priceRangeMax.addEventListener('input', () => {
                const minVal = parseInt(this.priceRangeMin.value);
                const maxVal = parseInt(this.priceRangeMax.value);
                if (maxVal < minVal) {
                    this.priceRangeMax.value = minVal;
                }
                this.maxPriceInput.value = this.priceRangeMax.value;
            });

            this.minPriceInput.addEventListener('change', () => {
                this.syncPriceInputs();
            });

            this.maxPriceInput.addEventListener('change', () => {
                this.syncPriceInputs();
            });
        }

        // Фильтры наличия и скидок
        if (this.inStockFilter) {
            this.inStockFilter.addEventListener('change', () => {
                this.filters.inStock = this.inStockFilter.checked;
                this.currentPage = 1;
                this.applyFilters();
            });
        }

        if (this.discountFilter) {
            this.discountFilter.addEventListener('change', () => {
                this.filters.onSale = this.discountFilter.checked;
                this.currentPage = 1;
                this.applyFilters();
            });
        }

        // Фильтр по рейтингу
        this.ratingRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.filters.rating = parseInt(radio.value);
                this.currentPage = 1;
                this.applyFilters();
            });
        });

        // Сброс фильтров
        if (this.resetFiltersBtn) {
            this.resetFiltersBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        if (this.resetFiltersNoProducts) {
            this.resetFiltersNoProducts.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // Поиск по брендам
        if (this.brandSearch) {
            this.brandSearch.addEventListener('input', () => {
                this.filterBrands(this.brandSearch.value);
            });
        }

        // Переключение вида
        this.viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        // Мобильное меню фильтров
        if (this.filterToggle) {
            this.filterToggle.addEventListener('click', () => {
                this.sidebar.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            // Закрытие по клику вне фильтров
            document.addEventListener('click', (e) => {
                if (this.sidebar && this.sidebar.classList.contains('active')) {
                    if (!this.sidebar.contains(e.target) && !this.filterToggle.contains(e.target)) {
                        this.sidebar.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }
            });
        }

        // Кнопка применения фильтров на мобильных
        const applyMobileBtn = document.getElementById('applyFiltersMobile');
        if (applyMobileBtn) {
            applyMobileBtn.addEventListener('click', () => {
                this.sidebar.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    }

    /**
     * Загрузка категорий из API
     */
    async loadCategories() {
        try {
            // В реальном приложении здесь запрос к API
            const response = await fetch('/api/categories');
            if (response.ok) {
                this.categories = await response.json();
            } else {
                throw new Error('Failed to load categories');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            // Заглушка для демонстрации
            this.categories = [
                { id: 1, name: 'Уход за лицом', slug: 'skincare', count: 24 },
                { id: 2, name: 'Макияж', slug: 'makeup', count: 32 },
                { id: 3, name: 'Парфюмерия', slug: 'fragrance', count: 18 },
                { id: 4, name: 'Уход за волосами', slug: 'haircare', count: 15 },
                { id: 5, name: 'Натуральная косметика', slug: 'natural', count: 22 },
                { id: 6, name: 'Уход за телом', slug: 'bodycare', count: 20 },
                { id: 7, name: 'Солнцезащитные средства', slug: 'sunscreen', count: 12 },
                { id: 8, name: 'Для мужчин', slug: 'men', count: 10 }
            ];
        }
        this.renderCategoryFilters();
    }

    /**
     * Загрузка брендов из API
     */
    async loadBrands() {
        try {
            // В реальном приложении здесь запрос к API
            const response = await fetch('/api/brands');
            if (response.ok) {
                this.brands = await response.json();
            } else {
                throw new Error('Failed to load brands');
            }
        } catch (error) {
            console.error('Error loading brands:', error);
            // Заглушка для демонстрации
            this.brands = [
                { id: 1, name: 'Lumière', count: 15 },
                { id: 2, name: 'Natura', count: 12 },
                { id: 3, name: 'Pure Skin', count: 8 },
                { id: 4, name: 'Beauty Lab', count: 10 },
                { id: 5, name: 'Organic Care', count: 7 },
                { id: 6, name: 'Fresh Look', count: 9 },
                { id: 7, name: 'Eco Beauty', count: 6 },
                { id: 8, name: 'Pro Cosmetics', count: 11 }
            ];
        }
        this.renderBrandFilters();
    }

    /**
     * Загрузка товаров из API
     */
    async loadProducts() {
        this.showLoading();
        
        try {
            // В реальном приложении здесь запрос к API
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                sort: this.sort
            });

            // Добавляем фильтры
            if (this.filters.categories.length > 0) {
                params.append('categories', this.filters.categories.join(','));
            }
            if (this.filters.minPrice > 0) {
                params.append('minPrice', this.filters.minPrice);
            }
            if (this.filters.maxPrice < 10000) {
                params.append('maxPrice', this.filters.maxPrice);
            }
            if (this.filters.brands.length > 0) {
                params.append('brands', this.filters.brands.join(','));
            }
            if (this.filters.inStock) {
                params.append('inStock', 'true');
            }
            if (this.filters.onSale) {
                params.append('onSale', 'true');
            }
            if (this.filters.rating > 0) {
                params.append('rating', this.filters.rating);
            }
            if (this.filters.search) {
                params.append('search', this.filters.search);
            }

            const response = await fetch(`/api/products?${params.toString()}`);
            
            if (response.ok) {
                const data = await response.json();
                this.products = data.products;
                this.totalPages = data.pagination.pages;
            } else {
                throw new Error('Failed to load products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            // Заглушка для демонстрации
            this.generateDemoProducts();
        }

        this.filteredProducts = this.products;
        this.renderProducts();
        this.hideLoading();
    }

    /**
     * Генерация демо-товаров (для тестирования)
     */
    generateDemoProducts() {
        const categories = ['Уход за лицом', 'Макияж', 'Парфюмерия', 'Уход за волосами', 'Натуральная косметика'];
        const brands = ['Lumière', 'Natura', 'Pure Skin', 'Beauty Lab', 'Organic Care'];
        
        this.products = [];
        for (let i = 1; i <= 50; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const price = Math.floor(Math.random() * 8000) + 500;
            const hasDiscount = Math.random() > 0.7;
            
            this.products.push({
                id: i,
                name: `${brand} Крем ${i}`,
                description: 'Интенсивное увлажнение и питание кожи. Подходит для всех типов кожи.',
                price: price,
                originalPrice: hasDiscount ? price * 1.3 : null,
                image: `https://picsum.photos/seed/product${i}/300/300`,
                category: category,
                brand: brand,
                rating: (Math.random() * 1 + 4).toFixed(1),
                inStock: Math.random() > 0.2,
                isNew: Math.random() > 0.8,
                isPopular: Math.random() > 0.7,
                created_at: new Date(Date.now() - Math.random() * 31536000000).toISOString()
            });
        }

        this.filteredProducts = this.products;
        this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
    }

    /**
     * Показать загрузку
     */
    showLoading() {
        if (this.productsGrid) {
            this.productsGrid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Загрузка товаров...</p>
                </div>
            `;
        }
    }

    /**
     * Скрыть загрузку
     */
    hideLoading() {
        // Загрузка скрыта автоматически при рендеринге
    }

    /**
     * Отрисовка фильтров категорий
     */
    renderCategoryFilters() {
        if (!this.categoryFilters) return;

        this.categoryFilters.innerHTML = this.categories.map(category => `
            <div class="category-filter-item">
                <label class="category-filter-label">
                    <input type="checkbox" value="${category.id}" 
                           data-category="${category.slug}"
                           ${this.filters.categories.includes(category.id) ? 'checked' : ''}>
                    <span class="category-checkbox"></span>
                    <span class="category-name">${category.name}</span>
                    <span class="category-count">${category.count}</span>
                </label>
            </div>
        `).join('');

        // Добавляем обработчики
        this.categoryFilters.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const categoryId = parseInt(checkbox.value);
                if (checkbox.checked) {
                    this.filters.categories.push(categoryId);
                } else {
                    this.filters.categories = this.filters.categories.filter(id => id !== categoryId);
                }
                this.currentPage = 1;
                this.applyFilters();
            });
        });
    }

    /**
     * Отрисовка фильтров брендов
     */
    renderBrandFilters() {
        if (!this.brandList) return;

        this.brandList.innerHTML = this.brands.map(brand => `
            <label class="brand-item">
                <input type="checkbox" value="${brand.id}" 
                       ${this.filters.brands.includes(brand.id) ? 'checked' : ''}>
                <span class="brand-name">${brand.name}</span>
                <span class="brand-count">${brand.count}</span>
            </label>
        `).join('');

        // Добавляем обработчики
        this.brandList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const brandId = parseInt(checkbox.value);
                if (checkbox.checked) {
                    this.filters.brands.push(brandId);
                } else {
                    this.filters.brands = this.filters.brands.filter(id => id !== brandId);
                }
                this.currentPage = 1;
                this.applyFilters();
            });
        });
    }

    /**
     * Фильтрация брендов при поиске
     */
    filterBrands(query) {
        const items = this.brandList.querySelectorAll('.brand-item');
        query = query.toLowerCase();

        items.forEach(item => {
            const brandName = item.querySelector('.brand-name').textContent.toLowerCase();
            if (brandName.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    /**
     * Получение параметров из URL
     */
    getURLParams() {
        const params = new URLSearchParams(window.location.search);
        
        // Категория
        const category = params.get('category');
        if (category) {
            const categoryObj = this.categories.find(c => c.slug === category);
            if (categoryObj) {
                this.filters.categories = [categoryObj.id];
                this.updateCategoryBanner(categoryObj);
            }
        }

        // Поиск
        const search = params.get('search');
        if (search) {
            this.filters.search = search;
            document.getElementById('searchInput').value = search;
        }
    }

    /**
     * Обновление баннера категории
     */
    updateCategoryBanner(category) {
        if (this.categoryBanner && this.categoryTitle && this.categoryDescription) {
            this.categoryBanner.style.display = 'block';
            this.categoryTitle.textContent = category.name;
            
            // Разные описания для разных категорий
            const descriptions = {
                'skincare': 'Кремы, сыворотки и маски для идеальной кожи',
                'makeup': 'Декоративная косметика для яркого образа',
                'fragrance': 'Изысканные ароматы на каждый день',
                'haircare': 'Уход за волосами любой длины и типа',
                'natural': '100% натуральные ингредиенты для вашей красоты',
                'bodycare': 'Уход и питание для всего тела'
            };
            
            this.categoryDescription.textContent = descriptions[category.slug] || 
                `Широкий выбор ${category.name.toLowerCase()}`;
            
            if (this.categoryBreadcrumb) {
                this.categoryBreadcrumb.textContent = category.name;
            }
        }
    }

    /**
     * Применение всех фильтров
     */
    applyFilters() {
        // Фильтрация товаров
        this.filteredProducts = this.products.filter(product => {
            // Фильтр по категории
            if (this.filters.categories.length > 0) {
                const category = this.categories.find(c => c.name === product.category);
                if (!category || !this.filters.categories.includes(category.id)) {
                    return false;
                }
            }

            // Фильтр по цене
            if (product.price < this.filters.minPrice || product.price > this.filters.maxPrice) {
                return false;
            }

            // Фильтр по бренду
            if (this.filters.brands.length > 0) {
                const brand = this.brands.find(b => b.name === product.brand);
                if (!brand || !this.filters.brands.includes(brand.id)) {
                    return false;
                }
            }

            // Фильтр по наличию
            if (this.filters.inStock && !product.inStock) {
                return false;
            }

            // Фильтр по скидкам
            if (this.filters.onSale && !product.originalPrice) {
                return false;
            }

            // Фильтр по рейтингу
            if (this.filters.rating > 0 && parseFloat(product.rating) < this.filters.rating) {
                return false;
            }

            // Поиск
            if (this.filters.search) {
                const searchLower = this.filters.search.toLowerCase();
                const productName = product.name.toLowerCase();
                const productBrand = product.brand.toLowerCase();
                if (!productName.includes(searchLower) && !productBrand.includes(searchLower)) {
                    return false;
                }
            }

            return true;
        });

        // Сортировка
        this.sortProducts();

        // Пагинация
        this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        
        // Обновление UI
        this.updateResultsCount();
        this.renderProducts();
        this.renderPagination();
        
        // Показать/скрыть сообщение об отсутствии товаров
        if (this.filteredProducts.length === 0) {
            this.showNoProducts();
        } else {
            this.hideNoProducts();
        }
    }

    /**
     * Сортировка товаров
     */
    sortProducts() {
        switch(this.sort) {
            case 'price-asc':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                this.filteredProducts.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
                break;
            case 'rating':
                this.filteredProducts.sort((a, b) => b.rating - a.rating);
                break;
            case 'name-asc':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                this.filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'popular':
            default:
                this.filteredProducts.sort((a, b) => 
                    (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)
                );
                break;
        }
    }

    /**
     * Обработчик применения ценового фильтра
     */
    applyPriceFilterHandler() {
        const minPrice = parseInt(this.minPriceInput.value) || 0;
        const maxPrice = parseInt(this.maxPriceInput.value) || 10000;

        if (minPrice > maxPrice) {
            shop.showNotification('Минимальная цена не может быть больше максимальной', 'error');
            return;
        }

        this.filters.minPrice = minPrice;
        this.filters.maxPrice = maxPrice;
        this.currentPage = 1;
        this.applyFilters();
    }

    /**
     * Синхронизация полей ввода цены с ползунками
     */
    syncPriceInputs() {
        let minPrice = parseInt(this.minPriceInput.value) || 0;
        let maxPrice = parseInt(this.maxPriceInput.value) || 10000;

        if (minPrice > maxPrice) {
            minPrice = maxPrice;
            this.minPriceInput.value = minPrice;
        }

        if (maxPrice < minPrice) {
            maxPrice = minPrice;
            this.maxPriceInput.value = maxPrice;
        }

        this.priceRangeMin.value = minPrice;
        this.priceRangeMax.value = maxPrice;
        
        this.filters.minPrice = minPrice;
        this.filters.maxPrice = maxPrice;
    }

    /**
     * Сброс всех фильтров
     */
    resetFilters() {
        // Сброс фильтров
        this.filters = {
            categories: [],
            minPrice: 0,
            maxPrice: 10000,
            brands: [],
            inStock: false,
            onSale: false,
            rating: 0,
            search: ''
        };
        
        this.sort = 'popular';
        this.currentPage = 1;

        // Сброс UI элементов
        if (this.minPriceInput) {
            this.minPriceInput.value = 0;
            this.maxPriceInput.value = 10000;
        }

        if (this.priceRangeMin) {
            this.priceRangeMin.value = 0;
            this.priceRangeMax.value = 10000;
        }

        if (this.inStockFilter) {
            this.inStockFilter.checked = false;
        }

        if (this.discountFilter) {
            this.discountFilter.checked = false;
        }

        if (this.sortSelect) {
            this.sortSelect.value = 'popular';
        }

        // Сброс чекбоксов категорий
        document.querySelectorAll('#categoryFilters input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });

        // Сброс чекбоксов брендов
        document.querySelectorAll('#brandList input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });

        // Сброс радио кнопок рейтинга
        document.querySelector('input[name="rating"][value="0"]').checked = true;

        // Сброс поиска
        if (this.filters.search) {
            document.getElementById('searchInput').value = '';
        }

        // Применение фильтров
        this.applyFilters();
    }

    /**
     * Обновление счетчика результатов
     */
    updateResultsCount() {
        if (this.resultsCount) {
            this.resultsCount.textContent = this.filteredProducts.length;
        }
    }

    /**
     * Отрисовка товаров
     */
    renderProducts() {
        if (!this.productsGrid) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredProducts.length);
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

        if (this.view === 'grid') {
            this.productsGrid.setAttribute('data-view', 'grid');
            this.productsGrid.innerHTML = productsToShow.map(product => this.renderProductCard(product)).join('');
        } else {
            this.productsGrid.setAttribute('data-view', 'list');
            this.productsGrid.innerHTML = productsToShow.map(product => this.renderProductListItem(product)).join('');
        }

        // Добавляем обработчики для кнопок
        this.attachProductEvents();
    }

    /**
     * Отрисовка карточки товара (сетка)
     */
    renderProductCard(product) {
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        
        return `
            <div class="product-card" data-id="${product.id}">
                ${product.isNew ? '<span class="product-badge">Новинка</span>' : ''}
                ${hasDiscount ? '<span class="product-badge" style="background: #e74c3c;">Скидка</span>' : ''}
                ${!product.inStock ? '<span class="product-badge" style="background: #95a5a6;">Нет в наличии</span>' : ''}
                
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     loading="lazy" onerror="this.src='https://via.placeholder.com/300'">
                
                <div class="product-info">
                    <div class="product-brand">${product.brand}</div>
                    <h3 class="product-title">${this.truncateText(product.name, 50)}</h3>
                    
                    <div class="product-rating">
                        ${this.generateStars(product.rating)}
                        <span class="rating-value">${product.rating}</span>
                    </div>
                    
                    <div class="product-price-block">
                        <div class="product-price">
                            ${product.price.toLocaleString()} ₽
                        </div>
                        ${hasDiscount ? `
                            <div class="product-old-price">
                                ${product.originalPrice.toLocaleString()} ₽
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn btn-primary add-to-cart" 
                                data-id="${product.id}"
                                ${!product.inStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i>
                            ${product.inStock ? 'В корзину' : 'Нет в наличии'}
                        </button>
                        <button class="quick-view-btn" data-id="${product.id}" title="Быстрый просмотр">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Отрисовка товара в виде списка
     */
    renderProductListItem(product) {
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        
        return `
            <div class="product-card" data-id="${product.id}">
                ${product.isNew ? '<span class="product-badge">Новинка</span>' : ''}
                ${hasDiscount ? '<span class="product-badge" style="background: #e74c3c;">Скидка</span>' : ''}
                
                <img src="${product.image}" alt="${product.name}" class="product-image"
                     loading="lazy" onerror="this.src='https://via.placeholder.com/300'">
                
                <div class="product-info">
                    <div class="product-brand">${product.brand}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    
                    <div class="product-rating">
                        ${this.generateStars(product.rating)}
                        <span class="rating-value">${product.rating}</span>
                    </div>
                    
                    <div class="product-price-block">
                        <div class="product-price">
                            ${product.price.toLocaleString()} ₽
                        </div>
                        ${hasDiscount ? `
                            <div class="product-old-price">
                                ${product.originalPrice.toLocaleString()} ₽
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart" 
                            data-id="${product.id}"
                            ${!product.inStock ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i>
                        ${product.inStock ? 'В корзину' : 'Нет в наличии'}
                    </button>
                    <button class="quick-view-btn" data-id="${product.id}" title="Быстрый просмотр">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Обрезка текста
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Генерация звезд рейтинга
     */
    generateStars(rating) {
        const numRating = parseFloat(rating);
        let stars = '';
        
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(numRating)) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i === Math.ceil(numRating) && numRating % 1 >= 0.5) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        
        return stars;
    }

    /**
     * Привязка событий к товарам
     */
    attachProductEvents() {
        // Переход на страницу товара при клике на карточку
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const productId = card.dataset.id;
                    window.location.href = `product.html?id=${productId}`;
                }
            });
        });

        // Добавление в корзину
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(e.currentTarget.dataset.id);
                const product = this.products.find(p => p.id === productId);
                
                if (product && product.inStock) {
                    if (window.shop) {
                        window.shop.addToCart(product);
                    }
                    
                    // Анимация кнопки
                    const originalText = e.currentTarget.innerHTML;
                    e.currentTarget.innerHTML = '<i class="fas fa-check"></i> Добавлено';
                    e.currentTarget.style.background = '#28a745';
                    
                    setTimeout(() => {
                        e.currentTarget.innerHTML = originalText;
                        e.currentTarget.style.background = '';
                    }, 2000);
                }
            });
        });

        // Быстрый просмотр
        document.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = e.currentTarget.dataset.id;
                this.quickView(productId);
            });
        });
    }

    /**
     * Быстрый просмотр товара
     */
    quickView(productId) {
        const product = this.products.find(p => p.id == productId);
        if (!product) return;

        const modal = document.getElementById('quickViewModal');
        const body = document.getElementById('quickViewBody');

        body.innerHTML = `
            <div class="quick-view-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="quick-view-details">
                <h2>${product.name}</h2>
                <div class="product-brand">${product.brand}</div>
                <div class="product-rating">
                    ${this.generateStars(product.rating)}
                    <span>${product.rating}</span>
                </div>
                <p class="product-description">${product.description}</p>
                <div class="product-price">
                    ${product.price.toLocaleString()} ₽
                    ${product.originalPrice ? `
                        <span class="old-price">${product.originalPrice.toLocaleString()} ₽</span>
                    ` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> В корзину
                    </button>
                    <a href="product.html?id=${product.id}" class="btn btn-outline">
                        Подробнее
                    </a>
                </div>
            </div>
        `;

        modal.classList.add('show');

        // Закрытие модального окна
        const closeBtn = modal.querySelector('.close-quick-view');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }

    /**
     * Отрисовка пагинации
     */
    renderPagination() {
        if (!this.pagination) return;

        if (this.totalPages <= 1) {
            this.pagination.innerHTML = '';
            return;
        }

        let html = '';

        // Кнопка "Назад"
        if (this.currentPage > 1) {
            html += `<a href="#" class="page-link" data-page="${this.currentPage - 1}">&laquo;</a>`;
        }

        // Номера страниц
        for (let i = 1; i <= this.totalPages; i++) {
            if (
                i === 1 || 
                i === this.totalPages || 
                (i >= this.currentPage - 2 && i <= this.currentPage + 2)
            ) {
                html += `
                    <a href="#" class="page-link ${i === this.currentPage ? 'active' : ''}" 
                       data-page="${i}">${i}</a>
                `;
            } else if (
                i === this.currentPage - 3 || 
                i === this.currentPage + 3
            ) {
                html += '<span class="page-dots">...</span>';
            }
        }

        // Кнопка "Вперед"
        if (this.currentPage < this.totalPages) {
            html += `<a href="#" class="page-link" data-page="${this.currentPage + 1}">&raquo;</a>`;
        }

        this.pagination.innerHTML = html;

        // Добавляем обработчики
        this.pagination.querySelectorAll('.page-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage = parseInt(e.target.dataset.page);
                this.renderProducts();
                this.renderPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    /**
     * Показать сообщение об отсутствии товаров
     */
    showNoProducts() {
        if (this.productsGrid) {
            this.productsGrid.style.display = 'none';
        }
        if (this.pagination) {
            this.pagination.style.display = 'none';
        }
        if (this.noProducts) {
            this.noProducts.style.display = 'block';
        }
    }

    /**
     * Скрыть сообщение об отсутствии товаров
     */
    hideNoProducts() {
        if (this.productsGrid) {
            this.productsGrid.style.display = 'grid';
        }
        if (this.pagination) {
            this.pagination.style.display = 'flex';
        }
        if (this.noProducts) {
            this.noProducts.style.display = 'none';
        }
    }

    /**
     * Переключение вида отображения
     */
    switchView(view) {
        this.view = view;
        
        // Обновление активной кнопки
        this.viewBtns.forEach(btn => {
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Перерендеринг товаров
        this.renderProducts();
    }


    setupView() {
        // сохраненные настройки пользователя
        const savedView = localStorage.getItem('catalogView');
        if (savedView && (savedView === 'grid' || savedView === 'list')) {
            this.switchView(savedView);
        }

        // Сохраняем настройки 
        this.viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                localStorage.setItem('catalogView', this.view);
            });
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsGrid')) {
        window.catalogManager = new CatalogManager();
    }
});