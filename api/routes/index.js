import express from 'express'
import authRoutes from './auth.routes.js'
import categoryStatsRoutes from './category-stats.routes.js'
import productStatsRoutes from './product-stats.routes.js'
import productRoutes from './product.routes.js'
import categoryRoutes from './category.routes.js'
import likeRoutes from './like.routes.js'
import businessTypeRoutes from './business-types.routes.js'
import quotationRoutes from './quotation.routes.js'
import serviceQuotationRoutes from './service-quotation.routes.js'
import profileRoutes from './profile.routes.js'
import notificationsRoutes from './notifications.routes.js'
import addressRoutes from './buyer-address.routes.js'
import blogRoutes from './blogs.routes.js'
import invoiceRoutes from './invoice.routes.js'
import orderRoutes from './orders.routes.js'
import reviewRoutes from './review.routes.js'
import careerRoutes from './career.routes.js'
import claimStoreRoutes from './claim-stores.routes.js'
import homePageRoutes from './home-page.routes.js'
import serviceRoutes from './service.routes.js'
import searchRoutes from './search.routes.js'
import sellerRoutes from './seller.routes.js'
import serviceOrderRoutes from './service-orders.routes.js'
import serviceInvoiceRoutes from './service-invoice.routes.js'
import serviceLikes from './service-like.routes.js'
import serviceReviewRoutes from './service-reviews.routes.js'
import cncQuotesRoutes from './cnc-quotes.routes.js'


const v1Routes = express.Router()
const router = express.Router()

v1Routes.use('/auth', authRoutes)
v1Routes.use('/category-stats' , categoryStatsRoutes)
v1Routes.use('/product-stats' , productStatsRoutes)
v1Routes.use('/product' , productRoutes)
v1Routes.use('/category' , categoryRoutes)
v1Routes.use('/like' , likeRoutes)
v1Routes.use('/business-types' , businessTypeRoutes)
v1Routes.use('/quotation' , quotationRoutes)
v1Routes.use('/service-quotation' , serviceQuotationRoutes)
v1Routes.use('/profile' , profileRoutes)
v1Routes.use('/notifications' , notificationsRoutes)
v1Routes.use('/address' , addressRoutes)
v1Routes.use('/blogs', blogRoutes)
v1Routes.use('/invoice' , invoiceRoutes)
v1Routes.use('/orders' ,orderRoutes)
v1Routes.use('/career' , careerRoutes)
v1Routes.use('/review' , reviewRoutes)
v1Routes.use('/claim-stores' , claimStoreRoutes)
v1Routes.use('/home-page', homePageRoutes)
v1Routes.use('/service', serviceRoutes)
v1Routes.use('/search', searchRoutes)
v1Routes.use('/seller', sellerRoutes)
v1Routes.use('/service-orders', serviceOrderRoutes)
v1Routes.use('/service-invoice', serviceInvoiceRoutes)
v1Routes.use('/service-like', serviceLikes)
v1Routes.use('/service-review', serviceReviewRoutes)
v1Routes.use('/cnc-quotes', cncQuotesRoutes)





router.use('/api/v1', v1Routes)

export default router
