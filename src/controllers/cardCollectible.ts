import appDataSource from '../db'
import { CardCollectible, CardCollectibleEditionType } from '../models/cardCollectible'

export const getCardCollectible = async (id: number): Promise<CardCollectible | null> => {
  const cardCollectiblesRepo = appDataSource.getRepository(CardCollectible)
  const cardCollectible = await cardCollectiblesRepo.findOneBy({ id })
  return cardCollectible
}

type CreateCardCollectibleDto = {
  name: string
  number: number
  rarity: number
  description: string
  artistId: number
  cardCollectionSetId: number
}

export const createCardCollectible = async (createCardCollectibleDto: CreateCardCollectibleDto) => {
  const { name, number, rarity, description, artistId,
    cardCollectionSetId } = createCardCollectibleDto
  
  const editions = [
    CardCollectibleEditionType.Normal,
    CardCollectibleEditionType.Foil,
    CardCollectibleEditionType.Gold
  ]

  const cardCollectiblesRepo = appDataSource.getRepository(CardCollectible)
  
  const cardCollectibles = await Promise.all(
    editions.map(edition =>
      cardCollectiblesRepo.save({
        name,
        number,
        rarity,
        edition,
        description,
        artistId,
        cardCollectionSetId,
      })
    )
  )

  return cardCollectibles
}

export const updateCardCollectible = async (id: number,
  updateCardCollectibleDto: Partial<CreateCardCollectibleDto>): Promise<CardCollectible> => {
  const cardCollectiblesRepo = appDataSource.getRepository(CardCollectible)
  
  let cardCollectible = await cardCollectiblesRepo.findOneBy({ id })
  if (!cardCollectible) {
    throw new Error(`CardCollectible with ID ${id} not found`)
  }

  cardCollectible = { ...cardCollectible, ...updateCardCollectibleDto }
  await cardCollectiblesRepo.save(cardCollectible)

  return cardCollectible
}
