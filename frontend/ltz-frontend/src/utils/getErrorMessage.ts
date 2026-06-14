/*
 * Bir hatadan kullanıcıya gösterilebilecek okunabilir mesaj çıkarır.
 * Axios hatalarında backend'in ErrorResponse.message alanını önceliklendirir.
 */

import { AxiosError } from "axios";

interface BackendErrorBody {
    message?: string;
}

export function getErrorMessage(
    error: unknown,
    fallback = "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as BackendErrorBody | undefined;

        if (data?.message) {
            return data.message;
        }

        if (error.code === "ERR_NETWORK") {
            return "Sunucuya ulaşılamıyor. Bağlantınızı kontrol edin.";
        }

        if (error.message) {
            return error.message;
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}
