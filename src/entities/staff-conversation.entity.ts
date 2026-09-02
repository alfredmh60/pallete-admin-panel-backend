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
import { Admins } from './admins.entity';
import { StaffConversationMember } from './staff-conversation-member.entity';
import { StaffMessage } from './staff-message.entity';

export type StaffConversationType = 'direct' | 'group';

@Entity('staff_conversations')
export class StaffConversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'direct' })
  type: StaffConversationType;

  @Column({ nullable: true })
  title: string;

  @Column({ name: 'created_by' })
  createdBy: number;

  @ManyToOne(() => Admins)
  @JoinColumn({ name: 'created_by' })
  creator: Admins;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => StaffConversationMember, (member) => member.conversation)
  members: StaffConversationMember[];

  @OneToMany(() => StaffMessage, (message) => message.conversation)
  messages: StaffMessage[];
}
