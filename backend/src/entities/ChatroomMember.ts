import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Chatroom } from "./Chatroom.js";
import { User } from "./User.js";

@Entity("chatroom_members")
export class ChatroomMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { name: "chatroom_id" })
  chatroomId!: string;

  @Column("uuid", { name: "user_id" })
  userId!: string;

  @Column("uuid", { nullable: true, name: "last_read_message_id" })
  lastReadMessageId?: string;

  @Column({ nullable: true, name: "last_read_at" })
  lastReadAt?: Date;

  @CreateDateColumn({ name: "joined_at" })
  joinedAt!: Date;

  @ManyToOne(() => Chatroom, (room: any) => room.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "chatroom_id" })
  chatroom?: Chatroom;

  @ManyToOne(() => User, (user: any) => user.chatroomMembers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user?: User;
}
