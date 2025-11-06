import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('towns')
export class Town {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'uuid', name: 'region_id' })
  regionId!: string;

  @ManyToOne('Region', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'region_id' })
  region!: any;

  @Column({ type: 'jsonb', nullable: true })
  coordinates?: { lat: number; lng: number };

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}
