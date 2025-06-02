import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RoleDto } from './dto/role.dto';
import { AuthenticatedRequest } from '../common/interfaces/user-auth.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthenticatedRequest = {
    user: {
      sub: 1,
      username: 'testuser',
      iat: Date.now(),
      exp: Date.now() + 3600,
    },
  } as AuthenticatedRequest;

  const mockLoginDto: LoginDto = {
    username: 'testuser',
    password: 'testpassword123',
  };

  const mockRegisterDto: RegisterDto = {
    username: 'newuser',
    password: 'newpassword123',
  };

  const mockRoleDto: RoleDto = {
    role: 'ADMIN',
  };

  const mockAuthResponse = {
    access_token: 'mock.jwt.token',
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
      changeRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(
      AuthService,
    ) as jest.Mocked<AuthService>;

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should login successfully with valid credentials', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.signIn(mockLoginDto);

      expect(result).toEqual(mockAuthResponse);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('should handle different usernames', async () => {
      const differentLoginDto = {
        ...mockLoginDto,
        username: 'anotheruser',
      };
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.signIn(differentLoginDto);

      expect(result).toEqual(mockAuthResponse);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.login).toHaveBeenCalledWith(differentLoginDto);
    });

    it('should propagate service errors for invalid credentials', async () => {
      const error = new Error('Invalid credentials');
      authService.login.mockRejectedValue(error);

      await expect(controller.signIn(mockLoginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
    });

    it('should handle empty credentials gracefully', async () => {
      const emptyLoginDto = { username: '', password: '' };
      authService.login.mockRejectedValue(
        new Error('Username and password required'),
      );

      await expect(controller.signIn(emptyLoginDto)).rejects.toThrow(
        'Username and password required',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.login).toHaveBeenCalledWith(emptyLoginDto);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(mockRegisterDto);

      expect(result).toEqual(mockAuthResponse);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.register).toHaveBeenCalledWith(mockRegisterDto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.register).toHaveBeenCalledTimes(1);
    });

    it('should handle registration with different usernames', async () => {
      const differentRegisterDto = {
        ...mockRegisterDto,
        username: 'differentuser',
      };
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(differentRegisterDto);

      expect(result).toEqual(mockAuthResponse);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.register).toHaveBeenCalledWith(differentRegisterDto);
    });

    it('should propagate service errors for duplicate username', async () => {
      const error = new Error('Username already exists');
      authService.register.mockRejectedValue(error);

      await expect(controller.register(mockRegisterDto)).rejects.toThrow(
        'Username already exists',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.register).toHaveBeenCalledWith(mockRegisterDto);
    });

    it('should handle weak password errors', async () => {
      const weakPasswordDto = { ...mockRegisterDto, password: '123' };
      authService.register.mockRejectedValue(new Error('Password too weak'));

      await expect(controller.register(weakPasswordDto)).rejects.toThrow(
        'Password too weak',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.register).toHaveBeenCalledWith(weakPasswordDto);
    });
  });

  describe('addRole', () => {
    it('should change user role successfully', async () => {
      authService.changeRole.mockResolvedValue();

      const result = await controller.addRole(
        mockRoleDto,
        mockAuthenticatedRequest,
      );

      expect(result).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.changeRole).toHaveBeenCalledWith(1, mockRoleDto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.changeRole).toHaveBeenCalledTimes(1);
    });

    it('should extract user ID from authenticated request', async () => {
      authService.changeRole.mockResolvedValue();

      await controller.addRole(mockRoleDto, mockAuthenticatedRequest);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.changeRole).toHaveBeenCalledWith(
        mockAuthenticatedRequest.user.sub,
        mockRoleDto,
      );
    });

    it('should handle different roles', async () => {
      const clientRoleDto: RoleDto = { role: 'CLIENT' };
      authService.changeRole.mockResolvedValue();

      await controller.addRole(clientRoleDto, mockAuthenticatedRequest);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.changeRole).toHaveBeenCalledWith(1, clientRoleDto);
    });

    it('should handle different user IDs', async () => {
      const differentUserRequest = {
        ...mockAuthenticatedRequest,
        user: { ...mockAuthenticatedRequest.user, sub: 5 },
      };
      authService.changeRole.mockResolvedValue();

      await controller.addRole(mockRoleDto, differentUserRequest);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.changeRole).toHaveBeenCalledWith(5, mockRoleDto);
    });

    it('should propagate service errors for role change', async () => {
      const error = new Error('User not found');
      authService.changeRole.mockRejectedValue(error);

      await expect(
        controller.addRole(mockRoleDto, mockAuthenticatedRequest),
      ).rejects.toThrow('User not found');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.changeRole).toHaveBeenCalledWith(1, mockRoleDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', () => {
      const result = controller.getProfile(mockAuthenticatedRequest);

      expect(result).toEqual(mockAuthenticatedRequest.user);
    });

    it('should return profile for different users', () => {
      const differentUserRequest = {
        ...mockAuthenticatedRequest,
        user: {
          sub: 2,
          username: 'anotheruser',
          iat: Date.now(),
          exp: Date.now() + 3600,
        },
      };

      const result = controller.getProfile(differentUserRequest);

      expect(result).toEqual(differentUserRequest.user);
      expect(result.sub).toBe(2);
      expect(result.username).toBe('anotheruser');
    });

    it('should include all user properties in profile', () => {
      const result = controller.getProfile(mockAuthenticatedRequest);

      expect(result).toHaveProperty('sub');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('iat');
      expect(result).toHaveProperty('exp');
    });
  });
});
