# Workshop: Adding Plasma Network & USDT0 Support to WDK Starter

<p align="center">
  <img src="https://plasma.to/plasma-logo.svg" alt="Plasma" width="200"/>
</p>

## Welcome

Welcome to this hands-on technical workshop! Today you'll learn how to extend the Tether Wallet Development Kit (WDK) React Native starter application to support **Plasma Network** and **USDT0 token**.

### What You'll Learn

- The WDK starter architecture for networks and tokens
- How to extend TypeScript enums with custom values
- Adding new network and token configurations
- Handling gas fees for new networks
- Graceful degradation patterns for pending provider support

### Workshop Duration

Approximately 45-60 minutes

---

## Need Help?

**Join the Tether Developer Discord for support:**

### https://discord.com/invite/tetherdev

Our community is here to help you with:
- Questions during and after this workshop
- WDK integration support
- General blockchain development questions
- Networking with other developers

---

## Prerequisites

### Required Software

| Software | Version | Check Command |
|----------|---------|---------------|
| Node.js | 22.x | `node --version` |
| npm | 10+ | `npm --version` |
| Git | Any | `git --version` |
| Xcode | Latest (iOS) | `xcode-select --version` |
| Android Studio | Latest (Android) | - |

### Required Knowledge

- Basic React Native / Expo experience
- TypeScript fundamentals
- Understanding of EVM-compatible blockchains

---

## Plasma Network Overview

### What is Plasma?

Plasma is a high-performance Layer 1 blockchain built specifically for stablecoin payments at global scale. Key features:

- **Gas-free USDT transfers** - No native tokens needed for transfers
- **EVM compatible** - Use familiar Ethereum tools
- **Instant settlements** - Fast transaction finality
- **Built for payments** - Optimized for stablecoin use cases

### Network Information

| Property | Mainnet | Testnet |
|----------|---------|---------|
| Network Name | Plasma Mainnet | Plasma Testnet |
| Chain ID | **9745** | **9746** |
| RPC URL | https://rpc.plasma.to | https://testnet-rpc.plasma.to |
| Block Explorer | https://plasmascan.to | https://testnet.plasmascan.to |
| Native Currency | XPL | XPL |

### USDT0 Token

| Property | Value |
|----------|-------|
| Contract Address | `0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb` |
| Symbol | USDT0 |
| Decimals | 6 |
| Type | ERC-20 |

---

## Step 0: Project Setup

### 0.1 Clone the Repository

```bash
git clone https://github.com/tetherto/wdk-starter-react-native.git wdk-plasma-workshop
cd wdk-plasma-workshop
```

### 0.2 Install Dependencies

```bash
npm install --legacy-peer-deps --ignore-scripts
```

> **Why `--ignore-scripts`?** The `@tetherto/pear-wrk-wdk` package has a postinstall script with Node.js 22 compatibility issues. The pre-built bundles work fine for development.

### 0.3 Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
EXPO_PUBLIC_WDK_INDEXER_BASE_URL=https://wdk-api.tether.io
EXPO_PUBLIC_WDK_INDEXER_API_KEY=your_api_key_here
```

### 0.4 Verify Setup

```bash
npx expo start --clear
```

Press `i` for iOS or `a` for Android. The app should launch.

---

## Step 1: Understand the Architecture

### Key Files Overview

```
src/
├── config/
│   ├── networks.ts          # Network display settings (name, icon, colors)
│   ├── assets.ts            # Token definitions & supported networks
│   └── get-chains-config.ts # RPC endpoints & chain parameters
├── utils/
│   └── gas-fee-calculator.ts # Fee estimation logic
├── services/
│   └── pricing-service.ts    # Fiat price conversions
└── types/
    └── extended-types.ts     # (We'll create this!)
```

### WDK Provider Types

The `@tetherto/wdk-react-native-provider` exports these enums:

```typescript
enum NetworkType {
  SEGWIT = 'bitcoin',
  LIGHTNING = 'lightning',
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
  TRON = 'tron',
  TON = 'ton',
  POLYGON = 'polygon',
  ARBITRUM = 'arbitrum',
}

