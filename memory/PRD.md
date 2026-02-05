# Fluxy Logistique Backend - PRD

## Project Overview
Backend API for Fluxy Logistique - a logistics/delivery management platform for heavy items.

## Tech Stack
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Emergent integrated)
- **Authentication**: Session-based tokens

## Core Features Implemented
- ✅ User Authentication (Admin, Business, Driver)
- ✅ Session management with tokens
- ✅ Business registration and profile management
- ✅ Driver registration and validation workflow
- ✅ Delivery request creation and management
- ✅ Admin dashboard with statistics
- ✅ Pricing rules management
- ✅ Commission settings
- ✅ Push notification support (Expo)
- ✅ Admin panel (HTML)

## API Endpoints
### Auth
- POST /api/auth/admin/login
- POST /api/auth/business/register
- POST /api/auth/business/login
- POST /api/auth/driver/register
- POST /api/auth/driver/login
- GET /api/auth/me
- POST /api/auth/logout

### Business
- PUT /api/business/profile
- POST /api/business/delivery
- GET /api/business/deliveries

### Driver
- PUT /api/driver/profile
- GET /api/driver/available-jobs
- GET /api/driver/my-jobs
- POST /api/driver/accept/{delivery_id}
- POST /api/driver/confirm-pickup/{delivery_id}
- POST /api/driver/confirm-delivery/{delivery_id}
- POST /api/driver/cancel/{delivery_id}

### Admin
- GET /api/admin/dashboard
- GET /api/admin/deliveries
- GET /api/admin/drivers
- GET /api/admin/businesses
- GET /api/admin/pricing
- POST /api/admin/pricing
- PUT /api/admin/commission

## Configuration
- DB_NAME: fluxy_logistique
- CORS: * (for mobile app)
- Admin: admin@fluxylogistique.com / admin123

## Deployment
- API URL: https://fluxy-mongo-api.preview.emergentagent.com
- Custom domain target: api.fluxy-logistique.com

## Date: February 2026
