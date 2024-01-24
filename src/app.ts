// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

import * as express from "express"
import { Request, Response } from "express"
import { initAppDataSource } from "./db"
import { createImage, deleteImage, getImage, getImagesByTagId, searchImages, updateImage } from "./controllers/image"
import { parsePageQuery } from "./middleware/parsePageQuery"
import { PageRequest, PathIntIdRequest } from "./types"
import { parsePathIntId } from "./middleware/parsePathIntId"
import { getAllTags } from "./controllers/tag"

const port = 4321

const startApp = async () => {
  await initAppDataSource()

  const app = express()
  app.use(express.json())

  app.get("/images", parsePageQuery, async function (req: PageRequest, res: Response) {
    try {
      const { page } = req.locals
      const data = await searchImages({ page })
      res.status(200)
      res.send(data)
    } catch (error) {
      res.status(400)
      res.send({ message: error.message })
    }
  })

  app.get("/images/by-tag", parsePageQuery, async function (req: PageRequest, res: Response) {
    try {
      const { id: tagId, page } = req.locals
      const data = await getImagesByTagId({ tagId, page })
      res.status(200)
      res.send(data)
    } catch (error) {
      res.status(400)
      res.send({ message: error.message })
    }
  })

  app.get("/image/:id", parsePathIntId, async function (req: PathIntIdRequest, res: Response) {
    try {
      const { id } = req.locals
      const data = await getImage(id)
      if (!data) {
        res.status(404)
        res.send({ message: 'Image not found' })
      } else {
        res.status(200)
        res.send(data)
      }
    } catch (error) {
      res.status(400)
      res.send({ message: error.message })
    }
  })

  app.delete("/image/:id", parsePathIntId, async function (req: PathIntIdRequest, res: Response) {
    try {
      const { id } = req.locals
      await deleteImage(id)
      res.status(201)
      res.send({ message: 'Image successfully deleted' })
    } catch (error) {
      res.status(400)
      res.send({ message: error.message })
    }
  })

  app.post("/image", async function (req: Request, res: Response) {
    try {
      const { tagTitles = [], title } = req.body
      const data = await createImage({ tagTitles, title })
      res.status(201)
      res.send(data)
    } catch (error) {
      res.status(400)
      res.send({ message: error.message })
    }
  })

  app.patch("/image", async function (req: Request, res: Response) {
    try {
      const { id, tagTitles = [], title } = req.body
      const data = await updateImage({ id, tagTitles, title })
      res.status(201)
      res.send(data)
    } catch (error) {
      res.status(400)
      res.send({ message: error.message })
    }
  })

  app.get("/tags/all", async function (req: Request, res: Response) {
    try {
      const data = await getAllTags()
      res.status(200)
      res.send(data)
    } catch (error) {
      res.status(400)
      res.send({ message: error.message })
    }
  })

  app.listen(port)

  console.log(`App is listening on port ${port}`)
}

(async() => {
  await startApp()
})()
