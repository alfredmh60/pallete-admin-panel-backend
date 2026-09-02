import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { StaffConversation } from './staff-conversation.entity';
import { Admins } from './admins.entity';

@Entity('staff_conversation_members')
@Unique('UQ_staff_conversation_members_pair', ['conversationId', 'adminId'])
export class StaffConversationMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'conversation_id' })
  conversationId: number;

  @ManyToOne(() => StaffConversation, (conversation) => conversation.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: StaffConversation;

  @Column({ name: 'admin_id' })
  adminId: number;

  @ManyToOne(() => Admins, (admin) => admin.staffConversationMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'admin_id' })
  admin: Admins;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ name: 'last_read_at', nullable: true, type: 'timestamp' })
  lastReadAt: Date;
}
