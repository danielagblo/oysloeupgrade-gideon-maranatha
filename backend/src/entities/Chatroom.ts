import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, CreateDateColumn, UpdateDateColumn } from "typeorm";

import { Message } from "./Message.js";

import { ChatroomMember } from "./ChatroomMember.js";

@Entity("chatrooms")
export class Chatroom {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200, unique: true, name: "room_id" })
  @Index()
  roomId!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "boolean", default: false, name: "is_group" })
  isGroup!: boolean;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => Message, (m: Message) => m.room)
  messages?: Message[];

  @OneToMany(() => ChatroomMember, (cm: ChatroomMember) => cm.chatroom)
  members?: ChatroomMember[];
}
