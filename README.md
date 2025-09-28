# Rexus Gaming Rewards Project

A comprehensive gaming peripheral rewards application built with React, TypeScript, and modern web technologies.

## Project Overview

This project is a loyalty rewards system for Rexus gaming peripherals, featuring:

- **Point-based Redemption System** - Users can redeem gaming peripherals using loyalty points
- **Admin Dashboard** - Complete order, inventory, and user management system
- **User Profiles** - Achievement tracking, order history, and profile management
- **Order Tracking** - Real-time shipping and delivery tracking with detailed timelines
- **Product Catalog** - Detailed product specifications, reviews, and ratings
- **Warehouse Management** - Inbound/outbound inventory operations
- **Affiliate Program** - Referral system with commission tracking

## Technologies Used

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript development
- **React 18** - Modern React with hooks and context
- **shadcn/ui** - High-quality component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icon library

## Getting Started

### Prerequisites

- Node.js (16.0 or later)
- npm or yarn package manager

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd rexus-project

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Building for Production

```sh
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (Header, etc.)
│   ├── sections/       # Page sections
│   └── ui/            # shadcn/ui components
├── pages/             # Application pages
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
└── assets/            # Static assets
```

## Key Features

### User Features
- **Product Browsing** - Browse gaming peripherals with detailed specifications
- **Points System** - Earn and redeem loyalty points
- **Order Management** - Track orders with real-time shipping updates
- **Profile Management** - Comprehensive user profiles with achievements
- **Mobile Responsive** - Optimized for all device sizes

### Admin Features  
- **Dashboard Overview** - Sales analytics and key metrics
- **Order Management** - Process and track all customer orders
- **Inventory Control** - Manage product stock and warehouse operations
- **User Management** - Monitor user accounts and activity
- **Affiliate Tracking** - Manage referral programs and commissions

## Development

The project uses hot module reloading for fast development. All changes are automatically reflected in the browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for Rexus Gaming.
