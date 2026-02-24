import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn } from 'typeorm';

import { AdminDepartment } from './admin-department.entity';
import { Ticket } from './ticket.entity';

@Entity('ticket_departments')
export class TicketDepartment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => Ticket, (ticket) => ticket.department)
  tickets: Ticket[];

  @OneToMany(() => AdminDepartment, (adminDept) => adminDept.department)
  admins: AdminDepartment[];
}