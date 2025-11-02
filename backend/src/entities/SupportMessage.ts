import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SupportCase } from './SupportCase.js';

@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'case_id' })
  caseId!: number;

  @ManyToOne(
    () => SupportCase,
    (sc: any) => sc.messages
  )
  @JoinColumn({ name: 'case_id' })
  supportCase?: any;

  @Column({ name: 'sender_id' })
  senderId!: string; // Can be user_id or admin_user_id

  @Column({ type: 'varchar', length: 20 })
  senderType!: string; // 'user' or 'admin'

  @Column({ type: 'varchar', length: 20, default: 'text' })
  messageType!: string; // 'text', 'image', 'voice', 'file'

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fileUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName?: string;

  @Column({ type: 'integer', nullable: true })
  fileSize?: number;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
