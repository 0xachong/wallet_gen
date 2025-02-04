import { ethers } from 'ethers';
import { GenerateOptions, WalletInfo, WalletMap } from '../types';
import { ChainType } from '../types';



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
    const { wordCount = 12, language = 'en', chain, derivationCount = 1 } = options;
    const wordlist = ethers.wordlists[language] || ethers.wordlists.en;

    let entropyBytes: number;
    if (wordCount <= 12) entropyBytes = 16;
    else if (wordCount <= 18) entropyBytes = 24;
    else entropyBytes = 32;

    const entropy = ethers.utils.randomBytes(entropyBytes);
    const mnemonic = ethers.utils.entropyToMnemonic(entropy, wordlist);

    return generateWalletsCommon(mnemonic, derivationCount, chain);
}

async function generateFromMnemonics(mnemonics: string[], options: GenerateOptions): Promise<WalletInfo[]> {
    const wallets: WalletInfo[] = [];

    for (let i = 0; i < mnemonics.length; i++) {
        const mnemonic = mnemonics[i].trim();
        if (!mnemonic) continue;

        const generatedWallets = await generateWalletsCommon(mnemonic, options.derivationCount, options.chain);
        generatedWallets.forEach(wallet => {
            wallet.id = wallets.length + 1;
            wallets.push(wallet);
        });
    }

    return wallets;
}

// 其他生成钱包的逻辑从 wallet.ts 移过来 