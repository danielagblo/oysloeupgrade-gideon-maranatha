import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { JobApplication } from './JobApplication.js';

export type DocumentType = 'cv' | 'cover_letter' | 'portfolio' | 'other';

@Entity('application_documents')
export class ApplicationDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'application_id' })
  applicationId!: number;

  @ManyToOne(
    () => JobApplication,
    (app: any) => app.documents,
    {
      onDelete: 'CASCADE',
    }
  )
  @JoinColumn({ name: 'application_id' })
  application!: JobApplication;

  @Column({ type: 'varchar', length: 50, name: 'document_type' })
  documentType!: DocumentType;

  @Column({ type: 'varchar', length: 500, name: 'file_url' })
  fileUrl!: string;

  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  fileName!: string;

  @Column({ type: 'integer', name: 'file_size' })
  fileSize!: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'mime_type' })
  mimeType?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
