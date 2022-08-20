import { expect } from 'chai';
import { ContractReceipt, ContractTransaction } from 'ethers';
import { ethers } from 'hardhat';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { Exchange, Exchange__factory, Token, Token__factory } from '../typechain-types';

const tokens = (n: number) => ethers.utils.parseEther(n.toString());

describe('Exchange', () => {
	let exchange: Exchange;
	let token1: Token;
	let token2: Token;
	let deployer: SignerWithAddress;
	let feeAccount: SignerWithAddress;
	let user1: SignerWithAddress;
	let user2: SignerWithAddress;
	const FEE_PERCENT = 10;

	beforeEach(async function () {
		const ExchangeFactory: Exchange__factory = await ethers.getContractFactory(
			'Exchange',
		);
		const Token: Token__factory = await ethers.getContractFactory('Token');
		token1 = await Token.deploy('ConSector', 'CS', tokens(1000000));
		token2 = await Token.deploy('Mock Dai', 'mDAI', tokens(1000000));

		[deployer, feeAccount, user1, user2] = await ethers.getSigners();
		exchange = await ExchangeFactory.deploy(feeAccount.address, FEE_PERCENT);

		// give user some tokens
		await token1.connect(deployer).transfer(user1.address, tokens(10000));
		await token1.connect(deployer).transfer(user2.address, tokens(10000));
	});

	describe('Deployment', () => {
		it('tracks the fee account', async () => {
			expect(await exchange.feeAccount()).to.equal(feeAccount.address);
		});
		it('tracks the fee percentage', async () => {
			expect(await exchange.feePercent()).to.equal(FEE_PERCENT);
		});
	});

	describe('Checking Balances', () => {
		let transaction: ContractTransaction,
			result: ContractReceipt,
			amount = tokens(1);

		beforeEach(async () => {
			// approve tokens for exchange to spend
			transaction = await token1
				.connect(user1)
				.approve(exchange.address, amount);
			result = await transaction.wait();
			// deposit tokens
			transaction = await exchange
				.connect(user1)
				.depositToken(token1.address, amount);
			result = await transaction.wait();
		});

		it('returns user balance', async () => {
			expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(
				amount,
			);
		});
	});
	describe('Depositing Tokens', () => {
		let transaction: ContractTransaction,
			result: ContractReceipt,
			amount = tokens(10);

		describe('Success', () => {
			beforeEach(async () => {
				// approve tokens for exchange to spend
				transaction = await token1
					.connect(user1)
					.approve(exchange.address, amount);
				result = await transaction.wait();
				// deposit tokens
				transaction = await exchange
					.connect(user1)
					.depositToken(token1.address, amount);
				result = await transaction.wait();
			});

			it('tracks the deposited tokens', async () => {
				// balance update
				expect(await token1.balanceOf(exchange.address)).to.equal(amount);
				// user tokens update
				expect(
					await exchange.balanceOf(token1.address, user1.address),
				).to.equal(amount);
			});

			it('emits a Deposit event', async () => {
				const eventLog = result.events!.pop();
				expect(eventLog.event).equal('Deposit');

				expect(eventLog.args.token).equal(token1.address);
				expect(eventLog.args.user).equal(user1.address);
				expect(eventLog.args.amount).equal(amount);
				expect(eventLog.args.balance).equal(
					await exchange.balanceOf(token1.address, user1.address),
				);
			});
		});
		describe('Failure', () => {
			it('fails when NO tokens are approved', async () => {
				// Do not approve tokens before depositing
				await expect(
					exchange.depositToken(token1.address, amount),
				).to.revertedWith('ERC20: insufficient allowance');
			});
		});
	});
	describe('Withdrawing Tokens', () => {
		let transaction: ContractTransaction,
			result: ContractReceipt,
			amount = tokens(10);

		describe('Success', () => {
			beforeEach(async () => {
				// approve tokens for exchange to spend
				transaction = await token1
					.connect(user1)
					.approve(exchange.address, amount);
				result = await transaction.wait();
				// deposit tokens
				transaction = await exchange
					.connect(user1)
					.depositToken(token1.address, amount);
				result = await transaction.wait();
				// now withdraw tokens
				transaction = await exchange
					.connect(user1)
					.withdrawToken(token1.address, amount);
				result = await transaction.wait();
			});

			it('withdraws tokens', async () => {
				// balance update
				expect(await token1.balanceOf(exchange.address)).to.equal(0);
				// user tokens update
				expect(
					await exchange.balanceOf(token1.address, user1.address),
				).to.equal(0);
			});

			it('emits a Withdraw event', async () => {
				const eventLog = result.events!.pop();

				expect(eventLog.event).equal('Withdraw');

				expect(eventLog.args.token).equal(token1.address);
				expect(eventLog.args.user).equal(user1.address);
				expect(eventLog.args.amount).equal(amount);
				expect(eventLog.args.balance).equal(0);
			});
		});
		describe('Failure', () => {
			it('fails when insufficient balance', async () => {
				// Withdraw more tokens than deposited
				await expect(
					exchange.withdrawToken(token1.address, amount),
				).to.revertedWith('Exchange: insufficient balance');
			});
		});
	});
	describe('Making Orders', () => {
		let transaction: ContractTransaction,
			result: ContractReceipt,
			amount = tokens(10);

		describe('Success', () => {
			beforeEach(async () => {
				// Deposit tokens before making an order
				// 1. approve tokens for exchange to spend
				transaction = await token1
					.connect(user1)
					.approve(exchange.address, amount);
				result = await transaction.wait();
				// 2. deposit tokens
				transaction = await exchange
					.connect(user1)
					.depositToken(token1.address, amount);
				result = await transaction.wait();
				// 3. Make Order
				transaction = await exchange
					.connect(user1)
					.makeOrder(token2.address, amount, token1.address, amount);
				result = await transaction.wait();
			});

			it('tracks the newly created order', async () => {
				expect(await exchange.ordersCount()).to.equal(1);
			});
			it('emits a Order event', async () => {
				const eventLog = result.events!.pop();

				expect(eventLog.event).equal('Order');
				expect(eventLog.args.id).equal(1);
				expect(eventLog.args.user).equal(user1.address);
				expect(eventLog.args.tokenGet).equal(token2.address);
				expect(eventLog.args.amountGet).equal(amount);
				expect(eventLog.args.tokenGive).equal(token1.address);
				expect(eventLog.args.amountGive).equal(amount);
				expect(eventLog.args.timestamp).to.at.least(1);
			});
		});
		describe('Failure', () => {
			it('fails when insufficient balance', async () => {
				await expect(
					exchange
						.connect(user1)
						.makeOrder(token2.address, amount, token1.address, amount),
				).to.revertedWith('Exchange: insufficient balance');
			});
		});
	});
});
