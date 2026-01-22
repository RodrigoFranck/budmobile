import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTodayInBrasilia } from "@/utils/dateUtils";

export interface Insight {
  title: string;
  description: string;
  loading?: boolean;
  error?: string;
  locked?: boolean;
  remaining?: number;
  contextSummary?: string;
  internalContext?: string;
  conversationId?: string;
  cycleProgress?: number; // Progresso no ciclo atual
  cycleRequired?: number; // Conversas necessárias para próximo ciclo
}

export function useExploreInsights() {
  const { user } = useAuth();
  const [yesterdayInsight, setYesterdayInsight] = useState<Insight>({ 
    title: '', 
    description: '', 
    loading: true 
  });
  const [generalInsight, setGeneralInsight] = useState<Insight>({ 
    title: '', 
    description: '', 
    loading: true 
  });
  const [frequencyInsight, setFrequencyInsight] = useState<Insight>({ 
    title: '', 
    description: '', 
    loading: true 
  });
  const [habitInsight, setHabitInsight] = useState<Insight>({ 
    title: '', 
    description: '', 
    loading: true 
  });
  

  useEffect(() => {
    if (!user) {
      const loginMessage = { 
        title: 'Faça login para ver seus insights',
        description: 'Entre na sua conta para acessar insights personalizados.',
        loading: false 
      };
      setYesterdayInsight(loginMessage);
      setGeneralInsight(loginMessage);
      setFrequencyInsight(loginMessage);
      setHabitInsight(loginMessage);
      return;
    }

    const fetchInsights = async () => {
      const today = getTodayInBrasilia();
      

      // Contar TODAS as conversas (histórico total) para cálculo de ciclo
      const { count: totalCount } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_archived', false);

      const totalConversationCount = totalCount || 0;
      
      // Fetch daily insights (yesterday, general)
      let { data: dailyInsights } = await supabase
        .from('user_insights')
        .select('*, context_summary, internal_context, conversation_id, cycle_conversation_count')
        .eq('user_id', user.id)
        .eq('insight_date', today)
        .in('insight_type', ['yesterday_journey', 'general_insight']);

      // Fallback: Se não encontrou insights de hoje, buscar os mais recentes
      if (!dailyInsights || dailyInsights.length === 0) {
        const { data: fallbackInsights } = await supabase
          .from('user_insights')
          .select('*, context_summary, internal_context, conversation_id, cycle_conversation_count')
          .eq('user_id', user.id)
          .in('insight_type', ['yesterday_journey', 'general_insight'])
          .order('insight_date', { ascending: false })
          .limit(2);
        
        if (fallbackInsights && fallbackInsights.length > 0) {
          dailyInsights = fallbackInsights;
        }
      }

      // Fetch frequency and habit insights - buscar mais recentes
      const { data: otherInsights } = await supabase
        .from('user_insights')
        .select('*, context_summary, internal_context, cycle_conversation_count')
        .eq('user_id', user.id)
        .in('insight_type', ['frequency', 'habit'])
        .order('insight_date', { ascending: false })
        .limit(2);

      const insights = [...(dailyInsights || []), ...(otherInsights || [])];

      // Mensagens empáticas padrão no estilo Bud
      const fallbackMessages = {
        yesterday_journey: {
          noInsights: {
            title: 'Ainda estou te conhecendo',
            description: 'Quando a gente conversar, vou poder te trazer algo sobre como foi o dia anterior.',
            locked: true,
          },
          missingInsight: {
            title: 'Senti sua falta ontem',
            description: 'Não conversamos ontem, mas tô aqui quando quiser.',
            locked: true,
          }
        },
        general_insight: {
          noInsights: {
            title: 'Preciso de mais contexto',
            description: 'Continue conversando comigo que logo eu consigo observar alguns padrões sobre você.',
            locked: true,
          },
          missingInsight: {
            title: 'Preciso de mais contexto',
            description: 'Continue conversando comigo que logo eu consigo te trazer algo.',
            locked: true,
          }
        },
        frequency: {
          noInsights: {
            title: 'Vou observar sua frequência',
            description: 'Continue conversando comigo que logo eu te trago um resumo de como você usa o Bud.',
            locked: true,
          },
          missingInsight: {
            title: 'Observando sua frequência',
            description: 'Continue conversando comigo que logo eu te trago um resumo de como você usa o Bud.',
            locked: true,
          }
        },
        habit: {
          noInsights: {
            title: 'Um hábito pra você',
            description: 'Quanto mais a gente conversa, mais eu consigo sugerir algo que faça sentido pra sua rotina.',
            locked: true,
          },
          missingInsight: {
            title: 'Um hábito pra você',
            description: 'Quanto mais a gente conversa, mais eu consigo sugerir algo pra você.',
            locked: true,
          }
        },
      };

      if (!insights || insights.length === 0) {
        setYesterdayInsight({ ...fallbackMessages.yesterday_journey.noInsights, loading: false });
        setGeneralInsight({ ...fallbackMessages.general_insight.noInsights, loading: false, remaining: Math.max(0, 5 - totalConversationCount), cycleProgress: Math.min(totalConversationCount, 5), cycleRequired: 5 });
        setFrequencyInsight({ ...fallbackMessages.frequency.noInsights, loading: false, remaining: Math.max(0, 3 - totalConversationCount), cycleProgress: Math.min(totalConversationCount, 3), cycleRequired: 3 });
        setHabitInsight({ ...fallbackMessages.habit.noInsights, loading: false, remaining: Math.max(0, 3 - totalConversationCount), cycleProgress: Math.min(totalConversationCount, 3), cycleRequired: 3 });
        return;
      }

      // Map insights by type
      const yesterday = insights.find(i => i.insight_type === 'yesterday_journey');
      const general = insights.find(i => i.insight_type === 'general_insight');
      const frequency = insights.find(i => i.insight_type === 'frequency');
      const habit = insights.find(i => i.insight_type === 'habit');

      // Usar valores do banco diretamente (edge function já calcula corretamente)
      const getProgressFromDB = (insight: any, required: number) => {
        if (!insight) {
          // Sem insight: calcular progresso inicial
          return { 
            progress: Math.min(totalConversationCount, required), 
            remaining: Math.max(0, required - totalConversationCount) 
          };
        }
        // Usar remaining do DB diretamente
        const dbRemaining = insight.remaining ?? required;
        const progress = required - dbRemaining;
        return { 
          progress: Math.max(0, Math.min(progress, required)), 
          remaining: Math.max(0, dbRemaining) 
        };
      };

      const generalProgress = getProgressFromDB(general, 5);
      const frequencyProgress = getProgressFromDB(frequency, 3);
      const habitProgress = getProgressFromDB(habit, 3);

      setYesterdayInsight({
        title: yesterday?.title || fallbackMessages.yesterday_journey.missingInsight.title,
        description: yesterday?.description || fallbackMessages.yesterday_journey.missingInsight.description,
        locked: yesterday?.locked ?? fallbackMessages.yesterday_journey.missingInsight.locked,
        contextSummary: yesterday?.context_summary || undefined,
        internalContext: yesterday?.internal_context || undefined,
        conversationId: yesterday?.conversation_id || undefined,
        loading: false,
      });

      setGeneralInsight({
        title: general?.title || fallbackMessages.general_insight.missingInsight.title,
        description: general?.description || fallbackMessages.general_insight.missingInsight.description,
        locked: general?.locked ?? fallbackMessages.general_insight.missingInsight.locked,
        remaining: generalProgress.remaining,
        cycleProgress: generalProgress.progress,
        cycleRequired: 5,
        contextSummary: general?.context_summary || undefined,
        internalContext: general?.internal_context || undefined,
        loading: false,
      });

      setFrequencyInsight({
        title: frequency?.title || fallbackMessages.frequency.missingInsight.title,
        description: frequency?.description || fallbackMessages.frequency.missingInsight.description,
        locked: frequency?.locked ?? fallbackMessages.frequency.missingInsight.locked,
        remaining: frequencyProgress.remaining,
        cycleProgress: frequencyProgress.progress,
        cycleRequired: 3,
        loading: false,
      });

      setHabitInsight({
        title: habit?.title || fallbackMessages.habit.missingInsight.title,
        description: habit?.description || fallbackMessages.habit.missingInsight.description,
        locked: habit?.locked ?? fallbackMessages.habit.missingInsight.locked,
        remaining: habitProgress.remaining,
        cycleProgress: habitProgress.progress,
        cycleRequired: 3,
        contextSummary: habit?.context_summary || undefined,
        internalContext: habit?.internal_context || undefined,
        loading: false,
      });
    };

    fetchInsights();
  }, [user]);

  return {
    yesterdayInsight,
    generalInsight,
    frequencyInsight,
    habitInsight,
    isLoading: yesterdayInsight.loading || generalInsight.loading || 
               frequencyInsight.loading || habitInsight.loading,
  };
}

