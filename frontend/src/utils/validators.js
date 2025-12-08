export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (password.length < minLength) 
    return 'Hasło musi mieć min. 8 znaków';
  if (!hasUpper) 
    return 'Hasło musi zawierać dużą literę';
  if (!hasLower) 
    return 'Hasło musi zawierać małą literę';
  if (!hasDigit) 
    return 'Hasło musi zawierać cyfrę';
  if (!hasSymbol) 
    return 'Hasło musi zawierać znak specjalny';
  return null;
};

export const validateEmail = (email) => /@/.test(email);