# Helper script for make_loop.sh

set -u

if [ $@ = "unused" ]
then
	echo "unused"
	exit
fi

Test=false
ISODate="1970-01-01T00:00:00+0000"

# Vitaluck_3b400b
# ERC20_f52136
# MarsTokenV1_292a17
# bash make.sh 0xef7c7254c290df3d167182356255cdfd8d3b400b 0x633f2b386538f542f292f6f775999f5ffff52136 0x0f72714b35a366285df85886a2ee174601292a17

# Determine which comparison operator to use for the filetype command
case `uname` in
	Linux*)	Operator="-bi" ;;
	Darwin*)Operator="-I";;
	*)	echo "uname output unexpected, abort"; exit ;;
esac
export NODE_PATH=$HOME/node_modules
export PATH=$PATH:$NODE_PATH/.bin

for Parameter
in "$@"
do
	Record=`jq -c '.[] | select(.address | match("'$Parameter'";"i"))' <scrapedContractsVerified.json`
	Address=`echo $Record | jq -r '.address'`
	Suffix=`echo $Record | jq -r '.address | .[-6:]'`
	Name=`echo $Record | jq -r '.name'`
	Directory=${Name}_${Suffix}.dir
	Version=`echo $Record | jq -r '.version'`

	/bin/rm -rf -rf $Directory
	mkdir $Directory
	echo "Starting in $Directory"
	(	cd $Directory
		cp ../Traces/$Directory/bqtrace.json .

# Generation: Extract contract sources from Etherscan and generate tests from the transactions of the contract
		truffle init
		echo $Record >chainsol.log
		fgrep toBigNumber $HOME/node_modules/abi-decoder/index.js >>chainsol.log
		if $Test
		then
			node ../chainsol.js -c $Name -a $Address -nt 5 -na 100 -v $Version -d >shar.sh 2>>chainsol.log
		else
			node ../chainsol.js -c $Name -a $Address -nt 50 -na 1000 -v $Version >shar.sh 2>>chainsol.log
		fi
		if [ $? -ne 0 ]
		then
			echo "chainsol failed in $Directory"
#			bash ../gensurvivors.sh >survivors.json
			break
		fi
		sh shar.sh
		mv truffle.js truffle-config.js
		TimeStamp=`sed -n -e 's/^# txListOriginal.timestamp = \([0-9]*\).*/\1/p' shar.sh`
		# ISODate=`sed -n -e 's/^# txListOriginal.ISODate = "\([^"]*\)".*/\1/p' shar.sh`
		echo $TimeStamp >>chainsol.log
		Original=contracts/$Name.sol
		FileType=`file $Operator $Original | sed -e 's/.*charset=//'`
		if [ $FileType = "utf-8" ]
		then
			cp $Original $Original.unconverted
			iconv -c -f utf8 -t ascii//TRANSLIT $Original >$Original.original
			echo "+ diff $Original.unconverted $Original.original" >iconv.log
			diff $Original.unconverted $Original.original >>iconv.log
		else
			cp $Original $Original.original
		fi

# Checking: Check that the generated tests are functional
		GanacheLog=ganache_debug_$Name.sol.log
		ganache-cli -a 1000 -e 1000000 -d -l 10000000 -t $ISODate --debug -v >$GanacheLog &
		Pid=$!
		sleep 30
		truffle test --verbose-rpc &>truffle.log
		kill $Pid
		/bin/rm -rf /tmp/test* /tmp/tmp*
		gzip $GanacheLog

# Mutation: Generate mutants from the contract source
		( 	cd contracts
			/bin/rm -f $Name*mut
			cp $Name.sol.original $Name.sol
			if $Test
			then
				node ../../mutasol.js -f $Name.sol -o 1 -m 5 -n 50 -v $Version -d 2>../mutasol.log
			else
				node ../../mutasol.js -f $Name.sol -o 1 -m 50 -n 500 -v $Version 2>../mutasol.log
			fi
			if [ $? -ne 0 ]
			then
				echo "mutasol failed in $Directory"
#				bash ../../gensurvivors.sh >survivors.json
				break
			fi
		)

# Testing: Run the test on each mutant to see which ones would be killed
		for MutantPath
		in contracts/$Name*.mut
		do
			MutantName=`basename $MutantPath .mut`
			echo "Starting Mutant $MutantName"
			echo "+ diff contracts/$Name.sol.original $MutantPath" >$MutantName.log
			sed -e '/^\/\/ begin_mutation_summary:$/,$d' $MutantPath | diff contracts/$Name.sol.original - >>$MutantName.log
			cp $MutantPath contracts/$Name.sol
			echo $TimeStamp >>$MutantName.log
			GanacheLog=ganache_debug_$MutantName.log
			ganache-cli -a 1000 -e 1000000 -d -l 10000000 -t $ISODate --debug -v >$GanacheLog &
			Pid=$!
			sleep 30
			truffle test >>$MutantName.log
			kill $Pid
			/bin/rm -rf /tmp/test* /tmp/tmp*
			gzip $GanacheLog
		done

# Data collection
#		bash ../gensurvivors.sh >survivors.json
	)
	echo "Finished in $Directory"
done
