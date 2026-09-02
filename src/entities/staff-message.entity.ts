import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StaffConversation } from './staff-conversation.entity';
import { Admins } from './admins.entity';

@Entity('staff_messages')
export class StaffMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'conversation_id' })
  conversationId: number;

  @ManyToOne(() => StaffConversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: StaffConversation;

  @Column({ name: 'sender_id' })
  senderId: number;

  @ManyToOne(() => Admins, (admin) => admin.staffMessages)
  @JoinColumn({ name: 'sender_id' })
  sender: Admins;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
