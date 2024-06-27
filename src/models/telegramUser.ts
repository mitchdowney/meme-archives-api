/* eslint-disable indent */
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('TelegramUser')
export class TelegramUser {
  @PrimaryColumn()
  publicId: string

  @Column({ type: 'integer' })
  privateId: number

  @Column({ length: 255, nullable: true })
  name: string

  @Column({ length: 255, unique: true })
  slug: string

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date
}
