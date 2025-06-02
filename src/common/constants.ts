export const jwtConstants = {
  secret: process.env.JWT_SECRET,
};

export const jwtExpirationTime = process.env.JWT_EXPIRATION_TIME || '1h';

export const serverPort = process.env.SERVER_PORT || 3000;
