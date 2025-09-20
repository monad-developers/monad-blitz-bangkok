# 🐋 Manorch - Trading Signals App Demo

A sleek, modern trading signals app that combines social features with trading insights. Follow the smart money and get real-time signals from verified whales.

## Features

### 📱 Core Screens

- **Feed Page**: A list of Signal Cards showing recent trades from verified traders
- **Signal Details Page**: Detailed view with actor profile and trade information
- **Settings Page**: Customizable filters and notification preferences
- **Copy Trade Modal**: One-click trade copying with slippage controls
- **Share Alpha Card**: Social sharing functionality for Farcaster

### 🎨 Design Features

- **Dark Theme**: Professional dark background (#0B132B) with lime accents (#C7F284)
- **Mobile-First**: Responsive design that scales from mobile to web
- **Crypto-Native**: Emoji badges (🐋 ✅ ⚡ 🔕) for a playful but clean feel
- **Modern UI**: Rounded cards with 16px radius and soft shadows
- **Typography**: Inter font family for clean, readable text

### 🔧 Technical Features

- **Real-time Data**: Integration with Redis for user data and trade signals
- **TypeScript**: Full type safety with proper interfaces
- **Tailwind CSS**: Utility-first styling with custom theme
- **Farcaster Integration**: Built as a Farcaster miniapp
- **Responsive Design**: Works on all screen sizes

## Components

### SignalCard

Displays trade information with:

- User avatar and verification badges
- Trade summary (token swap details)
- Performance metrics (PnL, winrate, followers)
- Action buttons (Copy Trade, Details)

### UserProfile

Actor profile header showing:

- Whale badges and verification status
- Performance statistics
- Follow/unfollow controls
- Share and mute options

### CopyTradeModal

Trade execution interface with:

- Token pair visualization
- Amount input with live calculations
- Slippage tolerance settings
- Confirmation flow

### SettingsPage

User preferences including:

- Filter controls (minimum notional, verified only, whales only)
- Notification toggles (in-app, Discord, Telegram)
- Follow management
- Save/load preferences

### ShareAlphaCard

Social sharing with:

- Preview card generation
- Farcaster integration
- Customizable sharing options

## Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Set Environment Variables**

   ```bash
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   ```

3. **Run Development Server**

   ```bash
   npm run dev
   ```

4. **Access the App**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Data Structure

### User Interface

```typescript
interface User {
  fid: number
  username: string
  displayName: string
  wallet: string
  verified: boolean
  whale_score: number
  followers: number
  winrate_30d: number
  pnl_30d: number
}
```

### Trade Interface

```typescript
interface Trade {
  id: string
  tokenIn: string
  tokenOut: string
  amountIn: number
  amountOut: number
  timestamp: Date
  pnl: number
  txHash: string
}
```

## Customization

### Theme Colors

- Primary Dark: `#0B132B`
- Accent Lime: `#C7F284`
- Gray Scale: `#1A2332` to `#9AA4AA`

### Typography

- Font Family: Inter (Google Fonts)
- Weights: 300, 400, 500, 600, 700

### Components

All components are located in `/components/Manorch/` and can be easily customized or extended.

## Integration Points

- **Redis**: User data and trade signals storage
- **Farcaster**: Social features and sharing
- **Trading APIs**: Real-time trade execution (to be implemented)
- **Notification Services**: Discord, Telegram integration (to be implemented)

## Future Enhancements

- Real-time WebSocket connections for live updates
- Advanced charting and analytics
- Portfolio tracking and PnL visualization
- Social features (comments, reactions, follows)
- Mobile app (React Native)
- Advanced filtering and search
- AI-powered signal recommendations

## License

MIT License - see LICENSE file for details.
