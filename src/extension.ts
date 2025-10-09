import * as vscode from 'vscode';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Tree Data Provider for Connection Status
class ConnectionProvider implements vscode.TreeDataProvider<ConnectionItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ConnectionItem | undefined | null | void> = new vscode.EventEmitter<ConnectionItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ConnectionItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private isConnected = false;
    private chainId: number | null = null;
    private networkName = '';
    private rpcUrl = '';

    constructor() {
        this.refresh();
        // Auto-refresh every 30 seconds
        setInterval(() => this.refresh(), 30000);
    }

    refresh(): void {
        this.testConnection();
        this._onDidChangeTreeData.fire();
    }

    private async testConnection() {
        try {
            const config = vscode.workspace.getConfiguration('ethFaucet');
            this.rpcUrl = config.get('rpcUrl', 'http://127.0.0.1:8545');
            
            const provider = new ethers.JsonRpcProvider(this.rpcUrl);
            const network = await Promise.race([
                provider.getNetwork(),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ]);

            this.isConnected = true;
            this.chainId = Number(network.chainId);
            this.networkName = this.getNetworkName(this.chainId);
            
            vscode.commands.executeCommand('setContext', 'ethFaucet.connected', true);
        } catch (error) {
            this.isConnected = false;
            this.chainId = null;
            this.networkName = '';
            vscode.commands.executeCommand('setContext', 'ethFaucet.connected', false);
        }
    }

    private getNetworkName(chainId: number): string {
        const names: Record<number, string> = {
            1: 'Ethereum Mainnet',
            11155111: 'Sepolia Testnet',
            5: 'Goerli Testnet',
            1337: 'Local Geth Dev',
            31337: 'Hardhat Local',
            80001: 'Polygon Mumbai',
            421614: 'Arbitrum Sepolia',
            11155420: 'Optimism Sepolia',
            84532: 'Base Sepolia'
        };
        return names[chainId] || `Chain ${chainId}`;
    }

    getTreeItem(element: ConnectionItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ConnectionItem): Thenable<ConnectionItem[]> {
        if (!element) {
            const items: ConnectionItem[] = [
                new ConnectionItem(
                    this.isConnected ? '✅ Connected' : '❌ Disconnected',
                    this.isConnected ? 
                        `${this.networkName} (${this.chainId})` : 
                        'No connection to RPC',
                    vscode.TreeItemCollapsibleState.None
                ),
                new ConnectionItem(
                    'RPC URL',
                    this.rpcUrl,
                    vscode.TreeItemCollapsibleState.None
                )
            ];

            if (this.isConnected && this.chainId === 1337) {
                items.push(new ConnectionItem(
                    '💡 Tip',
                    'Local dev node detected - ready for testing!',
                    vscode.TreeItemCollapsibleState.None
                ));
            }

            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }
}

class ConnectionItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}: ${this.description}`;
        this.description = description;
    }
}

// Tree Data Provider for Accounts
class AccountsProvider implements vscode.TreeDataProvider<AccountItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AccountItem | undefined | null | void> = new vscode.EventEmitter<AccountItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AccountItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private accounts: Array<{address: string, balance: string}> = [];

    refresh(): void {
        this.loadAccounts();
        this._onDidChangeTreeData.fire();
    }

    private async loadAccounts() {
        try {
            const config = vscode.workspace.getConfiguration('ethFaucet');
            const rpcUrl = config.get('rpcUrl', 'http://127.0.0.1:8545');
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            
            // Get first few accounts from the provider
            const accountAddresses = await provider.listAccounts();
            
            this.accounts = [];
            for (let i = 0; i < Math.min(5, accountAddresses.length); i++) {
                const address = accountAddresses[i].address;
                const balance = await provider.getBalance(address);
                this.accounts.push({
                    address,
                    balance: ethers.formatEther(balance)
                });
            }
        } catch (error) {
            this.accounts = [];
        }
    }

    getTreeItem(element: AccountItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: AccountItem): Thenable<AccountItem[]> {
        if (!element) {
            return Promise.resolve(
                this.accounts.map(account => 
                    new AccountItem(
                        `${account.address.slice(0, 6)}...${account.address.slice(-4)}`,
                        `${parseFloat(account.balance).toFixed(4)} ETH`,
                        account.address,
                        vscode.TreeItemCollapsibleState.None
                    )
                )
            );
        }
        return Promise.resolve([]);
    }
}

class AccountItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly fullAddress: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.fullAddress}\nBalance: ${this.description}`;
        this.contextValue = 'account';
        this.command = {
            command: 'ethFaucet.copyAddress',
            title: 'Copy Address',
            arguments: [this.fullAddress]
        };
    }
}

