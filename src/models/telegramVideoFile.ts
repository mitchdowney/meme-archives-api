/* eslint-disable indent */
import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToOne, JoinColumn } from 'typeorm'
import { Image } from './image'

@Entity('telegram_video_file', { schema: 'public' })
@Unique(['telegram_bot_user_name', 'telegram_cached_file_id'])
export class TelegramVideoFile {
  @PrimaryGeneratedColumn()
  id: number

  @OneToOne(() => Image, { nullable: false })
  @JoinColumn({ name: 'image_id' })
  image: Image

  @Column({ type: 'varchar', length: 2083 })
  telegram_bot_user_name: string

  @Column({ type: 'varchar', length: 2083 })
  telegram_cached_file_id: string
}
