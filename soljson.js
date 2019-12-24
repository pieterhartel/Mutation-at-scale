// Interface to the emscripten versions of the solidity compiler

// Dependencies
const fs = require( 'fs' ) ;
const solc = require( 'solc' ) ;

// The current list of compilers available are stored below.
// Extend the list if a new compiler appears.
const releaseTable = {
	'0.5.4':	'soljson-v0.5.4+commit.9549d8ff.js',
	'0.5.3':	'soljson-v0.5.3+commit.10d17f24.js',
	'0.5.2':	'soljson-v0.5.2+commit.1df8f40c.js',
	'0.5.1':	'soljson-v0.5.1+commit.c8a2cb62.js',
	'0.5.0':	'soljson-v0.5.0+commit.1d4f565a.js',
	'0.4.25':	'soljson-v0.4.25+commit.59dbf8f1.js',
	'0.4.24':	'soljson-v0.4.24+commit.e67f0147.js',
	'0.4.23':	'soljson-v0.4.23+commit.124ca40d.js',
	'0.4.22':	'soljson-v0.4.22+commit.4cb486ee.js',
	'0.4.21':	'soljson-v0.4.21+commit.dfe3193c.js',
	'0.4.20':	'soljson-v0.4.20+commit.3155dd80.js',
	'0.4.19':	'soljson-v0.4.19+commit.c4cbbb05.js',
	'0.4.18':	'soljson-v0.4.18+commit.9cf6e910.js',
	'0.4.17':	'soljson-v0.4.17+commit.bdeb9e52.js',
	'0.4.16':	'soljson-v0.4.16+commit.d7661dd9.js',
	'0.4.15':	'soljson-v0.4.15+commit.bbb8e64f.js',
	'0.4.14':	'soljson-v0.4.14+commit.c2215d46.js',
	'0.4.13':	'soljson-v0.4.13+commit.fb4cb1a.js',
	'0.4.12':	'soljson-v0.4.12+commit.194ff033.js',
	'0.4.11':	'soljson-v0.4.11+commit.68ef5810.js',
	'0.4.10':	'soljson-v0.4.10+commit.f0d539ae.js',
	'0.4.9':	'soljson-v0.4.9+commit.364da425.js',
	'0.4.8':	'soljson-v0.4.8+commit.60cc1668.js',
	'0.4.7':	'soljson-v0.4.7+commit.822622cf.js',
	'0.4.6':	'soljson-v0.4.6+commit.2dabbdf0.js',
	'0.4.5':	'soljson-v0.4.5+commit.b318366e.js',
	'0.4.4':	'soljson-v0.4.4+commit.4633f3de.js',
	'0.4.3':	'soljson-v0.4.3+commit.2353da71.js',
	'0.4.2':	'soljson-v0.4.2+commit.af6afb04.js',
	'0.4.1':	'soljson-v0.4.1+commit.4fc6fc2c.js',
	'0.4.0':	'soljson-v0.4.0+commit.acd334c9.js',
	'0.3.6':	'soljson-v0.3.6+commit.3fc68da.js',
	'0.3.5':	'soljson-v0.3.5+commit.5f97274.js',
	'0.3.4':	'soljson-v0.3.4+commit.7dab890.js',
	'0.3.3':	'soljson-v0.3.3+commit.4dc1cb1.js',
	'0.3.2':	'soljson-v0.3.2+commit.81ae2a7.js',
	'0.3.1':	'soljson-v0.3.1+commit.c492d9b.js',
	'0.3.0':	'soljson-v0.3.0+commit.11d6736.js',
	'0.2.2':	'soljson-v0.2.2+commit.ef92f56.js',
	'0.2.1':	'soljson-v0.2.1+commit.91a6b35.js',
	'0.2.0':	'soljson-v0.2.0+commit.4dc2445.js',
	'0.1.7':	'soljson-v0.1.7+commit.b4e666c.js',
	'0.1.6':	'soljson-v0.1.6+commit.d41f8b7.js',
	'0.1.5':	'soljson-v0.1.5+commit.23865e3.js',
	'0.1.4':	'soljson-v0.1.4+commit.5f6c3cd.js',
	'0.1.3':	'soljson-v0.1.3+commit.28f561.js',
	'0.1.2':	'soljson-v0.1.2+commit.d0d36e3.js',
	'0.1.1':	'soljson-v0.1.1+commit.6ff4cd6.js'
}

