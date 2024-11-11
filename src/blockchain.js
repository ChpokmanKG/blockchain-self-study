const { generateHash } = require('./utils');

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
    }
  }
}

class Blockchain {
  constructor() {
    this.chain = [new Block(Date.now(), [])];
    this.difficulty = 3;
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  addNewBlock(transactions) {
    const newBlock = new Block(Date.now(), transactions, this.getLastBlock().hash);

    newBlock.mine(this.difficulty);

    this.chain.push(newBlock);
  }

  checkIsValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currBlock = this.chain[i];
      const prevBlock = this.chain[i - 1];

      if (currBlock.hash !== currBlock.generateHash() || prevBlock?.hash !== currBlock.prevHash) {
        return false
      }
    }

    return true;
  }
}

const ChyngyzCoin = new Blockchain();

ChyngyzCoin.addNewBlock([{txt: 'Hello'}, {txt: 'World'}]);
ChyngyzCoin.addNewBlock([{txt: 'Hello'}, {txt: 'World'}]);
ChyngyzCoin.addNewBlock([{txt: 'Hello'}, {txt: 'World'}]);
ChyngyzCoin.addNewBlock([{txt: 'Hello'}, {txt: 'World'}]);
ChyngyzCoin.addNewBlock([{txt: 'Hello'}, {txt: 'World'}]);

console.log(ChyngyzCoin.chain);
console.log(ChyngyzCoin.checkIsValid());
