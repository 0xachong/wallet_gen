import React, { useState } from 'react';
import { Card, Button, Radio, InputNumber, Progress, Space, Typography, Row, Col, message, Table } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { WalletInfo, ChainType, GenerateOptions } from '../types';
import { WalletGenerator as Generator } from '../utils/wallet';
import './WalletGenerator.css';

const { Title, Text } = Typography;

export const WalletGenerator: React.FC = () => {
    const [wallets, setWallets] = useState<WalletInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<GenerateOptions>({
        wordCount: 12,
        language: 'en',
        chain: 'ETH',
        count: 10,
        processCount: 5
    });

    const chains: ChainType[] = ['ETH', 'BSC', 'HECO', 'MATIC', 'FANTOM', 'SOL', 'TRX', 'SUI', 'APTOS', 'BITCOIN', 'BITCOIN_TESTNET', 'COSMOS', 'TON'];

    const handleGenerate = async () => {
        setLoading(true);
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

    return (
        <div className="wallet-generator">
            <Card bordered={false}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: 30 }}>
                    批量生成ETH钱包地址
                </Title>

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
                    <div className="tips-card">
                        <Text type="secondary">
                            Tips: 钱包生成过程均在本地电脑完成，我们无法获取到您的助记词及私钥！
                        </Text>
                    </div>
                </Card>

                <Card title="选择助记词长度" className="section-card">
                    <Radio.Group
                        value={options.wordCount}
                        onChange={e => setOptions(prev => ({ ...prev, wordCount: e.target.value }))}
                        buttonStyle="solid"
                    >
                        <Space>
                            {[12, 15, 18, 21, 24].map(length => (
                                <Radio.Button key={length} value={length}>
                                    {length}位
                                </Radio.Button>
                            ))}
                        </Space>
                    </Radio.Group>
                </Card>

                <Card className="section-card">
                    <Row gutter={24}>
                        <Col span={12}>
                            <Title level={5}>进程数</Title>
                            <InputNumber
                                min={1}
                                max={20}
                                value={options.processCount}
                                onChange={value => setOptions(prev => ({ ...prev, processCount: value || 1 }))}
                                style={{ width: '100%' }}
                            />
                        </Col>
                        <Col span={12}>
                            <Title level={5}>生成的钱包地址数量</Title>
                            <InputNumber
                                min={1}
                                max={100}
                                value={options.count}
                                onChange={value => setOptions(prev => ({ ...prev, count: value || 1 }))}
                                style={{ width: '100%' }}
                            />
                        </Col>
                    </Row>
                </Card>

                <Card className="section-card">
                    <div style={{ marginBottom: 10 }}>
                        Progress: {wallets.length} / {options.count}
                    </div>
                    <Progress
                        percent={Math.round((wallets.length / options.count) * 100)}
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
                                        title: '助记词',
                                        dataIndex: 'mnemonic',
                                        key: 'mnemonic',
                                        ellipsis: true,
                                    },
                                    {
                                        title: '钱包地址',
                                        dataIndex: 'address',
                                        key: 'address',
                                        ellipsis: true,
                                        render: (text: string) => (
                                            <Typography.Text copyable>{text}</Typography.Text>
                                        ),
                                    },
                                    {
                                        title: '私钥',
                                        dataIndex: 'privateKey',
                                        key: 'privateKey',
                                        ellipsis: true,
                                        render: (text: string) => (
                                            <Typography.Text copyable>{text}</Typography.Text>
                                        ),
                                    },
                                ]}
                                pagination={false}
                                scroll={{ x: true }}
                                size="small"
                            />
                        </div>
                    </Card>
                )}

                <div className="actions">
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
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                        disabled={wallets.length === 0}
                        size="large"
                    >
                        下载表格
                    </Button>
                </div>
            </Card>
        </div>
    );
}; 