<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

$db = new Database();
$conn = $db->connect();

if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetRequest();
        break;
        
    case 'POST':
        handlePostRequest();
        break;
        
    case 'PUT':
        handlePutRequest();
        break;
        
    case 'DELETE':
        handleDeleteRequest();
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

function handleGetRequest() {
    global $conn;
    
    $id = $_GET['id'] ?? null;
    $category = $_GET['category'] ?? null;
    $search = $_GET['search'] ?? null;
    $limit = $_GET['limit'] ?? 20;
    $page = $_GET['page'] ?? 1;
    $sort = $_GET['sort'] ?? 'created_at';
    $order = $_GET['order'] ?? 'DESC';
    
    $offset = ($page - 1) * $limit;
    
    // Получение конкретного товара
    if ($id) {
        $stmt = $conn->prepare("
            SELECT p.*, c.name as category_name, c.slug as category_slug 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = :id
        ");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($product) {
            // Получаем отзывы для товара
            $stmt = $conn->prepare("
                SELECT r.*, u.name as user_name 
                FROM reviews r 
                LEFT JOIN users u ON r.user_id = u.id 
                WHERE r.product_id = :product_id 
                ORDER BY r.created_at DESC
            ");
            $stmt->bindParam(':product_id', $id);
            $stmt->execute();
            $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $product['reviews'] = $reviews;
            
            // Получаем похожие товары
            $stmt = $conn->prepare("
                SELECT * FROM products 
                WHERE category_id = :category_id 
                AND id != :id 
                ORDER BY RAND() 
                LIMIT 4
            ");
            $stmt->bindParam(':category_id', $product['category_id']);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $similar = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $product['similar_products'] = $similar;
            
            echo json_encode($product);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
        }
        return;
    }
    
    // Построение базового запроса
    $sql = "
        SELECT p.*, c.name as category_name, c.slug as category_slug 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE 1=1
    ";
    
    $params = [];
    
    // Фильтр по категории
    if ($category) {
        $sql .= " AND c.slug = :category";
        $params[':category'] = $category;
    }
    
    // Поиск по тексту
    if ($search) {
        $sql .= " AND (p.name LIKE :search OR p.description LIKE :search OR p.brand LIKE :search)";
        $params[':search'] = "%$search%";
    }
    
    // Сортировка
    $validSortFields = ['price', 'rating', 'created_at', 'name'];
    $validOrder = ['ASC', 'DESC'];
    
    if (in_array($sort, $validSortFields)) {
        $sql .= " ORDER BY p.$sort";
        if (in_array(strtoupper($order), $validOrder)) {
            $sql .= " $order";
        }
    }
    
    // Пагинация
    $sql .= " LIMIT :limit OFFSET :offset";
    
    $stmt = $conn->prepare($sql);
    
    // Привязка параметров
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Получаем общее количество для пагинации
    $countSql = "
        SELECT COUNT(*) as total 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE 1=1
    ";
    
    if ($category) {
        $countSql .= " AND c.slug = :category";
    }
    
    if ($search) {
        $countSql .= " AND (p.name LIKE :search OR p.description LIKE :search OR p.brand LIKE :search)";
    }
    
    $countStmt = $conn->prepare($countSql);
    
    if ($category) {
        $countStmt->bindValue(':category', $category);
    }
    
    if ($search) {
        $countStmt->bindValue(':search', "%$search%");
    }
    
    $countStmt->execute();
    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode([
        'products' => $products,
        'pagination' => [
            'total' => $total,
            'page' => (int)$page,
            'limit' => (int)$limit,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function handlePostRequest() {
    global $conn;
    
    // Проверка авторизации (для админа)
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!validateProductData($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid product data']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("
            INSERT INTO products 
            (name, description, price, original_price, image_url, category_id, brand, in_stock, is_new, is_popular) 
            VALUES 
            (:name, :description, :price, :original_price, :image_url, :category_id, :brand, :in_stock, :is_new, :is_popular)
        ");
        
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':price', $data['price']);
        $stmt->bindParam(':original_price', $data['original_price'] ?? null);
        $stmt->bindParam(':image_url', $data['image_url']);
        $stmt->bindParam(':category_id', $data['category_id']);
        $stmt->bindParam(':brand', $data['brand']);
        $stmt->bindParam(':in_stock', $data['in_stock'], PDO::PARAM_BOOL);
        $stmt->bindParam(':is_new', $data['is_new'], PDO::PARAM_BOOL);
        $stmt->bindParam(':is_popular', $data['is_popular'], PDO::PARAM_BOOL);
        
        if ($stmt->execute()) {
            $productId = $conn->lastInsertId();
            echo json_encode([
                'success' => true,
                'product_id' => $productId,
                'message' => 'Product created successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create product']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function handlePutRequest() {
    global $conn;
    
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        return;
    }
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID is required']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!validateProductData($data, false)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid product data']);
        return;
    }
    
    try {
        $sql = "UPDATE products SET ";
        $params = [];
        
        foreach ($data as $key => $value) {
            if (in_array($key, ['name', 'description', 'price', 'original_price', 'image_url', 'category_id', 'brand', 'in_stock', 'is_new', 'is_popular'])) {
                $sql .= "$key = :$key, ";
                $params[":$key"] = $value;
            }
        }
        
        $sql = rtrim($sql, ', ');
        $sql .= " WHERE id = :id";
        $params[':id'] = $id;
        
        $stmt = $conn->prepare($sql);
        
        foreach ($params as $key => $value) {
            if (in_array($key, [':in_stock', ':is_new', ':is_popular'])) {
                $stmt->bindValue($key, $value, PDO::PARAM_BOOL);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Product updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update product']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function handleDeleteRequest() {
    global $conn;
    
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        return;
    }
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID is required']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("DELETE FROM products WHERE id = :id");
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Product deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete product']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function validateProductData($data, $requireAll = true) {
    $requiredFields = ['name', 'price', 'category_id', 'brand'];
    
    if ($requireAll) {
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return false;
            }
        }
    }
    
    if (isset($data['price']) && (!is_numeric($data['price']) || $data['price'] <= 0)) {
        return false;
    }
    
    if (isset($data['original_price']) && !is_numeric($data['original_price'])) {
        return false;
    }
    
    return true;
}

function isAdmin() {
    // В реальном приложении здесь проверка JWT токена или сессии
    // Для демо всегда возвращаем true
    return true;
    
    /*
    // Пример проверки JWT
    $headers = getallheaders();
    $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
    
    try {
        $decoded = JWT::decode($token, 'your-secret-key', ['HS256']);
        return $decoded->role === 'admin';
    } catch (Exception $e) {
        return false;
    }
    */
}
?>