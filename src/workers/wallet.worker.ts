import { ethers } from 'ethers';
import { GenerateOptions, WalletInfo, WalletMap, ChainType } from '../types/index';



self.onmessage = async (e: MessageEvent<GenerateOptions & { mnemonics?: string[] }>) => {
    const options = e.data;
    try {
        const wallets = options.mnemonics
            ? await generateFromMnemonics(options.mnemonics, options)
            : await generateWallets(options);
        self.postMessage({ type: 'success', data: wallets });
    } catch (error) {
        console.error('Worker error:', error);
        self.postMessage({
            type: 'error',
            error: error instanceof Error ? error.message : '生成钱包失败'
        });
    }
};

async function generateWallets(options: GenerateOptions): Promise<WalletInfo[]> {
    const { count, derivationCount } = options;
    const wallets: WalletInfo[] = [];

    for (let i = 0; i < count; i++) {
        const groupWallets = await generateWalletGroup(options);
        groupWallets.forEach((wallet, index) => {
            wallet.id = i * derivationCount + index + 1;
            wallets.push(wallet);
        });
        // 报告进度
        self.postMessage({ type: 'progress', current: i + 1, total: count });
    }

    return wallets;
}

async function generateWalletsCommon(mnemonic: string, derivationCount: number, chain: ChainType): Promise<WalletInfo[]> {
    console.log("Generating wallet for chain:", chain);
    console.log("Available wallets:", Object.keys(WalletMap));

    const WalletClass = WalletMap[chain];
    if (!WalletClass) {
        throw new Error(`不支持的链: ${chain}`);
    }

    try {
        const wallets: WalletInfo[] = [];
        for (let i = 0; i < derivationCount; i++) {
            try {
                const wallet = new WalletClass.wallet();
                const params = {
                    mnemonic: mnemonic,
                    hdPath: await wallet.getDerivedPath({ index: i }),
                }
                const privateKey = await wallet.getDerivedPrivateKey(params);
                const { address } = await wallet.getNewAddress({
                    privateKey,
                    addressType: WalletMap[chain].addressType || undefined
                });

                wallets.push({
                    id: 0,
                    mnemonic,
                    address,
                    privateKey,
                    chain,
                    derivationIndex: i
                });
            } catch (error) {
                console.error(`Error generating wallet at index ${i}:`, error);
                throw error;
            }
        }
        return wallets;
    } catch (error) {
        console.error("Error in generateWalletsCommon:", error);
        throw error;
    }
}

async function generateWalletGroup(options: GenerateOptions): Promise<WalletInfo[]> {
    const { wordCount = 12, language = 'en', chains, derivationCount } = options;
    const mnemonic = ethers.Wallet.createRandom().mnemonic?.phrase || '';

    let wallets: WalletInfo[] = [];

    // 为每个选中的链生成钱包
    for (const chain of chains) {
        const chainWallets = await generateWalletsCommon(mnemonic, derivationCount, chain);
        wallets = wallets.concat(chainWallets);
    }

    return wallets;
}

async function generateFromMnemonics(mnemonics: string[], options: GenerateOptions): Promise<WalletInfo[]> {
    const { chains, derivationCount } = options;
    const wallets: WalletInfo[] = [];
    let currentId = 1;

    for (const mnemonic of mnemonics) {
        // 为每个选中的链生成钱包
        for (const chain of chains) {
            const chainWallets = await generateWalletsCommon(mnemonic, derivationCount, chain);
            chainWallets.forEach(wallet => {
                wallet.id = currentId++;
                wallets.push(wallet);
            });
        }
        // 报告进度
        self.postMessage({ type: 'progress', current: currentId, total: mnemonics.length * chains.length * derivationCount });
    }

    return wallets;
}

// 其他生成钱包的逻辑从 wallet.ts 移过来 