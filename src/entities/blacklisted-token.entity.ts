import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('blacklisted_tokens')
@Index(['token'], { unique: true })
@Index(['expiresAt'])
export class BlacklistedToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}