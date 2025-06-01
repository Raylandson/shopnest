import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import * as argon from 'argon2';
import { User } from '../../generated/prisma';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockUsersService = {};

const mockJwtService = {
  signAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: typeof mockPrismaService;
  let jwt: typeof mockJwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
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
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = { username: 'testuser', password: 'password' };
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      password: 'hashedpassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return an access token for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(argon, 'verify').mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('test_access_token');

      const result = await service.login(loginDto);
      expect(result).toEqual({ access_token: 'test_access_token' });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: loginDto.username },
      });
      expect(argon.verify).toHaveBeenCalledWith(
        mockUser.password,
        loginDto.password,
      );
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password verification fails', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(argon, 'verify').mockResolvedValue(false);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    const registerDto = { username: 'newuser', password: 'password123' };
    const hashedPassword = 'hashedNewPassword';
    const newUser: User = {
      id: 2,
      username: 'newuser',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should register a new user and return an access token', async () => {
      jest.spyOn(argon, 'hash').mockResolvedValue(hashedPassword);
      prisma.user.create.mockResolvedValue(newUser);
      jwt.signAsync.mockResolvedValue('new_access_token');

      const result = await service.register(registerDto);

      expect(result).toEqual({ access_token: 'new_access_token' });
      expect(argon.hash).toHaveBeenCalledWith(registerDto.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: registerDto.username,
          password: hashedPassword,
        },
      });
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: newUser.id,
        username: newUser.username,
      });
    });

    it('should throw UnauthorizedException if user creation fails (e.g., prisma returns null)', async () => {
      jest.spyOn(argon, 'hash').mockResolvedValue(hashedPassword);
      prisma.user.create.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        new UnauthorizedException('User registration failed'),
      );
    });
  });
});
