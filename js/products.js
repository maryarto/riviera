// Управление товарами, фильтрация и сортировка
class ProductManager {
    constructor() {
        this.allProducts = [];
        this.filteredProducts = [];
        this.currentCategory = null;
        this.currentFilters = {
            minPrice: 0,
            maxPrice: 10000,
            brands: [],
            inStock: false,
            onSale: false
        };
        this.currentSort = 'popular';
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.init();
    }
    
    init() {
        this.loadAllProducts();
        this.setupEventListeners();
        this.setupURLParams();
    }
    
    setupURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const search = urlParams.get('search');
        
        if (category) {
            this.currentCategory = category;
            this.updateCategoryFilter(category);
        }
        
        if (search) {
            document.getElementById('searchInput').value = search;
            this.searchProducts(search);
        }
    }
    
    async loadAllProducts() {
        try {
            // В реальном приложении здесь будет запрос к API
            const response = await fetch('php/api/products.php');
            this.allProducts = await response.json();
            this.applyFilters();
        } catch (error) {
            console.error('Error loading products:', error);
            // Заглушка для демонстрации
            this.allProducts = this.generateDemoProducts(50);
            this.applyFilters();
        }
    }
    
    generateDemoProducts(count) {
        const products = [];
        const categories = ['skincare', 'makeup', 'fragrance', 'haircare', 'natural', 'bodycare'];
        const brands = ['Lumière', 'Natura', 'Pure Skin', 'Beauty Lab', 'Organic Care', 'Fresh Look'];
        
        for (let i = 1; i <= count; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const price = Math.floor(Math.random() * 8000) + 500;
            
            products.push({
                id: i,
                name: `${brand} Продукт ${i}`,
                description: 'Высококачественный продукт для ухода и красоты',
                price: price,
                originalPrice: Math.random() > 0.7 ? price * 1.3 : null,
                image: `https://picsum.photos/seed/product${i}/500/500`,
                category: category,
                brand: brand,
                rating: (Math.random() * 1 + 4).toFixed(1),
                inStock: Math.random() > 0.1,
                isNew: Math.random() > 0.7,
                isPopular: Math.random() > 0.8,
                createdAt: new Date(Date.now() - Math.random() * 31536000000).toISOString()
            });
        }
        
        return products;
    }
    
    applyFilters() {
        let filtered = [...this.allProducts];
        
        // Фильтр по категории
        if (this.currentCategory) {
            filtered = filtered.filter(product => product.category === this.currentCategory);
        }
        
        // Фильтр по цене
        filtered = filtered.filter(product => 
            product.price >= this.currentFilters.minPrice && 
            product.price <= this.currentFilters.maxPrice
        );
        
        // Фильтр по брендам
        if (this.currentFilters.brands.length > 0) {
            filtered = filtered.filter(product => 
                this.currentFilters.brands.includes(product.brand)
            );
        }
        
        // Фильтр по наличию
        if (this.currentFilters.inStock) {
            filtered = filtered.filter(product => product.inStock);
        }
        
        // Фильтр по скидкам
        if (this.currentFilters.onSale) {
            filtered = filtered.filter(product => product.originalPrice !== null);
        }
        
        // Сортировка
        filtered = this.sortProducts(filtered, this.currentSort);
        
        this.filteredProducts = filtered;
        this.displayProducts();
        this.updatePagination();
    }
    
    sortProducts(products, sortType) {
        switch(sortType) {
            case 'price-asc':
                return [...products].sort((a, b) => a.price - b.price);
            case 'price-desc':
                return [...products].sort((a, b) => b.price - a.price);
            case 'newest':
                return [...products].sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
            case 'rating':
                return [...products].sort((a, b) => b.rating - a.rating);
            case 'popular':
            default:
                return [...products].sort((a, b) => 
                    (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)
                );
        }
    }
    
    displayProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);
        
        productsGrid.innerHTML = productsToShow.map(product => `
            <div class="product-card" data-id="${product.id}">
                ${product.isNew ? '<span class="product-badge">Новинка</span>' : ''}
                ${product.originalPrice ? '<span class="product-badge" style="background: #e74c3c;">Скидка</span>' : ''}
                ${!product.inStock ? '<span class="product-badge" style="background: #95a5a6;">Нет в наличии</span>' : ''}
                
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <div style="font-size: 0.9rem; color: #777; margin-bottom: 5px;">${product.brand}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-rating">
                        ${shop.generateStars(product.rating)}
                        <span style="color: #777; font-size: 0.9rem;">(${product.rating})</span>
                    </div>
                    
                    <div class="product-price">
                        ${product.originalPrice ? 
                            `<span style="text-decoration: line-through; color: #777; font-size: 0.9rem;">
                                ${product.originalPrice.toLocaleString()} ₽
                            </span><br>` : ''
                        }
                        ${product.price.toLocaleString()} ₽
                    </div>
                    
                    <button class="btn btn-primary add-to-cart" 
                            data-id="${product.id}"
                            ${!product.inStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        ${product.inStock ? 'В корзину' : 'Нет в наличии'}
                    </button>
                </div>
            </div>
        `).join('');
        
        this.setupProductCardListeners();
    }
    
    setupProductCardListeners() {
        // Обработчики для карточек товаров
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('add-to-cart')) {
                    const productId = card.dataset.id;
                    window.location.href = `product.html?id=${productId}`;
                }
            });
        });
        
        // Обработчики для кнопок "В корзину"
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(e.target.dataset.id);
                const product = this.allProducts.find(p => p.id === productId);
                if (product && product.inStock) {
                    shop.addToCart(product);
                    shop.showNotification('Товар добавлен в корзину!', 'success');
                }
            });
        });
    }
    
    updatePagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Кнопка "Назад"
        if (this.currentPage > 1) {
            html += `<a href="#" class="page-link" data-page="${this.currentPage - 1}">&laquo;</a>`;
        }
        
        // Страницы
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <a href="#" class="page-link ${i === this.currentPage ? 'active' : ''}" 
                       data-page="${i}">${i}</a>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span class="page-dots">...</span>';
            }
        }
        
        // Кнопка "Вперед"
        if (this.currentPage < totalPages) {
            html += `<a href="#" class="page-link" data-page="${this.currentPage + 1}">&raquo;</a>`;
        }
        
        pagination.innerHTML = html;
        
        // Обработчики для пагинации
        document.querySelectorAll('.page-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage = parseInt(e.target.dataset.page);
                this.displayProducts();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }
    
    setupEventListeners() {
        // Сортировка
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentSort = e.target.dataset.sort;
                this.applyFilters();
            });
        });
        
        // Фильтры
        const priceRange = document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        
        if (priceRange && priceValue) {
            priceRange.addEventListener('input', (e) => {
                this.currentFilters.maxPrice = parseInt(e.target.value);
                priceValue.textContent = `До ${this.currentFilters.maxPrice.toLocaleString()} ₽`;
                this.applyFilters();
            });
        }
        
        // Бренды
        document.querySelectorAll('.brand-filter').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const brand = e.target.value;
                if (e.target.checked) {
                    this.currentFilters.brands.push(brand);
                } else {
                    this.currentFilters.brands = this.currentFilters.brands.filter(b => b !== brand);
                }
                this.applyFilters();
            });
        });
        
        // Наличие
        const inStockFilter = document.getElementById('inStockFilter');
        if (inStockFilter) {
            inStockFilter.addEventListener('change', (e) => {
                this.currentFilters.inStock = e.target.checked;
                this.applyFilters();
            });
        }
        
        // Скидки
        const onSaleFilter = document.getElementById('onSaleFilter');
        if (onSaleFilter) {
            onSaleFilter.addEventListener('change', (e) => {
                this.currentFilters.onSale = e.target.checked;
                this.applyFilters();
            });
        }
        
        // Сброс фильтров
        const resetFilters = document.getElementById('resetFilters');
        if (resetFilters) {
            resetFilters.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetFilters();
            });
        }
    }
    
    resetFilters() {
        this.currentFilters = {
            minPrice: 0,
            maxPrice: 10000,
            brands: [],
            inStock: false,
            onSale: false
        };
        
        // Сбрасываем UI
        document.getElementById('priceRange').value = 10000;
        document.getElementById('priceValue').textContent = 'До 10 000 ₽';
        document.querySelectorAll('.brand-filter').forEach(cb => cb.checked = false);
        document.getElementById('inStockFilter').checked = false;
        document.getElementById('onSaleFilter').checked = false;
        
        this.applyFilters();
    }
    
    updateCategoryFilter(categorySlug) {
        this.currentCategory = categorySlug;
        
        // Обновляем заголовок страницы
        const categoryTitle = document.getElementById('categoryTitle');
        if (categoryTitle) {
            const category = shop.categories.find(c => c.slug === categorySlug);
            if (category) {
                categoryTitle.textContent = category.name;
            }
        }
        
        this.applyFilters();
    }
    
    searchProducts(query) {
        if (!query.trim()) {
            this.applyFilters();
            return;
        }
        
        const searchResults = this.allProducts.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase()) ||
            product.brand.toLowerCase().includes(query.toLowerCase())
        );
        
        this.filteredProducts = searchResults;
        this.displayProducts();
        this.updatePagination();
        
        // Показываем количество найденных товаров
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `Найдено товаров: ${searchResults.length}`;
        }
    }
}

// Инициализация менеджера товаров
if (document.getElementById('productsGrid')) {
    const productManager = new ProductManager();
    window.productManager = productManager;
}