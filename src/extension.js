"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ethers_1 = require("ethers");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Tree Data Provider for Connection Status
class ConnectionProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    isConnected = false;
    chainId = null;
    networkName = '';
    rpcUrl = '';
    constructor() {
        this.refresh();
        // Auto-refresh every 30 seconds
        setInterval(() => this.refresh(), 30000);
    }
    refresh() {
        this.testConnection();
        this._onDidChangeTreeData.fire();
    }
    async testConnection() {
        try {
            const config = vscode.workspace.getConfiguration('ethFaucet');
            this.rpcUrl = config.get('rpcUrl', 'http://127.0.0.1:8545');
            const provider = new ethers_1.ethers.JsonRpcProvider(this.rpcUrl);
            const network = await Promise.race([
                provider.getNetwork(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            this.isConnected = true;
            this.chainId = Number(network.chainId);
            this.networkName = this.getNetworkName(this.chainId);
            vscode.commands.executeCommand('setContext', 'ethFaucet.connected', true);
        }
        catch (error) {
            this.isConnected = false;
            this.chainId = null;
            this.networkName = '';
            vscode.commands.executeCommand('setContext', 'ethFaucet.connected', false);
        }
    }
    getNetworkName(chainId) {
        const names = {
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
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            const items = [
                new ConnectionItem(this.isConnected ? '✅ Connected' : '❌ Disconnected', this.isConnected ?
                    `${this.networkName} (${this.chainId})` :
                    'No connection to RPC', vscode.TreeItemCollapsibleState.None),
                new ConnectionItem('RPC URL', this.rpcUrl, vscode.TreeItemCollapsibleState.None)
            ];
            if (this.isConnected && this.chainId === 1337) {
                items.push(new ConnectionItem('💡 Tip', 'Local dev node detected - ready for testing!', vscode.TreeItemCollapsibleState.None));
            }
            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }
}
class ConnectionItem extends vscode.TreeItem {
    label;
    description;
    collapsibleState;
    constructor(label, description, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.tooltip = `${this.label}: ${this.description}`;
        this.description = description;
    }
}
// Tree Data Provider for Accounts
class AccountsProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    accounts = [];
    refresh() {
        this.loadAccounts();
        this._onDidChangeTreeData.fire();
    }
    async loadAccounts() {
        try {
            const config = vscode.workspace.getConfiguration('ethFaucet');
            const rpcUrl = config.get('rpcUrl', 'http://127.0.0.1:8545');
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            // Get first few accounts from the provider
            const accountAddresses = await provider.listAccounts();
            this.accounts = [];
            for (let i = 0; i < Math.min(5, accountAddresses.length); i++) {
                const address = accountAddresses[i].address;
                const balance = await provider.getBalance(address);
                this.accounts.push({
                    address,
                    balance: ethers_1.ethers.formatEther(balance)
                });
            }
        }
        catch (error) {
            this.accounts = [];
        }
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.accounts.map(account => new AccountItem(`${account.address.slice(0, 6)}...${account.address.slice(-4)}`, `${parseFloat(account.balance).toFixed(4)} ETH`, account.address, vscode.TreeItemCollapsibleState.None)));
        }
        return Promise.resolve([]);
    }
}
class AccountItem extends vscode.TreeItem {
    label;
    description;
    fullAddress;
    collapsibleState;
    constructor(label, description, fullAddress, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.fullAddress = fullAddress;
        this.collapsibleState = collapsibleState;
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
class FaucetProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            const config = vscode.workspace.getConfiguration('ethFaucet');
            const frequentAddresses = config.get('frequentAddresses', []);
            const items = [
                new FaucetItem('💸 Send ETH', 'Click to send ETH to any address', vscode.TreeItemCollapsibleState.None, {
                    command: 'ethFaucet.sendEth',
                    title: 'Send ETH'
                })
            ];
            if (frequentAddresses.length > 0) {
                items.push(new FaucetItem('📋 Frequent Addresses', `${frequentAddresses.length} saved`, vscode.TreeItemCollapsibleState.Expanded));
            }
            return Promise.resolve(items);
        }
        else if (element.label === '📋 Frequent Addresses') {
            const config = vscode.workspace.getConfiguration('ethFaucet');
            const frequentAddresses = config.get('frequentAddresses', []);
            return Promise.resolve(frequentAddresses.map(addr => new FaucetItem(addr.label || `${addr.address.slice(0, 6)}...${addr.address.slice(-4)}`, addr.address.slice(0, 6) + '...' + addr.address.slice(-4), vscode.TreeItemCollapsibleState.None, {
                command: 'ethFaucet.quickSend',
                title: 'Quick Send',
                arguments: [addr.address]
            }, 'recipient')));
        }
        return Promise.resolve([]);
    }
}
class FaucetItem extends vscode.TreeItem {
    label;
    description;
    collapsibleState;
    command;
    contextValue;
    constructor(label, description, collapsibleState, command, contextValue) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.contextValue = contextValue;
        this.tooltip = this.description;
        this.command = command;
        this.contextValue = contextValue;
    }
}
// Transaction History Provider
class HistoryProvider {
    context;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    transactions = [];
    constructor(context) {
        this.context = context;
        this.loadHistory();
    }
    addTransaction(hash, to, amount, status) {
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
    loadHistory() {
        const saved = this.context.globalState.get('ethFaucet.history', []);
        this.transactions = saved;
        vscode.commands.executeCommand('setContext', 'ethFaucet.hasHistory', this.transactions.length > 0);
    }
    saveHistory() {
        this.context.globalState.update('ethFaucet.history', this.transactions);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.transactions.map(tx => {
                const date = new Date(tx.timestamp).toLocaleDateString();
                const time = new Date(tx.timestamp).toLocaleTimeString();
                return new HistoryItem(`${tx.status === 'success' ? '✅' : '❌'} ${tx.amount} ETH`, `to ${tx.to.slice(0, 6)}...${tx.to.slice(-4)} • ${date} ${time}`, tx.hash, vscode.TreeItemCollapsibleState.None);
            }));
        }
        return Promise.resolve([]);
    }
}
class HistoryItem extends vscode.TreeItem {
    label;
    description;
    txHash;
    collapsibleState;
    constructor(label, description, txHash, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.txHash = txHash;
        this.collapsibleState = collapsibleState;
        this.tooltip = `Transaction: ${this.txHash}`;
        this.command = {
            command: 'ethFaucet.copyAddress',
            title: 'Copy Transaction Hash',
            arguments: [this.txHash]
        };
    }
}
// Auto-detect blockchain configuration files
async function detectBlockchainConfig() {
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
                    }
                    catch (error) {
                        continue;
                    }
                }
                else {
                    return true;
                }
            }
        }
    }
    return false;
}
function activate(context) {
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
        vscode.commands.registerCommand('ethFaucet.quickSend', async (address) => {
            if (!address) {
                vscode.window.showErrorMessage('No address provided');
                return;
            }
            await sendEthTransaction(address, '1.0');
        }),
        vscode.commands.registerCommand('ethFaucet.copyAddress', (address) => {
            vscode.env.clipboard.writeText(address);
            vscode.window.showInformationMessage(`Address copied: ${address.slice(0, 6)}...${address.slice(-4)}`);
        }),
        vscode.commands.registerCommand('ethFaucet.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'ethFaucet');
        })
    ];
    // Send ETH transaction function
    async function sendEthTransaction(recipient, amount) {
        try {
            const config = vscode.workspace.getConfiguration('ethFaucet');
            const rpcUrl = config.get('rpcUrl', 'http://127.0.0.1:8545');
            vscode.window.showInformationMessage(`Sending ${amount} ETH to ${recipient}...`);
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            // Resolve ENS if needed
            let targetAddress = recipient;
            if (recipient.endsWith('.eth')) {
                // Use mainnet for ENS resolution
                const mainnetProvider = new ethers_1.ethers.JsonRpcProvider('https://cloudflare-eth.com');
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
                value: ethers_1.ethers.parseEther(amount)
            });
            vscode.window.showInformationMessage(`🚀 Transaction sent! Hash: ${tx.hash.slice(0, 10)}...`);
            const receipt = await tx.wait();
            if (receipt && receipt.status === 1) {
                vscode.window.showInformationMessage(`✅ Transaction confirmed! Sent ${amount} ETH to ${recipient}`);
                // Add to transaction history
                historyProvider.addTransaction(tx.hash, targetAddress, amount, 'success');
                // Add to frequent addresses if not already there
                const frequentAddresses = config.get('frequentAddresses', []);
                if (!frequentAddresses.find(addr => addr.address.toLowerCase() === targetAddress.toLowerCase())) {
                    frequentAddresses.push({
                        address: targetAddress,
                        label: recipient.endsWith('.eth') ? recipient : ''
                    });
                    await config.update('frequentAddresses', frequentAddresses, vscode.ConfigurationTarget.Workspace);
                }
                // Refresh views
                accountsProvider.refresh();
            }
            else {
                vscode.window.showErrorMessage('❌ Transaction failed');
                historyProvider.addTransaction(tx.hash, targetAddress, amount, 'failed');
            }
        }
        catch (error) {
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
function deactivate() { }
//# sourceMappingURL=extension.js.map