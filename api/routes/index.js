import express from 'express'
import authRoutes from './auth.routes.js'
import uploadRoutes from './upload.routes.js'
import  categoryStatsRoutes from './category-stats.routes.js'
import productStatsRoutes from './product-stats.routes.js'
import productRoutes from './product.routes.js'
import categoryRoutes from './category.routes.js'

const v1Routes = express.Router()
const router = express.Router()

v1Routes.use('/auth', authRoutes)
v1Routes.use('/upload', uploadRoutes)
v1Routes.use('/category-stats' , categoryStatsRoutes)
v1Routes.use('/product-stats' , productStatsRoutes)
v1Routes.use('/product' , productRoutes)
v1Routes.use('/category' , categoryRoutes)

router.use('/api/v1', v1Routes)

export default router
