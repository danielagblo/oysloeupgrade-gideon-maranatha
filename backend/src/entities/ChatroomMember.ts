import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";

import type { Chatroom } from "./Chatroom.js";

import type { User } from "./User.js";

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

  @ManyToOne("Chatroom", "members", { onDelete: "CASCADE" })
  @JoinColumn({ name: "chatroom_id" })
  chatroom?: Chatroom;

  @ManyToOne("User", "chatroomMembers", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;
}
