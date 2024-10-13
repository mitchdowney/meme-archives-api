import { Equal } from 'typeorm'
import appDataSource from '../db'
import { handleThrowError } from '../lib/errors'
import { Image } from '../models/image'
import { TelegramVideoFile } from '../models/telegramVideoFile'

export async function getTelegramVideoFile(telegram_chat_id: string, image_id: number) {
  try {
    const telegramVideoFileRepo = appDataSource.getRepository(TelegramVideoFile)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const telegramVideoFile: any = await telegramVideoFileRepo.findOne({
      where: {
        telegram_chat_id: Equal(telegram_chat_id),
        image: Equal(image_id)
      }
    })

    return telegramVideoFile
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function createTelegramVideoFileIfNotExists(telegram_chat_id: string, image_id: number, telegram_cached_file_id: string) {
  try {
    const telegramVideoFileRepo = appDataSource.getRepository(TelegramVideoFile)
    const imageRepo = appDataSource.getRepository(Image)

    let telegramVideoFile = await telegramVideoFileRepo.findOne({
      where: {
        telegram_chat_id: Equal(telegram_chat_id),
        image: Equal(image_id)
      }
    })

    if (!telegramVideoFile) {
      const image = await imageRepo.findOne({ where: { id: Equal(image_id) } })
      if (!image) {
        throw new Error(`Image with id ${image_id} not found`)
      }

      telegramVideoFile = new TelegramVideoFile()
      telegramVideoFile.telegram_chat_id = telegram_chat_id
      telegramVideoFile.image = image
      telegramVideoFile.telegram_cached_file_id = telegram_cached_file_id

      await telegramVideoFileRepo.save(telegramVideoFile)
    }

    return telegramVideoFile
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function updateTelegramVideoFile(telegram_chat_id: string, image_id: number, new_telegram_cached_file_id: string) {
  try {
    const telegramVideoFileRepo = appDataSource.getRepository(TelegramVideoFile)

    const telegramVideoFile = await telegramVideoFileRepo.findOne({
      where: {
        telegram_chat_id: Equal(telegram_chat_id),
        image: Equal(image_id)
      }
    })

    if (telegramVideoFile) {
      telegramVideoFile.telegram_cached_file_id = new_telegram_cached_file_id
      await telegramVideoFileRepo.save(telegramVideoFile)
    } else {
      throw new Error(`TelegramVideoFile with chat_id ${telegram_chat_id} and image_id ${image_id} not found`)
    }

    return telegramVideoFile
  } catch (error: unknown) {
    handleThrowError(error)
  }
}
