import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { User } from '@authapex/core';

export type UserDataDocument = UserData & Document;

@Schema()
export class UserData {
  @Prop({
    type: String,
    required: true,
    index: true,
    unique: true,
  })
  userId: string;

  @Prop({
    type: Object,
    required: true,
  })
  user: User;
}

export const UserDataSchema = SchemaFactory.createForClass(UserData);
