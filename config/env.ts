import Constants from 'expo-constants';

// Get environment variables from Expo's extra config
const getEnvVar = (key: string): string => {
  return Constants.expoConfig?.extra?.[key] || process.env[key] || '';
};

export const config = {
  // API Configuration
  API_BASE_URL: getEnvVar('API_BASE_URL') || 'https://apipoolc.vercel.app',
  
  // Privy Configuration
  PRIVY_APP_ID: getEnvVar('PRIVY_APP_ID') || 'cmdfmgl76001qlh0mi0ggzx5l',
  PRIVY_CLIENT_ID: getEnvVar('PRIVY_CLIENT_ID') || 'client-WY6NvgKMnByoyauWRNvgPku7dBs3VtJeYxseJm48kDUtk',
  
  // Passkey Configuration
  PASSKEY_ASSOCIATED_DOMAIN: getEnvVar('PASSKEY_ASSOCIATED_DOMAIN') || 'https://your.real.domain.com',
  
  // EAS Configuration
  EAS_PROJECT_ID: getEnvVar('EAS_PROJECT_ID') || '61963352-b500-4c44-95ea-c3d0ca023713',
  
  // Helius RPC Configuration
  HELIUS_API_KEY: getEnvVar('HELIUS_API_KEY') || '397b5828-cbba-479e-992e-7000c78d482b',
}; 