enum AssetTicker {
  BTC = 'btc',
  USDT = 'usdt',
  XAUT = 'xaut',
}
```

**Notice:** No `PLASMA` or `USDT0`! We need to extend these.

---

## Step 2: Create Extended Types

### 2.1 Create Types Directory

```bash
mkdir -p src/types
```

### 2.2 Create Extended Types File

Create **`src/types/extended-types.ts`**:

```typescript
/**
 * Extended types for Plasma network and USDT0 token.
 * These extend the WDK provider types until native support is added.
 */

import {
  NetworkType as WDKNetworkType,
  AssetTicker as WDKAssetTicker
} from '@tetherto/wdk-react-native-provider';

// ============================================
// EXTENDED NETWORK TYPE
// ============================================

/**
 * Extended NetworkType that includes Plasma
 */
export const ExtendedNetworkType = {
  ...WDKNetworkType,
  PLASMA: 'plasma' as const,
} as const;

export type ExtendedNetworkType = typeof ExtendedNetworkType[keyof typeof ExtendedNetworkType];

/** All network types (WDK + Plasma) */
export type AllNetworkTypes = WDKNetworkType | typeof ExtendedNetworkType.PLASMA;

// ============================================
// EXTENDED ASSET TICKER
// ============================================

/**
 * Extended AssetTicker that includes USDT0
 */
export const ExtendedAssetTicker = {
  ...WDKAssetTicker,
  USDT0: 'usdt0' as const,
} as const;

export type ExtendedAssetTicker = typeof ExtendedAssetTicker[keyof typeof ExtendedAssetTicker];

// ============================================
// PLASMA CONFIGURATION
// ============================================

/** Plasma Mainnet configuration */
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

/** Plasma Testnet configuration */
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

// ============================================
// USDT0 CONFIGURATION
// ============================================

/** USDT0 token on Plasma */
export const USDT0_CONFIG = {
  address: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
  symbol: 'USDT0',
  name: 'USD₮0',
  decimals: 6,
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Check if network type is Plasma */
export const isPlasmaNetwork = (networkType: string): boolean => {
  return networkType === ExtendedNetworkType.PLASMA;
};

/** Check if asset ticker is USDT0 */
export const isUSDT0Asset = (assetTicker: string): boolean => {
  return assetTicker === ExtendedAssetTicker.USDT0;
};
```

### 2.3 Understanding the Pattern

**Why `as const`?**

```typescript
// Without 'as const' → type is string
const value = 'plasma';        // type: string

// With 'as const' → type is literal
const value = 'plasma' as const; // type: 'plasma'
```

**Extending enums pattern:**

```typescript
// Can't modify imported enum, so spread into new object
export const Extended = {
  ...Original,           // Spread original values
  NEW: 'new' as const,   // Add new value
} as const;              // Make entire object readonly
```

---

## Step 3: Add Network Configuration

### 3.1 Update `src/config/networks.ts`

**Add imports at top:**

```typescript
import { NetworkType } from '@tetherto/wdk-react-native-provider';
import { ExtendedNetworkType } from '@/types/extended-types';
```

**Update interface and type:**

```typescript
export interface Network {
  id: string;
  name: string;
  gasLevel: 'High' | 'Normal' | 'Low';
  gasColor: string;
  icon: string | any;
  color: string;
}

// Include extended networks in the type
export type AllNetworkTypes = NetworkType | typeof ExtendedNetworkType.PLASMA;

export const networkConfigs: Record<AllNetworkTypes, Network> = {
  // ... existing networks stay the same ...
```

**Add Plasma config** (before closing `}`):

```typescript
  [ExtendedNetworkType.PLASMA]: {
    id: 'plasma',
    name: 'Plasma',
    gasLevel: 'Low',
    gasColor: '#34C759',
    icon: require('../../assets/images/chains/plasma-logo.png'),
    color: '#00D4AA',
  },
};
```

### 3.2 Update `src/config/get-chains-config.ts`

**Add import at top:**

```typescript
import { PLASMA_CONFIG, USDT0_CONFIG } from '@/types/extended-types';
```

**Add Plasma chain config** (after `tron` config):

```typescript
    // Plasma network - EVM-compatible L1 for stablecoins
    plasma: {
      chainId: PLASMA_CONFIG.chainId,
      blockchain: 'plasma',
      provider: PLASMA_CONFIG.rpcUrl,
      transferMaxFee: 0,  // Gas-free USDT transfers!
      swapMaxFee: 1000000,
      bridgeMaxFee: 1000000,
      paymasterToken: {
        address: USDT0_CONFIG.address,
      },
    },
