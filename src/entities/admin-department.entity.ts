import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Admins } from './admins.entity';
import { TicketDepartment } from './ticket-department.entity';


@Entity('admin_departments')
export class AdminDepartment {
  @PrimaryColumn({ name: 'admin_id' })
  adminId: number;

  @PrimaryColumn({ name: 'department_id' })
  departmentId: number;

  @ManyToOne(() => Admins, (admin) => admin.departments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admins;

  @ManyToOne(() => TicketDepartment, (department) => department.admins, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id' })
  department: TicketDepartment;
}