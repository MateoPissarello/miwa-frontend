// lib/api/auth.types.ts (recomendado)
export type Tokens = {
  IdToken: string;
  AccessToken: string;
  RefreshToken?: string;
  ExpiresIn?: number;
  TokenType?: string;
};

export type LoginOK = { status: "OK"; tokens: Tokens };
export type LoginMfaSetup = { status: "MFA_SETUP"; session: string };
export type LoginSoftwareMfa = {
  status: "SOFTWARE_TOKEN_MFA";
  session: string;
};

export type LoginResponse = LoginOK | LoginMfaSetup | LoginSoftwareMfa;
// MFA
export type MfaSetupBeginResponse = {
  secret: string;
  otpauth: string;
  session: string;
};
export type MfaSetupVerifyResponse = LoginOK; // { status:"OK", tokens }
export type MfaChallengeResponse = LoginOK; // { status:"OK", tokens }
