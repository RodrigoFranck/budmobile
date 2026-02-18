/**
 * Utilitários de data para horário de Brasília (UTC-3)
 * 
 * IMPORTANTE: Todas as operações de data do sistema devem usar estas funções
 * para garantir consistência entre frontend, backend e banco de dados.
 */

/**
 * Retorna a data atual no fuso horário de Brasília (UTC-3)
 * @returns string no formato YYYY-MM-DD
 */
export function getTodayInBrasilia(): string {
  const now = new Date();
  // Brasília é UTC-3 (-180 minutos)
  const brasiliaOffset = -3 * 60; // em minutos
  const localOffset = now.getTimezoneOffset(); // em minutos (positivo para oeste do UTC)
  const diff = brasiliaOffset + localOffset; // diferença entre Brasília e local
  
  const brasiliaTime = new Date(now.getTime() + diff * 60 * 1000);
  return brasiliaTime.toISOString().split('T')[0];
}

/**
 * Retorna a data de ontem no fuso horário de Brasília (UTC-3)
 * @returns string no formato YYYY-MM-DD
 */
export function getYesterdayInBrasilia(): string {
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const localOffset = now.getTimezoneOffset();
  const diff = brasiliaOffset + localOffset;
  
  const brasiliaTime = new Date(now.getTime() + diff * 60 * 1000);
  brasiliaTime.setDate(brasiliaTime.getDate() - 1);
  return brasiliaTime.toISOString().split('T')[0];
}

/**
 * Retorna a data/hora atual como objeto Date ajustado para Brasília
 * Útil para cálculos de semana, dia da semana, etc.
 * @returns Date ajustado para Brasília
 */
export function getNowInBrasilia(): Date {
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const localOffset = now.getTimezoneOffset();
  const diff = brasiliaOffset + localOffset;
  
  return new Date(now.getTime() + diff * 60 * 1000);
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
 * Converte uma string de data YYYY-MM-DD para objeto Date no fuso local
 * Evita o problema de interpretação UTC do JavaScript
 * @param dateString string no formato YYYY-MM-DD
 * @returns Date no fuso local
 */
export function parseDateString(dateString: string): Date {
  // Adiciona T00:00:00 para forçar interpretação no fuso local
  return new Date(dateString + 'T00:00:00');
}

