// Turn instamining off
function _minerStop( ) {
	return new Promise( ( resolve, reject ) => {
		web3.currentProvider.send( {
			jsonrpc: '2.0',
			method: 'miner_stop',
			params: [],
			id: new Date( ).getSeconds( )
		}, ( err2, resp2 ) => {
			return err2 ? reject( err2 ) : resolve( resp2 ) ;
		} ) ;
	} ) ;
}

// Mine a new block with the given timestamp and seuqnece number
function _mineBlockWithTimestamp( sequence, timestamp ) {
	return new Promise( ( resolve, reject ) => {
		web3.currentProvider.send( {
			jsonrpc: '2.0',
			method: 'evm_mine',
			evm_mine_sequence: sequence,
			params: [timestamp],
			id: new Date( ).getSeconds( )
		}, ( err2, resp2 ) => {
			return err2 ? reject( err2 ) : resolve( resp2 ) ;
		} ) ;
	} ) ;
}

// Promisify the getBlockNumber function
function _getBlockNumber( ) {
	return new Promise( function( resolve, reject ) {
		web3.eth.getBlockNumber( function( e, result ) {
			if( e !== null ) {
				 reject( e ) ;
			} else {
				 resolve( result ) ;
			}
		} ) ;
	} ) ;
}

module.exports = {
	minerStop: _minerStop,
	mineBlockWithTimestamp: _mineBlockWithTimestamp,
	getBlockNumber: _getBlockNumber
} ;
