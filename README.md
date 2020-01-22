# Replication package for "Mutation testing of smart contracts at scale"

# 1. How to use this replication package?
This replication package can be used in at least five different ways.
The interested reader could:
1. Inspect the seven-point checklist for mutation research in section 2. below.
2. Study [comparison.xlsx](comparison.xlsx), which compares the mutation operators of all related work that we are aware of with the mutation operators that we have implemented.
3. Inspect our source code `*.js`.
4. Study an original contract, its mutants, and the main output generated for that contract, which is `Vitaluck_3b400b.dir`.
5. Re-run all our experiments, but please note that this would take 10-14 weeks on a single machine and about 0.5 TB of disk space to do.

# 2. Seven-point Mutation Testing Checklist
We use the recently proposed checklist [Papadakis2019] for research on mutation testing to analyse our work.

## 2.1 Mutant selection
The mutation operators consist of the minimum standard Mothra set plus a number of experimental Solidity specific operators based on all the related work that we are aware of.
We have provided a few examples in the background section of the paper to motivate the choice of operators in the paper, but this does not constitute proof that common errors in Solidity programs are captured by exactly the chosen operators.

## 2.2 Mutation testing tool
We have implemented a bespoke mutation tool in JavaScript and the source is available in this replication package.
The file [comparison.xlsx](comparison.xlsx) in this replication package provides a detailed specification of the mutation operators.

The mutation generation tool uses uniform random selection of mutation operators and operands.

Calls to `block.timestamp` do not cause non-deterministic behaviour as all transactions in the tests happen in the test environment at exactly the same time as they happened historically.

Calls to `block.blockhash` may generate non-deterministic results, but we excluded contracts that make such calls.

## 2.3 Mutant redundancy
We have used a state-of-the-art method [Kintis2018] to discard redundant mutants.

## 2.4 Test suite choice and size
We have used a relatively large sample of smart contracts that are representative for the entire collection of verified smart contracts available from Etherscan.
This collection however, is probably not representative for the entire population of smart contracts.
For example, many smart contracts in this larger population are clones of other smart [He2019], but this is not the case for verified smart contracts from Etherscan.
From a uniform random sample of 500 verified smart contract we have calculated the normalised edit distance (NLD) of all pairs and found that less than 1% of the pairs have an NLD of less than 20%, and less than 5% of all pairs have an NLD of less than 60%.
This means that the vast majority of all pairs are different.

The tests are all the same size, as each makes exactly 50 calls to a contract method.

The tests are replay tests, which have not been designed as tests by developers of smart contracts, and can therefore only be regarded as a baseline for real tests.

## 2.5 Clean program assumption
A limitation of this study is that we rely implicitly on the clean program assumption because we use existing smart contracts.

## 2.6 Multiple experimental repetitions
We have performed the main experiment with a relatively large number of smart contracts.

In a second experiment, we have tried to improve the test coverage by downloading double the number of historic transactions (i.e., 100) for a uniform sub sample of 63 smart contracts, but the results remain essentially the same.

## 2.7 Presentation of the results
The results are presented aggregated over the entire sample of smart contracts, which is larger than in all related research that we are aware of.

