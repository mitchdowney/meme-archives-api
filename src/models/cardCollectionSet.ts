/* eslint-disable indent */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { CardCollection } from './cardCollection'

@Entity('CardCollectionSet')
export class CardCollectionSet {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 255 })
  name: string

  @Column({ length: 255, unique: true })
  slug: string

  @ManyToOne(() => CardCollection, (cardCollection) => cardCollection.cardCollectionSets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cardCollectionId' })
  cardCollection: CardCollection

  @Column()
  cardCollectionId: number

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  dateCreated: Date

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  dateUpdated: Date
}
