const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Конфигурация базы данных
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cosmetics_shop',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Создание пула соединений
const pool = mysql.createPool(dbConfig);

// JWT секрет
const JWT_SECRET = 'your-secret-key-change-in-production';

// Проверка JWT токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Проверка роли администратора
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Настройка загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
}).single('image');

// Маршруты для товаров
app.get('/api/products', async (req, res) => {
    try {
        const {
            category,
            search,
            minPrice,
            maxPrice,
            brand,
            inStock,
            sort = 'created_at',
            order = 'DESC',
            page = 1,
            limit = 20
        } = req.query;

        let query = `
            SELECT p.*, c.name as category_name, c.slug as category_slug 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE 1=1
        `;
        const params = [];

        // Фильтры
        if (category) {
            query += ' AND c.slug = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (minPrice) {
            query += ' AND p.price >= ?';
            params.push(minPrice);
        }

        if (maxPrice) {
            query += ' AND p.price <= ?';
            params.push(maxPrice);
        }

        if (brand) {
            query += ' AND p.brand = ?';
            params.push(brand);
        }

        if (inStock === 'true') {
            query += ' AND p.in_stock = true';
        }

        // Сортировка
        const validSortFields = ['price', 'rating', 'created_at', 'name', 'is_popular'];
        const validOrders = ['ASC', 'DESC'];

        if (validSortFields.includes(sort) && validOrders.includes(order.toUpperCase())) {
            query += ` ORDER BY p.${sort} ${order}`;
        } else {
            query += ' ORDER BY p.created_at DESC';
        }

        // Пагинация
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        // Получение товаров
        const [products] = await pool.execute(query, params);

        // Получение общего количества
        let countQuery = 'SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
        const countParams = [];

        if (category) {
            countQuery += ' AND c.slug = ?';
            countParams.push(category);
        }

        if (search) {
            countQuery += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [products] = await pool.execute(`
            SELECT p.*, c.name as category_name, c.slug as category_slug 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ?
        `, [id]);

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = products[0];

        // Получение отзывов
        const [reviews] = await pool.execute(`
            SELECT r.*, u.name as user_name 
            FROM reviews r 
            LEFT JOIN users u ON r.user_id = u.id 
            WHERE r.product_id = ? 
            ORDER BY r.created_at DESC
        `, [id]);

        product.reviews = reviews;

        // Получение похожих товаров
        const [similar] = await pool.execute(`
            SELECT * FROM products 
            WHERE category_id = ? 
            AND id != ? 
            ORDER BY RAND() 
            LIMIT 4
        `, [product.category_id, id]);

        product.similar_products = similar;

        res.json(product);

    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/products', authenticateToken, isAdmin, upload, async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            original_price,
            category_id,
            brand,
            in_stock = true,
            is_new = false,
            is_popular = false
        } = req.body;

        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const [result] = await pool.execute(`
            INSERT INTO products 
            (name, description, price, original_price, image_url, category_id, brand, in_stock, is_new, is_popular) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, description, price, original_price, image_url, category_id, brand, in_stock, is_new, is_popular]);

        res.json({
            success: true,
            product_id: result.insertId,
            message: 'Product created successfully'
        });

    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Маршруты для категорий
app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await pool.execute(`
            SELECT * FROM categories 
            WHERE parent_id IS NULL 
            ORDER BY name
        `);

        // Получаем подкатегории для каждой категории
        for (let category of categories) {
            const [subcategories] = await pool.execute(`
                SELECT * FROM categories 
                WHERE parent_id = ? 
                ORDER BY name
            `, [category.id]);

            category.subcategories = subcategories;
        }

        res.json(categories);

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Маршруты для пользователей
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Валидация
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Проверка существующего пользователя
        const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание пользователя
        const [result] = await pool.execute(`
            INSERT INTO users (name, email, password, phone) 
            VALUES (?, ?, ?, ?)
        `, [name, email, hashedPassword, phone]);

        // Генерация JWT токена
        const token = jwt.sign(
            { userId: result.insertId, email, role: 'user' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            userId: result.insertId,
            name,
            email,
            token,
            message: 'Registration successful'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Поиск пользователя
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Проверка пароля
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Генерация JWT токена
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: 'user' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            userId: user.id,
            name: user.name,
            email: user.email,
            token,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(`
            SELECT id, name, email, phone, address, created_at 
            FROM users 
            WHERE id = ?
        `, [req.user.userId]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        // Получение заказов пользователя
        const [orders] = await pool.execute(`
            SELECT o.*, 
                   (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id) as items_count
            FROM orders o 
            WHERE o.user_id = ? 
            ORDER BY o.created_at DESC 
            LIMIT 10
        `, [req.user.userId]);

        user.orders = orders;

        res.json(user);

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Маршруты для корзины
app.post('/api/cart/add', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.userId;

        // Проверка существования товара
        const [products] = await pool.execute('SELECT * FROM products WHERE id = ? AND in_stock = true', [productId]);

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found or out of stock' });
        }

        // Проверка существующего элемента в корзине
        const [existingItems] = await pool.execute(`
            SELECT * FROM cart_items 
            WHERE user_id = ? AND product_id = ?
        `, [userId, productId]);

        if (existingItems.length > 0) {
            // Обновление количества
            await pool.execute(`
                UPDATE cart_items 
                SET quantity = quantity + ? 
                WHERE user_id = ? AND product_id = ?
            `, [quantity, userId, productId]);
        } else {
            // Добавление нового элемента
            await pool.execute(`
                INSERT INTO cart_items (user_id, product_id, quantity) 
                VALUES (?, ?, ?)
            `, [userId, productId, quantity]);
        }

        res.json({ success: true, message: 'Product added to cart' });

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const [cartItems] = await pool.execute(`
            SELECT ci.*, p.name, p.price, p.image_url, p.in_stock 
            FROM cart_items ci 
            JOIN products p ON ci.product_id = p.id 
            WHERE ci.user_id = ?
        `, [userId]);

        // Расчет общей суммы
        let subtotal = 0;
        cartItems.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        res.json({
            items: cartItems,
            summary: {
                subtotal,
                shipping: subtotal > 3000 ? 0 : 300,
                total: subtotal + (subtotal > 3000 ? 0 : 300)
            }
        });

    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Маршруты для заказов
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { shippingAddress, shippingMethod, paymentMethod, notes } = req.body;

        // Получение товаров из корзины
        const [cartItems] = await pool.execute(`
            SELECT ci.*, p.price 
            FROM cart_items ci 
            JOIN products p ON ci.product_id = p.id 
            WHERE ci.user_id = ?
        `, [userId]);

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Расчет общей суммы
        let totalAmount = 0;
        cartItems.forEach(item => {
            totalAmount += item.price * item.quantity;
        });

        // Генерация номера заказа
        const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        // Создание заказа
        const [orderResult] = await pool.execute(`
            INSERT INTO orders 
            (user_id, order_number, total_amount, shipping_address, shipping_method, payment_method, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userId, orderNumber, totalAmount, shippingAddress, shippingMethod, paymentMethod, notes]);

        const orderId = orderResult.insertId;

        // Добавление элементов заказа
        for (const item of cartItems) {
            await pool.execute(`
                INSERT INTO order_items (order_id, product_id, quantity, price) 
                VALUES (?, ?, ?, ?)
            `, [orderId, item.product_id, item.quantity, item.price]);
        }

        // Очистка корзины
        await pool.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);

        res.json({
            success: true,
            orderId,
            orderNumber,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});