## 2.8 References
* [He2019] Ningyu He, Lei Wu, Haoyu Wang, Yao Guo, and Xuxian Jiang. Characterizing code clones in the ethereum smart contract ecosystem. Technical report, Beijing University of Posts and Telecommunications, May 2019. [URL](https://arxiv.org/abs/1905.00272).
* [Kintis2018] Marinos Kintis, Mike Papadakis, Yue Jia, Nicos Malevris, Yves Le Traon, and Mark Harman. Detecting trivial mutant equivalences via compiler optimisations. IEEE Trans. on software engineering, 44(4):308-333, Apr 2018. [URL](https://doi.org/10.1109/TSE.2017.2684805).
* [Papadakis2019] Mike Papadakis, Marinos Kintis, Jie Zhang, Yue Jia, Yves Le Traon, and Mark Harman. Mutation testing advances: An analysis and survey. In Advances in Computers, volume 112, pages 275-378. Elsevier, 2019. [URL](https://doi.org/10.1016/bs.adcom.2018.03.015).


# 3. Setup
Please start by cloning this repository, `Mutation-at-scale`:
```
git clone https://github.com/pieterhartel/Mutation-at-scale.git
```
## 3.1 Assumptions
We assume the reader to be familiar with `node`, `npm`, and `truffle`.
See [Node](https://nodejs.org/) and [Truffle](https://www.trufflesuite.com) for the relevant documentation.

# 4. Programs
There are two main programs in the replication package: `chainsol.js` and `mutasol.js.`
The first, `chainsol.js`, downloads a contract from Etherscan, as described here [Truffle-tests-for-free](https://arxiv.org/abs/1907.09208).
The second program, `mutasol.js`, generates mutants, as described in the paper submitted to TAP2020.
These two programs use auxiliary modules: `comments.js`, `prepare.js`, `soljson.js`, and `evm_decoder.js`, all of which are available in the package.

## 4.1 Dependencies on `npm` modules
The programs `chainsol.js` and `mutasol.js` have a number of dependencies that can be installed in the `$HOME` directory as follows (tested on Ubuntu 18.04.3). The software is intended to run on a dedicated VM, hence for convenience everything is installed in the home directory.
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


## 4.2 Dependencies on Solidity compiler versions
The programs `chainsol.js` and `mutasol.js` also depend on the appropriate version of the solidity compiler.

The call `mutasol.js -c` will generate a script to download the Solidity compiler binaries from [Emscripten binaries](https://github.com/ethereum/solc-bin/blob/gh-pages/bin/list.json) into the directory `$HOME/soljson` as follows:
```
$ node mutasol.js -c >$HOME/soljson/script.sh
$ cd $HOME/soljson/
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

## 4.3 Dependencies on programs
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
$ sed --version
sed (GNU sed) 4.7
...
```

## 4.4 Dependencies on `Truffle-tests-for-free`
The program `chainsol.js` originates from `Truffle-tests-for-free` and it has been integrated in the replication package.
The file `scrapedContractsVerified.json` contains a list of key information about all verified smart contracts that were available on Etherscan on 1 January 2019.
The list includes the smart contracts from `Truffle-tests-for-free`.

# 5. Structure of the replication package
After running all mutants, there will be 1120 directories, with names derived from the name and address of the contract, e.g. `Vitaluck_3b400b.dir`.
Each directory contains all files and directories needed by `truffle test` and many output files.

## 5.1 Creating the contract directories and the log files
The script `make_loop.sh` makes 1120 calls to `make.sh` with the address of a contract to download, generate and execute the mutants.
We have run `make_loop.sh` in parallel for all contracts on 14 machines, which took about one week.

The following example call to `make.sh`  will create the `Vitaluck_3b400b.dir` directory.
```
$ bash make.sh 0xef7c7254c290df3d167182356255cdfd8d3b400b
```

The output of `make.sh` should look something like this:

```
Starting in Vitaluck_3b400b.dir

✔ Preparing to download
✔ Downloading
✔ Cleaning up temporary files
✔ Setting up box

Unbox successful. Sweet!

Commands:

  Compile:        truffle compile
  Migrate:        truffle migrate
  Test contracts: truffle test

Starting Mutant Vitaluck.sol_0
...
Starting Mutant Vitaluck.sol_9
Finished in Vitaluck_3b400b.dir
```
Running `make.sh` may generate warnings like this `/bin/rm: cannot remove '/tmp/tmp-5818PkSXWctk5kNI': Operation not permitted`, because the script is trying to remove some debris produced by `truffle`. Such warnings can be ignored.


## 5.2 Structure of the directories
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

## 5.3 Original contracts
The file `<contract>.js` in the `test` directory is the de-compiled version of the first 50 historic transactions of the contract.
The file `support.js` in the test directory contains some useful helper functions for the test.
(The same file appears in all 1120 directories.)
The files in the `test` directory are generated by `chainsol.js`.

The `contracts` directory contains the solidity files related to the contract.
The file `Migrations.sol` in the `contracts` directory is the migration file needed by the Truffle framework.
The file `<contract>.sol.original` in the contracts directory is the original code of the contract as downloaded from Etherscan by `chainsol.js`.

The files `ganache_debug_<contract>.sol.log.gz` contain the gzipped log generated by `ganache-cli` for the original contracts (output by the `make.sh` script).
We have used a locally modified version of `ganache-cli` with a non-standard debug output that also prints the PC alongside the EVM instruction.
This extra information is needed for the calculation of the coverage of the tests.
The files `ganache_debug_<contract>.sol_<mutant>.log.gz` contain the same information as above but for the mutants (output by the make.sh script).

The file `deployment.json` contains the ABI, and the bytecode of the contract, which we have downloaded from [Google BigQuery](https://console.cloud.google.com/bigquery?project=itrust-blocktest&p=bigquery-public-data&d=ethereum_blockchain&page=dataset).
The results of this download are stored in the `Traces` directory.

## 5.4 Truffle test files
The following files and directories are standard for truffle tests: `1_initial_migration.js` in the `migrations` directory, and `truffle-config.js`.
These are generated by `chainsol.js`.

## 5.5 Mutants of the contracts
The files `<contract>.sol_<mutant>.mut` in the `contracts` directory are the 50 mutants.
The files `<contract>.sol_<mutant>.log` contain the logfiles from running `truffle test` on each mutant (output by the `make.sh` script).

## 5.6 Data files
The file `bqtrace.json` contains the first 50 internal and external transactions of the contract, downloaded from Google BigQuery.
The file `chainsol.log` is the log generated by `chainsol.js` while downloading and generating the test for the contract.
The file `mutasol.log` is the log generated by `mutasol.js` while generating the mutants.
The file `truffle.log` contains the log of running truffle test (output by the `make.sh` script).

# 6 Analysis
Please run the following script to perform a basic analysis:
```
$ bash diff_loop.sh
```
This script processes the data in all diractories named `<contract>_<address>.dir`. For each directory it should generate 50 files with the extension `.diff`, i.e. one per mutant. It echoes the name of the dirotories processed.

## 6.1 The output of the basic analysis explained
The files with a `.diff` extension provide a basic analysis of the differences between the outputs of the original contract and a specific mutant. 
For example, the first part of the `.diff` file for mutant 25 shows the textual change of the mutant.

```
Mutation:
+ diff contracts/Vitaluck.sol.original contracts/Vitaluck.sol_25.mut
149c149
<             if(_finalRandomNumber >= 900) {
---
>             if(_finalRandomNumber >=  /*mutation*/ 1 /*noitatum*/ ) {
```

The second part shows the number of lines in the output of seven `diff` commands, one per type of output.

The example below shows that the given mutant is killed by differences in event outputs (the line with `eventResult` has a non-zero value) and by differences in method outputs (see the line with `methodResult`).
* There are no differences in the transaction status (the line with `txResult` has a 0 value).
* The lines with `fromBalance` and `toBalance` are not used.
* There are differences in gas consumption between the original and the mutant (see the line with `txGasUsed`).
This means that the original and the mutant do not consume exactly the same amount of gas.
However, this does not mean that the mutant is also killed by the gas limit criterion.
Instead, the calculation is done in the advanced analysis of differences.
* There are no differences in the time stamps of the blocks (see the line `txTime`).
Even if there are differences, this does not mean that the transactions in the mutant and the original execute at different times.
Instead, the differences are due to the fact that the time stamps of the first 3 blocks, which are created before the contract is deployed.

```
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


## 6.2 Advanced analysis
The advanced analysis scripts are not included in the replication package because we were unable to make them sufficiently robust in the time we had available.
Instead we have included the outputs of the scripts in the replication package. These are:

```
kill_detail_TxEvMethLimit.csv
kill_summary_000_1120.csv
```
The data file `kill_summary_000_1120.csv` contains many columns, of which the following are the most relevant:

* `run` indicates the killing decision, which can be `Limit`, `TxEvMeth`, or `TxEvMethLimit`.
* `maxTx` indicates the number of the current transaction, where Tx 0 is the deployment transaction.
* `name` is the name of the contract (disambiguated).
* `address` is the address of the contract on the Ethereum blockchain.
* `SLOC` is the number of source lines of the contract.
* `transactions` indicates how many transactions were made against the contract on 1 Jan 2019.
* `ether` is the amount of Ether stored in the contract on 1 Jan 2019.
* `version` is the compiler version (from the pragma in the course code).
* `registration_date` is the date at which the contract was registered as a verified smart contract on Etherscan.
* `methodCnt` is the number of different pure methods in the source code of the mutant.
* `instructionCnt` is the number of instructions in the byte code of the compiled mutant.
* `executionCnt` is the number of bytecodes of the mutant that have been executed.
* `compFailCnt` is the number of still born mutants for the contract.
* `mutNotEqCnt` is the number of trivially non-equivalent mutants of the contract.
* `killCnt` is the number of mutants killed.

The data file `kill_detail_TxEvMethLimit.csv` contains 10 columns, of which the following are most relevant:
* `mutant` indicates the mutant number.
* `operator` indicates which mutation operator was applied.
* `status` indicates whether the test was killed by the mutant before the manual analysis.

```
kill_detail.pdf
kill_summary.pdf
```

The file [kill_summary.pdf](kill_summary.pdf) shows on page 6 how Figure 1 from the paper was generated by SPSS from the data file `kill_summary_000_1120.csv`.

The file [kill_detail.pdf](kill_detail.pdf) shows on page 12-14 how Table 3 from the paper was generated from the data file `kill_detail_TxEvMethLimit.csv`. 
The two PDFs also show many of the descriptive statistics and rank correlations that have been used in the paper.

## 6.3 Manually analysing the stratified sample
The results of manually analysing the five contracts from the stratified sample of Table 4 are included in five different `.csv` files:

```
DBToken_5287BE.csv
MultiSigWallet_fbd121.csv
NumberBoard_9E7505.csv
casinoProxy_c0b022.csv
mall_7f683d.csv
```

Each of these `.csv` files contains 10 columns, of which the following are most relevant.
* `mutant` indicates the mutant number.
* `operator` indicates which mutation operator was applied.
* `status` indicates whether the test was killed by the mutant before the manual analysis.
* `notes` indicates what needs to be done to make the mutant killable.
* `details` indicates how the test could be updated.
Note that we have not actually updated any tests, nor have we executed new tests.
