# Workshop: Adding Plasma Network & USDT0 Support to WDK Starter

## Welcome

Welcome to this hands-on technical workshop! Today you'll learn how to extend the Tether Wallet Development Kit (WDK) React Native starter application to support a new blockchain network (Plasma) and a new token (USDT0).

By the end of this workshop, you will understand:
- The WDK starter architecture for networks and tokens
- How to extend TypeScript enums with custom values
- Adding new network and token configurations
- Handling gas fees for new networks
- Graceful degradation patterns for pending provider support

---

## Support & Community

Need help during or after the workshop?

**Join the Tether Developer Discord:**
https://discord.com/invite/tetherdev

Our community is here to help you with:
- Questions about this workshop
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
- Familiarity with terminal/command line

---

## Step 0: Project Setup

### 0.1 Clone the Starter Repository

```bash
# Clone the WDK starter
git clone https://github.com/tetherto/wdk-starter-react-native.git wdk-plasma-workshop
cd wdk-plasma-workshop
```

### 0.2 Install Dependencies

```bash
# Install with legacy peer deps and skip problematic postinstall
npm install --legacy-peer-deps --ignore-scripts
```

> **Note:** We use `--ignore-scripts` because the `@tetherto/pear-wrk-wdk` package has a postinstall script with Node.js version compatibility issues. The pre-built bundles included in the package work fine for development.

### 0.3 Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and add your API keys:
```
EXPO_PUBLIC_WDK_INDEXER_BASE_URL=https://wdk-api.tether.io
EXPO_PUBLIC_WDK_INDEXER_API_KEY=your_api_key_here
```

### 0.4 Verify Setup

```bash
# Start the development server
npx expo start --clear
```

Press `i` for iOS simulator or `a` for Android emulator. The app should launch successfully.

---

## Step 1: Understanding the Architecture

Before making changes, let's understand how the WDK starter handles networks and tokens.

### 1.1 Key Configuration Files

Open and review these files:

| File | Purpose |
|------|---------|
| `src/config/networks.ts` | UI display configuration (name, icon, colors) |
| `src/config/assets.ts` | Token definitions and their supported networks |
| `src/config/get-chains-config.ts` | RPC endpoints and chain parameters |
| `src/utils/gas-fee-calculator.ts` | Fee estimation logic |
| `src/services/pricing-service.ts` | Fiat price conversions |

### 1.2 WDK Provider Types

The `@tetherto/wdk-react-native-provider` exports these key types:

```typescript
// Currently supported networks
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

// Currently supported tokens
enum AssetTicker {
  BTC = 'btc',
  USDT = 'usdt',
  XAUT = 'xaut',
}
```

**Challenge:** These enums don't include Plasma or USDT0. We need to extend them locally!

### 1.3 Plasma Network Information

| Property | Mainnet | Testnet |
|----------|---------|---------|
| Network Name | Plasma Mainnet | Plasma Testnet |
| Chain ID | 9745 | 9746 |
| RPC URL | https://rpc.plasma.to | https://testnet-rpc.plasma.to |
| Block Explorer | https://plasmascan.to | https://testnet.plasmascan.to |
| Native Currency | XPL | XPL |

### 1.4 USDT0 Token Information

| Property | Value |
|----------|-------|
| Contract Address | `0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb` |
| Symbol | USDT0 |
| Decimals | 6 |
| Type | ERC-20 |

---

## Step 2: Create Extended Types

We need to create a types file that extends the WDK provider's enums.

### 2.1 Create the Types Directory

```bash
mkdir -p src/types
```

### 2.2 Create Extended Types File

Create `src/types/extended-types.ts`:

```typescript
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
```

### 2.3 Key Concepts Explained

**Why use `as const`?**
```typescript
// Without 'as const' - type is string
const PLASMA = 'plasma';  // type: string

// With 'as const' - type is literal
const PLASMA = 'plasma' as const;  // type: 'plasma'
```

**Pattern: Extending Enums**
```typescript
// Original enum from library
enum Original { A = 'a', B = 'b' }

// Extended version (can't modify original, so spread into new object)
export const Extended = {
  ...Original,
  C: 'c' as const,
} as const;
```

---

## Step 3: Add Network Configuration

### 3.1 Update networks.ts

Edit `src/config/networks.ts`:

**Add the import at the top:**
```typescript
import { NetworkType } from '@tetherto/wdk-react-native-provider';
import { ExtendedNetworkType } from '@/types/extended-types';
```