// Tree Data Provider for Faucet
class FaucetProvider implements vscode.TreeDataProvider<FaucetItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FaucetItem | undefined | null | void> = new vscode.EventEmitter<FaucetItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FaucetItem | undefined | null | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: FaucetItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FaucetItem): Thenable<FaucetItem[]> {
        if (!element) {
            const config = vscode.workspace.getConfiguration('ethFaucet');
            const frequentAddresses = config.get('frequentAddresses', []) as Array<{address: string, label: string}>;
            
            const items: FaucetItem[] = [
                new FaucetItem(
                    '💸 Send ETH',
                    'Click to send ETH to any address',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'ethFaucet.sendEth',
                        title: 'Send ETH'
                    }
                )
            ];

            if (frequentAddresses.length > 0) {
                items.push(new FaucetItem(
                    '📋 Frequent Addresses',
                    `${frequentAddresses.length} saved`,
                    vscode.TreeItemCollapsibleState.Expanded
                ));
            }

            return Promise.resolve(items);
        } else if (element.label === '📋 Frequent Addresses') {
            const config = vscode.workspace.getConfiguration('ethFaucet');
            const frequentAddresses = config.get('frequentAddresses', []) as Array<{address: string, label: string}>;
            
            return Promise.resolve(
                frequentAddresses.map(addr => 
                    new FaucetItem(
                        addr.label || `${addr.address.slice(0, 6)}...${addr.address.slice(-4)}`,
                        addr.address.slice(0, 6) + '...' + addr.address.slice(-4),
                        vscode.TreeItemCollapsibleState.None,
                        {
                            command: 'ethFaucet.quickSend',
                            title: 'Quick Send',
                            arguments: [addr.address]
                        },
                        'recipient'
                    )
                )
            );
        }
        return Promise.resolve([]);
    }
}

class FaucetItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        public readonly contextValue?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = this.description;
        this.command = command;
        this.contextValue = contextValue;
    }
}

// Transaction History Provider
class HistoryProvider implements vscode.TreeDataProvider<HistoryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HistoryItem | undefined | null | void> = new vscode.EventEmitter<HistoryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<HistoryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private transactions: Array<{hash: string, to: string, amount: string, timestamp: number, status: 'success' | 'failed'}> = [];

    constructor(private context: vscode.ExtensionContext) {
        this.loadHistory();
    }

    addTransaction(hash: string, to: string, amount: string, status: 'success' | 'failed') {
        this.transactions.unshift({
            hash,
            to,
            amount,
            timestamp: Date.now(),
            status
        });
        
        // Keep only last 50 transactions
        this.transactions = this.transactions.slice(0, 50);
        this.saveHistory();
        this._onDidChangeTreeData.fire();
        
        // Update context to show history view
        vscode.commands.executeCommand('setContext', 'ethFaucet.hasHistory', this.transactions.length > 0);
    }

    private loadHistory() {
        const saved = this.context.globalState.get('ethFaucet.history', []) as Array<any>;
        this.transactions = saved;
        vscode.commands.executeCommand('setContext', 'ethFaucet.hasHistory', this.transactions.length > 0);
    }

    private saveHistory() {
        this.context.globalState.update('ethFaucet.history', this.transactions);
    }

    getTreeItem(element: HistoryItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: HistoryItem): Thenable<HistoryItem[]> {
        if (!element) {
            return Promise.resolve(
                this.transactions.map(tx => {
                    const date = new Date(tx.timestamp).toLocaleDateString();
                    const time = new Date(tx.timestamp).toLocaleTimeString();
                    return new HistoryItem(
                        `${tx.status === 'success' ? '✅' : '❌'} ${tx.amount} ETH`,
                        `to ${tx.to.slice(0, 6)}...${tx.to.slice(-4)} • ${date} ${time}`,
                        tx.hash,
                        vscode.TreeItemCollapsibleState.None
                    );
                })
            );
        }
        return Promise.resolve([]);
    }
}

class HistoryItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly txHash: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `Transaction: ${this.txHash}`;
        this.command = {
            command: 'ethFaucet.copyAddress',
            title: 'Copy Transaction Hash',
            arguments: [this.txHash]
        };
    }
}

