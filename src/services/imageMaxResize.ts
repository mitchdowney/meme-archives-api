import { arrayBufferToExpressMulterFile } from '../lib/multer'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp')

export async function createMaxResizedImage(originalImageFile: Express.Multer.File) {
  return new Promise<Express.Multer.File>((resolve, reject) => {
    (async () => {
      try {
        const noBorderedImageBuffer = originalImageFile?.buffer
        const { width: originalWidth, height: originalHeight } = await sharp(noBorderedImageBuffer).metadata()

        if (originalWidth > 2000) {
          const resizedImageBuffer = await sharp(noBorderedImageBuffer)
            .resize({ width: 2000 })
            .toBuffer()
          const finalImageFile = arrayBufferToExpressMulterFile(resizedImageBuffer, 'temp-preview', 'image/png')
          resolve(finalImageFile)
        } else if (originalHeight > 2000) {
          const resizedImageBuffer = await sharp(noBorderedImageBuffer)
            .resize({ height: 2000 })
            .toBuffer()
          const finalImageFile = arrayBufferToExpressMulterFile(resizedImageBuffer, 'temp-preview', 'image/png')
          resolve(finalImageFile)
        } else {
          const isPng = originalImageFile.mimetype === 'image/png'
          let resizedImageBuffer: Buffer
          if (!isPng) {
            resizedImageBuffer = await sharp(noBorderedImageBuffer)
              .png()
              .toBuffer()
          } else {
            resizedImageBuffer = noBorderedImageBuffer
          }
          const finalImageFile = arrayBufferToExpressMulterFile(resizedImageBuffer, 'temp-preview.png', 'image/png')
          resolve(finalImageFile)
        }
      } catch (error) {
        reject(error)
      }
    })()
  })
}
