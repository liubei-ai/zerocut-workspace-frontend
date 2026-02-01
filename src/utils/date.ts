export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

export const formatDateShort = (dateString?: string | null) => {
  if (!dateString) return '-';

  return new Date(dateString)
    .toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\//g, '-');
};

export const formatDateRange = (startDate: string | null, endDate: string | null): string => {
  if (!startDate || !endDate) return '-';
  const start = formatDateShort(startDate);
  const end = formatDateShort(endDate);
  return `${start} ~ ${end}`;
};
