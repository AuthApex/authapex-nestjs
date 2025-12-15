import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type SessionDocument = Session & Document;

@Schema()
export class Session {
  @Prop({
    type: String,
    required: true,
    index: true,
    unique: true,
  })
  sessionId: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  userId: string;

  @Prop({
    type: Date,
    required: true,
  })
  createdAt: Date;

  @Prop({
    type: Date,
    required: true,
  })
  expiresAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
