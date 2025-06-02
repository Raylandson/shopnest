import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RoleDto } from './dto/role.dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';

// Mock argon2
jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUser = {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword123',
    role: 'CLIENT' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser = {
    id: 2,
    username: 'adminuser',
    password: 'hashedadminpassword',
    role: 'ADMIN' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

  const mockJwtToken = 'mock.jwt.token';

  beforeEach(async () => {
    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    prismaService = module.get<PrismaService>(PrismaService) as any;

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockArgon = argon as jest.Mocked<typeof argon>;
      mockArgon.verify.mockResolvedValue(true);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue(mockJwtToken);

      const result = await service.login(mockLoginDto);

      expect(result).toEqual({ access_token: mockJwtToken });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: mockLoginDto.username },
      });
      expect(mockArgon.verify).toHaveBeenCalledWith(
        mockUser.password,
        mockLoginDto.password,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: mockLoginDto.username },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const mockArgon = argon as jest.Mocked<typeof argon>;
      mockArgon.verify.mockResolvedValue(false);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: mockLoginDto.username },
      });
      expect(mockArgon.verify).toHaveBeenCalledWith(
        mockUser.password,
        mockLoginDto.password,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should handle login with different usernames', async () => {
      const differentLoginDto = { ...mockLoginDto, username: 'anotheruser' };
      const mockArgon = argon as jest.Mocked<typeof argon>;
      mockArgon.verify.mockResolvedValue(true);
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        username: 'anotheruser',
      });
      jwtService.signAsync.mockResolvedValue(mockJwtToken);

      const result = await service.login(differentLoginDto);

      expect(result).toEqual({ access_token: mockJwtToken });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'anotheruser' },
      });
    });

    it('should include role in JWT payload for admin users', async () => {
      const mockArgon = argon as jest.Mocked<typeof argon>;
      mockArgon.verify.mockResolvedValue(true);
      prismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      jwtService.signAsync.mockResolvedValue(mockJwtToken);

      const result = await service.login({
        username: 'adminuser',
        password: 'adminpassword',
      });

      expect(result).toEqual({ access_token: mockJwtToken });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockAdminUser.id,
        username: mockAdminUser.username,
        role: mockAdminUser.role,
      });
    });

    it('should handle argon verification errors gracefully', async () => {
      const mockArgon = argon as jest.Mocked<typeof argon>;
      mockArgon.verify.mockRejectedValue(
        new Error('Argon verification failed'),
      );
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        'Argon verification failed',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockArgon = argon as jest.Mocked<typeof argon>;
      const hashedPassword = 'hashedNewPassword123';
      mockArgon.hash.mockResolvedValue(hashedPassword);

      const newUser = {
        id: 3,
        username: mockRegisterDto.username,
        password: hashedPassword,
        role: 'CLIENT' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.create.mockResolvedValue(newUser);
      jwtService.signAsync.mockResolvedValue(mockJwtToken);

      const result = await service.register(mockRegisterDto);

      expect(result).toEqual({ access_token: mockJwtToken });
      expect(mockArgon.hash).toHaveBeenCalledWith(mockRegisterDto.password);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: mockRegisterDto.username,
          password: hashedPassword,
        },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: newUser.id,
        username: newUser.username,
      });
    });

    it('should handle registration with different usernames', async () => {
      const differentRegisterDto = {
        ...mockRegisterDto,
        username: 'differentuser',
      };
      const mockArgon = argon as jest.Mocked<typeof argon>;
      const hashedPassword = 'hashedDifferentPassword123';
      mockArgon.hash.mockResolvedValue(hashedPassword);

      const newUser = {
        id: 4,
        username: differentRegisterDto.username,
        password: hashedPassword,
        role: 'CLIENT' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.create.mockResolvedValue(newUser);
      jwtService.signAsync.mockResolvedValue(mockJwtToken);

      const result = await service.register(differentRegisterDto);

      expect(result).toEqual({ access_token: mockJwtToken });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: differentRegisterDto.username,
          password: hashedPassword,
        },
      });
    });

    it('should throw UnauthorizedException when user creation fails', async () => {
      const mockArgon = argon as jest.Mocked<typeof argon>;
      mockArgon.hash.mockResolvedValue('hashedPassword');
      prismaService.user.create.mockResolvedValue(null);

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        new UnauthorizedException('User registration failed'),
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should handle duplicate username errors', async () => {
      const mockArgon = argon as jest.Mocked<typeof argon>;
      mockArgon.hash.mockResolvedValue('hashedPassword');

      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
        },
      );

      prismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        prismaError,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should handle argon hashing errors gracefully', async () => {
      const mockArgon = argon as jest.Mocked<typeof argon>;
      mockArgon.hash.mockRejectedValue(new Error('Hashing failed'));

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        'Hashing failed',
      );

      expect(prismaService.user.create).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should handle different password lengths correctly', async () => {
      const longPasswordDto = {
        ...mockRegisterDto,
        password: 'averylongpasswordthatisvalid123',
      };
      const mockArgon = argon as jest.Mocked<typeof argon>;
      const hashedPassword = 'hashedLongPassword';
      mockArgon.hash.mockResolvedValue(hashedPassword);

      const newUser = {
        id: 5,
        username: longPasswordDto.username,
        password: hashedPassword,
        role: 'CLIENT' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.create.mockResolvedValue(newUser);
      jwtService.signAsync.mockResolvedValue(mockJwtToken);

      const result = await service.register(longPasswordDto);

      expect(result).toEqual({ access_token: mockJwtToken });
      expect(mockArgon.hash).toHaveBeenCalledWith(longPasswordDto.password);
    });
  });

  describe('changeRole', () => {
    it('should change user role successfully', async () => {
      const updatedUser = { ...mockUser, role: 'ADMIN' as const };
      prismaService.user.update.mockResolvedValue(updatedUser);

      await service.changeRole(1, mockRoleDto);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          role: mockRoleDto.role,
        },
      });
    });

    it('should handle different user IDs', async () => {
      const updatedUser = { ...mockUser, id: 5, role: 'ADMIN' as const };
      prismaService.user.update.mockResolvedValue(updatedUser);

      await service.changeRole(5, mockRoleDto);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {
          role: mockRoleDto.role,
        },
      });
    });

    it('should handle different roles', async () => {
      const clientRoleDto: RoleDto = { role: 'CLIENT' };
      const updatedUser = { ...mockUser, role: 'CLIENT' as const };
      prismaService.user.update.mockResolvedValue(updatedUser);

      await service.changeRole(1, clientRoleDto);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          role: 'CLIENT',
        },
      });
    });

    it('should handle user not found errors', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record to update not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );

      prismaService.user.update.mockRejectedValue(prismaError);

      await expect(service.changeRole(999, mockRoleDto)).rejects.toThrow(
        prismaError,
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 999 },
        data: {
          role: mockRoleDto.role,
        },
      });
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed');
      prismaService.user.update.mockRejectedValue(dbError);

      await expect(service.changeRole(1, mockRoleDto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should return void on successful role change', async () => {
      const updatedUser = { ...mockUser, role: 'ADMIN' as const };
      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.changeRole(1, mockRoleDto);

      expect(result).toBeUndefined();
    });
  });

  describe('Integration tests', () => {
    it('should handle complete user lifecycle: register -> login -> change role', async () => {
      const mockArgon = argon as jest.Mocked<typeof argon>;
      const hashedPassword = 'hashedTestPassword';

      // Mock register
      mockArgon.hash.mockResolvedValue(hashedPassword);
      const newUser = {
        id: 10,
        username: 'lifecycleuser',
        password: hashedPassword,
        role: 'CLIENT' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.user.create.mockResolvedValue(newUser);
      jwtService.signAsync.mockResolvedValue('register.token');

      // Register user
      const registerResult = await service.register({
        username: 'lifecycleuser',
        password: 'testpassword123',
      });
      expect(registerResult.access_token).toBe('register.token');

      // Mock login
      mockArgon.verify.mockResolvedValue(true);
      prismaService.user.findUnique.mockResolvedValue(newUser);
      jwtService.signAsync.mockResolvedValue('login.token');

      // Login user
      const loginResult = await service.login({
        username: 'lifecycleuser',
        password: 'testpassword123',
      });
      expect(loginResult.access_token).toBe('login.token');

      // Mock role change
      const updatedUser = { ...newUser, role: 'ADMIN' as const };
      prismaService.user.update.mockResolvedValue(updatedUser);

      // Change role
      await service.changeRole(10, { role: 'ADMIN' });

      // Verify all operations were called
      expect(prismaService.user.create).toHaveBeenCalledTimes(1);
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.user.update).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple users with different roles', async () => {
      const mockArgon = argon as jest.Mocked<typeof argon>;

      // User 1 - Client
      mockArgon.verify.mockResolvedValueOnce(true);
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      jwtService.signAsync.mockResolvedValueOnce('client.token');

      const clientLoginResult = await service.login({
        username: 'testuser',
        password: 'password123',
      });

      // User 2 - Admin
      mockArgon.verify.mockResolvedValueOnce(true);
      prismaService.user.findUnique.mockResolvedValueOnce(mockAdminUser);
      jwtService.signAsync.mockResolvedValueOnce('admin.token');

      const adminLoginResult = await service.login({
        username: 'adminuser',
        password: 'adminpassword',
      });

      expect(clientLoginResult.access_token).toBe('client.token');
      expect(adminLoginResult.access_token).toBe('admin.token');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle null/undefined input gracefully in login', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const nullLoginDto = { username: null, password: null } as any;
      prismaService.user.findUnique.mockResolvedValue(null);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(service.login(nullLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle empty string inputs in register', async () => {
      const emptyRegisterDto = { username: '', password: '' };
      const mockArgon = argon as jest.Mocked<typeof argon>;
      mockArgon.hash.mockResolvedValue('hashedEmptyPassword');
      prismaService.user.create.mockResolvedValue(null);

      await expect(service.register(emptyRegisterDto)).rejects.toThrow(
        new UnauthorizedException('User registration failed'),
      );
    });

    it('should handle JWT signing errors in login', async () => {
      const mockArgon = argon as jest.Mocked<typeof argon>;
      mockArgon.verify.mockResolvedValue(true);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      jwtService.signAsync.mockRejectedValue(new Error('JWT signing failed'));

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        'JWT signing failed',
      );
    });

    it('should handle JWT signing errors in register', async () => {
      const mockArgon = argon as jest.Mocked<typeof argon>;
      mockArgon.hash.mockResolvedValue('hashedPassword');
      const newUser = {
        id: 6,
        username: 'testuser',
        password: 'hashedPassword',
        role: 'CLIENT' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.user.create.mockResolvedValue(newUser);
      jwtService.signAsync.mockRejectedValue(new Error('JWT signing failed'));

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        'JWT signing failed',
      );
    });
  });
});
