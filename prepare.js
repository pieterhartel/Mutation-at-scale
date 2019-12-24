const fs = require( 'fs' ) ;

// Read text from a file and parse it.
function readFile( fileName ) {
	var text ;
	var result = '' ;
	try {
		text = fs.readFileSync( fileName ) ;
	} catch( error ) {
		console.error( 'prepare:fatal: cannot read %s (%s)', fileName, error.message ) ;
		process.exit( 1 ) ;
	}
	if( text.length > 0 ) {
		try {
			result = JSON.parse( text ) ;
		} catch( error ) {
			console.error( 'prepare:fatal: cannot parse %s (%s)', fileName, error.message ) ;
			process.exit( 1 ) ;
		}
	}
	return result ;
}

function fetchLoc( contractItem, id ) {
	const rule = contractItem.killedList[ id ].rule || {LOC: 0} ;
	return rule.LOC ;
}

function main( ) {
	if( process.argv.length < 2 ) {
		console.error( 'usage: node prepare detail.json ' );
		process.exit( 1 ) ;
	}
	const fileName = process.argv[ 2 ] ;
	const detailInfo = readFile( fileName ) ;
	console.log( 'comment,contract,mutant,SLOC,line,operator,status,notes,details' ) ;
	const nameList = Object.keys( detailInfo ).sort( ( a, b ) => a.localeCompare( b ) ) ;
	nameList.map( name => {
		const contractItem = detailInfo[ name ] ;
		const unsortedList = Object.keys( contractItem.killedList ) ;
		const sortedList = unsortedList.sort( ( a, b ) => fetchLoc( contractItem, a ) - fetchLoc( contractItem, b ) ) ;
		console.log( '1,Base=Regression_*/%s.dir; for i in %s; do vi $Base/contracts/*_${i}.*mut $Base/*_${i}.*diff; done', name, sortedList.join( ' ' ) );
		sortedList.map( id => {
			const killedItem = contractItem.killedList[ id ] ;
			const rule = killedItem.rule || { operator: '', LOC: '' } ;
			console.log( '0,%s,%s,%s,%s,%s,%s',
				contractItem.dirName.replace( /.dir/, '' ),
				id,
				contractItem.SLOC,
				rule.LOC,
				rule.operator,
				killedItem.killedBy ) ;
		} ) ;
	} ) ;
}

main( ) ;
