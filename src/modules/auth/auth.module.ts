import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserData, UserDataSchema } from '@/modules/auth/mongo/userData.schema';
import { AuthController } from '@/modules/auth/controllers/auth.controller';
import { AuthGuard } from '@/modules/auth/providers/auth.guard';
import { AuthService } from '@/modules/auth/providers/auth.service';
import { Session, SessionSchema } from '@/modules/auth/mongo/session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    MongooseModule.forFeature([{ name: UserData.name, schema: UserDataSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthGuard, AuthService],
  exports: [AuthGuard, AuthService],
})
export class AuthModule {}
