-- Создание базы данных
CREATE DATABASE IF NOT EXISTS cosmetics_shop;
USE cosmetics_shop;

-- Таблица пользователей
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Таблица категорий
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Таблица товаров
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    image_url VARCHAR(255),
    category_id INT,
    brand VARCHAR(100),
    rating DECIMAL(3, 2) DEFAULT 0,
    in_stock BOOLEAN DEFAULT true,
    is_new BOOLEAN DEFAULT false,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Таблица заказов
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT,
    shipping_method VARCHAR(50),
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Таблица элементов заказа
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Таблица отзывов
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Таблица корзины
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, product_id)
);

-- Индексы для оптимизации
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);

-- Вставка тестовых данных

-- Категории
INSERT INTO categories (name, slug, description) VALUES
('Уход за лицом', 'skincare', 'Кремы, сыворотки, тоники для лица'),
('Макияж', 'makeup', 'Декоративная косметика'),
('Парфюмерия', 'fragrance', 'Духи и туалетная вода'),
('Уход за волосами', 'haircare', 'Шампуни, маски, средства для укладки'),
('Натуральная косметика', 'natural', 'Органические средства'),
('Уход за телом', 'bodycare', 'Лосьоны, скрабы, масла для тела');

-- Подкатегории для ухода за лицом
INSERT INTO categories (name, slug, description, parent_id) VALUES
('Очищение', 'cleansing', 'Гели, пенки, мицеллярная вода', 1),
('Увлажнение', 'moisturizing', 'Кремы, сыворотки, маски', 1),
('Антивозрастной уход', 'anti-aging', 'Средства против морщин', 1),
('Защита от солнца', 'sun-protection', 'Солнцезащитные средства', 1);

-- Тестовые товары
INSERT INTO products (name, description, price, category_id, brand, image_url, rating, is_new, is_popular) VALUES
('Увлажняющий крем "Гидрация"', 'Интенсивное увлажнение на 24 часа с гиалуроновой кислотой', 2499.00, 1, 'Lumière', 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34', 4.8, true, true),
('Матовые помады "Velvet"', 'Насыщенный матовый цвет, который не сушит губы', 1299.00, 2, 'Lumière', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348', 4.9, false, true),
('Туалетная вода "Lumière"', 'Нежный цветочный аромат с нотками жасмина и ванили', 5800.00, 3, 'Lumière', 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6', 4.7, true, false),
('Сыворотка с витамином C', 'Осветляет тон кожи, борется с пигментацией', 3200.00, 1, 'Pure Skin', 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34', 4.6, true, true),
('Шампунь для объема', 'Придает объем и блеск тонким волосам', 890.00, 4, 'Natura', 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34', 4.5, false, false),
('Органическое масло для тела', '100% натуральное масло для питания кожи', 1500.00, 6, 'Organic Care', 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34', 4.8, false, true),
('Тональный крем', 'Легкое покрытие с SPF 30', 2100.00, 2, 'Beauty Lab', 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34', 4.4, true, false),
('Ночной крем', 'Интенсивное восстановление кожи во время сна', 2800.00, 1, 'Pure Skin', 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34', 4.7, false, true);

-- Тестовый пользователь (пароль: 123456)
INSERT INTO users (name, email, password, phone) VALUES
('Анна Иванова', 'anna@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+7 (999) 123-45-67');

-- Тестовые отзывы
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
(1, 1, 5, 'Отличный крем! Кожа стала мягкой и увлажненной.'),
(1, 2, 4, 'Хорошая помада, долго держится, но немного сушит губы.'),
(1, 3, 5, 'Прекрасный аромат, держится весь день.'),
(1, 4, 4, 'Заметно осветлила пигментные пятна за месяц использования.');