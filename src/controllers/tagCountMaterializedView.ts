import { TagCountMaterializedView } from '../models/tagCountMaterializedView'
import appDataSource from '../db'
import { handleLogError } from '../lib/errors'

export async function refreshTagCountMaterializedView() {
  try {
    await appDataSource.manager.query('REFRESH MATERIALIZED VIEW tag_count_materialized_view')
  } catch (error) {
    handleLogError(`refreshTagCountMaterializedView error: ${error}`)
  }
}

export async function queryTagCountMaterializedView() {
  try {
    const tagCountMaterializedViewRepo = appDataSource.getRepository(TagCountMaterializedView)
    const result = await tagCountMaterializedViewRepo
      .createQueryBuilder('materializedView')
      .getOne()
    return result?.tag_count ? result.tag_count : 0
  } catch (error) {
    handleLogError(`queryTagCountMaterializedView error: ${error}`)
  }
}
