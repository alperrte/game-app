/*
 * Bir hatadan kullanıcıya gösterilebilecek okunabilir mesaj çıkarır.
 * Axios hatalarında backend'in ErrorResponse.message alanını önceliklendirir.
 */

import { AxiosError } from "axios";

interface BackendErrorBody {
    message?: string;
}

const BYTE_SIZE_PATTERN = /(\d+)\s*bytes?/i;
const FILE_SIZE_LIMIT_PATTERN =
    /file.*exceeds.*maximum permitted size|maximum permitted size|FileSizeLimitExceededException/i;
const MEDIA_UPLOAD_LIMIT_MB = 50;

function normalizeErrorMessage(message: string): string {
    if (!message) return message;

    const byteMatch = message.match(BYTE_SIZE_PATTERN);

    if (FILE_SIZE_LIMIT_PATTERN.test(message) && byteMatch) {
        return `Medya dosyası çok büyük. En fazla ${MEDIA_UPLOAD_LIMIT_MB} MB yükleyebilirsin.`;
    }

    return message;
}

export function getErrorMessage(
    error: unknown,
    fallback = "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as BackendErrorBody | string | undefined;

        if (typeof data === "string") {
            return normalizeErrorMessage(data);
        }

        if (data?.message) {
            return normalizeErrorMessage(data.message);
        }

        if (error.code === "ERR_NETWORK") {
            return "Sunucuya ulaşılamıyor. Bağlantınızı kontrol edin.";
        }

        if (error.message) {
            return normalizeErrorMessage(error.message);
        }
    }

    if (error instanceof Error && error.message) {
        return normalizeErrorMessage(error.message);
    }

    return fallback;
}
