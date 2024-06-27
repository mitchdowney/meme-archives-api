/* eslint-disable indent */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { CardCollectionSet } from './cardCollectionSet'

@Entity('CardCollection')
export class CardCollection {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 255 })
  name: string

  @Column({ length: 255, unique: true })
  slug: string

  @OneToMany(() => CardCollectionSet, (cardCollectionSet) => cardCollectionSet.cardCollection)
  cardCollectionSets: CardCollectionSet[]

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date
}
