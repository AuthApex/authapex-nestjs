import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService, SessionDto } from '@/modules/auth/providers/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = request.cookies?.session;

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload: SessionDto = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.authService.getUserFromSession(payload.sessionId);

      request['sessionId'] = payload.sessionId;
      request['user'] = user;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }
}
