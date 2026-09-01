export type AuthStep =
  | 'account'
  | 'email_check'
  | 'tfa_check'
  | 'passkey_check';

export type VerifySession = {
  username: string;
  secret: string;
  emailHint?: string;
  passkeyOptions?: API.PublicKeyCredentialRequestOptionsJSON;
};
