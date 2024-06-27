import appDataSource from '../db'
import { TelegramUser } from '../models/telegramUser'

type TelegramUserDto = {
  publicId: string
  privateId: number
  name: string
  slug: string
}

export const createTelegramUser = async (telegramUserData: Partial<TelegramUserDto>): Promise<TelegramUser> => {
  const telegramUserRepo = appDataSource.getRepository(TelegramUser)
  const telegramUser = telegramUserRepo.create(telegramUserData)
  await telegramUserRepo.save(telegramUser)
  return telegramUser
}

export const updateTelegramUser = async (
  publicId: string,
  updateData: Partial<TelegramUserDto>
): Promise<TelegramUser> => {
  const telegramUserRepo = appDataSource.getRepository(TelegramUser)

  let telegramUser = await telegramUserRepo.findOneBy({ publicId })
  if (!telegramUser) {
    throw new Error(`TelegramUser with publicId ${publicId} not found`)
  }

  telegramUser = { ...telegramUser, ...updateData }

  await telegramUserRepo.save(telegramUser)

  return telegramUser
}

export const getTelegramUser = async (publicId: string): Promise<TelegramUser | null> => {
  const telegramUserRepo = appDataSource.getRepository(TelegramUser)
  const telegramUser = await telegramUserRepo.findOneBy({ publicId })
  return telegramUser
}
