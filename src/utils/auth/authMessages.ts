type AuthAlert = {
  title: string;
  message: string;
};

const normalizeAuthError = (message: string) => message.toLowerCase().trim();

export const signupPasswordMismatchAlert = (): AuthAlert => ({
  title: 'Confira sua senha',
  message:
    'As senhas digitadas não são iguais. Digite a mesma senha nos dois campos e tente novamente.',
});

export const signupSuccessAlert = (email: string): AuthAlert => ({
  title: 'Conta criada',
  message: `Enviamos um e-mail de confirmação para ${email}. Abra sua caixa de entrada (e a pasta de spam), clique no link de confirmação e depois volte aqui para fazer login.`,
});

export const signupEmailFailedAlert = (): AuthAlert => ({
  title: 'Conta criada',
  message:
    'Sua conta foi criada, mas não conseguimos enviar o e-mail de confirmação agora. Aguarde alguns minutos e tente fazer login. Se o problema continuar, use "Esqueceu a senha?" para receber um novo e-mail.',
});

export const signupIncompleteAlert = (): AuthAlert => ({
  title: 'Cadastro incompleto',
  message:
    'Não conseguimos concluir seu cadastro neste momento. Verifique sua conexão e tente novamente. Se o problema continuar, tente fazer login com o e-mail informado.',
});

export const mapSignupError = (rawMessage: string): AuthAlert => {
  const message = normalizeAuthError(rawMessage);

  if (message.includes('already registered') || message.includes('already been registered')) {
    return {
      title: 'E-mail já cadastrado',
      message:
        'Este e-mail já possui uma conta. Faça login ou use "Esqueceu a senha?" se não lembrar sua senha.',
    };
  }

  if (message.includes('invalid email') || message.includes('email inválido')) {
    return {
      title: 'E-mail inválido',
      message: 'Digite um endereço de e-mail válido, como seu@email.com.',
    };
  }

  if (message.includes('password') && message.includes('6')) {
    return {
      title: 'Senha muito curta',
      message: 'Sua senha precisa ter no mínimo 6 caracteres.',
    };
  }

  if (message.includes('nome é obrigatório')) {
    return {
      title: 'Nome obrigatório',
      message: 'Informe seu nome para concluir o cadastro.',
    };
  }

  if (message.includes('rate limit') || message.includes('too many requests')) {
    return {
      title: 'Muitas tentativas',
      message: 'Você fez muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
    };
  }

  if (message.includes('network') || message.includes('fetch')) {
    return {
      title: 'Sem conexão',
      message: 'Não foi possível concluir o cadastro. Verifique sua internet e tente novamente.',
    };
  }

  return {
    title: 'Não foi possível criar a conta',
    message: 'Algo deu errado ao criar sua conta. Confira os dados e tente novamente.',
  };
};

export const mapLoginError = (rawMessage: string): AuthAlert => {
  const message = normalizeAuthError(rawMessage);

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return {
      title: 'Não foi possível entrar',
      message:
        'E-mail ou senha incorretos. Confira os dados ou use "Esqueceu a senha?" para redefinir.',
    };
  }

  if (message.includes('email not confirmed') || message.includes('not confirmed')) {
    return {
      title: 'Confirme seu e-mail',
      message:
        'Sua conta ainda não foi confirmada. Verifique sua caixa de entrada (e a pasta de spam) e clique no link que enviamos.',
    };
  }

  if (message.includes('invalid email') || message.includes('email inválido')) {
    return {
      title: 'E-mail inválido',
      message: 'Digite um endereço de e-mail válido para continuar.',
    };
  }

  if (message.includes('rate limit') || message.includes('too many requests')) {
    return {
      title: 'Muitas tentativas',
      message: 'Você fez muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
    };
  }

  if (message.includes('network') || message.includes('fetch')) {
    return {
      title: 'Sem conexão',
      message: 'Não foi possível entrar. Verifique sua internet e tente novamente.',
    };
  }

  return {
    title: 'Não foi possível entrar',
    message: 'Algo deu errado ao fazer login. Tente novamente em instantes.',
  };
};

export const passwordResetEmptyEmailAlert = (): AuthAlert => ({
  title: 'E-mail obrigatório',
  message: 'Digite seu e-mail para receber o link de recuperação.',
});

export const mapPasswordResetError = (rawMessage: string): AuthAlert => {
  const message = normalizeAuthError(rawMessage);

  if (message.includes('invalid email') || message.includes('email inválido')) {
    return {
      title: 'E-mail inválido',
      message: 'Digite um endereço de e-mail válido, como seu@email.com.',
    };
  }

  if (message.includes('rate limit') || message.includes('too many requests')) {
    return {
      title: 'Muitas tentativas',
      message: 'Você fez muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
    };
  }

  if (message.includes('network') || message.includes('fetch')) {
    return {
      title: 'Sem conexão',
      message: 'Não foi possível enviar o e-mail. Verifique sua internet e tente novamente.',
    };
  }

  return {
    title: 'Erro ao enviar e-mail',
    message: 'Não foi possível enviar o link de recuperação agora. Tente novamente em instantes.',
  };
};

export const passwordTooShortAlert = (minLength: number): AuthAlert => ({
  title: 'Senha muito curta',
  message: `A senha precisa ter no mínimo ${minLength} caracteres.`,
});

export const passwordMismatchAlert = (): AuthAlert => ({
  title: 'Senhas diferentes',
  message: 'Digite a mesma senha nos dois campos e tente novamente.',
});

export const passwordUpdatedAlert = (): AuthAlert => ({
  title: 'Senha atualizada',
  message: 'Sua senha foi redefinida. Entre com o e-mail e a nova senha.',
});

export const mapPasswordUpdateError = (rawMessage: string): AuthAlert => {
  const message = normalizeAuthError(rawMessage);

  if (message.includes('password') && message.includes('6')) {
    return passwordTooShortAlert(6);
  }

  if (message.includes('same password') || message.includes('different from the old')) {
    return {
      title: 'Senha igual à atual',
      message: 'Escolha uma senha diferente da que você usa hoje.',
    };
  }

  if (message.includes('network') || message.includes('fetch')) {
    return {
      title: 'Sem conexão',
      message: 'Não foi possível atualizar a senha. Verifique sua internet e tente novamente.',
    };
  }

  return {
    title: 'Não foi possível atualizar a senha',
    message: 'Algo deu errado ao salvar a nova senha. Tente novamente em instantes.',
  };
};
