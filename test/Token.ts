import { expect } from 'chai';
import { BigNumberish, ContractReceipt, ContractTransaction } from 'ethers';
import { ethers } from 'hardhat';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { Token, Token__factory } from '../typechain-types';
import { PromiseOrValue } from '../typechain-types/common';

const tokens = (n: number) => ethers.utils.parseEther(n.toString());

describe('Token', () => {
	const name = 'ConSector';
	const symbol = 'CS';
	const decimals = 18;
	const initialSupply = tokens(1000000);
	const zeroAddress = '0x0000000000000000000000000000000000000000';

	let csToken: Token;
	let owner: SignerWithAddress;
	let address1: SignerWithAddress;
	let address2: SignerWithAddress;
	let addresses: SignerWithAddress[];

	beforeEach(async function () {
		[owner, address1, address2, ...addresses] = await ethers.getSigners();
		const csTokenFactory: Token__factory = await ethers.getContractFactory(
			'Token',
			owner,
		);
		csToken = await csTokenFactory.deploy(name, symbol, initialSupply);
	});

	describe('Deployment', () => {
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
		it('assigns total supply to the owner', async () => {
			expect(await csToken.balanceOf(owner.address)).to.equal(initialSupply);
		});
	});

	describe('Tokens Transfer', () => {
		let amount: PromiseOrValue<BigNumberish>;
		let txn: ContractTransaction;
		let result: ContractReceipt;

		describe('Success', () => {
			beforeEach(async function () {
				amount = tokens(100);
				txn = await csToken.connect(owner).transfer(address1.address, amount);
				result = await txn.wait();
			});
			it('transfers token balances', async () => {
				expect(await csToken.balanceOf(address1.address)).to.equal(amount);
				expect(await csToken.balanceOf(owner.address)).to.equal(tokens(999900));
			});
			it('emits a Transfer event', async () => {
				const eventLog = result.events!.pop();
				expect(eventLog.event).equal('Transfer');
				expect(eventLog.args.from).equal(owner.address);
				expect(eventLog.args.to).equal(address1.address);
				expect(eventLog.args.value).equal(amount);
			});
		});

		describe('Failure', () => {
			it('rejects when the sender has insufficient balances', async () => {
				const invalidAmount = tokens(10000000000);
				expect(
					csToken.connect(owner).transfer(address1.address, invalidAmount),
				).to.be.revertedWith('insufficient balance');
			});

			it('rejects when receiver is Zero address', async () => {
				expect(
					csToken.connect(owner).transfer(zeroAddress, tokens(100)),
				).to.be.revertedWith('invalid address');
			});
		});
	});

	describe('Tokens Approval', () => {
		let amount: PromiseOrValue<BigNumberish>;
		let txn: ContractTransaction;
		let result: ContractReceipt;
		beforeEach(async () => {
			amount = tokens(100);
			txn = await csToken.connect(owner).approve(address1.address, amount);
			result = await txn.wait();
		});
		describe('Success', () => {
			it('allocates an allowance for delegated token spending', async () => {
				expect(await csToken.allowance(owner.address, address1.address)).equal(
					amount,
				);
			});
			it('emits an Approval event', async () => {
				const eventLog = result.events!.pop();
				expect(eventLog.event).equal('Approval');
				expect(eventLog.args.owner).equal(owner.address);
				expect(eventLog.args.spender).equal(address1.address);
				expect(eventLog.args.value).equal(amount);
			});
		});
		describe('Failure', () => {
			it('rejects and reverts when the sender did not approve the spender', async () => {
				expect(
					csToken
						.connect(address1)
						.transferFrom(owner.address, address2.address, amount),
				).to.be.revertedWith('revert');
			});
			it('rejects when spender is Zero address', async () => {
				expect(
					csToken.connect(owner).transfer(zeroAddress, tokens(100)),
				).to.be.revertedWith('invalid address');
			});
		});
	});

	describe('Delegated Token Transfer', () => {
		let amount: PromiseOrValue<BigNumberish>;
		let txn: ContractTransaction;
		let result: ContractReceipt;

		beforeEach(async () => {
			amount = tokens(100);
			txn = await csToken.connect(owner).approve(address1.address, amount);
			result = await txn.wait();
		});

		describe('Success', () => {
			beforeEach(async () => {
				txn = await csToken
					.connect(address1)
					.transferFrom(owner.address, address2.address, amount);
				result = await txn.wait();
			});
			it('transfers token balances', async () => {
				expect(await csToken.balanceOf(address2.address)).to.equal(amount);
				expect(await csToken.balanceOf(owner.address)).to.equal(tokens(999900));
			});

			it('resets the allowance', async () => {
				expect(
					await csToken.allowance(owner.address, address1.address),
				).to.equal(0);
			});

			it('emits a Transfer event', async () => {
				const eventLog = result.events!.pop();
				expect(eventLog.event).equal('Transfer');
				expect(eventLog.args.from).equal(owner.address);
				expect(eventLog.args.to).equal(address2.address);
				expect(eventLog.args.value).equal(amount);
			});
		});

		describe('Failure', () => {
			it('rejects when the sender did not approve the spender', async () => {
				// here we are not approving the spender so it fails
				expect(
					csToken
						.connect(address1)
						.transferFrom(owner.address, address2.address, amount),
				).to.be.revertedWith('revert');
			});
			it('rejects when the sender has insufficient allowance', async () => {
				const invalidAmount = tokens(10000000000);
				expect(
					csToken
						.connect(address1)
						.transferFrom(owner.address, address2.address, invalidAmount),
				).to.be.revertedWith('ERC20: insufficient allowance');
			});
			it('rejects when receiver is Zero address', async () => {
				expect(
					csToken.connect(owner).transfer(zeroAddress, tokens(100)),
				).to.be.revertedWith('invalid address');
			});
		});
	});
});
