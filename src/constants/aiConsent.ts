import { PRIVACY_POLICY_URL } from '@/constants/healthSafety';

/** Bump when disclosure copy or third parties change — forces re-consent. */
export const AI_THIRD_PARTY_CONSENT_VERSION = 'ai-third-party-2026-11-25';

export const AI_THIRD_PARTY_CONSENT_TITLE = 'Uso de inteligência artificial';

export const AI_THIRD_PARTY_CONSENT_BODY =
  'Para conversar com o Bud, enviamos o texto das suas mensagens e o contexto do seu perfil necessário para personalizar as respostas ao provedor de modelos de linguagem OpenAI.\n\n' +
  'No modo de voz, o áudio e/ou a transcrição são processados pela ElevenLabs.\n\n' +
  'Esses dados são usados só para prestar o serviço a você. Detalhes estão na Política de Privacidade.';

export const AI_THIRD_PARTY_CONSENT_ACCEPT = 'Concordo e continuar';
export const AI_THIRD_PARTY_CONSENT_DECLINE = 'Agora não';
export const AI_THIRD_PARTY_CONSENT_PRIVACY_LINK = 'Política de Privacidade';

export { PRIVACY_POLICY_URL };

/** Copy ready to paste into falecombud.com.br/legal/privacidade-bud-2026 */
export const AI_THIRD_PARTY_PRIVACY_POLICY_SECTION = `## Processamento com inteligência artificial de terceiros

Para gerar respostas do companheiro emocional e recursos derivados (insights, cartas, sínteses e atividades), o Bud envia o conteúdo das suas conversas e o contexto necessário para personalização ao provedor de modelos de linguagem OpenAI (https://openai.com).

No modo de voz, o áudio e/ou a transcrição da conversa são processados pela ElevenLabs (https://elevenlabs.io) para reconhecimento e síntese de fala.

OpenAI e ElevenLabs processam esses dados para prestar o serviço ao Bud, sob obrigações contratuais de proteção equivalentes às descritas nesta Política. Eles não usam esses dados para treinar modelos públicos de forma independente do contrato com o Bud, salvo quando a legislação ou a política do provedor exigir divulgação adicional — nesse caso, informaremos na app e nesta página.

Antes do primeiro uso de chat ou voz, o aplicativo solicita seu consentimento explícito descrevendo quais dados são enviados e a quais provedores. Sem esse consentimento, o Bud não envia suas mensagens nem o áudio a esses serviços.

Você pode revisar essa informação em Conta e dados e ler sempre a versão atual desta Política.
`;
