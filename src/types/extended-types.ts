/**
 * Extended types for networks and assets not yet supported by the WDK provider.
 * This allows the app to display and configure Plasma network and USDT0 token
 * while waiting for official WDK provider support.
 */

import { NetworkType as WDKNetworkType, AssetTicker as WDKAssetTicker } from '@tetherto/wdk-react-native-provider';

/**
 * Extended NetworkType that includes Plasma
 * PLASMA is an EVM-compatible chain with chainId 9745
 */
export const ExtendedNetworkType = {
  ...WDKNetworkType,
  PLASMA: 'plasma' as const,
} as const;

export type ExtendedNetworkType = typeof ExtendedNetworkType[keyof typeof ExtendedNetworkType];

// Type that includes all network types (WDK + extended)
export type AllNetworkTypes = WDKNetworkType | typeof ExtendedNetworkType.PLASMA;

/**
 * Extended AssetTicker that includes USDT0
 * USDT0 is the bridged USDT token on Plasma network
 */
export const ExtendedAssetTicker = {
  ...WDKAssetTicker,
  USDT0: 'usdt0' as const,
} as const;

export type ExtendedAssetTicker = typeof ExtendedAssetTicker[keyof typeof ExtendedAssetTicker];

/**
 * Plasma network configuration
 */
export const PLASMA_CONFIG = {
  chainId: 9745,
  networkName: 'Plasma Mainnet',
  rpcUrl: 'https://rpc.plasma.to',
  blockExplorer: 'https://plasmascan.to',
  nativeCurrency: {
    name: 'XPL',
    symbol: 'XPL',
    decimals: 18,
  },
} as const;

/**
 * Plasma Testnet configuration (for development/testing)
 */
export const PLASMA_TESTNET_CONFIG = {
  chainId: 9746,
  networkName: 'Plasma Testnet',
  rpcUrl: 'https://testnet-rpc.plasma.to',
  blockExplorer: 'https://testnet.plasmascan.to',
  nativeCurrency: {
    name: 'XPL',
    symbol: 'XPL',
    decimals: 18,
  },
} as const;

/**
 * USDT0 token configuration on Plasma
 */
export const USDT0_CONFIG = {
  address: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
  symbol: 'USDT0',
  name: 'USD₮0',
  decimals: 6,
} as const;

/**
 * Check if a network type is the extended Plasma network
 */
export const isPlasmaNetwork = (networkType: string): boolean => {
  return networkType === ExtendedNetworkType.PLASMA;
};

/**
 * Check if an asset ticker is USDT0
 */
export const isUSDT0Asset = (assetTicker: string): boolean => {
  return assetTicker === ExtendedAssetTicker.USDT0;
};
