import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Ticket } from './ticket.entity';
import { Admins } from './admins.entity';

@Entity('ticket_assignments')
export class TicketAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ticket_id' })
  ticketId: number;

  @ManyToOne(() => Ticket, (ticket) => ticket.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ name: 'admin_id' })
  adminId: number;

  @ManyToOne(() => Admins, (admin) => admin.ticketAssignments)
  @JoinColumn({ name: 'admin_id' })
  admin: Admins;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  @Column({ name: 'unassigned_at', nullable: true, type: 'timestamp' })
  unassignedAt: Date;
}