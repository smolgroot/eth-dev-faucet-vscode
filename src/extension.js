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
                new ConnectionItem(this.isConnected ? 'Connected' : 'Disconnected', this.isConnected ?
                    `${this.networkName} (${this.chainId})` :
                    'No connection to RPC', vscode.TreeItemCollapsibleState.None, this.isConnected ? 'plug' : 'debug-disconnect'),
                new ConnectionItem('RPC URL', this.rpcUrl, vscode.TreeItemCollapsibleState.None, 'link')
            ];
            if (this.isConnected && this.chainId === 1337) {
                items.push(new ConnectionItem('Tip', 'Local dev node detected - ready for testing!', vscode.TreeItemCollapsibleState.None, 'lightbulb'));
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
    constructor(label, description, collapsibleState, iconId) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.tooltip = `${this.label}: ${this.description}`;
        this.description = description;
        if (iconId) {
            this.iconPath = new vscode.ThemeIcon(iconId);
        }
    }
}
// Tree Data Provider for Accounts
class AccountsProvider {
    context;
    historyProvider;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    accounts = [];
    constructor(context, historyProvider) {
        this.context = context;
        this.historyProvider = historyProvider;
    }
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
            const items = [];
            // Add current accounts with balances
            if (this.accounts.length > 0) {
                items.push(new AccountItem('Local Accounts', '', '', vscode.TreeItemCollapsibleState.None, 'separator', 'server-environment'));
                items.push(...this.accounts.map(account => new AccountItem(`${account.address.slice(0, 6)}...${account.address.slice(-4)}`, `${parseFloat(account.balance).toFixed(4)} ETH`, account.address, vscode.TreeItemCollapsibleState.None, 'localAccount', 'account')));
            }
            // Add used addresses from transaction history
            const history = this.context.globalState.get('ethFaucet.history', []);
            const usedAddresses = new Set();
            history.forEach((tx) => {
                if (tx.to && ethers_1.ethers.isAddress(tx.to)) {
                    usedAddresses.add(tx.to);
                }
            });
            if (usedAddresses.size > 0) {
                items.push(new AccountItem('Recently Used', '', '', vscode.TreeItemCollapsibleState.None, 'separator', 'history'));
                Array.from(usedAddresses).slice(0, 10).forEach(address => {
                    items.push(new AccountItem(`${address.slice(0, 6)}...${address.slice(-4)}`, 'Quick Send Available', address, vscode.TreeItemCollapsibleState.None, 'usedAddress', 'send'));
                });
            }
            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }
}
class AccountItem extends vscode.TreeItem {
    label;
    description;
    fullAddress;
    collapsibleState;
    contextValue;
    constructor(label, description, fullAddress, collapsibleState, contextValue = 'account', iconId) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.fullAddress = fullAddress;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.tooltip = this.fullAddress ? `${this.fullAddress}\n${this.description}` : this.description;
        this.contextValue = contextValue;
        if (iconId) {
            this.iconPath = new vscode.ThemeIcon(iconId);
        }
        // Only add command for actual addresses, not separators
        if (this.fullAddress && ethers_1.ethers.isAddress(this.fullAddress)) {
            this.command = {
                command: 'ethFaucet.copyAddress',
                title: 'Copy Address',
                arguments: [this.fullAddress]
            };
        }
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
                new FaucetItem('Amount Range', '0.1 - 10 ETH per transaction', vscode.TreeItemCollapsibleState.None, undefined, 'info', 'info'),
                new FaucetItem('Target Network', 'Local development chains only', vscode.TreeItemCollapsibleState.None, undefined, 'info', 'symbol-network')
            ];
            if (frequentAddresses.length > 0) {
                items.push(new FaucetItem('Frequent Addresses', `${frequentAddresses.length} saved`, vscode.TreeItemCollapsibleState.Expanded, undefined, undefined, 'bookmark'));
            }
            return Promise.resolve(items);
        }
        else if (element.label === 'Frequent Addresses') {
            const config = vscode.workspace.getConfiguration('ethFaucet');
            const frequentAddresses = config.get('frequentAddresses', []);
            return Promise.resolve(frequentAddresses.map(addr => new FaucetItem(addr.label || `${addr.address.slice(0, 6)}...${addr.address.slice(-4)}`, addr.address.slice(0, 6) + '...' + addr.address.slice(-4), vscode.TreeItemCollapsibleState.None, {
                command: 'ethFaucet.quickSend',
                title: 'Quick Send',
                arguments: [addr.address]
            }, 'recipient', 'account')));
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
    constructor(label, description, collapsibleState, command, contextValue, iconId) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.contextValue = contextValue;
        this.tooltip = this.description;
        this.command = command;
        this.contextValue = contextValue;
        if (iconId) {
            this.iconPath = new vscode.ThemeIcon(iconId);
        }
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
    clearHistory() {
        this.transactions = [];
        this.saveHistory();
        this._onDidChangeTreeData.fire();
        vscode.commands.executeCommand('setContext', 'ethFaucet.hasHistory', false);
        vscode.window.showInformationMessage('Transaction history cleared');
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.transactions.map(tx => {
                const date = new Date(tx.timestamp).toLocaleDateString();
                const time = new Date(tx.timestamp).toLocaleTimeString();
                return new HistoryItem(`${tx.amount} ETH`, `to ${tx.to.slice(0, 6)}...${tx.to.slice(-4)} • ${date} ${time}`, tx.hash, vscode.TreeItemCollapsibleState.None, tx.status === 'success' ? 'check' : 'error');
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
    constructor(label, description, txHash, collapsibleState, iconId) {
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
        if (iconId) {
            this.iconPath = new vscode.ThemeIcon(iconId);
        }
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
    const faucetProvider = new FaucetProvider();
    const historyProvider = new HistoryProvider(context);
    const accountsProvider = new AccountsProvider(context, historyProvider);
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
    // ENS Resolution Function
    async function resolveENSName(ensName) {
        // For ENS resolution, we MUST use mainnet - ENS contracts don't exist on local networks
        const providers = [
            'https://cloudflare-eth.com',
            'https://eth.llamarpc.com',
            'https://1rpc.io/eth'
        ];
        for (const providerUrl of providers) {
            try {
                const mainnetProvider = new ethers_1.ethers.JsonRpcProvider(providerUrl);
                // Test connection and resolve ENS name
                await mainnetProvider.getNetwork(); // Test connection
                const resolved = await mainnetProvider.resolveName(ensName);
                if (resolved) {
                    return resolved;
                }
            }
            catch (error) {
                console.log(`ENS Provider ${providerUrl} failed, trying next...`, error);
                continue;
            }
        }
        throw new Error(`Could not resolve ENS name: ${ensName}. Make sure you have internet connectivity for ENS resolution.`);
    }
    // Register commands
    const commands = [
        vscode.commands.registerCommand('ethFaucet.refresh', () => {
            connectionProvider.refresh();
            accountsProvider.refresh();
        }),
        vscode.commands.registerCommand('ethFaucet.clearHistory', () => {
            historyProvider.clearHistory();
            accountsProvider.refresh(); // Refresh accounts to update used addresses
        }),
        vscode.commands.registerCommand('ethFaucet.sendEth', async () => {
            const recipient = await vscode.window.showInputBox({
                prompt: 'Enter recipient address or ENS name',
                placeHolder: '0x742d35Cc6634C0532925a3b8D62B8bDD65b9b22d or vitalik.eth'
            });
            if (!recipient) {
                return;
            }
            // Resolve ENS name first if needed
            let targetAddress = recipient;
            if (recipient.endsWith('.eth')) {
                try {
                    vscode.window.showInformationMessage(`Resolving ENS name: ${recipient}...`);
                    targetAddress = await resolveENSName(recipient);
                    // Validate that we got a proper address
                    if (!ethers_1.ethers.isAddress(targetAddress)) {
                        throw new Error(`ENS resolution returned invalid address: ${targetAddress}`);
                    }
                    vscode.window.showInformationMessage(`ENS resolved: ${recipient} → ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`);
                    console.log(`DEBUG: ENS resolved ${recipient} to ${targetAddress}`);
                }
                catch (error) {
                    vscode.window.showErrorMessage(`ENS Resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    return;
                }
            }
            else {
                // Validate regular address
                if (!ethers_1.ethers.isAddress(recipient)) {
                    vscode.window.showErrorMessage('❌ Invalid Ethereum address format');
                    return;
                }
            }
            const amount = await vscode.window.showInputBox({
                prompt: `Enter amount in ETH (sending to ${recipient !== targetAddress ? recipient : targetAddress.slice(0, 6) + '...' + targetAddress.slice(-4)})`,
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
            await sendEthTransaction(targetAddress, amount, recipient);
        }),
        vscode.commands.registerCommand('ethFaucet.copyAddress', (address) => {
            vscode.env.clipboard.writeText(address);
            vscode.window.showInformationMessage(`Address copied: ${address.slice(0, 6)}...${address.slice(-4)}`);
        }),
        vscode.commands.registerCommand('ethFaucet.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'ethFaucet');
        }),
        vscode.commands.registerCommand('ethFaucet.clearHistory', () => {
            historyProvider.clearHistory();
            // Refresh accounts to update used addresses list
            accountsProvider.refresh();
        }),
        vscode.commands.registerCommand('ethFaucet.quickSend', async (accountItem) => {
            let address = '';
            if (accountItem && accountItem.fullAddress) {
                address = accountItem.fullAddress;
            }
            if (!address || !ethers_1.ethers.isAddress(address)) {
                vscode.window.showErrorMessage('Invalid address for quick send');
                return;
            }
            const amount = await vscode.window.showInputBox({
                prompt: `Quick send to ${address.slice(0, 6)}...${address.slice(-4)}`,
                placeHolder: '1.0',
                value: '1.0',
                validateInput: (value) => {
                    const num = parseFloat(value);
                    if (isNaN(num) || num <= 0 || num > 10) {
                        return 'Please enter a valid amount between 0.1 and 10 ETH';
                    }
                    return null;
                }
            });
            if (!amount) {
                return;
            }
            await sendEthTransaction(address, amount, address);
        })
    ];
    // Send ETH transaction function
    async function sendEthTransaction(targetAddress, amount, originalRecipient) {
        try {
            console.log(`DEBUG: sendEthTransaction called with targetAddress: ${targetAddress}, amount: ${amount}, originalRecipient: ${originalRecipient}`);
            // Validate that targetAddress is a proper address (not ENS name)
            if (!ethers_1.ethers.isAddress(targetAddress)) {
                throw new Error(`Invalid target address format: ${targetAddress}`);
            }
            if (targetAddress.endsWith('.eth')) {
                throw new Error(`ENS name passed to transaction function: ${targetAddress}. This should have been resolved first.`);
            }
            const config = vscode.workspace.getConfiguration('ethFaucet');
            const rpcUrl = config.get('rpcUrl', 'http://127.0.0.1:8545');
            const displayName = originalRecipient || targetAddress;
            vscode.window.showInformationMessage(`Sending ${amount} ETH to ${displayName}...`);
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            const signer = await provider.getSigner(0);
            console.log(`DEBUG: About to send transaction to ${targetAddress} with amount ${amount} ETH`);
            const tx = await signer.sendTransaction({
                to: targetAddress,
                value: ethers_1.ethers.parseEther(amount)
            });
            vscode.window.showInformationMessage(`Transaction sent! Hash: ${tx.hash.slice(0, 10)}...`);
            const receipt = await tx.wait();
            if (receipt && receipt.status === 1) {
                vscode.window.showInformationMessage(`Transaction confirmed! Sent ${amount} ETH to ${displayName}`);
                // Add to transaction history
                historyProvider.addTransaction(tx.hash, targetAddress, amount, 'success');
                // Add to frequent addresses if not already there
                const frequentAddresses = config.get('frequentAddresses', []);
                if (!frequentAddresses.find(addr => addr.address.toLowerCase() === targetAddress.toLowerCase())) {
                    frequentAddresses.push({
                        address: targetAddress,
                        label: originalRecipient && originalRecipient.endsWith('.eth') ? originalRecipient : ''
                    });
                    await config.update('frequentAddresses', frequentAddresses, vscode.ConfigurationTarget.Workspace);
                }
                // Refresh views
                accountsProvider.refresh();
            }
            else {
                vscode.window.showErrorMessage('Transaction failed');
                historyProvider.addTransaction(tx.hash, targetAddress, amount, 'failed');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Transaction failed: ${errorMessage}`);
            // Add failed transaction to history if we have the details
            if (targetAddress && amount) {
                historyProvider.addTransaction('failed', targetAddress, amount, 'failed');
            }
        }
    }
    context.subscriptions.push(...commands);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map