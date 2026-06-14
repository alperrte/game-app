/*
 * İstemci tarafı form doğrulama yardımcıları.
 * Kurallar backend RegisterRequest/LoginRequest ile uyumludur (constants.VALIDATION).
 * Backend yine de tek doğruluk kaynağıdır; bu yalnızca erken/kullanıcı dostu kontroldür.
 */

import { VALIDATION } from "../lib/constants";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
    return EMAIL_REGEX.test(value);
}

export interface LoginFormErrors {
    identifier?: string;
    password?: string;
}

export function validateLoginForm(values: {
    identifier: string;
    password: string;
}): LoginFormErrors {
    const errors: LoginFormErrors = {};

    if (!values.identifier.trim()) {
        errors.identifier = "E-posta veya kullanıcı adı gerekli.";
    }

    if (!values.password) {
        errors.password = "Şifre gerekli.";
    }

    return errors;
}

export interface RegisterFormErrors {
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
}

export function validateRegisterForm(values: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
}): RegisterFormErrors {
    const errors: RegisterFormErrors = {};

    const email = values.email.trim();
    if (!email) {
        errors.email = "E-posta gerekli.";
    } else if (!isValidEmail(email)) {
        errors.email = "Geçerli bir e-posta adresi giriniz.";
    } else if (email.length > VALIDATION.emailMax) {
        errors.email = `E-posta en fazla ${VALIDATION.emailMax} karakter olabilir.`;
    }

    const username = values.username.trim();
    if (!username) {
        errors.username = "Kullanıcı adı gerekli.";
    } else if (
        username.length < VALIDATION.usernameMin ||
        username.length > VALIDATION.usernameMax
    ) {
        errors.username = `Kullanıcı adı ${VALIDATION.usernameMin}-${VALIDATION.usernameMax} karakter olmalıdır.`;
    }

    if (!values.password) {
        errors.password = "Şifre gerekli.";
    } else if (
        values.password.length < VALIDATION.passwordMin ||
        values.password.length > VALIDATION.passwordMax
    ) {
        errors.password = `Şifre ${VALIDATION.passwordMin}-${VALIDATION.passwordMax} karakter olmalıdır.`;
    }

    if (!values.confirmPassword) {
        errors.confirmPassword = "Şifre tekrarı gerekli.";
    } else if (values.confirmPassword !== values.password) {
        errors.confirmPassword = "Şifreler eşleşmiyor.";
    }

    return errors;
}
