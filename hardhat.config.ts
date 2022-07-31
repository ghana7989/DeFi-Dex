import '@nomicfoundation/hardhat-toolbox';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';

import dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';

dotenv.config({path: __dirname + '/.env'});

const config: HardhatUserConfig = {
	solidity: '0.8.9',
	networks: {
		localhost: {},
	},
	paths: {
		sources: './blockchain/contracts',
		tests: './blockchain/test',
		artifacts: './blockchain/artifacts',
		cache: './blockchain/cache',
		root: './',
	},
	defaultNetwork: 'localhost',
	gasReporter: {
		enabled: true,
		currency: 'USD',
		outputFile: 'gas-reporter.csv',
	},
};

export default config;
