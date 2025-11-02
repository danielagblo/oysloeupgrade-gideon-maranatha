import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AdminUser } from './AdminUser.js';
import { SupportCase } from './SupportCase.js';

@Entity('support_case_assignments')
export class SupportCaseAssignment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'case_id' })
  caseId!: number;

  @ManyToOne(
    () => SupportCase,
    (sc: any) => sc.assignments
  )
  @JoinColumn({ name: 'case_id' })
  supportCase?: any;

  @Column({ name: 'admin_user_id' })
  adminUserId!: number;

  @ManyToOne(
    () => AdminUser,
    (admin: any) => admin.caseAssignments
  )
  @JoinColumn({ name: 'admin_user_id' })
  adminUser?: any;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'unassigned_at' })
  unassignedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
