# Run this script to diff the output of the mutants with the output of the original contract

Truffle=`pwd`
Tmp=/tmp/Diff_$$
/bin/rm -rf /tmp/Diff_*
mkdir -p $Tmp

for Dir
in *.dir
do
	(
		echo "+ cd $Dir"
		cd $Dir
		for SubDir
		in *dir
		do
			(
				echo "+ cd $SubDir"
				cd $SubDir
				Base=`echo $SubDir | sed -e 's/\(.*\)_......\.dir/\1/'`
				for Mutant
				in $Base.sol_*.log
				do
					if [ -f $Mutant ]
					then
						$Truffle/diff.sh $Tmp $Base.sol_0.log $Mutant
						(
							echo "Mutation:"
							head -5 $Mutant
							echo ""
							echo "Killed:"
							wc -l $Tmp/$Mutant.*.diff
							echo ""
							for Diff
							in $Tmp/$Mutant.*.diff
							do
								if [ -s $Diff ]
								then
									echo "$Diff"
									cat $Diff
								fi
							done
						) >$Mutant.diff
					fi
				done
			)
		done
	)
done
