export function formatCNPJ(cnpj) {
  const d = cnpj.replace(/\D/g, '').padStart(14, '0');
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

export function formatData(iso) {
  if (!iso) return '—';
  // aceita "YYYY-MM-DD" ou ISO completo
  const parte = iso.slice(0, 10);
  const [y, m, d] = parte.split('-');
  return `${d}/${m}/${y}`;
}

export function formatDataHora(iso) {
  if (!iso) return '—';
  const dt = new Date(iso);
  return dt.toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' });
}

export function formatMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_LABEL = {
  aguardando_separacao: 'Aguardando separação',
  em_separacao: 'Em separação',
  separado: 'Separado',
  expedido: 'Expedido',
  cancelado: 'Cancelado',
};

export function formatStatus(status) {
  return STATUS_LABEL[status] ?? status;
}

const STATUS_COR = {
  aguardando_separacao: 'warning',
  em_separacao: 'info',
  separado: 'primary',
  expedido: 'success',
  cancelado: 'danger',
};

export function corStatus(status) {
  return STATUS_COR[status] ?? 'secondary';
}
