export type JwtPayload = {
  sub: string;
  email: string;
  admin: boolean;
};

export type JwtPayloadWithRt = JwtPayload & {
  refreshToken: string;
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};
