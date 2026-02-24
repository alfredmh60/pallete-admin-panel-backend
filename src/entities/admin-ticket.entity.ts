import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Admins } from './admins.entity';

@Entity('admin_tickets')
export class AdminTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'sender_id' })
  senderId: number;

  @ManyToOne(() => Admins)
  @JoinColumn({ name: 'sender_id' })
  sender: Admins;

  @Column({ name: 'receiver_type' })
  receiverType: string;

  @Column({ name: 'receiver_id', nullable: true })
  receiverId: number;

  @ManyToOne(() => Admins, { nullable: true })
  @JoinColumn({ name: 'receiver_id' })
  receiver: Admins;

  @Column({ default: 'unread' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'closed_at', nullable: true, type: 'timestamp' })
  closedAt: Date;

  @Column({ name: 'closed_by', nullable: true })
  closedBy: number;

  @ManyToOne(() => Admins, { nullable: true })
  @JoinColumn({ name: 'closed_by' })
  closer: Admins;
}