**Update the Network interface and type:**
```typescript
export interface Network {
  id: string;
  name: string;
  gasLevel: 'High' | 'Normal' | 'Low';
  gasColor: string;
  icon: string | any;
  color: string;
}

// Type for all supported networks including extended ones
export type AllNetworkTypes = NetworkType | typeof ExtendedNetworkType.PLASMA;

export const networkConfigs: Record<AllNetworkTypes, Network> = {
```

**Add Plasma network config (after the last network entry, before the closing `}`):**
```typescript
  [ExtendedNetworkType.PLASMA]: {
    id: 'plasma',
    name: 'Plasma',
    gasLevel: 'Low',
    gasColor: '#34C759',
    icon: require('../../assets/images/chains/plasma-logo.png'),
    color: '#00D4AA',
  },
```

### 3.2 Add Chain Configuration

Edit `src/config/get-chains-config.ts`:

**Add the import at the top:**
```typescript
import { PLASMA_CONFIG, USDT0_CONFIG } from '@/types/extended-types';
```

**Add Plasma chain config (after the `tron` config, before the closing `}`):**
```typescript
    // Plasma network configuration (EVM-compatible L1 for stablecoins)
    plasma: {
      chainId: PLASMA_CONFIG.chainId,
      blockchain: 'plasma',
      provider: PLASMA_CONFIG.rpcUrl,
      transferMaxFee: 0, // Plasma offers gas-free USDT transfers
      swapMaxFee: 1000000,
      bridgeMaxFee: 1000000,
      paymasterToken: {
        address: USDT0_CONFIG.address, // USDT0 on Plasma
      },
    },
```

### 3.3 Add Logo Assets

You need to add logo images for Plasma and USDT0.

**Option A: Use placeholder images (for workshop)**
```bash
# Copy existing logos as placeholders
cp assets/images/chains/ethereum-eth-logo.png assets/images/chains/plasma-logo.png
cp assets/images/tokens/tether-usdt-logo.png assets/images/tokens/tether-usdt0-logo.png
```

**Option B: Download actual logos**

Download the Plasma logo from official sources and save as:
- `assets/images/chains/plasma-logo.png`
- `assets/images/tokens/tether-usdt0-logo.png`

---

## Step 4: Add Token Configuration

### 4.1 Update assets.ts

Edit `src/config/assets.ts`:

**Update the imports:**
```typescript
import { FiatCurrency } from '@/services/pricing-service';
import { NetworkType } from '@tetherto/wdk-react-native-provider';
import { ExtendedNetworkType, type AllNetworkTypes } from '@/types/extended-types';
```

**Update the AssetConfig interface:**
```typescript
export interface AssetConfig {
  name: string;
  symbol: string;
  icon: any;
  color: string;
  supportedNetworks: (NetworkType | AllNetworkTypes)[];
}
```

**Add USDT0 token config (after the `xaut` entry, before the closing `}`):**
```typescript
  usdt0: {
    name: 'USD₮0',
    symbol: 'USD₮0',
    icon: require('../../assets/images/tokens/tether-usdt0-logo.png'),
    color: '#ffffff',
    supportedNetworks: [ExtendedNetworkType.PLASMA],
  },
```

---

## Step 5: Update Gas Fee Calculator

Edit `src/utils/gas-fee-calculator.ts`:

### 5.1 Update Imports

```typescript
import { AssetTicker, NetworkType, WDKService } from '@tetherto/wdk-react-native-provider';
import { ExtendedNetworkType, ExtendedAssetTicker, isPlasmaNetwork, isUSDT0Asset } from '@/types/extended-types';
```

### 5.2 Add USDT0 Quote Recipient

Add this after the existing `QUOTE_RECIPIENTS` entries:

```typescript
  // USDT0 on Plasma network (uses EVM address format)
  [ExtendedAssetTicker.USDT0]: {
    networks: {
      [ExtendedNetworkType.PLASMA]: '0x8d42eb95360bf68d65e5a810986b2ebd88c5e606',
    },
  },
```

### 5.3 Update Network Type Mapping

Replace the `getNetworkType` function:

```typescript
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
```

### 5.4 Update Asset Ticker Mapping

Replace the `getAssetTicker` function:

```typescript
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
```

### 5.5 Update Calculate Gas Fee Function

Add this at the beginning of the `calculateGasFee` function (after getting networkType and assetTicker):

