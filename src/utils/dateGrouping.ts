import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getNowInBrasilia,
  getWeekEndBrasilia,
  getWeekStartBrasilia,
  parseDateString,
} from "./dateUtils";
import { resolveConversationDisplayTitle } from "./generateConversationTitle";

function buildConversationFallbackTitle(date: Date): string {
  const label = format(date, "d 'de' MMMM", { locale: ptBR });
  return `Conversa de ${label}`;
}

function capitalizeFirst(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDayMonth(date: Date): string {
  const raw = format(date, 'd MMM', { locale: ptBR });
  const [day, month] = raw.split(' ');
  return `${day} ${capitalizeFirst(month)}`;
}

export function formatWeekRangeLabel(weekStart: Date, weekEnd: Date): string {
  return `${formatDayMonth(weekStart)} - ${formatDayMonth(weekEnd)}`;
}

export function formatConversationWeekdayLabel(date: Date): string {
  const weekday = format(date, 'EEEE', { locale: ptBR }).split('-')[0];
  return `${capitalizeFirst(weekday)}, ${formatDayMonth(date)}`;
}

function resolveConversationDate(conv: ConversationWithDate): Date {
  const dateSource = conv.conversation_date || conv.created_at;
  return dateSource.includes('T')
    ? new Date(dateSource)
    : parseDateString(dateSource);
}

export interface ConversationWithDate {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  conversation_date: string | null;
}

export interface GroupedConversation {
  groupTitle: string;
  groupKey: string;
  conversations: Array<{
    id: string;
    title: string;
    dateLabel: string;
    date: Date;
  }>;
}

export interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  conversations: ConversationWithDate[];
  count: number;
}

export interface WeekGroup {
  weekKey: string;
  weekLabel: string;
  weekStart: Date;
  weekEnd: Date;
  conversations: ConversationWithDate[];
  count: number;
  isCurrent: boolean;
}

export function groupConversationsByMonth(conversations: ConversationWithDate[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();

  conversations.forEach((conv) => {
    const convDate = resolveConversationDate(conv);

    const monthKey = format(convDate, 'yyyy-MM');
    const rawLabel = format(convDate, 'MMMM yyyy', { locale: ptBR });
    const monthLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

    if (!groups.has(monthKey)) {
      groups.set(monthKey, { monthKey, monthLabel, conversations: [], count: 0 });
    }
    const g = groups.get(monthKey)!;
    g.conversations.push(conv);
    g.count += 1;
  });

  return Array.from(groups.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

export function groupConversationsByWeek(conversations: ConversationWithDate[]): WeekGroup[] {
  const groups = new Map<string, WeekGroup>();
  const currentWeekStart = getWeekStartBrasilia();
  const currentWeekKey = format(currentWeekStart, 'yyyy-MM-dd');

  conversations.forEach((conv) => {
    const convDate = resolveConversationDate(conv);
    const weekStart = getWeekStartBrasilia(convDate);
    const weekEnd = getWeekEndBrasilia(weekStart);
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    if (!groups.has(weekKey)) {
      groups.set(weekKey, {
        weekKey,
        weekLabel: formatWeekRangeLabel(weekStart, weekEnd),
        weekStart,
        weekEnd,
        conversations: [],
        count: 0,
        isCurrent: weekKey === currentWeekKey,
      });
    }

    const group = groups.get(weekKey)!;
    group.conversations.push(conv);
    group.count += 1;
  });

  if (!groups.has(currentWeekKey)) {
    const weekEnd = getWeekEndBrasilia(currentWeekStart);
    groups.set(currentWeekKey, {
      weekKey: currentWeekKey,
      weekLabel: formatWeekRangeLabel(currentWeekStart, weekEnd),
      weekStart: currentWeekStart,
      weekEnd,
      conversations: [],
      count: 0,
      isCurrent: true,
    });
  }

  return Array.from(groups.values()).sort((a, b) => b.weekKey.localeCompare(a.weekKey));
}

export function groupConversationsByDate(conversations: ConversationWithDate[]): GroupedConversation[] {
  // Remover duplicatas baseadas no ID antes de processar
  const uniqueConversations = Array.from(
    new Map(conversations.map(conv => [conv.id, conv])).values()
  );

  // Usar horário de Brasília para agrupamento correto
  const now = getNowInBrasilia();

  // Agrupar conversas por dia individual
  const groups: Map<string, GroupedConversation> = new Map();
  const seenConversationIds = new Set<string>();

  uniqueConversations.forEach((conv) => {
    // Pular se já processamos esta conversa
    if (seenConversationIds.has(conv.id)) {
      return;
    }
    seenConversationIds.add(conv.id);

    // Usar conversation_date se disponível, senão created_at
    const dateSource = conv.conversation_date || conv.created_at;
    // Para datas simples (YYYY-MM-DD), usar parseDateString para evitar problema de fuso
    // Para timestamps completos (com T), usar new Date diretamente
    const convDate = dateSource.includes('T') 
      ? new Date(dateSource) 
      : parseDateString(dateSource);
    const convDay = startOfDay(convDate);
    
    // Usar a data como chave única (YYYY-MM-DD)
    const dateKey = format(convDate, "yyyy-MM-dd", { locale: ptBR });
    
    // Label para exibição (DIA DA SEMANA, MÊS DIA)
    const dateLabel = format(convDate, "EEEE, MMM d", { locale: ptBR }).toUpperCase();
    
    // Título do grupo (mesmo que o label da data)
    const groupTitle = dateLabel;

    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        groupTitle,
        groupKey: dateKey,
        conversations: [],
      });
    }

    // Verificar se a conversa já não está no grupo antes de adicionar
    const group = groups.get(dateKey)!;
    if (!group.conversations.some(c => c.id === conv.id)) {
      group.conversations.push({
        id: conv.id,
        title: resolveConversationDisplayTitle(conv.title, buildConversationFallbackTitle(convDate)),
        dateLabel,
        date: convDate,
      });
    }
  });

  // Ordenar grupos por data (mais recente primeiro)
  const sortedGroups = Array.from(groups.values()).sort((a, b) => {
    return new Date(b.groupKey).getTime() - new Date(a.groupKey).getTime();
  });

  // Ordenar conversas dentro de cada grupo (mais recente primeiro)
  sortedGroups.forEach(group => {
    group.conversations.sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  return sortedGroups;
}

