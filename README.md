# Replication package for "Mutation testing of smart contracts at scale"

This replication package can be used in at least three different ways.
The interested reader could:
1. Study `comparison.xslx`, which compares the mutation operators of all related work that we are awareof with the mutation operators that we have implemented.
2. Inspect our source code `*.js`.
3. Study an original contract, its mutants, and the main output generated for that contract, which is `Vitaluck_3b400b.dir`.
4. Re-run all our experiments, but please note that this would take 10-14 weeks on a single machine and about 0.5 TB of disk space to do.

We assume the reader to be familiar with `node`, `npm`, and `truffle`.
See [Node](https://nodejs.org/) and [Truffle](https://www.trufflesuite.com) for the relevant documentation.

# 0. Setup
Please start by cloning this repository, `Mutation-at-scale`:
```
git clone https://github.com/pieterhartel/Mutation-at-scale.git
```

# 1. Programs
There are two main programs in the replication package: `chainsol.js` and `mutasol.js.`
The first, `chainsol.js`, downloads a contract from Etherscan, as described here [Truffle-tests-for-free](https://arxiv.org/abs/1907.09208).
The second program, `mutasol.js`, generates mutants, as described in the paper submitted to TAP2020.
These two programs use auxiliary modules: `comments.js`, `prepare.js`, `soljson.js`, and `evm_decoder.js`, all of which are available in the package.

## 1.1 Dependencies on npm modules
The programs `chainsol.js` and `mutasol.js` have a number of dependencies that can be installed as follows (tested on Ubuntu 18.04.3).
```
npm install \
        abi-decoder \
        assert \
        child_process \
        etherscan-api \
        js-levenshtein \
        json-stringify-safe \
        levelup \
	md5 \
        mysql \
        net \
        node-fetch \
        path \
        plotter \
        puppeteer \
        random-seed \
        sleep \
        solc \
        stringify-object \
        web3 \
        web3-utils \
        truffle \
        ganache-cli
npm install git://github.com/pieterhartel/abi-decoder.git
```

## 1.2 Dependencies on Solidity compiler versions
The programs `chainsol.js` and `mutasol.js` also depend on the appropriate version of the solidity compiler.

The call `mutasol.js -c` will generate a script to download the Solidity compiler binaries from [Emscripten binaries](https://github.com/ethereum/solc-bin/blob/gh-pages/bin/list.json) into the directory `$HOME/soljson` as follows:
```
$ cd $HOME/soljson/
$ node mutasol.js -c >script.sh
$ sh script
```

After running the script, the `soljson` directory should contain one file per major compiler version as follows:
```
$HOME/soljson/
├── soljson-v0.1.1+commit.6ff4cd6.js
├── soljson-v0.1.2+commit.d0d36e3.js
├── soljson-v0.1.3+commit.28f561.js
...
├── soljson-v0.5.1+commit.c8a2cb62.js
├── soljson-v0.5.2+commit.1df8f40c.js
├── soljson-v0.5.3+commit.10d17f24.js
└── soljson-v0.5.4+commit.9549d8ff.js
```

## 1.3 Dependencies on programs
The script `make.sh` uses `jq`, which is a lightweight and flexible command-line JSON processor:
```
sudo apt install -y jq
```

The replication package has been tested with these versions of the tools:
```
$ npm -v
3.5.2
$ node -v
v8.10.0
$ ganache-cli --version
Ganache CLI v6.4.4 (ganache-core: 2.5.6)
$ truffle -v
Truffle v5.0.2 - a development framework for Ethereum
$ jq --version
jq-1.5-1-a5b5cbe
```

## 1.4 Dependencies on `Truffle-tests-for-free`
The program `chainsol.js` originates from `Truffle-tests-for-free` and it has been integrated in the replication package.
The file `scrapedContractsVerified.json` contains a list of key information about all verified smart contracts that were available on Etherscan on 1 January 2019.
The list includes the smart contracts from `Truffle-tests-for-free`.

# 2. Structure of the replication package
After running all mutants, there will be 1120 directories, with names derived from the name and address of the contract, e.g. `Vitaluck_3b400b.dir`.
Each directory contains all files and directories needed by `truffle test` and many output files.

## 2.1 Creating the contract directories and the log files
The script `make_loop.sh` makes 1120 calls to `make.sh` with the address of a contract to download, generate and execute the mutants.
For example The following call will create the `Vitaluck_3b400b.dir` directory.
```
$ bash make.sh 0xef7c7254c290df3d167182356255cdfd8d3b400b
```
We have run `make.sh` in parallel on 14 machines, which took about one week.


## 2.2 Structure of the directories
For each contract there is a directory `<contract>_<address>.dir`, where `<contract>` is the name of the contract, and `<address>` is the last 6 hex digits of the address of the contract.
The hex digits are used to disambiguate contracts with the same name.
The structure of a contract directory is as follows:
```
<contract>_<address>.dir/
├── bqtrace.json
├── chainsol.log
├── contracts
│   ├── Migrations.sol
│   ├── <contract>.sol.original
│   └── <contract>.sol_<mutant>.mut
├── deployment.json
├── ganache_debug_<contract>.sol.log.gz
├── ganache_debug_<contract>.sol_<mutant>.log.gz
├── <contract>.cover
├── <contract>.sol_<mutant>.log
├── <contract>.sol_<mutant>.log.diff
├── <contract>_<mutant>.histogram.gz
├── <contract>_<mutant>.inspace.gz
├── migrations
│   └── 1_initial_migration.js
├── mutasol.log
├── test
│   ├── <contract>.js
│   └── support.js
├── truffle-config.js
└── truffle.log
```

## 2.3 Original contracts
The file `<contract>.js` in the `test` directory is the de-compiled version of the first 50 historic transactions of the contract.
The file `support.js` in the test directory contains some useful helper functions for the test.
(The same file appears in all 1120 directories.)
The files in the `test` directory are generated by `chainsol.js`.

The `contracts` directory contains the solidity files related to the contract.
The file `Migrations.sol` in the contracts directory is the migration file needed by the Truffle framework.
The file `<contract>.sol.original` in the contracts directory is the original code of the contract as downloaded from Etherscan by `chainsol.js`.

The files `ganache_debug_<contract>.sol.log.gz` contain the gzipped log generated by `ganache-cli` for the original contracts (output by the `make.sh` script).
We have used a locally modified version of `ganache-cli` with a non-standard debug output that also prints the PC alongside the EVM instruction.
This extra information is needed for the calculation of the coverage of the tests.
The files `ganache_debug_<contract>.sol_<mutant>.log.gz` contain the same information as above but for the mutants (output by the make.sh script).

The file `deployment.json` contains the ABI, and the bytecode of the contract, which we have downloaded from [Google BigQuery](https://console.cloud.google.com/bigquery?project=itrust-blocktest&p=bigquery-public-data&d=ethereum_blockchain&page=dataset).
The results of this download are stored in the `Traces` directory.

## 2.4 Truffle test files
The following files and directories are standard for truffle tests: `1_initial_migration.js` in the `migrations` directory, and `truffle-config.js`.
These are generated by `chainsol.js`.

## 2.5 Mutants of the contracts
The files `<contract>.sol_<mutant>.mut` in the `contracts` directory are the 50 mutants.
The files `<contract>.sol_<mutant>.log` contain the logfiles from running `truffle test` on each mutant (output by the `make.sh` script).

## 2.6 Data files
The file `bqtrace.json` contains the first 50 internal and external transactions of the contract, downloaded from Google BigQuery.
The file `chainsol.log` is the log generated by `chainsol.js` while downloading and generating the test for the contract.
The file `mutasol.log` is the log generated by `mutasol.js` while generating the mutants.
The file `truffle.log` contains the log of running truffle test (output by the `make.sh` script).

## 2.7 Output differences
The files with a `.diff` extension provide a summary of the outputs of the original contract and the mutant.
The example below shows that for the given mutant 38 events, and 244 method results are different.

```
Mutation:
+ diff contracts/Vitaluck.sol.original contracts/Vitaluck.sol_25.mut
149c149
<             if(_finalRandomNumber >= 900) {
---
>             if(_finalRandomNumber >=  /*mutation*/ 1 /*noitatum*/ ) {

Killed:
   38 /tmp/Diff_91970/Vitaluck.sol_25.log.eventResult.diff
   56 /tmp/Diff_91970/Vitaluck.sol_25.log.fromBalance.diff
  244 /tmp/Diff_91970/Vitaluck.sol_25.log.methodResult.diff
   38 /tmp/Diff_91970/Vitaluck.sol_25.log.toBalance.diff
   56 /tmp/Diff_91970/Vitaluck.sol_25.log.txGasUsed.diff
    0 /tmp/Diff_91970/Vitaluck.sol_25.log.txResult.diff
    0 /tmp/Diff_91970/Vitaluck.sol_25.log.txTime.diff
  432 total
```
