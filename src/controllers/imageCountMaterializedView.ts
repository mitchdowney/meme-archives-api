import { ImageCountMaterializedView } from '../models/imageCountMaterializedView'
import appDataSource from '../db'
import { handleLogError } from '../lib/errors'

export async function refreshImageCountMaterializedView() {
  try {
    await appDataSource.manager.query('REFRESH MATERIALIZED VIEW image_count_materialized_view')
  } catch (error) {
    handleLogError(`refreshImageCountMaterializedView error: ${error}`)
  }
}

export async function queryImageCountMaterializedView() {
  try {
    const imageCountMaterializedViewRepo = appDataSource.getRepository(ImageCountMaterializedView)
    const result = await imageCountMaterializedViewRepo
      .createQueryBuilder('materializedView')
      .getOne()
    return result?.image_count ? result.image_count : 0
  } catch (error) {
    handleLogError(`queryImageCountMaterializedView error: ${error}`)
  }
}
