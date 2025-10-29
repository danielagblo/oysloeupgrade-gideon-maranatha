import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chatroom } from './Chatroom.js';
import { User } from './User.js';

export type MessageType = 'text' | 'audio' | 'image';

@Entity('messages')
@Index(['roomId', 'id'])
@Index(['roomId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'room_id' })
  roomId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'sender_id' })
  senderId?: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'text',
    name: 'message_type',
  })
  messageType!: MessageType;

  @Column({ type: 'text', nullable: true, name: 'file_url' })
  fileUrl?: string;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead!: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Chatroom, (room) => room.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room?: Chatroom;

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_id' })
  sender?: User;
}
