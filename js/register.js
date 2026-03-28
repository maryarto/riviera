/**
 * Управление страницей регистрации
 * Многошаговая форма, валидация, отправка данных
 */

class RegisterManager {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {};
        
        this.init();
    }

    /**
     * Инициализация менеджера регистрации
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupPasswordStrength();
        this.setupCaptcha();
        this.loadSavedData();
    }

    /**
     * Кэширование DOM элементов
     */
    cacheElements() {
        this.steps = document.querySelectorAll('.form-step');
        this.progressSteps = document.querySelectorAll('.progress-step');
        this.progressFill = document.querySelector('.progress-fill');
        this.nextButtons = document.querySelectorAll('.next-step');
        this.prevButtons = document.querySelectorAll('.prev-step');
        this.registerBtn = document.getElementById('registerBtn');
        
        // Поля формы
        this.nameInput = document.getElementById('name');
        this.surnameInput = document.getElementById('surname');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.phoneInput = document.getElementById('phone');
        this.birthdateInput = document.getElementById('birthdate');
        this.citySelect = document.getElementById('city');
        this.newsletterCheckbox = document.getElementById('newsletter');
        this.agreeTermsCheckbox = document.getElementById('agreeTerms');
        this.agreeAdsCheckbox = document.getElementById('agreeAds');
        
        // Капча
        this.captchaInput = document.getElementById('captcha');
        this.captchaText = document.getElementById('captchaText');
        this.refreshCaptchaBtn = document.getElementById('refreshCaptcha');
        
        // Модальное окно
        this.successModal = document.getElementById('successModal');
    }

    /**
     * Привязка обработчиков событий
     */
    bindEvents() {
        // Кнопки "Далее"
        this.nextButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToNextStep(parseInt(btn.dataset.next));
            });
        });

        // Кнопки "Назад"
        this.prevButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToPrevStep(parseInt(btn.dataset.prev));
            });
        });

        // Отправка формы
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Валидация в реальном времени
        if (this.nameInput) {
            this.nameInput.addEventListener('blur', () => this.validateName());
            this.nameInput.addEventListener('input', () => this.clearFieldError('name'));
        }

        if (this.emailInput) {
            this.emailInput.addEventListener('blur', () => this.validateEmail());
            this.emailInput.addEventListener('input', () => this.clearFieldError('email'));
        }

        if (this.passwordInput) {
            this.passwordInput.addEventListener('input', () => {
                this.checkPasswordStrength();
                this.validatePassword();
            });
        }

        if (this.confirmPasswordInput) {
            this.confirmPasswordInput.addEventListener('input', () => this.validateConfirmPassword());
        }

        if (this.phoneInput) {
            this.phoneInput.addEventListener('input', (e) => this.formatPhone(e));
            this.phoneInput.addEventListener('blur', () => this.validatePhone());
        }

        // Показ/скрытие пароля
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

        // Обновление капчи
        if (this.refreshCaptchaBtn) {
            this.refreshCaptchaBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.generateCaptcha();
            });
        }

        // Закрытие модального окна
        const closeBtn = document.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideSuccessModal());
        }

        // Клик вне модального окна
        window.addEventListener('click', (e) => {
            if (e.target === this.successModal) {
                this.hideSuccessModal();
            }
        });

        // Ограничение даты рождения
        if (this.birthdateInput) {
            const today = new Date();
            const maxDate = new Date(today.setFullYear(today.getFullYear() - 14));
            const minDate = new Date(today.setFullYear(today.getFullYear() - 100));
            
            this.birthdateInput.max = maxDate.toISOString().split('T')[0];
            this.birthdateInput.min = minDate.toISOString().split('T')[0];
        }
    }

    /**
     * Переход к следующему шагу
     */
    goToNextStep(nextStep) {
        if (!this.validateCurrentStep()) {
            return;
        }

        this.saveStepData(this.currentStep);
        this.currentStep = nextStep;
        this.updateSteps();
    }

    /**
     * Переход к предыдущему шагу
     */
    goToPrevStep(prevStep) {
        this.currentStep = prevStep;
        this.updateSteps();
        this.loadStepData(this.currentStep);
    }

    /**
     * Обновление отображения шагов
     */
    updateSteps() {
        // Обновление шагов формы
        this.steps.forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById(`step${this.currentStep}`).classList.add('active');

        // Обновление прогресс-бара
        const progressWidth = (this.currentStep / this.totalSteps) * 100;
        if (this.progressFill) {
            this.progressFill.style.width = `${progressWidth}%`;
        }

        // Обновление индикаторов шагов
        this.progressSteps.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNum === this.currentStep) {
                step.classList.add('active');
            } else if (stepNum < this.currentStep) {
                step.classList.add('completed');
            }
        });

        // Скролл к началу формы
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Валидация текущего шага
     */
    validateCurrentStep() {
        switch(this.currentStep) {
            case 1:
                return this.validateStep1();
            case 2:
                return this.validateStep2();
            case 3:
                return true; // Валидация чекбоксов и капчи при отправке
            default:
                return true;
        }
    }

    /**
     * Валидация шага 1 (основные данные)
     */
    validateStep1() {
        const isNameValid = this.validateName();
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        const isConfirmValid = this.validateConfirmPassword();

        return isNameValid && isEmailValid && isPasswordValid && isConfirmValid;
    }

    /**
     * Валидация имени
     */
    validateName() {
        const name = this.nameInput.value.trim();
        
        if (!name) {
            this.showFieldError('name', 'Введите имя');
            return false;
        }
        
        if (name.length < 2) {
            this.showFieldError('name', 'Имя должно содержать минимум 2 символа');
            return false;
        }
        
        if (!/^[а-яА-Яa-zA-Z\s-]+$/.test(name)) {
            this.showFieldError('name', 'Имя может содержать только буквы, пробелы и дефис');
            return false;
        }
        
        this.clearFieldError('name');
        return true;
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
     * Валидация подтверждения пароля
     */
    validateConfirmPassword() {
        const password = this.passwordInput.value;
        const confirm = this.confirmPasswordInput.value;
        
        if (!confirm) {
            this.showFieldError('confirmPassword', 'Подтвердите пароль');
            return false;
        }
        
        if (password !== confirm) {
            this.showFieldError('confirmPassword', 'Пароли не совпадают');
            return false;
        }
        
        this.clearFieldError('confirmPassword');
        return true;
    }

    /**
     * Валидация шага 2 (контактные данные)
     */
    validateStep2() {
        const isPhoneValid = this.validatePhone();
        return isPhoneValid;
    }

    /**
     * Валидация телефона
     */
    validatePhone() {
        const phone = this.phoneInput.value.trim();
        const phoneRegex = /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
        
        if (!phone) {
            this.showFieldError('phone', 'Введите номер телефона');
            return false;
        }
        
        // Упрощенная проверка (минимум 10 цифр)
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 11) {
            this.showFieldError('phone', 'Введите корректный номер телефона');
            return false;
        }
        
        this.clearFieldError('phone');
        return true;
    }

    /**
     * Форматирование телефона
     */
    formatPhone(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value.startsWith('7')) {
                value = value.substring(1);
            } else if (value.startsWith('8')) {
                value = value.substring(1);
            }
        }
        
        if (value.length > 0) {
            let formatted = '+7 ';
            
            if (value.length > 0) {
                formatted += '(' + value.substring(0, 3);
            }
            if (value.length >= 4) {
                formatted += ') ' + value.substring(3, 6);
            }
            if (value.length >= 7) {
                formatted += '-' + value.substring(6, 8);
            }
            if (value.length >= 9) {
                formatted += '-' + value.substring(8, 10);
            }
            
            e.target.value = formatted;
        }
    }

    /**
     * Проверка сложности пароля
     */
    checkPasswordStrength() {
        const password = this.passwordInput.value;
        const strengthBars = document.querySelectorAll('.strength-bar');
        const hint = document.getElementById('passwordHint');
        
        if (!strengthBars.length) return;
        
        // Критерии сложности
        const hasLower = /[a-zа-я]/.test(password);
        const hasUpper = /[A-ZА-Я]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const length = password.length;
        
        let strength = 0;
        
        if (length >= 6) strength++;
        if (length >= 8 && (hasLower || hasUpper)) strength++;
        if (hasLower && hasUpper) strength++;
        if (hasDigit) strength++;
        if (hasSpecial) strength++;
        
        // Ограничим максимум 3
        strength = Math.min(strength, 3);
        
        // Обновление индикаторов
        strengthBars.forEach((bar, index) => {
            bar.className = 'strength-bar';
            if (index < strength) {
                if (strength === 1) bar.classList.add('weak');
                if (strength === 2) bar.classList.add('medium');
                if (strength === 3) bar.classList.add('strong');
            }
        });
        
        // Подсказки
        const hints = {
            0: 'Слишком простой пароль',
            1: 'Слабый пароль',
            2: 'Средний пароль',
            3: 'Надёжный пароль'
        };
        
        if (hint) {
            hint.textContent = hints[strength] || '';
            hint.style.color = strength === 3 ? '#27ae60' : strength === 2 ? '#f39c12' : '#e74c3c';
        }
    }

    /**
     * Показать ошибку поля
     */
    showFieldError(field, message) {
        const errorElement = document.getElementById(`${field}Error`);
        let input;
        
        switch(field) {
            case 'name':
                input = this.nameInput;
                break;
            case 'email':
                input = this.emailInput;
                break;
            case 'password':
                input = this.passwordInput;
                break;
            case 'confirmPassword':
                input = this.confirmPasswordInput;
                break;
            case 'phone':
                input = this.phoneInput;
                break;
        }
        
        if (errorElement) {
            errorElement.textContent = message;
        }
        
        if (input) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
        }
    }

    /**
     * Очистить ошибку поля
     */
    clearFieldError(field) {
        const errorElement = document.getElementById(`${field}Error`);
        let input;
        
        switch(field) {
            case 'name':
                input = this.nameInput;
                break;
            case 'email':
                input = this.emailInput;
                break;
            case 'password':
                input = this.passwordInput;
                break;
            case 'confirmPassword':
                input = this.confirmPasswordInput;
                break;
            case 'phone':
                input = this.phoneInput;
                break;
        }
        
        if (errorElement) {
            errorElement.textContent = '';
        }
        
        if (input) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        }
    }

    /**
     * Сохранение данных шага
     */
    saveStepData(step) {
        switch(step) {
            case 1:
                this.formData.name = this.nameInput.value.trim();
                this.formData.surname = this.surnameInput.value.trim();
                this.formData.email = this.emailInput.value.trim();
                this.formData.password = this.passwordInput.value;
                break;
                
            case 2:
                this.formData.phone = this.phoneInput.value.trim();
                this.formData.birthdate = this.birthdateInput.value;
                
                const genderInput = document.querySelector('input[name="gender"]:checked');
                if (genderInput) {
                    this.formData.gender = genderInput.value;
                }
                
                this.formData.city = this.citySelect.value;
                break;
        }
    }

    /**
     * Загрузка данных шага
     */
    loadStepData(step) {
        switch(step) {
            case 1:
                if (this.formData.name) this.nameInput.value = this.formData.name;
                if (this.formData.surname) this.surnameInput.value = this.formData.surname;
                if (this.formData.email) this.emailInput.value = this.formData.email;
                if (this.formData.password) {
                    this.passwordInput.value = this.formData.password;
                    this.confirmPasswordInput.value = this.formData.password;
                }
                break;
                
            case 2:
                if (this.formData.phone) this.phoneInput.value = this.formData.phone;
                if (this.formData.birthdate) this.birthdateInput.value = this.formData.birthdate;
                if (this.formData.gender) {
                    const radio = document.querySelector(`input[name="gender"][value="${this.formData.gender}"]`);
                    if (radio) radio.checked = true;
                }
                if (this.formData.city) this.citySelect.value = this.formData.city;
                break;
        }
    }

    /**
     * Загрузка сохраненных данных (если есть)
     */
    loadSavedData() {
        // Можно загрузить из localStorage или cookies
        const savedData = localStorage.getItem('registrationDraft');
        if (savedData) {
            try {
                this.formData = JSON.parse(savedData);
                this.loadStepData(this.currentStep);
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }

    /**
     * Генерация капчи
     */
    generateCaptcha() {
        const operators = ['+', '-'];
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operator = operators[Math.floor(Math.random() * operators.length)];
        
        this.captchaAnswer = operator === '+' ? num1 + num2 : num1 - num2;
        this.captchaText.textContent = `${num1} ${operator} ${num2} = ?`;
    }

    /**
     * Настройка капчи
     */
    setupCaptcha() {
        this.generateCaptcha();
        
        if (this.captchaInput) {
            this.captchaInput.value = '';
        }
    }

    /**
     * Проверка капчи
     */
    validateCaptcha() {
        const answer = parseInt(this.captchaInput.value);
        const error = document.getElementById('captchaError');
        
        if (isNaN(answer) || answer !== this.captchaAnswer) {
            if (error) {
                error.textContent = 'Неверный ответ';
            }
            return false;
        }
        
        if (error) {
            error.textContent = '';
        }
        return true;
    }

    /**
     * Обработка отправки формы
     */
    async handleSubmit(e) {
        e.preventDefault();

        // Валидация последнего шага
        if (!this.agreeTermsCheckbox.checked) {
            document.getElementById('termsError').textContent = 'Необходимо согласиться с условиями';
            shop.showNotification('Необходимо согласиться с условиями использования', 'error');
            return;
        }

        if (!this.validateCaptcha()) {
            shop.showNotification('Неверный ответ капчи', 'error');
            return;
        }

        // Сохраняем данные последнего шага
        this.formData.newsletter = this.newsletterCheckbox.checked;
        this.formData.agreeTerms = this.agreeTermsCheckbox.checked;
        this.formData.agreeAds = this.agreeAdsCheckbox.checked;

        // Показываем загрузку
        this.setLoadingState(true);

        try {
            // Имитация отправки на сервер
            const response = await this.sendRegistrationRequest(this.formData);

            if (response.success) {
                // Очищаем черновик
                localStorage.removeItem('registrationDraft');
                
                // Показываем успешное сообщение
                this.showSuccessModal();
                
                // Автоматически входим после регистрации
                if (window.shop) {
                    window.shop.currentUser = {
                        id: response.userId,
                        name: this.formData.name,
                        email: this.formData.email
                    };
                    window.shop.checkAuthStatus();
                }
            } else {
                throw new Error(response.error || 'Ошибка при регистрации');
            }
        } catch (error) {
            console.error('Registration error:', error);
            shop.showNotification(error.message, 'error');
            this.setLoadingState(false);
        }
    }

    /**
     * Отправка запроса на регистрацию (имитация)
     */
    async sendRegistrationRequest(data) {
        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Проверка существующего email (демо)
        const existingEmails = ['test@test.com', 'user@example.com'];
        if (existingEmails.includes(data.email)) {
            throw new Error('Пользователь с таким email уже существует');
        }

        return {
            success: true,
            userId: Math.floor(Math.random() * 1000) + 1,
            message: 'Registration successful'
        };

        /* В реальном приложении:
        const response = await fetch('/api/auth/register', {
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
     * Установка состояния загрузки
     */
    setLoadingState(isLoading) {
        if (isLoading) {
            this.registerBtn.disabled = true;
            this.registerBtn.querySelector('.btn-text').style.opacity = '0';
            this.registerBtn.querySelector('.btn-loader').style.display = 'inline-block';
        } else {
            this.registerBtn.disabled = false;
            this.registerBtn.querySelector('.btn-text').style.opacity = '1';
            this.registerBtn.querySelector('.btn-loader').style.display = 'none';
        }
    }

    /**
     * Показать модальное окно успеха
     */
    showSuccessModal() {
        if (this.successModal) {
            this.successModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Скрыть модальное окно успеха
     */
    hideSuccessModal() {
        if (this.successModal) {
            this.successModal.classList.remove('show');
            document.body.style.overflow = '';
            
            // Перенаправляем на главную через небольшую задержку
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('registerForm')) {
        window.registerManager = new RegisterManager();
    }
});