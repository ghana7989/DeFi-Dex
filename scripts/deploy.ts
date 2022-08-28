import { ethers } from 'hardhat';

async function main() {
	console.log('Deploying contract...\n');

	// Fetch Contracts
	const Token = await ethers.getContractFactory('Token');
	const Exchange = await ethers.getContractFactory('Exchange');
	// Get some accounts
	const accounts = await ethers.getSigners();
	// 1. accounts[0] is the deployer
	// 2. accounts[1] is the feeAccount
	console.log(
		`Accounts fetched:\n ${accounts[0].address}\n ${accounts[1].address}\n ${accounts[2].address}\n`,
	);

	// Deploy Contract
	const csToken = await Token.deploy(
		'CSToken',
		'CS',
		ethers.utils.parseEther('1000000'),
	);
	await csToken.deployed();
	console.log(`CSToken deployed at: ${csToken.address}\n`);

	const mETH = await Token.deploy(
		'mETH',
		'mETH',
		ethers.utils.parseEther('1000000'),
	);
	await mETH.deployed();
	console.log(`mETH Deployed to: ${mETH.address}`);

	const mDAI = await Token.deploy(
		'mDAI',
		'mDAI',
		ethers.utils.parseEther('1000000'),
	);
	await mDAI.deployed();
	console.log(`mDAI Deployed to: ${mDAI.address}`);

	const exchange = await Exchange.deploy(accounts[1].address, 10);
	await exchange.deployed();
	console.log(`Exchange Deployed to: ${exchange.address}`);
}

main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
