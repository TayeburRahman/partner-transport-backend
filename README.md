# Xmoveit Backend

A robust Node.js and Express REST API for managing logistics services, partner applications, real-time communication, and payment processing.

## Project Description

Xmoveit Backend powers a logistics platform that connects users with transport partners. It handles service auctions, bid management, real-time messaging, payment processing (Stripe & PayPal), push notifications, and an admin dashboard for overseeing operations.

## Features

- **User Authentication** - JWT-based authentication with role-based access control (User, Partner, Admin)
- **Partner Application System** - Partner registration with vehicle documentation and verification
- **Admin Approval System** - Admin dashboard for managing users, partners, and services
- **Service Auction & Bidding** - Users post services; partners place competitive bids
- **Real-time Messaging** - Socket.IO powered chat between users, partners, and admins
- **Payment Processing** - Stripe and PayPal integration with refund support
- **Email Notifications** - Transactional emails via SendGrid
- **Push Notifications** - Mobile push notifications via OneSignal
- **File Uploads** - Image uploads managed through Cloudinary
- **Location Tracking** - Real-time partner location updates
- **Phone Verification** - SMS verification via Twilio

## Tech Stack

| Technology  | Purpose              |
|-------------|----------------------|
| Node.js     | Runtime environment  |
| Express.js  | Web framework        |
| MongoDB     | Database             |
| Mongoose    | ODM                  |
| JWT         | Authentication       |
| Socket.IO   | Real-time communication |
| SendGrid    | Email service        |
| Stripe      | Payment processing   |
| PayPal      | Payment processing   |
| Cloudinary  | File storage         |
| OneSignal   | Push notifications   |
| Twilio      | SMS verification     |

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd partner-transport-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run in development
npm run dev

# Run in production
npm start
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
NODE_ENV=development
PORT=5050
BASE_URL=http://localhost:5050

# Database
MONGO_URL=mongodb://localhost:27017/xmoveit
DB_PASSWORD=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=

# SMTP / SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SERVICE=SendGrid
SMTP_MAIL=
SMTP_PASSWORD=
SENDGRID_API_KEY=
SEND_GRIDAPI_KEY=
FORM_EMAIL=
SERVICE_NAME=Xmoveit

# Cloudinary
CLOUD_NAME=
API_KEY=
API_SECRET=
CLOUDINARY_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
ENDPOINT_SECRET_WEBHOOK_STRIPE=

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET_KEY=
PAYPAL_MODE=sandbox

# OneSignal
ONESIGNAL_APP_ID=
ONESIGNAL_API_KEY=
ONESIGNAL_URL=

# Twilio
ACCOUNT_NUMBER=
AUTH_TOKEN=
PHONE_NUMBER=
```

## API Endpoints

### Authentication
| Method | Endpoint                | Description            |
|--------|-------------------------|------------------------|
| POST   | `/auth/login`           | User/Partner login     |
| POST   | `/auth/register`        | User registration      |
| POST   | `/auth/forgot-password` | Password reset request |
| POST   | `/auth/verify-otp`      | OTP verification       |

### Services
| Method | Endpoint                          | Description                  |
|--------|-----------------------------------|------------------------------|
| POST   | `/services/create`                | Create a new service post    |
| GET    | `/services/details/:id`           | Get service details          |
| GET    | `/services/review-partner`        | Get partner reviews          |
| POST   | `/services/review`                | Submit a review              |
| PATCH  | `/services/update-status`         | Update service status        |
| POST   | `/services/upload-status-image`   | Upload status images         |

### Bids
| Method | Endpoint                | Description            |
|--------|-------------------------|------------------------|
| POST   | `/bids/create`          | Place a bid            |
| GET    | `/bids/partner-profile` | Get partner bid profile|

### Payments
| Method | Endpoint                      | Description        |
|--------|-------------------------------|--------------------|
| POST   | `/payment/stripe/pay`         | Stripe payment     |
| PATCH  | `/payment/stripe/refund_pay`  | Stripe refund      |
| POST   | `/payment/paypal/pay`         | PayPal payment     |
| PATCH  | `/payment/paypal/refund_pay`  | PayPal refund      |

### Dashboard (Admin)
| Method | Endpoint                              | Description              |
|--------|---------------------------------------|--------------------------|
| GET    | `/dashboard/get_all_partner`          | List all partners        |
| GET    | `/dashboard/get_partner_details`      | Get partner details      |
| PATCH  | `/dashboard/block-unblock-user-partner-admin` | Block/unblock user |
| DELETE | `/dashboard/delete_partner`           | Delete a partner         |
| POST   | `/dashboard/notice/partner`           | Send notice to partner   |

### Messages
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | `/message/get-message`    | Get conversation messages |

### Socket Events
| Event                    | Description                  |
|--------------------------|------------------------------|
| `new-message`            | Send a new message           |
| `new-message/{userId}`   | Receive real-time messages   |
| `new-message-service`    | Service-related messaging    |
| `partner-location`       | Partner location updates     |
| `active-admin`           | Active admin tracking        |
| `notification`           | Real-time notifications      |

## Folder Structure

```
src/
├── app/
│   └── modules/
│       ├── admin/          # Admin management
│       ├── auth/           # Authentication & authorization
│       ├── bid/            # Bidding system & reviews
│       ├── category/       # Service categories
│       ├── dashboard/      # Admin dashboard
│       ├── logs-dashboard/ # Activity logs
│       ├── manage/         # General management
│       ├── message/        # Chat & conversations
│       ├── notification/   # Push notifications
│       ├── one-signal/     # OneSignal integration
│       ├── partner/        # Partner management
│       ├── payment/        # Stripe & PayPal payments
│       ├── phone-verify/   # Phone verification (Twilio)
│       ├── services/       # Service posts & auctions
│       ├── support/        # Support system
│       ├── user/           # User management
│       └── variable/       # App variables & config
├── builder/                # Query builders
├── config/                 # Environment configuration
├── connection/             # Database connection
├── errors/                 # Error handling
├── helpers/                # Utility helpers
├── mails/                  # Email templates
├── shared/                 # Shared middleware & utilities
├── socket/                 # Socket.IO setup & handlers
├── utils/                  # Enums & constants
├── app.js                  # Express app setup
└── server.js               # Server entry point
```

## Scripts

```bash
npm start           # Start production server
npm run dev         # Start development server (nodemon)
npm run lint:check  # Run ESLint checks
npm run lint:fix    # Auto-fix lint issues
npm run prettier:fix    # Format code with Prettier
npm run prettier:check  # Check code formatting
```

## Author

**Tayeb Rayhan**
- Email: tayebrayhan101@gmail.com

## License

This project is licensed under the ISC License.
