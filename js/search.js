// Система поиска товаров
class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');
        this.allProducts = [];
        this.init();
    }
    
    async init() {
        await this.loadAllProducts();
        this.setupEventListeners();
        this.setupAutocomplete();
    }
    
    async loadAllProducts() {
        try {
            // В реальном приложении здесь будет запрос к API
            const response = await fetch('php/api/products.php?limit=100');
            this.allProducts = await response.json();
        } catch (error) {
            console.error('Error loading products for search:', error);
        }
    }
    
    setupEventListeners() {
        if (!this.searchInput) return;
        
        // Поиск при вводе
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                this.showSearchResults(query);
            } else {
                this.hideSearchResults();
            }
        });
        
        // Закрытие результатов при клике вне поля поиска
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
                this.hideSearchResults();
            }
        });
        
        // Поиск при отправке формы
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = this.searchInput.value.trim();
                if (query) {
                    window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
                }
            });
        }
    }
    
    setupAutocomplete() {
        if (!this.searchInput) return;
        
        // Подсказки при фокусе
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.length >= 2) {
                this.showSearchResults(this.searchInput.value);
            } else {
                this.showPopularSearches();
            }
        });
    }
    
    showSearchResults(query) {
        if (!this.searchResults || this.allProducts.length === 0) return;
        
        const results = this.searchProducts(query).slice(0, 8);
        
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="search-result-item">
                    <div style="padding: 15px; text-align: center; color: #777;">
                        <i class="fas fa-search" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <p>Товары не найдены</p>
                    </div>
                </div>
            `;
        } else {
            this.searchResults.innerHTML = results.map(product => `
                <a href="product.html?id=${product.id}" class="search-result-item">
                    <img src="${product.image}" alt="${product.name}">
                    <div>
                        <h4 style="margin-bottom: 5px; font-size: 14px;">${product.name}</h4>
                        <div style="color: #d4a574; font-weight: 600;">${product.price.toLocaleString()} ₽</div>
                        <div style="font-size: 12px; color: #777;">${product.category}</div>
                    </div>
                </a>
            `).join('');
        }
        
        this.searchResults.style.display = 'block';
    }
    
    showPopularSearches() {
        if (!this.searchResults) return;
        
        const popularSearches = [
            'крем для лица',
            'помада матовая',
            'духи цветочные',
            'шампунь для волос',
            'сыворотка витамин C',
            'тональный крем',
            'тушь для ресниц',
            'лосьон для тела'
        ];
        
        this.searchResults.innerHTML = `
            <div class="search-result-item">
                <div style="padding: 15px;">
                    <p style="margin-bottom: 10px; font-weight: 600; color: #333;">Популярные запросы:</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${popularSearches.map(term => `
                            <a href="catalog.html?search=${encodeURIComponent(term)}" 
                               style="display: inline-block; padding: 5px 10px; 
                                      background: #f5f5f5; border-radius: 15px; 
                                      font-size: 12px; color: #555; text-decoration: none;">
                                ${term}
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.searchResults.style.display = 'block';
    }
    
    hideSearchResults() {
        if (this.searchResults) {
            this.searchResults.style.display = 'none';
        }
    }
    
    searchProducts(query) {
        if (!query.trim()) return [];
        
        const searchTerms = query.toLowerCase().split(' ');
        
        return this.allProducts.filter(product => {
            const searchString = `
                ${product.name.toLowerCase()}
                ${product.description.toLowerCase()}
                ${product.brand?.toLowerCase() || ''}
                ${product.category?.toLowerCase() || ''}
            `;
            
            // Проверяем все поисковые термины
            return searchTerms.every(term => searchString.includes(term));
        });
    }
    
    // Расширенный поиск с учетом категорий, брендов и т.д.
    advancedSearch(params) {
        let results = [...this.allProducts];
        
        // Поиск по тексту
        if (params.query) {
            results = this.searchProducts(params.query);
        }
        
        // Фильтр по категории
        if (params.category) {
            results = results.filter(product => product.category === params.category);
        }
        
        // Фильтр по бренду
        if (params.brand) {
            results = results.filter(product => product.brand === params.brand);
        }
        
        // Фильтр по цене
        if (params.minPrice) {
            results = results.filter(product => product.price >= params.minPrice);
        }
        
        if (params.maxPrice) {
            results = results.filter(product => product.price <= params.maxPrice);
        }
        
        // Сортировка
        if (params.sort) {
            results = this.sortResults(results, params.sort);
        }
        
        return results;
    }
    
    sortResults(results, sortType) {
        switch(sortType) {
            case 'price-asc':
                return results.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return results.sort((a, b) => b.price - a.price);
            case 'rating':
                return results.sort((a, b) => b.rating - a.rating);
            case 'newest':
                return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            default:
                return results;
        }
    }
}

// Инициализация менеджера поиска
const searchManager = new SearchManager();
window.searchManager = searchManager;