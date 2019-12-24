# Run this script to download the contracts from etherscan.io
# Please make sure that you abide by the policies of etherscan

cat <<'end' >/tmp/strip.js
const fs = require( 'fs' ) ;

const html = fs.readFileSync( '/dev/stdin', 'utf8' ) ;

const sol = html.replace( /[\s\S]*<pre class='js-sourcecopyarea editor' id='editor' style='margin-top: 5px;'>/, '' )
		.replace( /<\/pre><br><script[\s\S]*/, '' )
		.replace( /&#160;/g, ' ' )
		.replace( /&#162;/g, 'c' )
		.replace( /&#169;/g, '(c)' )
		.replace( /&#173;/g, '-' )
		.replace( /&#176;/g, 'o' )
		.replace( /&#180;/g, "'" )
		.replace( /&#183;/g, '.' )
		.replace( /&#184;/g, ',' )
		.replace( /&#185;/g, '1' )
		.replace( /&#189;/g, '1/2' )
		.replace( /&#191;/g, '?' )
		.replace( /&#224;/g, 'a' )
		.replace( /&#225;/g, 'a' )
		.replace( /&#226;/g, 'a' )
		.replace( /&#231;/g, 'c' )
		.replace( /&#232;/g, 'e' )
		.replace( /&#233;/g, 'e' )
		.replace( /&#237;/g, 'i' )
		.replace( /&#39;/g, "'" )
		.replace( /&amp;/g, '&' )
		.replace( /&gt;/g, '>' )
		.replace( /&lt;/g, '<' )
		.replace( /&quot;/g, '"' )
		.replace( /&times;/g, '*' );

console.log( sol ) ;
end

for SOL
in [A-Z].dir/*.dir/contracts/*.sol
do
	if [[ $SOL != *"Migrations.sol" && $SOL != "Vitaluck"* ]]
	then
		URL=`cat $SOL | sed -n -e 's/#contracts/#code/p'`
		HTML=`echo $SOL | sed -e 's/\.sol/.html/'`
		curl $URL > $HTML
		sleep 5
	fi
done

for HTML
in [A-Z].dir/*.dir/contracts/*.html
do
	if [[ $HTML != *"Vitaluck"* ]]
	then
		SOL=`echo $HTML | sed -e 's/\.html/.sol/'`
		CODE=`echo $HTML | sed -e 's/\.html/.code/'`
		mv $SOL $CODE
		node /tmp/strip <$HTML >$SOL
		/bin/rm $HTML
	fi
done
