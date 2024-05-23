import { requiresAuth } from 'express-openid-connect'
import { Unauthorized } from 'http-errors'

export const authRequire = (req, res, next) => {
  try {
    requiresAuth()(req, res, error => {
      if (error) {
        const authHeader = req.headers.authorization
        const adminSecretKey = process.env.ADMIN_SECRET_KEY

        if (authHeader && adminSecretKey?.length >= 32 && authHeader === adminSecretKey) {
          next()
        } else {
          throw new Unauthorized()
        }
      } else {
        next()
      }
    });
  } catch (error) {
    next(error)
  }
}
