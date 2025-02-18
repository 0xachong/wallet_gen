import React, { useState, useEffect } from 'react';
import { Card, Button, Checkbox, InputNumber, Progress, Space, Typography, Row, Col, message, Table, Input, Select } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { WalletInfo, ChainType, GenerateOptions } from '../types/index';
import { WalletGenerator as Generator } from '../utils/wallet';
import './WalletGenerator.css';

const { Title, Text } = Typography;

// 定义表格数据类型
interface GroupedWallet {
    id: number;
    mnemonic: string;
    derivationIndex: number;
    wallets: Record<string, {
        privateKey: string;
        address: string;
    }>;
}

export const WalletGenerator: React.FC = () => {
    const [wallets, setWallets] = useState<WalletInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [options, setOptions] = useState<GenerateOptions>({
        wordCount: 12,
        language: 'en',
        chains: ['ETH'],
        count: 10,
        processCount: 5,
        derivationCount: 1
    });
    const [mnemonicList, setMnemonicList] = useState('');

    const chains: ChainType[] = ['ETH', 'SOL', 'TRX', 'TON', 'SUI', 'APTOS', 'BITCOIN'];

    useEffect(() => {
        // 设置进度回调
        Generator.onProgress = (current, total) => {
            setProgress({ current, total });
        };

        return () => {
            Generator.onProgress = undefined;
        };
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        setProgress({ current: 0, total: options.count });
        try {
            const newWallets = await Generator.generateBatch(options);
            setWallets(newWallets);
            message.success('钱包生成成功！');
        } catch (error) {
            message.error('生成钱包失败！');
            console.error('生成钱包失败:', error);
        }
        setLoading(false);
    };

    const handleDownload = async () => {
        if (wallets.length > 0) {
            const csv = await Generator.exportToCsv(wallets);
            Generator.downloadCsv(csv);
            message.success('文件下载成功！');
        }
    };

    const handleImportMnemonics = async () => {
        const mnemonics = mnemonicList.split('\n').filter(m => m.trim());
        if (!mnemonics.length) return;

        setLoading(true);
        try {
            const newWallets = await Generator.generateFromMnemonics(mnemonics, options);
            setWallets(newWallets);
            message.success('钱包生成成功！');
        } catch (error) {
            message.error('生成钱包失败！');
            console.error('生成钱包失败:', error);
        }
        setLoading(false);
    };

    const handleChainChange = (values: ChainType[]) => {
        if (values.length === 0) {
            message.warning('请至少选择一个区块链');
            values = ['ETH'];
        }
        setOptions((prev: GenerateOptions) => ({
            ...prev,
            chains: values
        }));
        if (values.includes('TON')) {
            message.warning('注意: TON 生成私钥及地址目前仅支持 OKX 钱包，与其他钱包可能不兼容');
        }
    };

    return (
        <div className="wallet-generator">
            <Card bordered={false} style={{ padding: '8px' }}>
                <div className="tips-card" style={{ marginBottom: '8px' }}>
                    <Text type="secondary">
                        Tips: 钱包生成过程均在本地电脑完成，我们无法获取到您的助记词及私钥！请保管好您的助记词及私钥！
                    </Text>
                </div>

                {/* 参数设置卡片 */}
                <Card
                    title="参数设置"
                    className="section-card"
                    style={{ marginBottom: '8px' }}
                    bodyStyle={{ padding: '12px' }}
                    headStyle={{ padding: '8px 12px' }}
                >
                    {/* 链选择 */}
                    <div style={{ marginBottom: '12px' }}>
                        <Title level={5} style={{ marginBottom: '8px' }}>选择链</Title>
                        <Checkbox.Group
                            value={options.chains}
                            onChange={(values: ChainType[]) => {
                                if (values.length === 0) {
                                    message.warning('请至少选择一个区块链');
                                    values = ['ETH'];
                                }
                                handleChainChange(values);
                            }}
                            style={{ width: '100%' }}
                        >
                            <Space wrap size={8}>
                                {chains.map(chain => (
                                    <Checkbox
                                        key={chain}
                                        value={chain}
                                        className="chain-checkbox"
                                    >
                                        {chain}
                                    </Checkbox>
                                ))}
                            </Space>
                        </Checkbox.Group>
                    </div>

                    {/* 其他参数 */}
                    <Row gutter={[8, 8]}>
                        <Col span={6}>
                            <Title level={5} style={{ marginBottom: '8px' }}>助记词长度</Title>
                            <Select
                                size="middle"
                                value={options.wordCount as 12 | 15 | 18 | 21 | 24}
                                onChange={(value: 12 | 15 | 18 | 21 | 24) => setOptions((prev: GenerateOptions) => ({ ...prev, wordCount: value }))}
                                style={{ width: '100%' }}
                                options={[
                                    { label: '12位助记词', value: 12 },
                                    { label: '15位助记词', value: 15 },
                                    { label: '18位助记词', value: 18 },
                                    { label: '21位助记词', value: 21 },
                                    { label: '24位助记词', value: 24 },
                                ]}
                                defaultValue={12}
                            />
                        </Col>
                        <Col span={6}>
                            <Title level={5} style={{ marginBottom: '8px' }}>助记词数量</Title>
                            <InputNumber
                                size="middle"
                                min={1}
                                max={1000}
                                value={options.count}
                                onChange={value => setOptions((prev: GenerateOptions) => ({ ...prev, count: value || 1 }))}
                                style={{ width: '100%' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Title level={5} style={{ marginBottom: '8px' }}>派生钱包数量</Title>
                            <InputNumber
                                size="middle"
                                min={1}
                                max={10000}
                                value={options.derivationCount}
                                onChange={value => setOptions((prev: GenerateOptions) => ({ ...prev, derivationCount: value || 1 }))}
                                style={{ width: '100%' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Title level={5} style={{ marginBottom: '8px' }}>导入助记词</Title>
                            <Input.TextArea
                                placeholder="每行一组助记词，例如：
word1 word2 word3 ... word12
word1 word2 word3 ... word12"
                                rows={4}
                                value={mnemonicList}
                                onChange={e => setMnemonicList(e.target.value)}
                            />
                        </Col>
                    </Row>

                    {/* 操作按钮 */}
                    <div style={{ marginTop: '12px' }}>
                        <Space size={8}>
                            <Button type="primary" size="middle" icon={<ReloadOutlined />} onClick={handleGenerate} loading={loading}>
                                {loading ? '生成中...' : '重新生成'}
                            </Button>
                            <Button type="primary" size="middle" onClick={handleImportMnemonics} disabled={!mnemonicList.trim()} loading={loading}>从助记词生成</Button>
                        </Space>

                        {/* 进度条 */}
                        {loading && (
                            <div style={{ marginTop: '8px' }}>
                                <Progress
                                    percent={Math.round((progress.current / progress.total) * 100)}
                                    status="active"
                                    showInfo={false}
                                    size="small"
                                />
                            </div>
                        )}
                    </div>
                </Card>

                {/* 钱包列表卡片 */}
                {wallets.length > 0 && (
                    <Card
                        title="生成的钱包列表"
                        className="section-card"
                        bodyStyle={{ padding: '8px' }}
                        headStyle={{ padding: '8px 12px' }}
                        extra={
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={handleDownload}
                                size="small"
                            >
                                下载表格
                            </Button>
                        }
                    >
                        <div className="table-container">
                            <Table
                                dataSource={(() => {
                                    // 按助记词和派生索引分组
                                    const groups = wallets.reduce((acc, wallet) => {
                                        const key = `${wallet.mnemonic}-${wallet.derivationIndex}`;
                                        if (!acc[key]) {
                                            acc[key] = {
                                                id: wallet.id,
                                                mnemonic: wallet.mnemonic,
                                                derivationIndex: wallet.derivationIndex,
                                                wallets: {}
                                            };
                                        }
                                        acc[key].wallets[wallet.chain] = {
                                            privateKey: wallet.privateKey,
                                            address: wallet.address
                                        };
                                        return acc;
                                    }, {} as Record<string, GroupedWallet>);
                                    return Object.values(groups) as GroupedWallet[];
                                })()}
                                rowKey={(record: GroupedWallet) =>
                                    `${record.mnemonic}-${record.derivationIndex}`}
                                columns={[
                                    {
                                        title: '序号',
                                        dataIndex: 'id',
                                        key: 'id',
                                        width: 60,
                                    },
                                    {
                                        title: '派生索引',
                                        dataIndex: 'derivationIndex',
                                        key: 'derivationIndex',
                                        width: 80,
                                    },
                                    {
                                        title: '助记词',
                                        dataIndex: 'mnemonic',
                                        key: 'mnemonic',
                                        width: 240,
                                        render: (text: string) => {
                                            const words = text.split(' ');
                                            const displayText = words.length > 6
                                                ? `${words.slice(0, 3).join(' ')} ... ${words.slice(-3).join(' ')}`
                                                : text;

                                            return (
                                                <Typography.Text
                                                    className="monospace-text clickable-text"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(text);
                                                        message.success('助记词已复制到剪贴板');
                                                    }}
                                                >
                                                    {displayText}
                                                </Typography.Text>
                                            );
                                        },
                                    },
                                    ...options.chains.map((chain: ChainType) => ({
                                        title: chain,
                                        key: chain,
                                        children: [
                                            {
                                                title: '私钥',
                                                dataIndex: ['wallets', chain, 'privateKey'],
                                                key: `${chain}-privateKey`,
                                                width: 180,
                                                render: (text: string) => text && (
                                                    <Typography.Text
                                                        className="monospace-text clickable-text"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(text);
                                                            message.success('私钥已复制到剪贴板');
                                                        }}
                                                    >
                                                        {text.slice(0, 10)}...{text.slice(-8)}
                                                    </Typography.Text>
                                                ),
                                            },
                                            {
                                                title: '地址',
                                                dataIndex: ['wallets', chain, 'address'],
                                                key: `${chain}-address`,
                                                width: 180,
                                                render: (text: string) => text && (
                                                    <Typography.Text
                                                        className="monospace-text clickable-text"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(text);
                                                            message.success('地址已复制到剪贴板');
                                                        }}
                                                    >
                                                        {text.slice(0, 10)}...{text.slice(-8)}
                                                    </Typography.Text>
                                                ),
                                            },
                                        ],
                                    })),
                                ]}
                                size="small"
                                scroll={{ x: 'max-content' }}
                                pagination={{
                                    defaultPageSize: 10,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                }}
                            />
                        </div>
                    </Card>
                )}

                {/* 底部信息 */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '16px',
                    borderTop: '1px solid #f0f0f0',
                    paddingTop: '16px',
                    color: '#888'
                }}>
                    <Space direction="vertical" size={4}>
                        <div>
                            <a
                                href="https://github.com/0xachong/wallet_gen"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#1890ff' }}
                            >
                                <Space>
                                    <svg height="16" viewBox="0 0 16 16" width="16" aria-hidden="true">
                                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" fill="currentColor"></path>
                                    </svg>
                                    <span>GitHub</span>
                                </Space>
                            </a>
                        </div>
                        <div>
                            Made with ❤️ by <a
                                href="https://github.com/0xachong"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#1890ff' }}
                            >
                                0xachong
                            </a>
                        </div>
                    </Space>
                </div>
            </Card>
        </div>
    );
}; 