// Auto-detect blockchain configuration files
async function detectBlockchainConfig(): Promise<boolean> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return false;
    }

    const configFiles = [
        'hardhat.config.js',
        'hardhat.config.ts', 
        'foundry.toml',
        'truffle-config.js',
        'brownie-config.yaml',
        'package.json' // Check for blockchain-related dependencies
    ];

    for (const folder of workspaceFolders) {
        for (const configFile of configFiles) {
            const configPath = path.join(folder.uri.fsPath, configFile);
            if (fs.existsSync(configPath)) {
                // Additional check for package.json to see if it has blockchain deps
                if (configFile === 'package.json') {
                    try {
                        const packageJson = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                        if (deps.hardhat || deps.ethers || deps.web3 || deps['@foundry-rs/foundry']) {
                            return true;
                        }
                    } catch (error) {
                        continue;
                    }
                } else {
                    return true;
                }
            }
        }
    }
    return false;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('ETH Faucet extension is now active!');

    // Initialize providers
    const connectionProvider = new ConnectionProvider();
    const accountsProvider = new AccountsProvider();
    const faucetProvider = new FaucetProvider();
    const historyProvider = new HistoryProvider(context);

    // Register tree data providers
    vscode.window.registerTreeDataProvider('ethFaucet.connection', connectionProvider);
    vscode.window.registerTreeDataProvider('ethFaucet.accounts', accountsProvider);
    vscode.window.registerTreeDataProvider('ethFaucet.faucet', faucetProvider);
    vscode.window.registerTreeDataProvider('ethFaucet.history', historyProvider);

    // Auto-detect blockchain configuration
    detectBlockchainConfig().then(hasConfig => {
        vscode.commands.executeCommand('setContext', 'workspaceHasEthereumConfig', hasConfig);
        vscode.commands.executeCommand('setContext', 'ethFaucet.forceShow', true);
    });

    // Register commands
    const commands = [
        vscode.commands.registerCommand('ethFaucet.refresh', () => {
            connectionProvider.refresh();
            accountsProvider.refresh();
        }),

        vscode.commands.registerCommand('ethFaucet.sendEth', async () => {
            const recipient = await vscode.window.showInputBox({
                prompt: 'Enter recipient address or ENS name',
                placeHolder: '0x742d35Cc6634C0532925a3b8D62B8bDD65b9b22d or vitalik.eth'
            });

            if (!recipient) {
                return;
            }

            const amount = await vscode.window.showInputBox({
                prompt: 'Enter amount in ETH (0-10)',
                placeHolder: '1.0',
                validateInput: (value) => {
                    const num = parseFloat(value);
                    if (isNaN(num) || num <= 0 || num > 10) {
                        return 'Please enter a valid amount between 0 and 10 ETH';
                    }
                    return null;
                }
            });

            if (!amount) {
                return;
            }

            await sendEthTransaction(recipient, amount);
        }),

        vscode.commands.registerCommand('ethFaucet.quickSend', async (address?: string) => {
            if (!address) {
                vscode.window.showErrorMessage('No address provided');
                return;
            }
            await sendEthTransaction(address, '1.0');
        }),

        vscode.commands.registerCommand('ethFaucet.copyAddress', (address: string) => {
            vscode.env.clipboard.writeText(address);
            vscode.window.showInformationMessage(`Address copied: ${address.slice(0, 6)}...${address.slice(-4)}`);
        }),

        vscode.commands.registerCommand('ethFaucet.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'ethFaucet');
        })
    ];

    // Send ETH transaction function
    async function sendEthTransaction(recipient: string, amount: string) {
        try {
            const config = vscode.workspace.getConfiguration('ethFaucet');
            const rpcUrl = config.get('rpcUrl', 'http://127.0.0.1:8545');
            
            vscode.window.showInformationMessage(`Sending ${amount} ETH to ${recipient}...`);
            
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            
            // Resolve ENS if needed
            let targetAddress = recipient;
            if (recipient.endsWith('.eth')) {
                // Use mainnet for ENS resolution
                const mainnetProvider = new ethers.JsonRpcProvider('https://cloudflare-eth.com');
                const resolved = await mainnetProvider.resolveName(recipient);
                if (!resolved) {
                    throw new Error(`Could not resolve ENS name: ${recipient}`);
                }
                targetAddress = resolved;
                vscode.window.showInformationMessage(`✅ ENS resolved: ${recipient} → ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`);
            }

            const signer = await provider.getSigner(0);
            const tx = await signer.sendTransaction({
                to: targetAddress,
                value: ethers.parseEther(amount)
            });

            vscode.window.showInformationMessage(`🚀 Transaction sent! Hash: ${tx.hash.slice(0, 10)}...`);
            
            const receipt = await tx.wait();
            if (receipt && receipt.status === 1) {
                vscode.window.showInformationMessage(`✅ Transaction confirmed! Sent ${amount} ETH to ${recipient}`);
                
                // Add to transaction history
                historyProvider.addTransaction(tx.hash, targetAddress, amount, 'success');
                
                // Add to frequent addresses if not already there
                const frequentAddresses = config.get('frequentAddresses', []) as Array<{address: string, label: string}>;
                if (!frequentAddresses.find(addr => addr.address.toLowerCase() === targetAddress.toLowerCase())) {
                    frequentAddresses.push({
                        address: targetAddress,
                        label: recipient.endsWith('.eth') ? recipient : ''
                    });
                    await config.update('frequentAddresses', frequentAddresses, vscode.ConfigurationTarget.Workspace);
                }
                
                // Refresh views
                accountsProvider.refresh();
            } else {
                vscode.window.showErrorMessage('❌ Transaction failed');
                historyProvider.addTransaction(tx.hash, targetAddress, amount, 'failed');
            }
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`❌ Transaction failed: ${errorMessage}`);
            // Add failed transaction to history if we have the details
            if (recipient && amount) {
                historyProvider.addTransaction('failed', recipient, amount, 'failed');
            }
        }
    }

    context.subscriptions.push(...commands);
}

export function deactivate() {}
