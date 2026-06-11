import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isDeveloperEmail } from "@/constants/developerAccess";

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

function applyDeveloperAccess(insight: Insight, cycleRequired?: number): Insight {
  return {
    ...insight,
    locked: false,
    remaining: 0,
    ...(cycleRequired
      ? { cycleProgress: cycleRequired, cycleRequired }
      : {}),
  };
}

export function useExploreInsights() {
  const { user } = useAuth();
  const isDeveloper = isDeveloperEmail(user?.email);
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
      if (isDeveloper) {
        try {
          await supabase.functions.invoke("generate-insights", {
            body: {},
          });
        } catch (error) {
          console.warn("Developer insight regeneration failed:", error);
        }
      }

      

      // Contar TODAS as conversas (histórico total) para cálculo de ciclo
      const { count: totalCount } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_archived', false);

      const totalConversationCount = totalCount || 0;
      
      // Insights devem refletir interações antigas:
      // buscar os mais recentes por tipo, ordenando por insight_date desc.
      const insightTypeValues = [
        'yesterday_journey',
        'general_insight',
        'frequency',
        'habit',
      ] as const;

      const { data: insightsData } = await supabase
        .from('user_insights')
        .select('*, context_summary, internal_context, conversation_id, cycle_conversation_count')
        .eq('user_id', user.id)
        .in('insight_type', insightTypeValues)
        .order('insight_date', { ascending: false });

      const insights = insightsData || [];

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
        const emptyYesterday = { ...fallbackMessages.yesterday_journey.noInsights, loading: false };
        const emptyGeneral = {
          ...fallbackMessages.general_insight.noInsights,
          loading: false,
          remaining: Math.max(0, 5 - totalConversationCount),
          cycleProgress: Math.min(totalConversationCount, 5),
          cycleRequired: 5,
        };
        const emptyFrequency = {
          ...fallbackMessages.frequency.noInsights,
          loading: false,
          remaining: Math.max(0, 3 - totalConversationCount),
          cycleProgress: Math.min(totalConversationCount, 3),
          cycleRequired: 3,
        };
        const emptyHabit = {
          ...fallbackMessages.habit.noInsights,
          loading: false,
          remaining: Math.max(0, 3 - totalConversationCount),
          cycleProgress: Math.min(totalConversationCount, 3),
          cycleRequired: 3,
        };

        setYesterdayInsight(isDeveloper ? applyDeveloperAccess(emptyYesterday) : emptyYesterday);
        setGeneralInsight(isDeveloper ? applyDeveloperAccess(emptyGeneral, 5) : emptyGeneral);
        setFrequencyInsight(isDeveloper ? applyDeveloperAccess(emptyFrequency, 3) : emptyFrequency);
        setHabitInsight(isDeveloper ? applyDeveloperAccess(emptyHabit, 3) : emptyHabit);
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

      setYesterdayInsight(
        isDeveloper
          ? applyDeveloperAccess({
              title: yesterday?.title || fallbackMessages.yesterday_journey.missingInsight.title,
              description: yesterday?.description || fallbackMessages.yesterday_journey.missingInsight.description,
              locked: yesterday?.locked ?? fallbackMessages.yesterday_journey.missingInsight.locked,
              contextSummary: yesterday?.context_summary || undefined,
              internalContext: yesterday?.internal_context || undefined,
              conversationId: yesterday?.conversation_id || undefined,
              loading: false,
            })
          : {
              title: yesterday?.title || fallbackMessages.yesterday_journey.missingInsight.title,
              description: yesterday?.description || fallbackMessages.yesterday_journey.missingInsight.description,
              locked: yesterday?.locked ?? fallbackMessages.yesterday_journey.missingInsight.locked,
              contextSummary: yesterday?.context_summary || undefined,
              internalContext: yesterday?.internal_context || undefined,
              conversationId: yesterday?.conversation_id || undefined,
              loading: false,
            },
      );

      setGeneralInsight(
        isDeveloper
          ? applyDeveloperAccess({
              title: general?.title || fallbackMessages.general_insight.missingInsight.title,
              description: general?.description || fallbackMessages.general_insight.missingInsight.description,
              locked: general?.locked ?? fallbackMessages.general_insight.missingInsight.locked,
              remaining: generalProgress.remaining,
              cycleProgress: generalProgress.progress,
              cycleRequired: 5,
              contextSummary: general?.context_summary || undefined,
              internalContext: general?.internal_context || undefined,
              loading: false,
            }, 5)
          : {
              title: general?.title || fallbackMessages.general_insight.missingInsight.title,
              description: general?.description || fallbackMessages.general_insight.missingInsight.description,
              locked: general?.locked ?? fallbackMessages.general_insight.missingInsight.locked,
              remaining: generalProgress.remaining,
              cycleProgress: generalProgress.progress,
              cycleRequired: 5,
              contextSummary: general?.context_summary || undefined,
              internalContext: general?.internal_context || undefined,
              loading: false,
            },
      );

      setFrequencyInsight(
        isDeveloper
          ? applyDeveloperAccess({
              title: frequency?.title || fallbackMessages.frequency.missingInsight.title,
              description: frequency?.description || fallbackMessages.frequency.missingInsight.description,
              locked: frequency?.locked ?? fallbackMessages.frequency.missingInsight.locked,
              remaining: frequencyProgress.remaining,
              cycleProgress: frequencyProgress.progress,
              cycleRequired: 3,
              loading: false,
            }, 3)
          : {
              title: frequency?.title || fallbackMessages.frequency.missingInsight.title,
              description: frequency?.description || fallbackMessages.frequency.missingInsight.description,
              locked: frequency?.locked ?? fallbackMessages.frequency.missingInsight.locked,
              remaining: frequencyProgress.remaining,
              cycleProgress: frequencyProgress.progress,
              cycleRequired: 3,
              loading: false,
            },
      );

      setHabitInsight(
        isDeveloper
          ? applyDeveloperAccess({
              title: habit?.title || fallbackMessages.habit.missingInsight.title,
              description: habit?.description || fallbackMessages.habit.missingInsight.description,
              locked: habit?.locked ?? fallbackMessages.habit.missingInsight.locked,
              remaining: habitProgress.remaining,
              cycleProgress: habitProgress.progress,
              cycleRequired: 3,
              contextSummary: habit?.context_summary || undefined,
              internalContext: habit?.internal_context || undefined,
              loading: false,
            }, 3)
          : {
              title: habit?.title || fallbackMessages.habit.missingInsight.title,
              description: habit?.description || fallbackMessages.habit.missingInsight.description,
              locked: habit?.locked ?? fallbackMessages.habit.missingInsight.locked,
              remaining: habitProgress.remaining,
              cycleProgress: habitProgress.progress,
              cycleRequired: 3,
              contextSummary: habit?.context_summary || undefined,
              internalContext: habit?.internal_context || undefined,
              loading: false,
            },
      );
    };

    fetchInsights();
  }, [user, isDeveloper]);

  return {
    yesterdayInsight,
    generalInsight,
    frequencyInsight,
    habitInsight,
    isLoading: yesterdayInsight.loading || generalInsight.loading || 
               frequencyInsight.loading || habitInsight.loading,
  };
}

