import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Ticket } from './ticket.entity';

/** Aligned with core `ticket_answers.side`, plus `internal` for staff-only notes. */
export type TicketAnswerSide = 'user' | 'admin' | 'internal';

@Entity('ticket_answers')
export class TicketAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_TICKET_ANSWERS_TICKET_ID')
  @Column({ name: 'ticket_id', type: 'int' })
  ticketId: number;

  @ManyToOne(() => Ticket, (ticket) => ticket.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ type: 'varchar', length: 16 })
  side: TicketAnswerSide;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'file_url', type: 'varchar', nullable: true })
  fileUrl: string | null;

  @Column({ name: 'file_mime_type', type: 'varchar', length: 128, nullable: true })
  fileMimeType: string | null;

  @Column({ name: 'sender_admin_id', type: 'int', nullable: true })
  senderAdminId: number | null;

  @Column({ name: 'sender_admin_name', type: 'varchar', length: 255, nullable: true })
  senderAdminName: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
