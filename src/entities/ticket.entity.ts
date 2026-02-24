import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketDepartment } from './ticket-department.entity';
import { Admins } from './admins.entity';


import { TicketMessage } from './ticket-message.entity';
import { TicketAssignment } from './ticket-assignment.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'department_id' })
  departmentId: number;

  @ManyToOne(() => TicketDepartment, (department) => department.tickets)
  @JoinColumn({ name: 'department_id' })
  department: TicketDepartment;

  @Column({ default: 'new' })
  status: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'customer_name', nullable: true })
  customerName: string;

  @Column({ name: 'customer_email', nullable: true })
  customerEmail: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'closed_at', nullable: true, type: 'timestamp' })
  closedAt: Date;

  @Column({ name: 'closed_by', nullable: true })
  closedBy: number;

  @ManyToOne(() => Admins, { nullable: true })
  @JoinColumn({ name: 'closed_by' })
  closer: Admins;

  // Relations
  @OneToMany(() => TicketMessage, (message) => message.ticket)
  messages: TicketMessage[];

  @OneToMany(() => TicketAssignment, (assignment) => assignment.ticket)
  assignments: TicketAssignment[];
}