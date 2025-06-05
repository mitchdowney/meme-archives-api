import { arrayBufferToExpressMulterFile } from '../lib/multer'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp')

export async function createMaxResizedImage(originalImageFile: Express.Multer.File) {
  return new Promise<Express.Multer.File>((resolve, reject) => {
    (async () => {
      try {
        const noBorderedImageBuffer = originalImageFile?.buffer
        const { width: originalWidth, height: originalHeight } = await sharp(noBorderedImageBuffer).metadata()

        let processedBuffer: Buffer | null = null
        const filename = 'temp-preview.png'
        const mimetype = 'image/png'

        if (originalWidth > 2000) {
          processedBuffer = await sharp(noBorderedImageBuffer)
            .resize({ width: 2000 })
            .png({
              compressionLevel: 5,
              quality: 90,
              adaptiveFiltering: true,
              effort: 9
            })
            .toBuffer()
        } else if (originalHeight > 2000) {
          processedBuffer = await sharp(noBorderedImageBuffer)
            .resize({ height: 2000 })
            .png({
              compressionLevel: 5,
              quality: 90,
              adaptiveFiltering: true,
              effort: 9
            })
            .toBuffer()
        } else {
          const isPng = originalImageFile.mimetype === 'image/png'
          if (!isPng) {
            // Convert to PNG with compression
            processedBuffer = await sharp(noBorderedImageBuffer)
              .png({
                compressionLevel: 5,
                quality: 90,
                adaptiveFiltering: true,
                effort: 9
              })
              .toBuffer()
          } else {
            // Already PNG, just check size
            resolve(originalImageFile)
            return
          }
        }

        if (processedBuffer) {
          const finalImageFile = arrayBufferToExpressMulterFile(processedBuffer, filename, mimetype)
          resolve(finalImageFile)
        } else {
          resolve(originalImageFile)
        }
      } catch (error) {
        reject(error)
      }
    })()
  })
}
