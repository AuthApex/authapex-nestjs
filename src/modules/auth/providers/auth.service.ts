import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthorizationService, User, UserService } from '@authapex/core';
import { Response } from 'express';
import { addMonths, addWeeks, isAfter } from 'date-fns';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import { Session, SessionDocument } from '@/modules/auth/mongo/session.schema';
import { UserData, UserDataDocument } from '@/modules/auth/mongo/userData.schema';

export interface SessionDto {
  sessionId: string;
  expiresAt: string;
}

const AUTH_URL = process.env.AUTH_URL ?? 'https://id.authapex.net';
const AUTHORIZATION_SERVICE = new AuthorizationService(
  AUTH_URL,
  process.env.APP_NAME,
  process.env.APP_URL + '/api/auth',
  process.env.AUTH_API_KEY
);
const USER_SERVICE = new UserService(AUTH_URL, process.env.APP_NAME, process.env.AUTH_API_KEY);

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(UserData.name)
    private readonly userDataModel: Model<UserDataDocument>
  ) {}

  async updateUser(userId: string): Promise<void> {
    const userData = await this.userDataModel.findOne({ userId: userId }).exec();

    if (!userData) {
      return;
    }
    userData.user = await USER_SERVICE.getUpdatedUser(userId);
    await userData.save();
  }

  async deleteSession(userId: string): Promise<void> {
    await this.sessionModel.deleteMany({ userId: userId }).exec();
  }

  async getSession(sessionId: string): Promise<string> {
    const cachedUser = USER_SERVICE.getUserFromCacheBySessionId(sessionId);
    if (cachedUser) {
      return cachedUser.userId;
    }
    const session = await this.sessionModel.findOne({ sessionId: sessionId }).exec();

    if (!session) {
      throw new UnauthorizedException();
    }
    if (isAfter(new Date(), session.expiresAt)) {
      await this.sessionModel.deleteOne({ sessionId: sessionId }).exec();
      throw new UnauthorizedException();
    }
    return session.userId;
  }

  async getUserFromSession(sessionId: string): Promise<User> {
    const cachedUser = USER_SERVICE.getUserFromCacheBySessionId(sessionId);
    if (cachedUser) {
      return cachedUser;
    }
    const userId = await this.getSession(sessionId);
    const userData = await this.userDataModel.findOne({ userId: userId }).exec();
    if (!userData) {
      throw new UnauthorizedException();
    }
    USER_SERVICE.addSessionToCache(sessionId, userData.user);
    return userData.user;
  }

  async getUser(userId: string): Promise<User> {
    const cachedUser = USER_SERVICE.getUserFromCacheByUserId(userId);
    if (cachedUser) {
      return cachedUser;
    }
    const userData = await this.userDataModel.findOne({ userId: userId }).exec();
    if (!userData) {
      throw new UnauthorizedException();
    }
    USER_SERVICE.addUserToCache(userData.userId, userData.user);
    return userData.user;
  }

  async createSession(user: User, res: Response): Promise<void> {
    const expiresAt = addMonths(new Date(), 1);

    const session = new this.sessionModel({
      sessionId: nanoid(),
      userId: user.userId,
      createdAt: new Date(),
      expiresAt,
    });
    await session.save();

    const token = await this.jwtService.signAsync(
      {
        sessionId: session.sessionId,
        expiresAt: expiresAt.toISOString(),
      } as SessionDto,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
        secret: process.env.JWT_SECRET,
      }
    );

    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env.DEVELOPMENT !== 'true',
      sameSite: 'strict',
      path: '/api',
      expires: expiresAt,
    });
  }

  async refresh(sessionId: string, user: User, res: Response): Promise<void> {
    const existingSession = await this.sessionModel.findOne({ sessionId: sessionId }).exec();

    if (!existingSession) {
      throw new UnauthorizedException();
    }

    if (isAfter(addWeeks(new Date(), 1), existingSession.expiresAt)) {
      await existingSession.deleteOne();
      await this.createSession(user, res);
    }
  }

  async login(authCode: string, res: Response): Promise<void> {
    const user: User = await AUTHORIZATION_SERVICE.authorize(authCode);

    const existingUserData = await this.userDataModel.findOne({ userId: user.userId }).exec();
    if (existingUserData == null) {
      await new this.userDataModel({
        userId: user.userId,
        user,
      }).save();
    } else {
      existingUserData.user = user;
      await existingUserData.save();
    }

    await this.createSession(user, res);
    res.redirect(process.env.APP_URL!);
  }

  async logout(sessionId: string, res: Response): Promise<void> {
    await this.sessionModel.deleteOne({ sessionId: sessionId }).exec();

    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.DEVELOPMENT !== 'true',
      sameSite: 'strict',
      path: '/api',
    });
    res.status(HttpStatus.OK).json({ status: 'success' });
  }
}