```typescript
    // Plasma network offers gas-free USDT0 transfers
    if (isPlasmaNetwork(networkType) && isUSDT0Asset(assetTicker)) {
      return { fee: 0 };
    }
```

Update the quote recipient lookup:
```typescript
    // @ts-expect-error
    const quoteRecipient = QUOTE_RECIPIENTS[assetTicker]?.networks?.[networkType];

    // If no quote recipient is configured for this network/asset combo, return error
    if (!quoteRecipient) {
      return {
        fee: undefined,
        error: 'Network not supported for this asset',
      };
    }
```

Update the WDKService call with type assertions:
```typescript
    const gasFee = await WDKService.quoteSendByNetwork(
      networkType as NetworkType,
      0, // account index
      assetTicker === AssetTicker.BTC ? parseFloat(amount!.toFixed(8)) : 1,
      quoteRecipient,
      assetTicker as AssetTicker
    );
```

---

## Step 6: Update Pricing Service

Edit `src/services/pricing-service.ts`:

### 6.1 Add Import

```typescript
import { ExtendedAssetTicker } from '@/types/extended-types';
```

### 6.2 Add Type Alias

After the `FiatCurrency` enum, add:

```typescript
// Type for all asset tickers including extended ones (USDT0)
export type AllAssetTickers = AssetTicker | typeof ExtendedAssetTicker.USDT0;
```

### 6.3 Update Cache Type

```typescript
private fiatExchangeRateCache: Record<FiatCurrency, Record<AllAssetTickers, number>> | undefined;
```

### 6.4 Add USDT0 to Exchange Rate Cache

In the `initialize()` method, add USDT0 to the cache:

```typescript
this.fiatExchangeRateCache = {
  [FiatCurrency.USD]: {
    [AssetTicker.BTC]: await this.provider.getLastPrice(AssetTicker.BTC, FiatCurrency.USD),
    [AssetTicker.USDT]: 1,
    [AssetTicker.XAUT]: await this.provider.getLastPrice(AssetTicker.XAUT, FiatCurrency.USD),
    [ExtendedAssetTicker.USDT0]: 1, // USDT0 is 1:1 backed with USDT
  },
};
```

### 6.5 Update getFiatValue Method

```typescript
async getFiatValue(value: number, asset: AllAssetTickers | string, currency: FiatCurrency): Promise<number> {
  if (!this.isInitialized || !this.fiatExchangeRateCache) {
    throw new Error('Pricing service not initialized. Call initialize() first.');
  }

  const rate = this.fiatExchangeRateCache[currency][asset as AllAssetTickers];
  if (rate === undefined) {
    // Default to 1 for unknown stablecoins (like USDT0)
    return new DecimalJS(value).toNumber();
  }
  return new DecimalJS(value).mul(rate).toNumber();
}
```

### 6.6 Update refreshExchangeRates Method

Add USDT0 to the refresh method (same as initialize):

```typescript
[ExtendedAssetTicker.USDT0]: 1, // USDT0 is 1:1 backed with USDT
```

### 6.7 Update getExchangeRate Method

```typescript
getExchangeRate(asset: AllAssetTickers, currency: FiatCurrency): number | undefined {
  return this.fiatExchangeRateCache?.[currency]?.[asset];
}
```

---

## Step 7: Handle Send Transactions

Since the WDK provider doesn't natively support Plasma yet, we need graceful handling.

Edit `src/app/send/details.tsx`:

### 7.1 Add Imports

```typescript
import { AssetTicker, NetworkType, useWallet, WDKService } from '@tetherto/wdk-react-native-provider';
import { isPlasmaNetwork, isUSDT0Asset } from '@/types/extended-types';
```

### 7.2 Update handleSend Function

Find the `handleSend` function and add Plasma handling after getting networkType and assetTicker:

```typescript
const handleSend = useCallback(async () => {
  if (!validateTransaction()) {
    return;
  }

  setSendingTransaction(true);
  setTransactionResult(null);

  try {
    const networkType = getNetworkType(networkId);
    const assetTicker = getAssetTicker(tokenId);

    // Convert fiat to token amount if in fiat mode
    let numericAmount = parseFloat(amount);
    if (inputMode === 'fiat' && tokenPrice > 0) {
      numericAmount = numericAmount / tokenPrice;
    }

    // Check if this is a Plasma network transaction
    if (isPlasmaNetwork(networkType) || isUSDT0Asset(assetTicker)) {
      Alert.alert(
        'Plasma Network',
        'USDT0 transactions on Plasma network will be available once the WDK provider adds native support. The network configuration is ready.',
        [{ text: 'OK' }]
      );
      setSendingTransaction(false);
      return;
    }

    const sendResult = await WDKService.sendByNetwork(
      networkType as NetworkType,
      0, // account index
      numericAmount,
      recipientAddress,
      assetTicker as AssetTicker
    );

    setTransactionResult({ txId: sendResult });
    setShowConfirmation(true);
  } catch (error) {
    console.error('Transaction failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Transaction failed';

    Alert.alert('Transaction Failed', errorMessage, [{ text: 'OK' }]);

    setTransactionResult({ error: errorMessage });
  } finally {
    setSendingTransaction(false);
    refreshWalletBalance();
  }
}, [/* existing dependencies */]);
```

