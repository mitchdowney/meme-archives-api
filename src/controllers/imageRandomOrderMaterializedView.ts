import { In } from 'typeorm'
import appDataSource from '../db'
import { handleLogError, handleThrowError } from '../lib/errors'
import { getPaginationQueryParams } from '../lib/pagination'
import { Image } from '../models/image'
import { ImageRandomOrderMaterializedView } from '../models/imageRandomOrderMaterializedView'
import { ImageMediumType, ImageType } from '../types'
import { getImageMediumTypesQueryColumn, getImageTypesArray } from './image'
import { ImageArtist } from '../models/imageArtist'

export async function refreshImageRandomOrderMaterializedView() {
  try {
    await appDataSource.manager.query('REFRESH MATERIALIZED VIEW image_random_order_materialized_view')
  } catch (error) {
    handleLogError(`refreshImageRandomOrderMaterializedView error: ${error}`)
  }
}

export async function queryImageRandomOrderMaterializedView(page: number, imageType: ImageType, imageMediumType: ImageMediumType): Promise<Image[]> {
  try {
    const imageRandomOrderMaterializedViewRepo = appDataSource.getRepository(ImageRandomOrderMaterializedView)
    const paginationParams = getPaginationQueryParams(page)

    const whereType = getImageTypesArray(imageType)

    let query = imageRandomOrderMaterializedViewRepo
      .createQueryBuilder('image_random_order_materialized_view')
      .select('image_random_order_materialized_view.id')
      .skip(paginationParams.skip)
      .take(paginationParams.take)

    if (whereType.length > 0) {
      query = query.where('image_random_order_materialized_view.type IN (:...types)', { types: whereType })
    }

    const whereMediumType = getImageMediumTypesQueryColumn(imageMediumType)
    if (whereMediumType) {
      query = query.andWhere(`image_random_order_materialized_view.${whereMediumType} IS TRUE`)
    }

    const ids = await query.getRawMany()

    const imageIds = ids.map(row => row.image_random_order_materialized_view_id)

    const imageRepo = appDataSource.getRepository(Image)
    let images = await imageRepo.find({
      where: {
        id: In(imageIds)
      },
      relations: ['artists', 'tags']
    })

    images = images.sort((a, b) => imageIds.indexOf(a.id) - imageIds.indexOf(b.id))

    return images
  } catch (error) {
    handleThrowError(`queryImageRandomOrderMaterializedView error: ${error}`)
  }
}

export async function queryRandomImagesByArtistPaginated(page: number, artist_id: number): Promise<[Image[], number]> {
  try {
    const imageArtistJoinRepo = appDataSource.getRepository(ImageArtist)
    const imageRandomOrderMaterializedViewRepo = appDataSource.getRepository(ImageRandomOrderMaterializedView)
    const imageRepo = appDataSource.getRepository(Image)

    const imageArtistJoins = await imageArtistJoinRepo.find({ where: { artist_id } })
    const imageIds = imageArtistJoins.map(join => join.image_id)

    if (imageIds.length > 0) {
      const imageCount = imageIds?.length
  
      const imagesInView = await imageRandomOrderMaterializedViewRepo
        .createQueryBuilder('image_random_order_materialized_view')
        .select('image_random_order_materialized_view.id')
        .where('image_random_order_materialized_view.id IN (:...ids)', { ids: imageIds })
        .getRawMany()
  
      const viewImageIds = imagesInView.map(row => row.image_random_order_materialized_view_id)
  
      const paginationParams = getPaginationQueryParams(page)
  
      const paginatedImageIds = viewImageIds.slice(paginationParams.skip, paginationParams.skip + paginationParams.take)
  
      let images = await imageRepo.find({
        where: {
          id: In(paginatedImageIds)
        },
        relations: ['artists', 'tags']
      })
  
      images = images.sort((a, b) => paginatedImageIds.indexOf(a.id) - paginatedImageIds.indexOf(b.id))
  
      return [images, imageCount]
    } else {
      return [[], 0]
    }
  } catch (error) {
    handleThrowError(`queryImagesByArtistPaginated error: ${error}`)
  }
}
