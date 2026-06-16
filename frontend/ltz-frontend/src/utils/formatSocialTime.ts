export function formatSocialTime(dateValue: string): string {
  const normalizedDateValue = /(?:z|[+-]\d{2}:\d{2})$/i.test(dateValue)
    ? dateValue
    : `${dateValue}Z`;
  const date = new Date(normalizedDateValue);

  if (Number.isNaN(date.getTime())) {
    return "Az önce";
  }

  const diffInSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000),
  );

  if (diffInSeconds < 60) {
    return `${Math.max(1, diffInSeconds)} saniye önce`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);

  if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours} saat önce`;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  }).format(date);
}
