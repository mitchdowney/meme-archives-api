import { requiresAuth } from 'express-openid-connect'
import { Unauthorized } from 'http-errors'

export const authRequire = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const adminSecretKey = process.env.ADMIN_SECRET_KEY

    if (authHeader && adminSecretKey?.length >= 32 && authHeader === adminSecretKey) {
      next()
    } else {
      requiresAuth()(req, res, error => {
        if (error) {
          throw new Unauthorized()
        } else {
          next()
        }
      })
    }
  } catch (error) {
    console.log('error', error)
    next(error)
  }
}
