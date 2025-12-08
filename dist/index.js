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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multichain = exports.ProcessCleanupError = exports.NetworkConnectionError = exports.ChainConfigError = exports.getMultichainProviders = exports.getProvider = void 0;
const config_1 = require("hardhat/config");
const plugins_1 = require("hardhat/plugins");
const chainManager_1 = __importStar(require("./chainManager"));
Object.defineProperty(exports, "ChainConfigError", { enumerable: true, get: function () { return chainManager_1.ChainConfigError; } });
Object.defineProperty(exports, "NetworkConnectionError", { enumerable: true, get: function () { return chainManager_1.NetworkConnectionError; } });
Object.defineProperty(exports, "ProcessCleanupError", { enumerable: true, get: function () { return chainManager_1.ProcessCleanupError; } });
function getProvider(networkName) {
    const provider = chainManager_1.default.getProvider(networkName);
    if (!provider) {
        throw new Error(`Provider for network ${networkName} not found. Ensure the chain is properly configured and running.`);
    }
    return provider;
}
exports.getProvider = getProvider;
function getMultichainProviders() {
    return chainManager_1.default.getProviders();
}
exports.getMultichainProviders = getMultichainProviders;
var chainManager_2 = require("./chainManager");
Object.defineProperty(exports, "multichain", { enumerable: true, get: function () { return __importDefault(chainManager_2).default; } });
(0, config_1.extendEnvironment)((hre) => {
    hre.multichain = (0, plugins_1.lazyObject)(() => {
        return chainManager_1.default.getProviders();
    });
});
(0, config_1.extendConfig)((config, userConfig) => {
    const defaultChainManager = {
        chains: {},
    };
    config.chainManager = {
        ...defaultChainManager,
        ...userConfig.chainManager,
    };
});
(0, config_1.task)("test-multichain", "Launches multiple forked Hardhat networks")
    .addOptionalVariadicPositionalParam("testFiles", "Test files to run")
    .addParam("chains", "Comma-separated list of chain names to fork", "")
    .addOptionalParam("logs", "Log directory for forked chain output", "")
    .setAction(async ({ chains, logs, testFiles }, hre) => {
    if (!chains) {
        console.log("No secondary chains specified.");
        return;
    }
    const logsDir = logs || undefined;
    const chainNames = chains
        .split(",")
        .map((name) => name.trim());
    if (chainNames.length === 0) {
        console.log("No valid chain names provided.");
        return;
    }
    let cleanupRegistered = false;
    try {
        console.log(`🔄 Launching forks for: ${chainNames.join(", ")}`);
        await chainManager_1.default.setupChains(chainNames, hre.userConfig, logsDir ? logsDir : undefined);
        console.log("✅ Forked chains launched successfully.");
        // Register cleanup handlers only after successful setup
        if (!cleanupRegistered) {
            const cleanup = async () => {
                console.log("Exiting. Cleaning up forked networks...");
                try {
                    await chainManager_1.default.cleanup();
                }
                catch (error) {
                    console.error("Error during cleanup:", error);
                }
            };
            process.on("exit", cleanup);
            process.on("SIGINT", async () => {
                await cleanup();
                process.exit(0);
            });
            process.on("SIGTERM", async () => {
                await cleanup();
                process.exit(0);
            });
            cleanupRegistered = true;
        }
        if (testFiles && testFiles.length > 0) {
            console.log(`🧪 Running tests: ${testFiles.join(", ")}`);
            await hre.run("test", { testFiles });
        }
        else {
            console.log("No test files specified. Running all tests...");
            await hre.run("test");
        }
    }
    catch (error) {
        console.error("❌ Error during multichain setup or testing:");
        if (error instanceof chainManager_1.ChainConfigError) {
            console.error(`Configuration Error: ${error.message}`);
        }
        else if (error instanceof chainManager_1.NetworkConnectionError) {
            console.error(`Network Connection Error: ${error.message}`);
            console.error("Please check your RPC URLs and network connectivity.");
        }
        else if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        }
        else {
            console.error("Unknown error:", error);
        }
        // Cleanup on error
        try {
            await chainManager_1.default.cleanup();
        }
        catch (cleanupError) {
            console.error("Additional error during cleanup:", cleanupError);
        }
        throw error;
    }
});
//# sourceMappingURL=index.js.map