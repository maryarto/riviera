<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

$db = new Database();
$conn = $db->connect();

if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        register();
        break;
        
    case 'login':
        login();
        break;
        
    case 'logout':
        logout();
        break;
        
    case 'profile':
        getProfile();
        break;
        
    case 'update':
        updateProfile();
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}

function register() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!validateRegistrationData($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid registration data']);
        return;
    }
    
    // Проверяем, существует ли пользователь с таким email
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->bindParam(':email', $data['email']);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already registered']);
        return;
    }
    
    try {
        // Хешируем пароль
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $stmt = $conn->prepare("
            INSERT INTO users (name, email, password, phone) 
            VALUES (:name, :email, :password, :phone)
        ");
        
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':phone', $data['phone'] ?? null);
        
        if ($stmt->execute()) {
            $userId = $conn->lastInsertId();
            
            // Генерируем JWT токен
            $token = generateJWT($userId, $data['email']);
            
            echo json_encode([
                'success' => true,
                'userId' => $userId,
                'name' => $data['name'],
                'email' => $data['email'],
                'token' => $token,
                'message' => 'Registration successful'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to register user']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function login() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("SELECT * FROM users WHERE email = :email");
        $stmt->bindParam(':email', $data['email']);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($data['password'], $user['password'])) {
            // Генерируем JWT токен
            $token = generateJWT($user['id'], $user['email']);
            
            echo json_encode([
                'success' => true,
                'userId' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'token' => $token,
                'message' => 'Login successful'
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid email or password']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function logout() {
    // В реальном приложении здесь инвалидация токена
    echo json_encode(['success' => true, 'message' => 'Logout successful']);
}

function getProfile() {
    global $conn;
    
    $userId = getUserIdFromToken();
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("
            SELECT id, name, email, phone, address, created_at 
            FROM users 
            WHERE id = :id
        ");
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // Получаем историю заказов пользователя
            $stmt = $conn->prepare("
                SELECT o.*, 
                       (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id) as items_count
                FROM orders o 
                WHERE o.user_id = :user_id 
                ORDER BY o.created_at DESC 
                LIMIT 10
            ");
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $user['orders'] = $orders;
            
            echo json_encode($user);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function updateProfile() {
    global $conn;
    
    $userId = getUserIdFromToken();
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $sql = "UPDATE users SET ";
        $params = [':id' => $userId];
        
        $allowedFields = ['name', 'phone', 'address'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $sql .= "$field = :$field, ";
                $params[":$field"] = $data[$field];
            }
        }
        
        // Обновление пароля
        if (isset($data['current_password']) && isset($data['new_password'])) {
            // Проверяем текущий пароль
            $stmt = $conn->prepare("SELECT password FROM users WHERE id = :id");
            $stmt->bindParam(':id', $userId);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($data['current_password'], $user['password'])) {
                $hashedPassword = password_hash($data['new_password'], PASSWORD_DEFAULT);
                $sql .= "password = :password, ";
                $params[':password'] = $hashedPassword;
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Current password is incorrect']);
                return;
            }
        }
        
        $sql = rtrim($sql, ', ');
        $sql .= " WHERE id = :id";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function validateRegistrationData($data) {
    $requiredFields = ['name', 'email', 'password'];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            return false;
        }
    }
    
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    
    if (strlen($data['password']) < 6) {
        return false;
    }
    
    return true;
}

function generateJWT($userId, $email) {
    $secret_key = 'your-secret-key'; // В реальном приложении храните в настройках
    
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $userId,
        'email' => $email,
        'iat' => time(),
        'exp' => time() + (60 * 60 * 24) // 24 часа
    ]);
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret_key, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function getUserIdFromToken() {
    // В реальном приложении здесь декодирование JWT токена
    // Для демо возвращаем 1
    return 1;
    
    /*
    $headers = getallheaders();
    $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
    
    if (!$token) {
        return null;
    }
    
    try {
        $secret_key = 'your-secret-key';
        $decoded = JWT::decode($token, $secret_key, ['HS256']);
        return $decoded->user_id;
    } catch (Exception $e) {
        return null;
    }
    */
}
?>