---

## Step 8: Testing

### 8.1 Run Type Check

```bash
npm run typecheck
```

You should see no errors related to Plasma/USDT0 changes. Some pre-existing errors may appear in other files - these are unrelated to our changes.

### 8.2 Start the App

```bash
npx expo start --clear
```

### 8.3 Verification Checklist

Test the following:

- [ ] App launches without errors
- [ ] Navigate to **Assets** screen
- [ ] USDT0 appears in the token list
- [ ] Tap **Send**
- [ ] Select USDT0 from token selection
- [ ] Plasma network appears in network selection
- [ ] Select Plasma network
- [ ] Gas fee shows as **$0.00** (gas-free!)
- [ ] Enter a recipient address and amount
- [ ] Tap Send - should show "Plasma Network" message

---

## Step 9: Summary

### Files Created

| File | Purpose |
|------|---------|
| `src/types/extended-types.ts` | Extended types and constants for Plasma/USDT0 |
| `assets/images/chains/plasma-logo.png` | Plasma network logo |
| `assets/images/tokens/tether-usdt0-logo.png` | USDT0 token logo |

### Files Modified

| File | Changes |
|------|---------|
| `src/config/networks.ts` | Added Plasma network display config |
| `src/config/assets.ts` | Added USDT0 token config |
| `src/config/get-chains-config.ts` | Added Plasma chain parameters |
| `src/utils/gas-fee-calculator.ts` | Added Plasma/USDT0 mappings and gas-free handling |
| `src/services/pricing-service.ts` | Added USDT0 pricing (1:1 with USD) |
| `src/app/send/details.tsx` | Added Plasma transaction handling |

### Key Concepts Learned

1. **Type Extension Pattern** - Using spread operators with `as const` to extend enums
2. **Layered Configuration** - Separating UI config from chain parameters
3. **Graceful Degradation** - Handling unsupported features with informative messages
4. **Type Safety** - Using union types and type guards for extended values

---

## Troubleshooting

### Metro Bundler Path Resolution Error

**Error:**
```
Unable to resolve module .../node_modules/@expo/metro-config/...
```

**Solution:**
```bash
rm -rf node_modules .expo ios/Pods ios/build
rm -f package-lock.json
watchman watch-del-all 2>/dev/null
npm install --legacy-peer-deps --ignore-scripts
npx expo start --clear
```

### WDK Postinstall Script Fails

**Error:**
```
Bail: UNKNOWN_FLAG: target
# or
MODULE_NOT_FOUND: Cannot find module 'http2'
```

**Solution:**
```bash
npm install --legacy-peer-deps --ignore-scripts
```

### TypeScript Errors

**Error:**
```
Type 'string' is not assignable to type 'NetworkType'
```

**Solution:** Use type assertions where needed:
```typescript
networkType as NetworkType
assetTicker as AssetTicker
```

---

## Next Steps

When the WDK provider adds native Plasma support:

1. Remove the transaction blocking in `src/app/send/details.tsx`
2. Update type mappings to use native `NetworkType.PLASMA` if added
3. Test actual transaction signing and broadcasting

---

## Resources

- **Tether Developer Discord:** https://discord.com/invite/tetherdev
- **Plasma Documentation:** https://docs.plasma.to
- **Plasma Mainnet ChainList:** https://chainlist.org/chain/9745
- **USDT0 on Plasmascan:** https://plasmascan.to/token/0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb
- **WDK Documentation:** https://docs.wallet.tether.io
- **WDK Starter Repository:** https://github.com/tetherto/wdk-starter-react-native

---

## Questions?

If you have questions during the workshop, raise your hand!

For post-workshop support, join our Discord:
**https://discord.com/invite/tetherdev**

Thank you for attending!
