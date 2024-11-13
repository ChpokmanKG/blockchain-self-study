const assert = require('assert');
const EC = require('elliptic').ec;
const { generateHash, keys } = require('../utils');

const ec = new EC('secp256k1');
const {Blockchain, Block, Transaction} = require('../Blockchain');

const minersKey = ec.keyFromPrivate(keys.minersPrivate);
const minersWallet = minersKey.getPublic('hex');

const key = ec.keyFromPrivate(keys.private);
const wallet = key.getPublic('hex');

describe('Transaction', function() {
  it('should create a valid transaction', function() {
    const tx = new Transaction(wallet, 'some_address', 50, 5);
    assert.strictEqual(tx.from, wallet);
    assert.strictEqual(tx.to, 'some_address');
    assert.strictEqual(tx.amount, 50);
    assert.strictEqual(tx.fee, 5);
    assert.ok(tx.timestamp);
  });

  it('should generate a valid hash', function() {
    const tx = new Transaction(wallet, 'some_address', 50, 5);
    const hash = tx.generateHash();
    assert.strictEqual(hash, generateHash(tx.timestamp + wallet + 'some_address' + 50));
  });

  it('should sign the transaction', function() {
    const tx = new Transaction(wallet, 'some_address', 50, 5);
    tx.sign(key);
    assert.ok(tx.signature);
  });

  it('should be valid after signing with correct private key', function() {
    const tx = new Transaction(wallet, 'some_address', 50, 5);
    tx.sign(key);
    assert.ok(tx.isValid());
  });

  it('should be invalid if not signed', function() {
    const tx = new Transaction(wallet, 'some_address', 50, 5);
    assert.strictEqual(tx.isValid(), false);
  });
});

describe('Block', function() {
  it('should create a valid block', function() {
    const block = new Block(Date.now(), [], 'prevHash');
    assert.ok(block.timestamp);
    assert.strictEqual(block.prevHash, 'prevHash');
    assert.strictEqual(block.nonce, 0);
    assert.ok(block.hash);
  });

  it('should generate a valid hash', function() {
    const block = new Block(Date.now(), [], 'prevHash');
    const generatedHash = block.generateHash();
    assert.strictEqual(generatedHash, generateHash(block.timestamp + JSON.stringify(block.data) + block.prevHash + block.nonce));
  });

  it('should mine a block', function(done) {
    const block = new Block(Date.now(), [], 'prevHash');
    const difficulty = 3;
    block.mine(difficulty);
    assert.strictEqual(block.hash.substring(0, difficulty), Array(difficulty + 1).join('0'));
    done();
  });
});

describe('Blockchain', function() {
  it('should create a valid blockchain', function() {
    const blockchain = new Blockchain();
    assert.strictEqual(blockchain.chain.length, 1);
    assert.strictEqual(blockchain.pendingTransactions.length, 0);
  });

  it('should add a valid transaction', function() {
    const blockchain = new Blockchain();
    blockchain.minePendingTransactions(wallet);
    const tx = new Transaction(wallet, 'some_address', 50, 5);
    tx.sign(key);
    blockchain.addTransaction(tx);
    assert.strictEqual(blockchain.pendingTransactions.length, 1);
  });

  it('should reject invalid transactions', function() {
    const blockchain = new Blockchain();
    const tx = new Transaction(wallet, 'some_address', 50, 5);
    assert.throws(() => blockchain.addTransaction(tx), /Cannot add invalid transaction to chain/);
  });

  it('should calculate the balance of an address correctly', function() {
    const blockchain = new Blockchain();
    blockchain.minePendingTransactions(wallet);
    const tx1 = new Transaction(wallet, 'some_address', 50, 5);
    tx1.sign(key);
    blockchain.addTransaction(tx1);

    blockchain.minePendingTransactions(minersWallet);

    blockchain.minePendingTransactions(wallet);

    const balance = blockchain.getBalanceOfAddress(wallet);
    assert.strictEqual(balance, 145);
  });

  it('should mine pending transactions and reward miner', function() {
    const blockchain = new Blockchain();
    blockchain.minePendingTransactions(wallet);
    const tx1 = new Transaction(wallet, 'some_address', 50, 5);
    tx1.sign(key);
    blockchain.addTransaction(tx1);

    blockchain.minePendingTransactions(minersWallet);

    const balance = blockchain.getBalanceOfAddress(minersWallet);
    assert.strictEqual(balance, blockchain.reward + 5);
  });

  it('should validate the blockchain integrity', function() {
    const blockchain = new Blockchain();
    blockchain.minePendingTransactions(wallet);
    const tx1 = new Transaction(wallet, 'some_address', 50, 5);
    tx1.sign(key);
    blockchain.addTransaction(tx1);
    blockchain.minePendingTransactions(minersWallet);

    assert.ok(blockchain.checkIsValid());

    blockchain.chain[1].data[0].amount = 1000;
    assert.strictEqual(blockchain.checkIsValid(), false);
  });
});

