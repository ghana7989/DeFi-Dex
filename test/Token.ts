import { expect } from 'chai';
import { ethers } from 'hardhat';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { Token, Token__factory } from '../typechain-types';

const tokens = (n: number) => ethers.utils.parseEther(n.toString());

describe('Token', () => {
	const name = 'ConSector';
	const symbol = 'CS';
	const decimals = 18;
	const initialSupply = tokens(1000000);

	let csToken: Token;
	let owner: SignerWithAddress;
	let addr1: SignerWithAddress;
	let addr2: SignerWithAddress;
	let addrs: SignerWithAddress[];

	beforeEach(async function () {
		[owner, addr1, addr2, ...addrs] = await ethers.getSigners();
		const csTokenFactory: Token__factory = await ethers.getContractFactory(
			'Token',
			owner,
		);
		csToken = await csTokenFactory.deploy();
	});

	it('has correct name', async () => {
		expect(await csToken.name()).to.equal(name);
	});

	it('has correct symbol', async () => {
		expect(await csToken.symbol()).to.equal(symbol);
	});

	it('has correct decimals', async () => {
		expect(await csToken.decimals()).to.equal(decimals);
	});

	it('has correct total supply', async () => {
		expect(await csToken.totalSupply()).to.equal(initialSupply);
	});
});
