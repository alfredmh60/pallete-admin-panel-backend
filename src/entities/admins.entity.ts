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
import { Log } from './log.entity';
import { StaffConversation } from './staff-conversation.entity';
import { StaffConversationMember } from './staff-conversation-member.entity';
import { StaffMessage } from './staff-message.entity';

@Entity('admins')
export class Admins {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  phone: string | null;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash: string | null;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ name: 'role_id', nullable: true })
  roleId: number;

  @Column({ name: 'role_name', nullable: true })
  roleName: string;

  @ManyToOne(() => Role, (role) => role.admins)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'otp_code', type: 'varchar', nullable: true })
  otpCode: string | null;

  @Column({ name: 'otp_expires_at', nullable: true, type: 'timestamp' })
  otpExpiresAt: Date | null;

  @Column({ name: 'otp_requested_at', nullable: true, type: 'timestamp' })
  otpRequestedAt: Date | null;

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

  @OneToMany(() => Log, (log) => log.admin)
  logs: Log[];

  @OneToMany(() => StaffConversation, (conversation) => conversation.creator)
  createdStaffConversations: StaffConversation[];

  @OneToMany(() => StaffConversationMember, (member) => member.admin)
  staffConversationMemberships: StaffConversationMember[];

  @OneToMany(() => StaffMessage, (message) => message.sender)
  staffMessages: StaffMessage[];
}
