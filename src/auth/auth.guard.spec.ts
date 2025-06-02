import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { jwtConstants } from '../common/constants';
import { Request } from 'express';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  const mockRequest = (headers?: any) =>
    ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      headers: headers || {},
    }) as Request;

  const mockExecutionContext = (request: Request) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    jwtService = new JwtService({ secret: jwtConstants.secret }); // Real instance for spy, or mock methods
    guard = new AuthGuard(jwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException if no token is provided', async () => {
    const request = mockRequest();
    const context = mockExecutionContext(request);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if token is not Bearer type', async () => {
    const request = mockRequest({ authorization: 'Basic sometoken' });
    const context = mockExecutionContext(request);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if token verification fails', async () => {
    const request = mockRequest({ authorization: 'Bearer invalidtoken' });
    const context = mockExecutionContext(request);
    jest
      .spyOn(jwtService, 'verifyAsync')
      .mockRejectedValueOnce(new Error('test-error'));
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return true and attach user to request if token is valid', async () => {
    const userPayload = { sub: '1', username: 'testuser' };
    const token = await jwtService.signAsync(userPayload);
    const request = mockRequest({ authorization: `Bearer ${token}` });
    const context = mockExecutionContext(request);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request['user']).toEqual(userPayload);
  });

  describe('extractTokenFromHeader', () => {
    it('should return token if Bearer token is present', () => {
      const request = mockRequest({ authorization: 'Bearer sometoken' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      expect((guard as any).extractTokenFromHeader(request)).toEqual(
        'sometoken',
      );
    });

    it('should return undefined if token is not Bearer type', () => {
      const request = mockRequest({ authorization: 'Basic sometoken' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      expect((guard as any).extractTokenFromHeader(request)).toBeUndefined();
    });

    it('should return undefined if no authorization header is present', () => {
      const request = mockRequest();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      expect((guard as any).extractTokenFromHeader(request)).toBeUndefined();
    });

    it('should return undefined if authorization header is malformed', () => {
      const request = mockRequest({ authorization: 'BearerTokenWithoutSpace' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      expect((guard as any).extractTokenFromHeader(request)).toBeUndefined();
    });
  });
});
