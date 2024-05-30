/* eslint-disable indent */
import { ViewEntity, ViewColumn } from 'typeorm'
import { ImageType } from '../types'

@ViewEntity({
  name: 'image_random_order_materialized_view',
  expression: `
    SELECT * FROM image_random_order_materialized_view
  `,
})
export class ImageRandomOrderMaterializedView {
  @ViewColumn()
  id: number

  @ViewColumn()
  type: ImageType

  @ViewColumn()
  has_animation: boolean

  @ViewColumn()
  has_border: boolean

  @ViewColumn()
  has_no_border: boolean

  @ViewColumn()
  has_video: boolean
}
