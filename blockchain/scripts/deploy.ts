import { ethers } from 'hardhat';

async function main() {
	// Fetch Contract
	const Token = await ethers.getContractFactory('Token');
	// Deploy Contract
	const token = await Token.deploy();
	await token.deployed();
	console.log(token.address);
}

main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