```

### 3.3 Add Logo Images

```bash
# Create placeholder logos (replace with real logos later)
cp assets/images/chains/ethereum-eth-logo.png assets/images/chains/plasma-logo.png
cp assets/images/tokens/tether-usdt-logo.png assets/images/tokens/tether-usdt0-logo.png
```

---

## Step 4: Add Token Configuration

### 4.1 Update `src/config/assets.ts`

**Update imports:**

```typescript
import { FiatCurrency } from '@/services/pricing-service';
import { NetworkType } from '@tetherto/wdk-react-native-provider';
import { ExtendedNetworkType, type AllNetworkTypes } from '@/types/extended-types';
```

**Update interface:**

```typescript
export interface AssetConfig {
  name: string;
  symbol: string;
  icon: any;
  color: string;
  supportedNetworks: (NetworkType | AllNetworkTypes)[];
}
```

**Add USDT0 token** (after `xaut`):

```typescript
  usdt0: {
    name: 'USD₮0',
    symbol: 'USD₮0',
    icon: require('../../assets/images/tokens/tether-usdt0-logo.png'),
    color: '#ffffff',
    supportedNetworks: [ExtendedNetworkType.PLASMA],
  },
};
```

---

## Step 5: Update Gas Fee Calculator

### 5.1 Update `src/utils/gas-fee-calculator.ts`

**Replace imports:**

```typescript
import { AssetTicker, NetworkType, WDKService } from '@tetherto/wdk-react-native-provider';
import {
  ExtendedNetworkType,
  ExtendedAssetTicker,
  isPlasmaNetwork,
  isUSDT0Asset
} from '@/types/extended-types';
```

**Add USDT0 to `QUOTE_RECIPIENTS`:**

```typescript
const QUOTE_RECIPIENTS = {
  // ... existing entries ...

  // USDT0 on Plasma (EVM address format)
  [ExtendedAssetTicker.USDT0]: {
    networks: {
      [ExtendedNetworkType.PLASMA]: '0x8d42eb95360bf68d65e5a810986b2ebd88c5e606',
    },
  },
};
```

**Update `getNetworkType` function:**

```typescript
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
    plasma: ExtendedNetworkType.PLASMA,  // ← Add this
  };
  return networkMap[networkId] || NetworkType.ETHEREUM;
};
```

**Update `getAssetTicker` function:**

```typescript
export const getAssetTicker = (tokenId: string): AssetTicker | string => {
  const assetMap: Record<string, AssetTicker | string> = {
    btc: AssetTicker.BTC,
    usdt: AssetTicker.USDT,
    xaut: AssetTicker.XAUT,
    usdt0: ExtendedAssetTicker.USDT0,  // ← Add this
  };
  return assetMap[tokenId?.toLowerCase()] || AssetTicker.USDT;
};
```

**Update `calculateGasFee` function** - add at the beginning:

```typescript
export const calculateGasFee = async (
  networkId: string,
  tokenId: string,
  amount?: number
): Promise<GasFeeEstimate> => {
  try {
    const networkType = getNetworkType(networkId);
    const assetTicker = getAssetTicker(tokenId);

    // ✨ Plasma offers gas-free USDT0 transfers!
    if (isPlasmaNetwork(networkType) && isUSDT0Asset(assetTicker)) {
      return { fee: 0 };
    }

    // ... rest of function ...
```

**Update quote recipient lookup:**

```typescript
    // @ts-expect-error - Dynamic access
    const quoteRecipient = QUOTE_RECIPIENTS[assetTicker]?.networks?.[networkType];

    if (!quoteRecipient) {
      return {
        fee: undefined,
        error: 'Network not supported for this asset',
      };
    }
```

**Update WDKService call with type assertions:**

```typescript
    const gasFee = await WDKService.quoteSendByNetwork(
      networkType as NetworkType,
      0,
      assetTicker === AssetTicker.BTC ? parseFloat(amount!.toFixed(8)) : 1,
      quoteRecipient,
      assetTicker as AssetTicker
    );
```

---

## Step 6: Update Pricing Service

### 6.1 Update `src/services/pricing-service.ts`

**Add import:**

```typescript
import { ExtendedAssetTicker } from '@/types/extended-types';
```

**Add type alias** (after `FiatCurrency` enum):

```typescript
// All asset tickers including USDT0
export type AllAssetTickers = AssetTicker | typeof ExtendedAssetTicker.USDT0;
```

**Update cache type:**

```typescript
private fiatExchangeRateCache: Record<FiatCurrency, Record<AllAssetTickers, number>> | undefined;
```

**Add USDT0 to `initialize()` cache:**

```typescript
this.fiatExchangeRateCache = {
  [FiatCurrency.USD]: {
    [AssetTicker.BTC]: await this.provider.getLastPrice(AssetTicker.BTC, FiatCurrency.USD),
    [AssetTicker.USDT]: 1,
    [AssetTicker.XAUT]: await this.provider.getLastPrice(AssetTicker.XAUT, FiatCurrency.USD),
    [ExtendedAssetTicker.USDT0]: 1,  // ← USDT0 is 1:1 with USD
  },
};
```

**Update `getFiatValue()` method:**

```typescript
async getFiatValue(
  value: number,
  asset: AllAssetTickers | string,
  currency: FiatCurrency
): Promise<number> {
  if (!this.isInitialized || !this.fiatExchangeRateCache) {
    throw new Error('Pricing service not initialized.');
  }

  const rate = this.fiatExchangeRateCache[currency][asset as AllAssetTickers];
  if (rate === undefined) {
    return new DecimalJS(value).toNumber();  // Default for unknown
  }
  return new DecimalJS(value).mul(rate).toNumber();
}
```

**Update `refreshExchangeRates()` method** - add USDT0:

```typescript
[ExtendedAssetTicker.USDT0]: 1,
```

**Update `getExchangeRate()` method:**

```typescript
getExchangeRate(asset: AllAssetTickers, currency: FiatCurrency): number | undefined {
  return this.fiatExchangeRateCache?.[currency]?.[asset];
}
```

---

## Step 7: Handle Send Transactions

The WDK provider doesn't natively support Plasma yet, so we add graceful handling.

### 7.1 Update `src/app/send/details.tsx`

**Add imports:**

```typescript
import { AssetTicker, NetworkType, useWallet, WDKService } from '@tetherto/wdk-react-native-provider';
import { isPlasmaNetwork, isUSDT0Asset } from '@/types/extended-types';
```

**Update `handleSend` function:**

```typescript
const handleSend = useCallback(async () => {
  if (!validateTransaction()) return;

  setSendingTransaction(true);
  setTransactionResult(null);

  try {
    const networkType = getNetworkType(networkId);
    const assetTicker = getAssetTicker(tokenId);

    let numericAmount = parseFloat(amount);
    if (inputMode === 'fiat' && tokenPrice > 0) {
      numericAmount = numericAmount / tokenPrice;
    }

    // ✨ Handle Plasma network gracefully
    if (isPlasmaNetwork(networkType) || isUSDT0Asset(assetTicker)) {
      Alert.alert(
        'Plasma Network',
        'USDT0 transactions on Plasma network will be available once the WDK provider adds native support. The network configuration is ready.',
        [{ text: 'OK' }]
      );
      setSendingTransaction(false);
      return;
    }

    // Proceed with supported networks
    const sendResult = await WDKService.sendByNetwork(
      networkType as NetworkType,
      0,
      numericAmount,
      recipientAddress,
      assetTicker as AssetTicker
    );

    setTransactionResult({ txId: sendResult });
    setShowConfirmation(true);
  } catch (error) {
    console.error('Transaction failed:', error);
    Alert.alert('Transaction Failed',
      error instanceof Error ? error.message : 'Transaction failed',
      [{ text: 'OK' }]
    );
    setTransactionResult({ error: error instanceof Error ? error.message : 'Failed' });
  } finally {
    setSendingTransaction(false);
    refreshWalletBalance();
  }
}, [/* dependencies */]);
```

---

## Step 8: Test Your Implementation

### 8.1 Type Check

```bash
npm run typecheck
```

✅ Should pass with no Plasma/USDT0 related errors.

### 8.2 Start the App

```bash
npx expo start --clear
```

### 8.3 Verification Checklist

| Test | Expected Result |
|------|-----------------|
| App launches | ✅ No errors |
| Open Assets screen | ✅ USDT0 visible in list |
| Tap Send → Select Token | ✅ USDT0 appears |
| Select USDT0 | ✅ Plasma network shown |
| View gas fee | ✅ Shows $0.00 |
| Tap Send button | ✅ Shows "Plasma Network" message |

---

## Summary

### Files Created

| File | Purpose |
|------|---------|
| `src/types/extended-types.ts` | Extended types for Plasma/USDT0 |
| `assets/images/chains/plasma-logo.png` | Network logo |
| `assets/images/tokens/tether-usdt0-logo.png` | Token logo |

### Files Modified

| File | Changes |
|------|---------|
| `src/config/networks.ts` | Added Plasma network display config |
| `src/config/assets.ts` | Added USDT0 token config |
| `src/config/get-chains-config.ts` | Added Plasma chain parameters |
| `src/utils/gas-fee-calculator.ts` | Added mappings + gas-free handling |
| `src/services/pricing-service.ts` | Added USDT0 pricing |
| `src/app/send/details.tsx` | Added Plasma transaction handling |

### Key Concepts

1. **Type Extension Pattern** - Spread + `as const` to extend enums
2. **Layered Configuration** - UI config separate from chain params
3. **Graceful Degradation** - Handle unsupported features elegantly
4. **Type Safety** - Union types + type guards for extended values

---

## Troubleshooting

### Metro Bundler Path Error

```
Unable to resolve module .../node_modules/@expo/metro-config/...
```

**Fix:**
```bash
rm -rf node_modules .expo ios/Pods ios/build
rm -f package-lock.json
npm install --legacy-peer-deps --ignore-scripts
npx expo start --clear
```

### Postinstall Script Fails

```
MODULE_NOT_FOUND: Cannot find module 'http2'
```

**Fix:**
```bash
npm install --legacy-peer-deps --ignore-scripts
```

### TypeScript Errors

```
Type 'string' is not assignable to type 'NetworkType'
```

**Fix:** Use type assertions:
```typescript
networkType as NetworkType
assetTicker as AssetTicker
```

---

## What's Next?

When WDK provider adds native Plasma support:

1. Remove transaction blocking in `send/details.tsx`
2. Update mappings to use native `NetworkType.PLASMA`
3. Test real transaction signing

---

## Resources

| Resource | Link |
|----------|------|
| **Tether Developer Discord** | https://discord.com/invite/tetherdev |
| Plasma Documentation | https://docs.plasma.to |
| Plasma ChainList | https://chainlist.org/chain/9745 |
| USDT0 on Plasmascan | https://plasmascan.to/token/0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb |
| WDK Documentation | https://docs.wallet.tether.io |
| WDK Starter Repo | https://github.com/tetherto/wdk-starter-react-native |

---

## Questions?

**During the workshop:** Raise your hand!

**After the workshop:** Join our Discord community

### https://discord.com/invite/tetherdev

---

<p align="center">
  <strong>Thank you for attending!</strong><br/>
  Built with 💚 by Tether
</p>
