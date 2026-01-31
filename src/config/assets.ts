import { FiatCurrency } from '@/services/pricing-service';
import { NetworkType } from '@tetherto/wdk-react-native-provider';
import { ExtendedNetworkType, type AllNetworkTypes } from '@/types/extended-types';

export interface AssetConfig {
  name: string;
  symbol: string;
  icon: any;
  color: string;
  supportedNetworks: (NetworkType | AllNetworkTypes)[];
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  fiatValue: number;
  fiatCurrency: FiatCurrency;
  icon: string | any;
  color: string;
}

export const assetConfig: Record<string, AssetConfig> = {
  btc: {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: require('../../assets/images/tokens/bitcoin-btc-logo.png'),
    color: '#ffffff',
    supportedNetworks: [NetworkType.SEGWIT],
  },
  usdt: {
    name: 'USD₮',
    symbol: 'USD₮',
    icon: require('../../assets/images/tokens/tether-usdt-logo.png'),
    color: '#ffffff',
    supportedNetworks: [
      NetworkType.ETHEREUM,
      NetworkType.POLYGON,
      NetworkType.ARBITRUM,
      NetworkType.TON,
      NetworkType.TRON,
      NetworkType.SOLANA,
    ],
  },
  xaut: {
    name: 'XAU₮',
    symbol: 'XAU₮',
    icon: require('../../assets/images/tokens/tether-xaut-logo.png'),
    color: '#ffffff',
    supportedNetworks: [NetworkType.ETHEREUM],
  },
  usdt0: {
    name: 'USD₮0',
    symbol: 'USD₮0',
    icon: require('../../assets/images/tokens/tether-usdt0-logo.png'),
    color: '#ffffff',
    supportedNetworks: [ExtendedNetworkType.PLASMA],
  },
};
