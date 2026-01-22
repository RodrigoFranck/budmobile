# Bud Mobile

Aplicativo mobile do Bud desenvolvido com Expo, React Native, NativeWind e Supabase.

## 🚀 Stack

- **Expo SDK 54** - Framework React Native
- **NativeWind v4** - Tailwind CSS para React Native
- **Supabase** - Backend (Auth, Database, Edge Functions)
- **React Navigation** - Navegação
- **TypeScript** - Tipagem estática
- **expo-auth-session** - Autenticação OAuth (Google)
- **expo-notifications** - Push Notifications

## 📋 Pré-requisitos

- Node.js 20+ (ou 22+)
- npm ou yarn
- Expo Go app no celular (para desenvolvimento)
- Conta Expo (opcional, para EAS Build)

## 🛠️ Setup

1. **Instalar dependências:**
   ```bash
   npm install
   ```
   
   **Nota:** Se estiver usando Node.js 21, use `npm` ao invés de `yarn`, pois algumas dependências requerem Node 20 ou 22+. O npm funciona normalmente (apenas mostra warnings).

2. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas credenciais do Supabase.

3. **Iniciar o projeto:**
   ```bash
   npm start
   ```

4. **Executar no dispositivo:**
   - iOS: `npm run ios` (requer Mac com Xcode)
   - Android: `npm run android` (requer Android Studio)
   - Ou escaneie o QR code com Expo Go

## 📁 Estrutura do Projeto

```
budmobile/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── contexts/       # Contextos React (Auth, etc)
│   ├── hooks/          # Custom hooks
│   ├── integrations/   # Integrações (Supabase)
│   ├── lib/            # Utilitários
│   ├── pages/          # Telas do app
│   └── utils/          # Funções auxiliares
├── App.tsx             # Componente raiz
├── global.css          # Estilos globais Tailwind
└── tailwind.config.js  # Configuração Tailwind
```

## 🎨 Estilos

O projeto usa **NativeWind v4** que permite usar classes Tailwind diretamente:

```tsx
<View className="flex-1 bg-background p-4">
  <Text className="text-foreground text-xl">Hello World</Text>
</View>
```

As cores seguem o mesmo tema do projeto web (shadcn/ui).

## 🔐 Autenticação

A autenticação usa `expo-auth-session` para OAuth Google e Supabase para gerenciamento de sessão.

## 📱 Features Planejadas

- [x] Setup inicial com Expo + NativeWind
- [ ] Autenticação Google
- [ ] Onboarding (7 steps)
- [ ] Chat texto
- [ ] Chat voz (ElevenLabs)
- [ ] Insights semanais
- [ ] Histórico de conversas
- [ ] Sistema de segurança
- [ ] Configurações
- [ ] Push Notifications

## 📚 Documentação

- [Expo Docs](https://docs.expo.dev/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Supabase Mobile](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

## 🐛 Troubleshooting

### Erro de NativeWind
Se os estilos não funcionarem, limpe o cache:
```bash
npx expo start -c
```

### Erro de tipos TypeScript
Gere os tipos do Supabase:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

## 📝 Notas

- Este projeto segue o plano documentado em `ESTIMATIVA_MOBILE.md`
- Reutiliza ~80% dos estilos Tailwind do projeto web
- MVP estimado em 6-8 semanas
