import { WalletInfo, GenerateOptions } from '../types';

export class WalletGenerator {
    private static worker: Worker | null = null;
    private static getWorker(): Worker {
        if (!this.worker) {
            this.worker = new Worker(
                new URL('../workers/wallet.worker.ts', import.meta.url),
                { type: 'module' }
            );
        }
        return this.worker;
    }

    static async generateBatch(options: GenerateOptions): Promise<WalletInfo[]> {
        return new Promise((resolve, reject) => {
            const worker = this.getWorker();

            worker.onmessage = (e) => {
                const { type, data, error, current, total } = e.data;
                switch (type) {
                    case 'success':
                        resolve(data);
                        break;
                    case 'error':
                        reject(new Error(error));
                        break;
                    case 'progress':
                        // 触发进度更新事件
                        this.onProgress?.(current, total);
                        break;
                }
            };

            worker.onerror = (error) => {
                reject(error);
            };

            worker.postMessage(options);
        });
    }

    static onProgress?: (current: number, total: number) => void;

    static async exportToCsv(wallets: WalletInfo[]): Promise<string> {
        // CSV 表头
        const headers = ['序号', '链', '派生索引', '助记词', '私钥', '地址'];

        // 转换钱包数据为 CSV 行
        const rows = wallets.map(wallet => [
            wallet.id,
            wallet.chain,
            wallet.derivationIndex,
            wallet.mnemonic,
            wallet.privateKey,
            wallet.address
        ]);

        // 组合表头和数据行
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return csvContent;
    }

    static downloadCsv = (csvContent: string) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        // 格式化当前时间为年月日时分秒
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

        link.setAttribute('href', url);
        link.setAttribute('download', `wallets_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    static async generateFromMnemonics(mnemonics: string[], options: GenerateOptions): Promise<WalletInfo[]> {
        return new Promise((resolve, reject) => {
            const worker = this.getWorker();

            worker.onmessage = (e) => {
                const { type, data, error } = e.data;
                switch (type) {
                    case 'success':
                        resolve(data);
                        break;
                    case 'error':
                        reject(new Error(error));
                        break;
                }
            };

            worker.onerror = (error) => {
                reject(error);
            };

            worker.postMessage({ ...options, mnemonics });
        });
    }
} 