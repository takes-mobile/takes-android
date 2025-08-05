# Solana Wallet Integration System

A comprehensive React Native Solana wallet integration system with Mobile Wallet Adapter support, session management, and user-friendly wallet setup guidance.

## Features

### 🔗 Core Wallet Integration
- **Solana Mobile Wallet Adapter** support via `@solana-mobile/mobile-wallet-adapter-protocol-web3js`
- **Multiple Wallet Support**: Phantom, Solflare with direct download links
- **Session Persistence**: AsyncStorage-based session management
- **Address Conversion**: Base58/Base64 conversion utilities
- **TypeScript Support**: Full TypeScript implementation

### 🎨 UI Components
- **WalletConnectButton**: Reusable connect/disconnect button with multiple variants
- **WalletConnect**: Full-featured wallet connection interface
- **WalletSetupInfo**: Comprehensive wallet setup guidance
- **ThemedText**: Theme-aware text component
- **Enhanced Error Handling**: User-friendly error messages and retry mechanisms

### 🔧 Utilities & Hooks
- **useWalletConnection**: Custom hook for wallet state management
- **walletSession**: Session management utilities
- **Enhanced Color System**: Extended theme support with wallet-specific colors

## Quick Start

### 1. Import and Use in Components

```tsx
import { WalletConnectButton, useWalletConnection } from './components/wallet';

function MyComponent() {
  const {
    connected,
    connecting,
    address,
    connectWallet,
    disconnectWallet,
  } = useWalletConnection();

  return (
    <WalletConnectButton
      connected={connected}
      connecting={connecting}
      onConnect={connectWallet}
      onDisconnect={disconnectWallet}
      address={address}
      variant="primary"
      size="medium"
    />
  );
}
```

### 2. Full Wallet Interface

```tsx
import { WalletConnect } from './components/WalletConnect';

function WalletScreen() {
  return (
    <WalletConnect
      onConnectionChange={(connected, address) => {
        console.log('Wallet connection changed:', connected, address);
      }}
      showSetupInfo={true}
      variant="primary"
      size="medium"
    />
  );
}
```

## Components

### WalletConnectButton

A customizable button component for wallet connection.

**Props:**
- `connected: boolean` - Wallet connection status
- `connecting: boolean` - Connection in progress
- `onConnect: () => void` - Connect function
- `onDisconnect: () => void` - Disconnect function
- `address?: string` - Wallet address to display
- `variant?: 'primary' | 'secondary' | 'outline'` - Button style
- `size?: 'small' | 'medium' | 'large'` - Button size
- `showAddress?: boolean` - Show wallet address when connected
- `disabled?: boolean` - Disable button

### WalletConnect

Complete wallet interface with setup guidance.

**Props:**
- `onConnectionChange?: (connected: boolean, address?: string) => void` - Connection change callback
- `showSetupInfo?: boolean` - Show wallet setup information
- `variant?: 'primary' | 'secondary' | 'outline'` - Button variant
- `size?: 'small' | 'medium' | 'large'` - Button size
- `style?: any` - Custom styles

### WalletSetupInfo

Wallet installation and setup guidance component.

**Props:**
- `onPhantomDownload: () => void` - Phantom download handler
- `onSolflareDownload: () => void` - Solflare download handler
- `onSetupGuide: () => void` - Setup guide handler

## Hooks

### useWalletConnection

Main hook for wallet connection management.

**Returns:**
```typescript
{
  // State
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  address: string | null;
  error: string | null;

  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  clearError: () => void;
  formatAddress: (length?: number) => string;

  // Wallet Setup
  showEnhancedWalletGuide: () => void;
  openPhantomDownload: () => void;
  openSolflareDownload: () => void;
  showWalletSetupInstructions: () => void;
  isNoWalletError: (error: any) => boolean;
}
```

## Utilities

### walletSession

Session management utilities for persistent wallet connections.

```typescript
// Save wallet session
await walletSession.savePublicKey(publicKey);

// Get saved wallet address
const address = await walletSession.getPublicKey();

// Check session validity
const isValid = await walletSession.isSessionValid();

// Clear session
await walletSession.clear();

// Address formatting
const formatted = walletSession.formatWalletAddress(address, 4);

// Address validation
const isValid = walletSession.isValidSolanaAddress(address);

// Address conversion
const base64 = walletSession.addressConversion.base58ToBase64(address);
const base58 = walletSession.addressConversion.base64ToBase58(base64Address);
```

