// Управление авторизацией и регистрацией
class AuthManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkCurrentPage();
    }
    
    setupEventListeners() {
        // Форма регистрации
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.register();
            });
        }
        
        // Форма входа
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }
        
        // Показать/скрыть пароль
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                const input = e.target.previousElementSibling;
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                e.target.classList.toggle('fa-eye');
                e.target.classList.toggle('fa-eye-slash');
            });
        });
        
        // Валидация в реальном времени
        document.querySelectorAll('#registerForm input').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }
    
    checkCurrentPage() {
        // Если пользователь уже авторизован и находится на странице входа/регистрации,
        // перенаправляем его на главную
        if ((window.location.pathname.includes('login.html') || 
             window.location.pathname.includes('register.html')) && 
            shop.currentUser) {
            window.location.href = 'index.html';
        }
        
        // Если пользователь не авторизован и находится на странице профиля,
        // перенаправляем его на страницу входа
        if (window.location.pathname.includes('profile.html') && !shop.currentUser) {
            window.location.href = 'login.html';
        }
    }
    
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let message = '';
        
        switch(fieldName) {
            case 'name':
                if (value.length < 2) {
                    isValid = false;
                    message = 'Имя должно содержать минимум 2 символа';
                }
                break;
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    message = 'Введите корректный email';
                }
                break;
                
            case 'password':
                if (value.length < 6) {
                    isValid = false;
                    message = 'Пароль должен содержать минимум 6 символов';
                }
                break;
                
            case 'confirmPassword':
                const password = document.getElementById('password').value;
                if (value !== password) {
                    isValid = false;
                    message = 'Пароли не совпадают';
                }
                break;
                
            case 'phone':
                const phoneRegex = /^[\d\s\-\+\(\)]+$/;
                if (value && !phoneRegex.test(value)) {
                    isValid = false;
                    message = 'Введите корректный номер телефона';
                }
                break;
        }
        
        this.showFieldValidation(field, isValid, message);
        return isValid;
    }
    
    showFieldValidation(field, isValid, message) {
        // Удаляем предыдущие сообщения
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Убираем предыдущие стили
        field.classList.remove('is-invalid', 'is-valid');
        
        if (isValid) {
            field.classList.add('is-valid');
        } else {
            field.classList.add('is-invalid');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = message;
            errorDiv.style.cssText = `
                color: #e74c3c;
                font-size: 0.85rem;
                margin-top: 5px;
            `;
            field.parentElement.appendChild(errorDiv);
        }
    }
    
    async register() {
        // Собираем данные формы
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            phone: document.getElementById('phone').value,
            agreeTerms: document.getElementById('agreeTerms').checked
        };
        
        // Валидация
        let isValid = true;
        document.querySelectorAll('#registerForm input').forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        if (!formData.agreeTerms) {
            shop.showNotification('Необходимо согласиться с условиями', 'error');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        try {
            // В реальном приложении здесь будет запрос к API
            const response = await fetch('php/api/auth.php?action=register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Автоматически входим после регистрации
                shop.currentUser = {
                    id: result.userId,
                    name: formData.name,
                    email: formData.email
                };
                
                localStorage.setItem('currentUser', JSON.stringify(shop.currentUser));
                shop.checkAuthStatus();
                
                shop.showNotification('Регистрация успешна! Добро пожаловать!', 'success');
                
                // Перенаправляем на главную
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Ошибка при регистрации');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            shop.showNotification(error.message, 'error');
        }
    }
    
    async login() {
        const formData = {
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value,
            rememberMe: document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : false
        };
        
        if (!formData.email || !formData.password) {
            shop.showNotification('Заполните все поля', 'error');
            return;
        }
        
        try {
            // В реальном приложении здесь будет запрос к API
            const response = await fetch('php/api/auth.php?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                shop.currentUser = {
                    id: result.userId,
                    name: result.name,
                    email: formData.email,
                    token: result.token
                };
                
                localStorage.setItem('currentUser', JSON.stringify(shop.currentUser));
                
                // Если выбрано "Запомнить меня", сохраняем токен в куки
                if (formData.rememberMe && result.token) {
                    this.setCookie('auth_token', result.token, 30);
                }
                
                shop.checkAuthStatus();
                shop.showNotification('Вы успешно вошли!', 'success');
                
                // Перенаправляем на предыдущую страницу или на главную
                const redirectTo = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                setTimeout(() => {
                    window.location.href = redirectTo;
                }, 1000);
                
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Ошибка при входе');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            shop.showNotification(error.message, 'error');
        }
    }
    
    setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/';
    }
    
    getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    deleteCookie(name) {
        document.cookie = name + '=; Max-Age=-99999999; path=/';
    }
}

// Инициализация менеджера авторизации
const authManager = new AuthManager();
window.authManager = authManager;