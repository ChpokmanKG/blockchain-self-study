const EC = require('elliptic').ec;
const { generateHash, keys} = require('./utils');

const ec = new EC('secp256k1');

class Transaction {
  constructor(from, to, amount, fee) {
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.timestamp = Date.now();
    this.fee = fee;
  }

  generateHash() {
    return generateHash(this.timestamp + this.from + this.to + this.amount + this.fee);
  }

  sign(key) {
    if (key.getPublic('hex') !== this.from) {
      throw new Error('You cannot affect for other wallet');

      return;
    }

    const hashTx = this.generateHash();
    const sig = key.sign(hashTx, 'base64');

    this.signature = sig.toDER('hex');
  }

  isValid() {
    if (this.from === null) return true;
    if (!this.signature) return false;

    return ec.keyFromPublic(this.from, 'hex').verify(this.generateHash(), this.signature);
  }
}

class Block {
  constructor(timestamp, data = [], prevHash = '') {
    this.timestamp = timestamp;
    this.data = data;
    this.prevHash = prevHash;
    this.nonce = 0;
    this.hash = this.generateHash();
  }

  generateHash() {
    return generateHash(this.timestamp + JSON.stringify(this.data) + this.prevHash + this.nonce);
  }

  mine(difficulty) {
    const difficultyPrefix = Array(difficulty + 1).join('0');

    while (this.hash.substring(0, difficulty) !== difficultyPrefix) {
      this.nonce++;
      this.hash = this.generateHash();

      console.log(`Mining... Nonce: ${this.nonce} Hash: ${this.hash}`);
    }
    console.log();
    console.log(`Block mined: ${this.hash}`);
  }
}

class Blockchain {
  constructor() {
    this.chain = [new Block(Date.now(), [])];
    this.pendingTransactions = [];
    this.difficulty = 3;
    this.reward = 100;
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(address) {
    const rewardTx = new Transaction(
      null,
      address,
      this.reward
    );
    let totalFees = 0;

    for (const tx of this.pendingTransactions) {
      totalFees += tx.fee;
    }

    rewardTx.amount += totalFees;
    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLastBlock().hash
    );

    block.mine(this.difficulty);

    console.log('Block successfully mined!');
    this.chain.push(block);

    this.pendingTransactions = [];
  }

  addTransaction(tx) {
    if (!tx.from || !tx.to) throw new Error('Transaction must include from and to address');
    if (!tx.isValid()) throw new Error('Cannot add invalid transaction to chain');
    if (tx.amount <= 0) throw new Error('Transaction amount should be higher than 0');
    if (tx.fee > tx.amount) throw new Error('Fee cannot be greater than transaction amount');

    const addressBalance = this.getBalanceOfAddress(tx.from);

    if (tx.amount > addressBalance) throw new Error('Not enough tokens');

    const totalPendingAmount = this.pendingTransactions
      .filter(pendingTx => tx.from === pendingTx.from)
      .reduce((prev, curr) => prev + curr.amount, tx.amount);

    if (totalPendingAmount > addressBalance) {
      throw new Error('Not enough tokens');
    }

    this.pendingTransactions.push(tx);
  }

  getBalanceOfAddress(address) {
    let balance = 0;

    this.chain.forEach(block => {
      block.data.forEach(tx => {
        if (tx.from === address) balance = (balance - tx.amount) - tx.fee;
        if (tx.to === address) balance = balance + tx.amount;
      });
    });

    return balance;
  }

  checkIsValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currBlock = this.chain[i];
      const prevBlock = this.chain[i - 1];

      if (currBlock.hash !== currBlock.generateHash() || prevBlock?.hash !== currBlock.prevHash) {
        return false
      }

      for (const tx of currBlock.data) {
        if (!tx.isValid()) return false;
      }
    }

    return true;
  }
}

module.exports = {Transaction, Block, Blockchain};

const minersKey = ec.keyFromPrivate(keys.minersPrivate);
const minersWallet = minersKey.getPublic('hex');

const key = ec.keyFromPrivate(keys.private);
const wallet = key.getPublic('hex');

const ChyngyzCoin = new Blockchain();

ChyngyzCoin.minePendingTransactions(wallet);

const tx1 = new Transaction(wallet, 'some_address', 50, 5);
tx1.sign(key);
ChyngyzCoin.addTransaction(tx1);

ChyngyzCoin.minePendingTransactions(minersWallet);

console.log('My wallet',ChyngyzCoin.getBalanceOfAddress(wallet));
console.log('some_address',ChyngyzCoin.getBalanceOfAddress('some_address'));
console.log('miners wallet',ChyngyzCoin.getBalanceOfAddress(minersWallet));
console.log('blockchain validity',ChyngyzCoin.checkIsValid());
