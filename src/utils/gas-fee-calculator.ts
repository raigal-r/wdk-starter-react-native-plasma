import { AssetTicker, NetworkType, WDKService } from '@tetherto/wdk-react-native-provider';
import { ExtendedNetworkType, ExtendedAssetTicker, isPlasmaNetwork, isUSDT0Asset } from '@/types/extended-types';

export interface GasFeeEstimate {
  fee?: number;
  error?: string;
}

const QUOTE_RECIPIENTS = {
  [AssetTicker.BTC]: {
    networks: {
      [NetworkType.SEGWIT]: 'bc1qh96eg54ddu4q2cmn0n6g8uymuqlw402jndphu9',
    },
  },
  [AssetTicker.USDT]: {
    networks: {
      [NetworkType.ETHEREUM]: '0x8d42eb95360bf68d65e5a810986b2ebd88c5e606',
      [NetworkType.POLYGON]: '0x8d42eb95360bf68d65e5a810986b2ebd88c5e606',
      [NetworkType.ARBITRUM]: '0x8d42eb95360bf68d65e5a810986b2ebd88c5e606',
      [NetworkType.TON]: 'EQD5mxRgCuRNLxKxeOjG6r14iSroLF5FtomPnet-sgP5xNJb',
      [NetworkType.TRON]: 'TLDCVJBtvYXJb2fEEk5pPoApHZbyuf2TyG',
      [NetworkType.SOLANA]: '74xb5G9LTr1J45HPcLqz6VF4NHVQtRqrTDD1MQ8D7zer',
    },
  },
  [AssetTicker.XAUT]: {
    networks: {
      [NetworkType.ETHEREUM]: '0x8d42eb95360bf68d65e5a810986b2ebd88c5e606',
      [NetworkType.POLYGON]: '0x8d42eb95360bf68d65e5a810986b2ebd88c5e606',
      [NetworkType.ARBITRUM]: '0x8d42eb95360bf68d65e5a810986b2ebd88c5e606',
      [NetworkType.TON]: 'EQD5mxRgCuRNLxKxeOjG6r14iSroLF5FtomPnet-sgP5xNJb',
    },
  },
  // USDT0 on Plasma network (uses EVM address format)
  [ExtendedAssetTicker.USDT0]: {
    networks: {
      [ExtendedNetworkType.PLASMA]: '0x8d42eb95360bf68d65e5a810986b2ebd88c5e606',
    },
  },
};

// Network type mapping (includes extended Plasma network)
export const getNetworkType = (networkId: string): NetworkType | string => {
  const networkMap: Record<string, NetworkType | string> = {
    ethereum: NetworkType.ETHEREUM,
    polygon: NetworkType.POLYGON,
    arbitrum: NetworkType.ARBITRUM,
    bitcoin: NetworkType.SEGWIT,
    lightning: NetworkType.LIGHTNING,
    ton: NetworkType.TON,
    tron: NetworkType.TRON,
    solana: NetworkType.SOLANA,
    plasma: ExtendedNetworkType.PLASMA,
  };
  return networkMap[networkId] || NetworkType.ETHEREUM;
};

// Asset ticker mapping (includes extended USDT0)
export const getAssetTicker = (tokenId: string): AssetTicker | string => {
  const assetMap: Record<string, AssetTicker | string> = {
    btc: AssetTicker.BTC,
    usdt: AssetTicker.USDT,
    xaut: AssetTicker.XAUT,
    usdt0: ExtendedAssetTicker.USDT0,
  };
  return assetMap[tokenId?.toLowerCase()] || AssetTicker.USDT;
};

/**
 * Pre-calculates gas fee using dummy values
 * This is useful for showing an estimated fee before the user enters transaction details
 */
export const calculateGasFee = async (
  networkId: string,
  tokenId: string,
  amount?: number
): Promise<GasFeeEstimate> => {
  try {
    const networkType = getNetworkType(networkId);
    const assetTicker = getAssetTicker(tokenId);

    // Plasma network offers gas-free USDT0 transfers
    if (isPlasmaNetwork(networkType) && isUSDT0Asset(assetTicker)) {
      return { fee: 0 };
    }

    // @ts-expect-error
    const quoteRecipient = QUOTE_RECIPIENTS[assetTicker]?.networks?.[networkType];

    // If no quote recipient is configured for this network/asset combo, return error
    if (!quoteRecipient) {
      return {
        fee: undefined,
        error: 'Network not supported for this asset',
      };
    }

    if (!amount && networkType === NetworkType.SEGWIT) {
      return {
        fee: undefined,
        error: 'Insufficient balance for fee calculation',
      };
    }

    const gasFee = await WDKService.quoteSendByNetwork(
      networkType as NetworkType,
      0, // account index
      assetTicker === AssetTicker.BTC ? parseFloat(amount!.toFixed(8)) : 1,
      quoteRecipient,
      assetTicker as AssetTicker
    );

    return { fee: gasFee };
  } catch (error) {
    console.error('Gas fee pre-calculation failed:', error);
    const networkType = getNetworkType(networkId);
    const isBitcoinNetwork =
      networkType === NetworkType.SEGWIT || networkType === NetworkType.LIGHTNING;

    if (
      isBitcoinNetwork &&
      error instanceof Error &&
      error.message.includes('Insufficient balance')
    ) {
      return {
        fee: undefined,
        error: 'Insufficient balance for fee calculation',
      };
    } else if (
      isBitcoinNetwork &&
      error instanceof Error &&
      error.message.includes('amount must be bigger than the dust limit')
    ) {
      return {
        fee: undefined,
        error: `The amount must be bigger than the dust limit`,
      };
    } else {
      return {
        fee: undefined,
        error: error instanceof Error ? error.message : 'Failed to calculate fee',
      };
    }
  }
};
