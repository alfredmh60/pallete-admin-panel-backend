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
 import { Role } from './role.entity';
// import { Log } from './log.entity';
// import { TicketAssignment } from './ticket-assignment.entity';
// import { AdminDepartment } from './admin-department.entity';
// import { AdminTicket } from './admin-ticket.entity';

@Entity('admins')
export class Admins {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ name: 'role_id', nullable: true })
  roleId: number;



  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'reset_token', nullable: true })
  resetToken: string;

  @Column({ name: 'reset_token_expiry', nullable: true, type: 'timestamp' })
  resetTokenExpiry: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @ManyToOne(() => Admins, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: Admins;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true, type: 'timestamp' })
  deletedAt: Date;



  @ManyToOne(() => Role, (role) => role.admins, { 
    nullable: true,
    eager: false // این مهمه
  })
  @JoinColumn({ name: 'role_id' }) // این خط حتماً باید باشه
  role: Role;

  // Relations
  // @OneToMany(() => Log, (log) => log.admin)
  // logs: Log[];

//   @OneToMany(() => TicketAssignment, (assignment) => assignment.admin)
//   ticketAssignments: TicketAssignment[];

//   @OneToMany(() => AdminDepartment, (adminDept) => adminDept.admin)
//   departments: AdminDepartment[];

//   @OneToMany(() => AdminTicket, (ticket) => ticket.sender)
//   sentAdminTickets: AdminTicket[];

//   @OneToMany(() => AdminTicket, (ticket) => ticket.receiver)
//   receivedAdminTickets: AdminTicket[];
}