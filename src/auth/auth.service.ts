import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as argon from 'argon2';
import { RoleDto } from './dto/role.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    const pass = await argon.verify(user.password, loginDto.password);

    if (!pass) {
      throw new UnauthorizedException();
    }

    return {
      access_token: await this.accesToken(user.id, user.username, user.role),
    };
  }

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    const hash = await argon.hash(registerDto.password);
    const newUser = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        password: hash,
      },
    });

    if (!newUser) {
      throw new UnauthorizedException('User registration failed');
    }

    return {
      access_token: await this.accesToken(
        newUser.id,
        newUser.username,
        newUser.role,
      ),
    };
  }

  async changeRole(
    userId: number,
    roleDto: RoleDto,
  ): Promise<{ access_token: string }> {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: roleDto.role,
      },
    });
    return {
      access_token: await this.accesToken(
        updatedUser.id,
        updatedUser.username,
        updatedUser.role,
      ),
    };
  }

  async accesToken(
    userId: number,
    username: string,
    role: string,
  ): Promise<string> {
    const payload = { sub: userId, username, role };
    return await this.jwtService.signAsync(payload);
  }
}