// Create a shell script to download all compiler releases that will be needed
function fetchReleases( ) {
	const result = [ 'echo "see https://github.com/ethereum/solc-bin/blob/gh-pages/bin/list.json"' ] ;
	for( var version in releaseTable ) {
		result.push( 'wget https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/bin/' + releaseTable[ version ] ) ;
	}
	return result.join( '\n' ) ;
}

// Avoid reloading the compiler as loading is expensive.
var currentVersion ;
var currentCompiler ;

// Compile the source of a smart contract and return key data
function emscriptenCompile( directory, version, srcCode, settings ) {
	if( currentVersion !== version ) {
		const longVersion = releaseTable[ version ] ;
		const fileName = directory + '/' + longVersion ;
		if( ! fs.existsSync( fileName ) ) {
			console.error( 'soljson:fatal: compiler %s not found', fileName ) ;
			process.exit( 1 ) ;
		}
		try {
			const soljsonModule = require( fileName ) ;
			currentCompiler = solc.setupMethods( soljsonModule ) ;
		} catch( error ) {
			console.error( 'soljson:fatal: cannot load compiler %s (%s)', longVersion, error ) ;
			process.exit( 1 ) ;
		}
		currentVersion = version ;
	}
	var input = JSON.stringify( {
		language: 'Solidity',
		sources: {
			'Task' : {
				content: srcCode
			}
		},
		settings: settings
	} );
	var output ;
	try {
		output = currentCompiler.compile( input );
	} catch( error ) {
		const formattedMessage = '?:?:soljson compilation with version ' + version + ' failed (' + error + ')' ;
		const severity = 'error' ;
		return { errors: [ { severity: severity, formattedMessage: formattedMessage } ] } ;
	}
	if( typeof output === 'undefined' ) {
		console.error( 'soljson:fatal: compilation %s did not generate output', version ) ;
		process.exit( 1 ) ;
	} else {
		try{
			return JSON.parse( output ) ;
		} catch( error ) {
			console.error( 'soljson:fatal: cannot parse compiler %s output', version ) ;
			process.exit( 1 ) ;
		}
	}
}

// Determine the solidity compiler version to be used from the 'pragma solidity' in the source text.
function parsePragmaSolidity( srcCode, defaultVersion ) {
	const pragmaString = srcCode.match( /^\s*pragma\s+solidity[^;]*/m ) ;
	if( pragmaString == null ) {
		return defaultVersion ;
	} else {
		const versionExpression = pragmaString[ 0 ].replace( /.*solidity/, '' ).replace( /['"\s]/g, '' ) ;
		var versionComponent = versionExpression.match( /(>=|>|<=|<|\^|~)?(\d+)\.(\d+)\.?(\d*)/ ) ;
		if( versionComponent == null ) {
			console.error( 'mutasol:fatal: cannot determine compiler version from pragma solidity %s', versionExpression ) ;
			process.exit( 1 ) ;
		} else {
			if( versionComponent[ 4 ] === '' ) {
				versionComponent[ 4 ] = '0' ;
			}
			if( versionComponent[ 1 ] === '>' ) {
				versionComponent[ 4 ] = ( parseInt( versionComponent[ 4 ] ) + 1 ).toString() ;
			}
			const version = versionComponent[ 2 ] + '.' + versionComponent[ 3 ] + '.' + versionComponent[ 4 ] ;
			if( typeof releaseTable[ version ] === 'undefined' ) {
				console.error( 'mutasol:fatal: compiler version %s not avaialable', versionExpression ) ;
				process.exit( 1 ) ;
			} else {
				return version ;
			}
		}
	}
}

exports.releaseTable = releaseTable ;
exports.emscriptenCompile = emscriptenCompile ;
exports.fetchReleases = fetchReleases ;
exports.parsePragmaSolidity = parsePragmaSolidity ;
exports.fetchReleases = fetchReleases ;
