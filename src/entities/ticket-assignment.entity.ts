import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Ticket } from './ticket.entity';
import { Admins } from './admins.entity';

@Entity('ticket_assignments')
export class TicketAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_TICKET_ASSIGNMENTS_TICKET_ID')
  @Column({ name: 'ticket_id', type: 'int' })
  ticketId: number;

  @ManyToOne(() => Ticket, (ticket) => ticket.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ name: 'admin_id', type: 'int' })
  adminId: number;

  @ManyToOne(() => Admins, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admins;

  @Column({ name: 'admin_name', type: 'varchar', length: 255, nullable: true })
  adminName: string | null;

  @Column({ name: 'assigned_at', type: 'timestamptz', default: () => 'now()' })
  assignedAt: Date;

  @Column({ name: 'unassigned_at', type: 'timestamptz', nullable: true })
  unassignedAt: Date | null;

  @Column({ name: 'assigned_by_admin_id', type: 'int', nullable: true })
  assignedByAdminId: number | null;
}
