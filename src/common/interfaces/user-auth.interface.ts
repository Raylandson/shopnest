export interface UserRequest {
  sub: number;
  username: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user: UserRequest;
}
