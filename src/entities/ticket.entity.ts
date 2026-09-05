import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TicketAnswer } from './ticket-answer.entity';
import { TicketAssignment } from './ticket-assignment.entity';
import { Admins } from './admins.entity';

export type TicketStatus = 'open' | 'closed';
export type TicketSubject = 'support' | 'finance';

/**
 * Seller support ticket — aligned with core `tickets` plus admin workflow fields.
 * `userId` is the core seller id (no FK; core DB is separate).
 */
@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_TICKETS_USER_ID')
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 32, default: 'support' })
  subject: TicketSubject;

  @Index('IDX_TICKETS_STATUS')
  @Column({ type: 'varchar', length: 32, default: 'open' })
  status: TicketStatus;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'file_url', type: 'varchar', nullable: true })
  fileUrl: string | null;

  @Column({ name: 'file_mime_type', type: 'varchar', length: 128, nullable: true })
  fileMimeType: string | null;

  @Column({ name: 'seller_phone', type: 'varchar', length: 32, nullable: true })
  sellerPhone: string | null;

  @Column({ name: 'seller_name', type: 'varchar', length: 255, nullable: true })
  sellerName: string | null;

  @Index('IDX_TICKETS_ASSIGNED_ADMIN')
  @Column({ name: 'assigned_admin_id', type: 'int', nullable: true })
  assignedAdminId: number | null;

  @Column({ name: 'assigned_admin_name', type: 'varchar', length: 255, nullable: true })
  assignedAdminName: string | null;

  @ManyToOne(() => Admins, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_admin_id' })
  assignedAdmin?: Admins | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'closed_by_admin_id', type: 'int', nullable: true })
  closedByAdminId: number | null;

  /** Seller last viewed the thread — used for unread badges. */
  @Column({ name: 'seller_last_seen_at', type: 'timestamptz', nullable: true })
  sellerLastSeenAt: Date | null;

  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt: Date | null;

  @Column({ name: 'last_message_side', type: 'varchar', length: 16, nullable: true })
  lastMessageSide: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => TicketAnswer, (answer) => answer.ticket)
  answers?: TicketAnswer[];

  @OneToMany(() => TicketAssignment, (assignment) => assignment.ticket)
  assignments?: TicketAssignment[];
}
