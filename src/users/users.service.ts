import { Injectable } from '@nestjs/common';

// This should be a real class/interface representing a user entity
export interface User {
  userId: number;
  username: string;
  password: string;
}

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  findOne(username: string): User | undefined {
    return this.users.find((user) => user.username === username);
  }
}
