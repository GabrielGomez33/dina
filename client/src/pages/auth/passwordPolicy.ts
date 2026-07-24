// Client-side mirror of the server password policy (src/modules/auth/policy.ts).
// Kept in sync so the form gives instant feedback; the server remains the
// authority. Same rule: 8–128 chars with lower, upper, digit, and one symbol.
export interface PolicyCheck {
  ok: boolean;
  rules: { label: string; met: boolean }[];
}

export function checkPassword(pw: string): PolicyCheck {
  const rules = [
    { label: '8–128 characters', met: pw.length >= 8 && pw.length <= 128 },
    { label: 'a lowercase letter', met: /[a-z]/.test(pw) },
    { label: 'an uppercase letter', met: /[A-Z]/.test(pw) },
    { label: 'a number', met: /\d/.test(pw) },
    { label: 'a symbol', met: /[^A-Za-z0-9\s]/.test(pw) },
  ];
  return { ok: rules.every((r) => r.met), rules };
}
