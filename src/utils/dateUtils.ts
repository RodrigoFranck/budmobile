/**
 * Utilitários de data para horário de Brasília (America/Sao_Paulo)
 *
 * IMPORTANTE: Todas as operações de data do sistema devem usar estas funções
 * para garantir consistência entre frontend, backend e banco de dados.
 */

const BRASILIA_TIME_ZONE = 'America/Sao_Paulo';
const MS_IN_DAY = 24 * 60 * 60 * 1000;

function getBrasiliaDateTimeParts(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BRASILIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
}

/**
 * Retorna a data atual no fuso horário de Brasília
 * @returns string no formato YYYY-MM-DD
 */
export function getTodayInBrasilia(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BRASILIA_TIME_ZONE,
  }).format(new Date());
}

/**
 * Retorna a data de ontem no fuso horário de Brasília
 * @returns string no formato YYYY-MM-DD
 */
export function getYesterdayInBrasilia(): string {
  const today = parseDateString(getTodayInBrasilia());
  today.setDate(today.getDate() - 1);
  return formatDateBrasilia(today);
}

/**
 * Retorna a data/hora atual como objeto Date com componentes de Brasília
 * Útil para cálculos de semana, dia da semana, etc.
 * @returns Date ajustado para Brasília
 */
export function getNowInBrasilia(): Date {
  const { year, month, day, hour, minute, second } = getBrasiliaDateTimeParts();
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Milissegundos até a próxima meia-noite em Brasília (00:00 do dia seguinte)
 */
export function getMsUntilNextMidnightBrasilia(from: Date = new Date()): number {
  const { hour, minute, second } = getBrasiliaDateTimeParts(from);
  const msElapsedToday = ((hour * 60 + minute) * 60 + second) * 1000;
  return MS_IN_DAY - msElapsedToday + 1000;
}

/**
 * Calcula a segunda-feira (início) da semana no fuso de Brasília
 * @param date Data de referência
 * @returns Date com a segunda-feira da semana
 */
export function getWeekStartBrasilia(date?: Date): Date {
  const d = date ? new Date(date) : getNowInBrasilia();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calcula o domingo (fim) da semana no fuso de Brasília
 * @param weekStart Segunda-feira de referência
 * @returns Date com o domingo da semana
 */
export function getWeekEndBrasilia(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Verifica se hoje é domingo no fuso de Brasília
 * @returns boolean
 */
export function isSundayInBrasilia(): boolean {
  return getNowInBrasilia().getDay() === 0;
}

/**
 * Formata um Date para string YYYY-MM-DD (componentes locais do Date passado)
 */
export function formatDateBrasilia(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converte uma string de data YYYY-MM-DD para objeto Date no fuso local
 * Evita o problema de interpretação UTC do JavaScript
 * @param dateString string no formato YYYY-MM-DD
 * @returns Date no fuso local
 */
export function parseDateString(dateString: string): Date {
  // Adiciona T00:00:00 para forçar interpretação no fuso local
  return new Date(dateString + 'T00:00:00');
}

