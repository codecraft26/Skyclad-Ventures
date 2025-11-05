import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async login(email: string, role?: string): Promise<{
    access_token: string;
    user: {
      id: string;
      email: string;
      role: string;
    };
  }> {
    // Find or create user (mocked authentication)
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // Create user with default role or provided role
      const userRole = role || 'user';
      user = await this.usersService.create(email, userRole);
    } else if (role && user.role !== role) {
      // Update role if provided and different
      user.role = role;
      await user.save();
    }

    // Generate JWT token
    const payload = {
      sub: String((user as any)._id),
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: String((user as any)._id),
        email: user.email,
        role: user.role,
      },
    };
  }
}