## Error Handling

The system includes comprehensive error handling:

- **No Wallet Detected**: Automatically shows wallet installation guide
- **Connection Timeout**: Provides retry functionality
- **User Cancellation**: Graceful handling of cancelled connections
- **Invalid Addresses**: Address validation and error messages
- **Session Errors**: Automatic session cleanup on errors

## Platform Support

### iOS
- App Store links for wallet downloads
- iOS-specific setup instructions
- Native alert dialogs

### Android
- Google Play Store links
- Android-specific setup instructions
- Material Design components

## Wallet Downloads

### Phantom
- **iOS**: https://apps.apple.com/app/phantom-solana-wallet/id1598432977
- **Android**: https://play.google.com/store/apps/details?id=app.phantom
- **Website**: https://phantom.app/download

### Solflare
- **iOS**: https://apps.apple.com/app/solflare/id1580902717
- **Android**: https://play.google.com/store/apps/details?id=com.solflare.mobile
- **Website**: https://solflare.com/download

## Configuration

### Network Configuration
Default network is set to `devnet`. To change:

```typescript
// In useWalletConnection.ts
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
```

### Session Expiry
Default session expiry is 30 days. To modify:

```typescript
const isValid = await walletSession.isSessionValid(7 * 24 * 60 * 60 * 1000); // 7 days
```

### App Identity
Update app identity in the connection:

```typescript
// In useWalletConnection.ts - connectWallet function
const authorization = await wallet.authorize({
  cluster: 'devnet',
  identity: {
    name: 'Your App Name',
    uri: 'https://yourapp.com',
    icon: 'path/to/icon.ico',
  },
});
```

## Dependencies

Required packages (already included in package.json):

```json
{
  "@solana-mobile/mobile-wallet-adapter-protocol-web3js": "^2.2.2",
  "@solana/web3.js": "^1.98.4",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "bs58": "^6.0.0",
  "buffer": "^6.0.3"
}
```

## Integration with LoginScreen

The wallet connection has been integrated into the existing LoginScreen:

1. **Import added**: WalletConnectButton and useWalletConnection
2. **Hook integrated**: Wallet connection state management
3. **UI element added**: Wallet connect button below the main login button
4. **Styling**: Consistent with existing app theme

## Security Considerations

- **Recovery Phrase**: Users are guided to securely store recovery phrases
- **Session Management**: Automatic session expiry and cleanup
- **Address Validation**: All addresses are validated before use
- **Error Handling**: No sensitive data exposed in error messages
- **Secure Storage**: Uses AsyncStorage for session persistence

## Customization

### Colors
Extend the Colors.ts file for custom wallet-specific colors:

```typescript
export const Colors = {
  light: {
    // ... existing colors
    walletPrimary: '#9945FF', // Solana purple
    walletSuccess: '#14F195', // Solana green
  },
  dark: {
    // ... existing colors  
    walletPrimary: '#9945FF',
    walletSuccess: '#14F195',
  },
};
```

### Theming
The components automatically adapt to light/dark themes using the useColorScheme hook.

## Troubleshooting

### Common Issues

1. **Wallet Not Found**: Ensure Mobile Wallet Adapter is properly configured
2. **Connection Timeout**: Check network connectivity and wallet app status
3. **Session Not Persisting**: Verify AsyncStorage permissions
4. **Address Format Issues**: Use provided conversion utilities

### Debug Mode
Enable detailed logging by adding to the wallet connection hook:

```typescript
// Add at the top of useWalletConnection.ts
const DEBUG = __DEV__;

if (DEBUG) {
  console.log('Wallet connection debug info:', { connected, address, error });
}
```

## Future Enhancements

Potential additions for future versions:

- **Hardware Wallet Support**: Ledger integration
- **Multi-Account Support**: Multiple wallet management
- **Transaction History**: View past transactions
- **Balance Display**: Show SOL and token balances
- **Network Switching**: Easy network configuration
- **Wallet Analytics**: Connection and usage analytics

## License

This wallet integration system is part of the Takes App project and follows the same licensing terms.
