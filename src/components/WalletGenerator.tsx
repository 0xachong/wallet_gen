import React, { useState, useEffect } from 'react';
import { Card, Button, Radio, InputNumber, Progress, Space, Typography, Row, Col, message, Table, Input, Select } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { WalletInfo, ChainType, GenerateOptions } from '../types';
import { WalletGenerator as Generator } from '../utils/wallet';
import './WalletGenerator.css';

const { Title, Text } = Typography;

export const WalletGenerator: React.FC = () => {
    const [wallets, setWallets] = useState<WalletInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [options, setOptions] = useState<GenerateOptions>({
        wordCount: 12,
        language: 'en',
        chain: 'ETH',
        count: 10,
        processCount: 5,
        derivationCount: 1
    });
    const [mnemonicList, setMnemonicList] = useState('');

    const chains: ChainType[] = ['ETH', 'BSC', 'HECO', 'MATIC', 'FANTOM', 'SOL', 'TRX', 'SUI', 'APTOS', 'BITCOIN', 'BITCOIN_TESTNET', 'COSMOS', 'TON'];

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

    return (
        <div className="wallet-generator">
            <Card bordered={false}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: 30 }}>
                    批量生成ETH钱包地址
                </Title>

                <Row gutter={24}>
                    <Card title="选择批量生成钱包的链" className="section-card">
                        <Radio.Group
                            value={options.chain}
                            onChange={e => setOptions(prev => ({ ...prev, chain: e.target.value }))}
                            buttonStyle="solid"
                        >
                            <Space wrap>
                                {chains.map(chain => (
                                    <Radio.Button key={chain} value={chain}>
                                        {chain}
                                    </Radio.Button>
                                ))}
                            </Space>
                        </Radio.Group>

                        <div style={{ marginTop: 20 }}>
                            <Title level={5}>选择助记词长度</Title>
                            <Select
                                value={options.wordCount}
                                onChange={value => setOptions(prev => ({ ...prev, wordCount: value }))}
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
                        </div>

                        <div className="tips-card">
                            <Text type="secondary">
                                Tips: 钱包生成过程均在本地电脑完成，我们无法获取到您的助记词及私钥！
                            </Text>
                        </div>
                    </Card>
                </Row>

                <Card className="section-card">
                    <Row gutter={24}>
                        <Col span={8}>
                            <Title level={5}>生成助记词数量</Title>
                            <InputNumber
                                min={1}
                                max={100}
                                value={options.count}
                                onChange={value => setOptions(prev => ({ ...prev, count: value || 1 }))}
                                style={{ width: '100%' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Title level={5}>每个助记词派生数量</Title>
                            <InputNumber
                                min={1}
                                max={20}
                                value={options.derivationCount}
                                onChange={value => setOptions(prev => ({ ...prev, derivationCount: value || 1 }))}
                                style={{ width: '100%' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Title level={5}>导入助记词列表</Title>
                            <Input.TextArea
                                placeholder="每行一个助记词，例如：
word1 word2 word3 ... word12
word1 word2 word3 ... word12"
                                rows={4}
                                value={mnemonicList}
                                onChange={e => setMnemonicList(e.target.value)}
                            />
                        </Col>
                    </Row>
                </Card>

                <div className="actions" style={{ margin: '24px 0' }}>
                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={handleGenerate}
                        loading={loading}
                        size="large"
                    >
                        {loading ? '生成中...' : '重新生成'}
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleImportMnemonics}
                        disabled={!mnemonicList.trim()}
                        loading={loading}
                        size="large"
                    >
                        从助记词生成
                    </Button>
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                        disabled={wallets.length === 0}
                        size="large"
                    >
                        下载表格
                    </Button>
                </div>

                <Card className="section-card">
                    <div style={{ marginBottom: 10 }}>
                        Progress: {progress.current} / {progress.total}
                    </div>
                    <Progress
                        percent={Math.round((progress.current / progress.total) * 100)}
                        status="active"
                        showInfo={false}
                    />
                </Card>

                {wallets.length > 0 && (
                    <Card title="生成的钱包列表" className="section-card">
                        <div className="table-container">
                            <Table
                                dataSource={wallets}
                                columns={[
                                    {
                                        title: '序号',
                                        dataIndex: 'id',
                                        key: 'id',
                                        width: 80,
                                    },
                                    {
                                        title: '链',
                                        dataIndex: 'chain',
                                        key: 'chain',
                                        width: 100,
                                    },
                                    {
                                        title: '派生索引',
                                        dataIndex: 'derivationIndex',
                                        key: 'derivationIndex',
                                        width: 100,
                                    },
                                    {
                                        title: '助记词',
                                        dataIndex: 'mnemonic',
                                        key: 'mnemonic',
                                        width: '25%',
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
                                    {
                                        title: '私钥',
                                        dataIndex: 'privateKey',
                                        key: 'privateKey',
                                        width: '25%',
                                        render: (text: string) => (
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
                                        title: '钱包地址',
                                        dataIndex: 'address',
                                        key: 'address',
                                        width: '25%',
                                        render: (text: string) => (
                                            <Typography.Text
                                                className="monospace-text clickable-text"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(text);
                                                    message.success('地址已复制到剪贴板');
                                                }}
                                            >
                                                {text.slice(0, 6)}...{text.slice(-4)}
                                            </Typography.Text>
                                        ),
                                    }
                                ]}
                                pagination={false}
                                scroll={{ x: true }}
                                size="small"
                            />
                        </div>
                    </Card>
                )}
            </Card>
        </div >
    );
}; 