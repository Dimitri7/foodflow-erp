export function formatCNPJ(cnpj) {
  const d = cnpj.replace(/\D/g, '').padStart(14, '0');
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

// Para campos do banco que são só data (YYYY-MM-DD): lê direto da string, sem conversão de fuso.
export function formatData(iso) {
  if (!iso) return '—';
  const parte = iso.slice(0, 10);
  const [y, m, d] = parte.split('-');
  return `${d}/${m}/${y}`;
}

// Para timestamps completos: converte para America/Fortaleza e exibe data + hora.
export function formatDataHora(iso) {
  if (!iso) return '—';
  const dt = new Date(iso);
  return dt.toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' });
}

// Para timestamps completos quando só a data é necessária (ex: Kanban).
export function formatDataLocal(iso) {
  if (!iso) return '—';
  const dt = new Date(iso);
  return dt.toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' });
}

export function formatMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formata quantidades sem zeros desnecessários: 30.000 → "30", 12.500 → "12,5".
export function formatQuantidade(valor) {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
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
