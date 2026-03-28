/**
 * Управление страницей входа
 * Обработка формы входа, валидация, социальная авторизация
 */

class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('loginEmail');
        this.passwordInput = document.getElementById('loginPassword');
        this.rememberCheckbox = document.getElementById('rememberMe');
        this.loginBtn = document.getElementById('loginBtn');
        this.forgotPasswordLink = document.getElementById('forgotPassword');
        this.resetModal = document.getElementById('resetPasswordModal');
        this.resetForm = document.getElementById('resetPasswordForm');
        
        this.init();
    }

    /**
     * Инициализация менеджера входа
     */
    init() {
        this.checkSavedCredentials();
        this.bindEvents();
        this.setupSocialButtons();
    }

    /**
     * Привязка обработчиков событий
     */
    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        if (this.emailInput) {
            this.emailInput.addEventListener('blur', () => this.validateEmail());
            this.emailInput.addEventListener('input', () => this.clearFieldError('email'));
        }

        if (this.passwordInput) {
            this.passwordInput.addEventListener('blur', () => this.validatePassword());
            this.passwordInput.addEventListener('input', () => this.clearFieldError('password'));
        }

        // Показать/скрыть пароль
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                const input = document.getElementById(targetId);
                const icon = e.currentTarget.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });

        // Восстановление пароля
        if (this.forgotPasswordLink) {
            this.forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showResetModal();
            });
        }

        // Закрытие модального окна
        const closeBtn = document.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideResetModal());
        }

        // Отправка формы восстановления
        if (this.resetForm) {
            this.resetForm.addEventListener('submit', (e) => this.handleResetPassword(e));
        }

        // Закрытие модального окна по клику вне его
        window.addEventListener('click', (e) => {
            if (e.target === this.resetModal) {
                this.hideResetModal();
            }
        });

        // Обработка Enter на полях
        this.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.passwordInput.focus();
            }
        });

        this.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSubmit(e);
            }
        });
    }

    /**
     * Проверка сохраненных учетных данных
     */
    checkSavedCredentials() {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            this.emailInput.value = savedEmail;
            this.rememberCheckbox.checked = true;
            this.passwordInput.focus();
        }
    }

    /**
     * Валидация email
     */
    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showFieldError('email', 'Введите email');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            this.showFieldError('email', 'Введите корректный email');
            return false;
        }
        
        this.clearFieldError('email');
        return true;
    }

    /**
     * Валидация пароля
     */
    validatePassword() {
        const password = this.passwordInput.value;
        
        if (!password) {
            this.showFieldError('password', 'Введите пароль');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError('password', 'Пароль должен содержать минимум 6 символов');
            return false;
        }
        
        this.clearFieldError('password');
        return true;
    }

    /**
     * Показать ошибку поля
     */
    showFieldError(field, message) {
        const errorElement = document.getElementById(`${field}Error`);
        const input = field === 'email' ? this.emailInput : this.passwordInput;
        
        if (errorElement) {
            errorElement.textContent = message;
        }
        
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
    }

    /**
     * Очистить ошибку поля
     */
    clearFieldError(field) {
        const errorElement = document.getElementById(`${field}Error`);
        const input = field === 'email' ? this.emailInput : this.passwordInput;
        
        if (errorElement) {
            errorElement.textContent = '';
        }
        
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    }

    /**
     * Обработка отправки формы
     */
    async handleSubmit(e) {
        e.preventDefault();

        // Валидация
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();

        if (!isEmailValid || !isPasswordValid) {
            shop.showNotification('Пожалуйста, заполните все поля корректно', 'error');
            return;
        }

        // Показываем загрузку
        this.setLoadingState(true);

        // Получаем данные формы
        const formData = {
            email: this.emailInput.value.trim(),
            password: this.passwordInput.value,
            remember: this.rememberCheckbox.checked
        };

        try {
            // В реальном приложении здесь будет запрос к API
            const response = await this.sendLoginRequest(formData);

            if (response.success) {
                // Сохраняем email если нужно
                if (formData.remember) {
                    localStorage.setItem('rememberedEmail', formData.email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                // Сохраняем данные пользователя
                const userData = {
                    id: response.userId,
                    name: response.name,
                    email: response.email,
                    token: response.token
                };

                localStorage.setItem('currentUser', JSON.stringify(userData));
                
                // Обновляем состояние в главном объекте
                if (window.shop) {
                    window.shop.currentUser = userData;
                    window.shop.checkAuthStatus();
                }

                // Показываем успешное сообщение
                shop.showNotification('Вход выполнен успешно!', 'success');

                // Перенаправляем на предыдущую страницу или на главную
                const redirectTo = this.getRedirectUrl();
                setTimeout(() => {
                    window.location.href = redirectTo;
                }, 1000);
            } else {
                throw new Error(response.error || 'Ошибка при входе');
            }
        } catch (error) {
            console.error('Login error:', error);
            shop.showNotification(error.message, 'error');
            this.setLoadingState(false);
        }
    }

    /**
     * Отправка запроса на вход (имитация)
     */
    async sendLoginRequest(data) {
        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Демо-данные для тестирования
        const demoUsers = [
            { email: 'test@test.com', password: '123456', name: 'Тестовый Пользователь' },
            { email: 'user@example.com', password: '123456', name: 'Анна Иванова' },
            { email: 'demo@lumiere.ru', password: 'demo123', name: 'Демо Пользователь' }
        ];

        const user = demoUsers.find(u => u.email === data.email && u.password === data.password);

        if (user) {
            return {
                success: true,
                userId: 1,
                name: user.name,
                email: user.email,
                token: 'demo-jwt-token-' + Date.now()
            };
        } else {
            throw new Error('Неверный email или пароль');
        }

        /* В реальном приложении:
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        return await response.json();
        */
    }

    /**
     * Получение URL для перенаправления
     */
    getRedirectUrl() {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        
        if (redirect) {
            return decodeURIComponent(redirect);
        }
        
        // Проверяем, откуда пришли
        const referrer = document.referrer;
        if (referrer && !referrer.includes('login') && !referrer.includes('register')) {
            return referrer;
        }
        
        return 'index.html';
    }

    /**
     * Установка состояния загрузки
     */
    setLoadingState(isLoading) {
        if (isLoading) {
            this.loginBtn.disabled = true;
            this.loginBtn.querySelector('.btn-text').style.opacity = '0';
            this.loginBtn.querySelector('.btn-loader').style.display = 'inline-block';
        } else {
            this.loginBtn.disabled = false;
            this.loginBtn.querySelector('.btn-text').style.opacity = '1';
            this.loginBtn.querySelector('.btn-loader').style.display = 'none';
        }
    }

    /**
     * Настройка кнопок социальной авторизации
     */
    setupSocialButtons() {
        const googleBtn = document.getElementById('googleLogin');
        const vkBtn = document.getElementById('vkLogin');
        const yandexBtn = document.getElementById('yandexLogin');

        if (googleBtn) {
            googleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.socialLogin('google');
            });
        }

        if (vkBtn) {
            vkBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.socialLogin('vk');
            });
        }

        if (yandexBtn) {
            yandexBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.socialLogin('yandex');
            });
        }
    }

    /**
     * Социальная авторизация
     */
    socialLogin(provider) {
        // Имитация социальной авторизации
        shop.showNotification(`Вход через ${provider}...`, 'info');
        
        setTimeout(() => {
            const userData = {
                id: 2,
                name: `User_${provider}`,
                email: `user@${provider}.com`,
                provider: provider
            };

            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            if (window.shop) {
                window.shop.currentUser = userData;
                window.shop.checkAuthStatus();
            }

            shop.showNotification('Вход выполнен успешно!', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }, 1500);
    }

    /**
     * Показать модальное окно восстановления пароля
     */
    showResetModal() {
        if (this.resetModal) {
            this.resetModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Фокус на поле email
            setTimeout(() => {
                document.getElementById('resetEmail').focus();
            }, 300);
        }
    }

    /**
     * Скрыть модальное окно восстановления пароля
     */
    hideResetModal() {
        if (this.resetModal) {
            this.resetModal.classList.remove('show');
            document.body.style.overflow = '';
            
            // Сброс формы
            const resetForm = document.getElementById('resetPasswordForm');
            const resetSuccess = document.getElementById('resetSuccess');
            
            if (resetForm) resetForm.style.display = 'block';
            if (resetSuccess) resetSuccess.style.display = 'none';
        }
    }

    /**
     * Обработка восстановления пароля
     */
    async handleResetPassword(e) {
        e.preventDefault();

        const email = document.getElementById('resetEmail').value.trim();
        
        if (!email) {
            shop.showNotification('Введите email', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            shop.showNotification('Введите корректный email', 'error');
            return;
        }

        const resetBtn = document.getElementById('resetBtn');
        resetBtn.disabled = true;
        resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';

        // Имитация отправки
        setTimeout(() => {
            const resetForm = document.getElementById('resetPasswordForm');
            const resetSuccess = document.getElementById('resetSuccess');
            
            resetForm.style.display = 'none';
            resetSuccess.style.display = 'block';

            setTimeout(() => {
                this.hideResetModal();
            }, 3000);
        }, 1500);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, находимся ли мы на странице входа
    if (document.getElementById('loginForm')) {
        window.loginManager = new LoginManager();
    }
});