import { Body, Controller, Get, Post, Query, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { User, WebSocketEvent } from '@authapex/core';
import type { Response } from 'express';
import { AuthService } from '@/modules/auth/providers/auth.service';
import { AuthGuard } from '@/modules/auth/providers/auth.guard';
import { SessionId, SessionUser } from '@/modules/auth/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async authorize(@Res({ passthrough: true }) res: Response, @Query('authCode') authCode?: string): Promise<void> {
    if (!authCode) {
      throw new UnauthorizedException();
    }
    await this.authService.login(authCode, res);
  }

  @UseGuards(AuthGuard)
  @Get('refresh')
  async refresh(
    @Res({ passthrough: true }) res: Response,
    @SessionId() sessionId: string,
    @SessionUser() user: User
  ): Promise<void> {
    await this.authService.refresh(sessionId, user, res);
  }

  @UseGuards(AuthGuard)
  @Get('user')
  getUser(@SessionUser() user: User): User {
    return user;
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@SessionId() sessionId: string, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.authService.logout(sessionId, res);
  }

  @Post('ws')
  async authApexWebsocket(@Body() request: WebSocketEvent): Promise<void> {
    if (request.type === 'user-update') {
      await this.authService.updateUser(request.data.userId);
      return;
    }
    if (request.type === 'session-deleted') {
      await this.authService.deleteSession(request.data.userId);
      return;
    }
  }
}
