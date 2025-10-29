import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ChatroomMember } from "./ChatroomMember.js";
import { Message } from "./Message.js";

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

  @OneToMany(() => ChatroomMember, (cm) => cm.chatroom)
  members?: ChatroomMember[];

  @OneToMany(() => Message, (m) => m.room)
  messages?: Message[];
}
