# Replication package for "A baseline for mutation testing of smart contracts on Ethereum"

This replication package can be used in at least three different ways. The interested reader could:
1. re-run all our experiments, but this would take 10-14 weeks and about 0.5 TB of disk space to do.
2. inspect our source code (mostly written in JavaScript) and study an original contract, all its mutants and the output generated for that contract, which is `Regression_280_560/mall_7f683d.dir`.
3. browse the diff files of some of the other contracts.

We assume the reader to be familiar with `node`, `npm`, and `truffle`.
See [Node](https://nodejs.org/) and [Truffle](https://www.trufflesuite.com) for the relevant documentation.

# 1. Programs
There are two main programs in the replication package: `chainsol.js` and `mutasol.js.`
The first, `chainsol.js` downloads a contract from Etherscan, as described here [Truffle-tests-for-free](https://arxiv.org/abs/1907.09208).
The second program `mutasol.js` generates mutants, as described in the paper submitted to ICST2020.
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

The program `mutasol.js -c` will generate a script to download the Solidity compiler binaries from [Emscripten binaries](https://github.com/ethereum/solc-bin/blob/gh-pages/bin/list.json) into the directory `$HOME/soljson` as follows:
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

## 1.4 Dependencies on Truffle-tests-for-free
The program `chainsol.js` originates from Truffle-tests-for-free and it has been integrated in the replication package.
The file `scrapedContractsVerified.json` contains a list of key information about all verified smart contracts that were available on Etherscan on 1 January 2019. The list includes the smart contracts from Truffle-tests-for-free.

# 2. Structure of the replication package
There are 6 main directories with the smart contracts, their mutants and the data: `Regression_000_070` (with 70 subdirectories), `Regression_070_280` (with 210 subdirectories), `Regression_280_560` (with 268 subdirectories), `Regression_560_840`, and `Regression_840_1120` (each with 280 subdirectories), and finally `Regression_run_again` (with 12 subdirectories).
In total there are 1120 subdirectories.
Each subdirectory contains all files and directories needed by `truffle test` and many output files.

## 2.1 Creating the contract subdirectories and the log files
The script `make.sh` requires the address of a contract to download, to generate and to execute the mutants.
For example The following call will create the `Vitaluck_3b400b.dir` subdirectory.
```
$ bash make.sh 0xef7c7254c290df3d167182356255cdfd8d3b400b
```

The `make.sh` script has been run 1120 times, to download a specific smart contract, to generate the replay test and the 50 mutants, and to run `truffle test` for the original and all the mutants, thus creating the 1120 subdirectories with data files.
We have run `make.sh` in parallel on 14 machines, which took about one week.
The files `Regression_<from>_<to>/make_<machine>.log` are the logs of running `make.sh` on each of the 14 machines.

## 2.2 Structure of the subdirectories
For each contract there is a subdirectory `<contract>_<address>.dir`, where `<contract>` is the name of the contract, and `<address>` is the last 6 hex digits of the address of the contract.
The hex digits are used to disambiguate contracts with the same name.
The structure of a contract subdirectory is as follows:
```
Regression_<from>_<to>/<contract>_<address>.dir/
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
The files in the `test` directory are also generated by `chainsol.js`.

The `contracts` directory contains the solidity files related to the contract.
`Migrations.sol` in the contracts directory is the migration file needed by the Truffle framework.
The file `<contract>.sol.original` in the contracts directory is the original code of the contract as downloaded from Etherscan by `chainsol.js`.
We have removed the actual contract code to comply with the terms of use of Etherscan, except for the contract `mall`, for which all code and data is present in the package.

The files `ganache_debug_<contract>.sol.log.gz` contain the gzipped log generated by `ganache-cli` for the original contracts (output by the `make.sh` script).
We have used a locally modified version of `ganache-cli` with a non-standard debug output that also prints the PC alongside the EVM instruction.
This extra information is needed for the calculation of the coverage of the tests.
The files `ganache_debug_<contract>.sol_<mutant>.log.gz` contain the same information as above but for the mutants (output by the make.sh script).

The file `deployment.json` contains the ABI, and the bytecode of the contract, which we have downloaded from [Google BigQuery](https://console.cloud.google.com/bigquery?project=itrust-blocktest&p=bigquery-public-data&d=ethereum_blockchain&page=dataset).

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
The file `<contract>.sol_<mutant>.log.diff` summarises the differences between the original and each mutant.
The differences may be in the `eventResult`, `methodResult`, or `txResult`.
**There are other differences, but these are not used: `fromBalance`, `toBalance`, `txGasUsed`, `txTime`.**
The `*.diff` files in each subdirectory are generated by the `diff_loop.sh` scripts, with the help of the `diff.sh` script.
The intermediate results may be found in the directory `Regression_<from>_<to>/diff_loop`.
The log of running the `diff_loop.sh` script is stored in `Regression_<from>_<to>/diff_loop.log`.

```
Regression_<from>_<to>/diff_loop.log
Regression_<from>_<to>/diff_loop
├── <contract>.sol_<mutant>.log
├── <contract>.sol_<mutant>.log.eventResult
├── <contract>.sol_<mutant>.log.eventResult.diff
├── <contract>.sol_<mutant>.log.fromBalance
├── <contract>.sol_<mutant>.log.fromBalance.diff
├── <contract>.sol_<mutant>.log.methodResult
├── <contract>.sol_<mutant>.log.methodResult.diff
├── <contract>.sol_<mutant>.log.toBalance
├── <contract>.sol_<mutant>.log.toBalance.diff
├── <contract>.sol_<mutant>.log.txGasUsed
├── <contract>.sol_<mutant>.log.txGasUsed.diff
├── <contract>.sol_<mutant>.log.txResult
├── <contract>.sol_<mutant>.log.txResult.diff
├── <contract>.sol_<mutant>.log.txTime
└── <contract>.sol_<mutant>.log.txTime.diff
```

## 2.8 Bytecode coverage
**The coverage data is not actually used in the submitted paper, but some of the scripts refer to it and the description of the coverage data is therefore provided here**

```
Regression_<from>_<to>/cover_loop.log
Regression_<from>_<to>/cover_loop
└── <contract>_<mutant>.bytecode
```
The file `<contract>.cover` in each subdirectory describes for each mutant which transactions are covered by the test.
This is a summary of the data in the directory `Regression_<from>_<to>/cover_loop`.
The summary is created by the script `cover_loop.sh`, and the log of running the script is stored in `Regression_<from>_<to>/cover_loop.log`.

The file `<contract>_<mutant>.inspace.gz` shows the instruction space of the contract or mutant and the file `<contract>_<mutant>.histogram.gz` shows a histogram of how often each instruction has been executed by the test.
These two files are also output by the `cover_loop.sh` script.

# 3. Top level analysis
The results of all the scripts are collected in a number of csv files in the directory `000_1120`.
Two of the csv files are then analysed by SPSS scripts `kill_detail.sps` and `kill_summary.sps`. 
The output of running SPSS is included in `kill_summary.pdf` and `kill_detail.pdf`.
The two SPSS scripts produce many tables and graphs, a selection of which has been included in the submitted paper.
For example the graph of Figure 1 from the submitted paper appears on page 6 of `kill_summary.pdf`.
Table IV of the submitted paper appears on pages 13 and 14 of `kill_detail.pdf`.

```
000_1120/
├── kill_detail.pdf
├── kill_detail.sps
├── kill_summary.pdf
├── kill_summary.sps
├── kill_detail_Limit.csv
├── kill_detail_Limit.json
├── kill_detail_TxEvMeth.csv
├── kill_detail_TxEvMeth.json
├── kill_detail_TxEvMethLimit.csv
├── kill_detail_TxEvMethLimit.json
├── kill_summary_Limit.csv
├── kill_summary_TxEvMeth.csv
└── kill_summary_TxEvMethLimit.csv
```

## 3.1 Intermediate results of the top level analysis
The `kill_loop.sh` script produces copious intermediate outputs, which are collected in the directory `kill_loop`.

```
kill_loop.log
kill_loop
├── begin_code.js
├── contract_code.js
├── contract_info.sed
├── end_code.js
├── tx_code.js
└── tx_info.sed
```

