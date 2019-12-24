const Vitaluck = artifacts.require( "./Vitaluck.sol" ) ;
const web3Utils = require( "web3-utils" ) ;
const support = require( "./support.js" ) ;

const maxRandom = 10 ;
const randomSeed = 0 ;
const random = require( "random-seed" ).create( randomSeed ) ;

const contractName = "Vitaluck" ;
console.log( "contractName = %s", JSON.stringify( contractName ) ) ;

const addressListOriginal = ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000001", "0xEf7C7254c290DF3d167182356255CDfd8D3b400b", "0x46d9112533ef677059c430E515775e358888e38b", "0x23a49A9930f5b562c6B1096C3e6b5BEc133E8B2E", "0x0a1f64527ADBF775CEBdb00937f0FB63d479A11a", "0x720b303d7803418fC2a5f4D5Ba42928E9421c91F", "0x1A5fe261E8D9e8efC5064EEccC09B531E6E24BD3", "0x70580eA14d98a53fd59376dC7e959F4a6129bB9b", "0x70EBad820B1d70ff702B4E084CEd819d8f04568B", "0x9aFbaA3003D9e75C35FdE2D1fd283b13d3335f00", "0x64cDc23FadD389170b30F3F4b75b47EA12f65221", "0xC54100Fc034D412C21ba92Ccf2D916374AC22555"] ;
console.log( "addressListOriginal = %s", JSON.stringify( addressListOriginal ) ) ;
console.log( "addressListOriginal.length = %d", addressListOriginal.length ) ;

const methodPrototypeListOriginal = [{constant: true, inputs: [], name: "GetStats", outputs: [{name: "", type: "uint256"}, {name: "", type: "uint256"}, {name: "", type: "uint256"}], payable: false, stateMutability: "view", type: "function"}, {constant: true, inputs: [{name: "_owner", type: "address"}], name: "GetLastBetUser", outputs: [{name: "", type: "uint256[]"}], payable: false, stateMutability: "view", type: "function"}, {constant: true, inputs: [], name: "GetWinningAddress", outputs: [{name: "", type: "address"}], payable: false, stateMutability: "view", type: "function"}, {constant: true, inputs: [{name: "", type: "address"}], name: "ownerBetsCount", outputs: [{name: "", type: "uint256"}], payable: false, stateMutability: "view", type: "function"}, {constant: true, inputs: [{name: "_owner", type: "address"}], name: "GetUserBets", outputs: [{name: "", type: "uint256[]"}], payable: false, stateMutability: "view", type: "function"}, {constant: true, inputs: [{name: "_betId", type: "uint256"}], name: "GetBet", outputs: [{name: "number", type: "uint256"}, {name: "isWinner", type: "bool"}, {name: "player", type: "address"}, {name: "timestamp", type: "uint32"}, {name: "JackpotWon", type: "uint256"}], payable: false, stateMutability: "view", type: "function"}, {constant: true, inputs: [], name: "GetCurrentNumbers", outputs: [{name: "", type: "uint256"}, {name: "", type: "uint256"}, {name: "", type: "uint256"}], payable: false, stateMutability: "view", type: "function"}] ;
console.log( "methodPrototypeListOriginal = %s", JSON.stringify( methodPrototypeListOriginal ) ) ;

const eventPrototypeListOriginal = [{anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"}] ;
console.log( "eventPrototypeListOriginal = %s", JSON.stringify( eventPrototypeListOriginal ) ) ;

const eventSignatureListOriginal = ["NewPlay(address,uint256,bool)"] ;
console.log( "eventSignatureListOriginal = %s", JSON.stringify( eventSignatureListOriginal ) ) ;

const topicListOriginal = ["0xd1c1f19f7ba3ca76debbac20fd5125c7491a617fc098b486edd1bc40539792f4"] ;
console.log( "topicListOriginal = %s", JSON.stringify( topicListOriginal ) ) ;

const nBlocksOriginal = 27 ;
console.log( "nBlocksOriginal = %s", nBlocksOriginal ) ;

const fromBlockOriginal = 4976191 ;
console.log( "fromBlockOriginal = %s", fromBlockOriginal ) ;

const toBlockOriginal = 5001667 ;
console.log( "toBlockOriginal = %s", toBlockOriginal ) ;

const constructorPrototypeOriginal = {inputs: [], name: "Vitaluck", outputs: [], type: "function"} ;
console.log( "constructorPrototypeOriginal = %s", JSON.stringify( constructorPrototypeOriginal ) ) ;

var addressList = null ;
var deployedContract = "address(this)" ;
var eventPrototypeList = null ;

function convertAddress( theAddress ) {
	if( theAddress === 0 || theAddress.match( /^0x0*$/ ) ) {
		return "0x0000000000000000000000000000000000000000" ;
	} else if( theAddress === 1 || theAddress.match( /^0x0*1$/ ) ) {
		return "0x0000000000000000000000000000000000000001" ;
	} else if( theAddress === "address(this)" ) {
		return "address(this)" ;
	} else {
		try {
			return web3.utils.toChecksumAddress( theAddress ) ;
		} catch( error ) {
			return theAddress ;
		}
	}
}

function mergeEvent( call, result ) {
	var merge = { inputs: [], name: call.name, outputs: [], type: call.type } ;
	for( var i = 0; i < call.inputs.length; i++ ) {
		const item = result[ call.inputs[ i ].name ] ;
		if( typeof item !== "undefined" ) {
			merge.outputs[ i ] = { name: call.inputs[ i ].name, type: call.inputs[ i ].type, value: ( item === null ? "null" :
				( typeof item.toString === "undefined" ? item : item.toString( 10, 85 ) ) ) } ;
		}
	}
	return merge ;
}

function mergeCall( call, args ) {
	var merge = { inputs: call.inputs, name: call.name, outputs: [], type: call.type } ;
	if( typeof args.isError !== 'undefined' ) {
		merge.isError = args.isError ;
		merge.message = args.message ;
	} else if( call.outputs.length === 1 ) {
		merge.outputs[ 0 ] = { name: call.outputs[ 0 ].name, type: call.outputs[ 0 ].type, value: ( args === null ? "null" :
				( typeof args.toString === "undefined" ? args : args.toString( 10, 85 ) ) ) } ;
	} else {
		for( var i = 0; i < call.outputs.length; i++ ) {
			const item = args[ i ] ;
			merge.outputs[ i ] = { name: call.outputs[ i ].name, type: call.outputs[ i ].type, value: ( item === null ? "null" :
				( typeof item.toString === "undefined" ? item : item.toString( 10, 85 ) ) ) } ;
		}
	}
	return merge ;
}

async function constantFunction( txIndex, deployedContract ) {
	var methodCall, methodArgs, methodResult ;
	methodCall = {inputs: [], name: "GetStats", outputs: [{name: "", type: "uint256"}, {name: "", type: "uint256"}, {name: "", type: "uint256"}], type: "function"} ;
	console.log( "methodCall[" + txIndex + ",0] = %s", JSON.stringify( methodCall ) ) ;
	try {
		methodArgs = await deployedContract.methods[ "GetStats()" ](  ) ;
	} catch( methodError ) {
		methodArgs = { isError: 1, message: methodError.message } ;
	}
	methodResult = mergeCall( methodCall, methodArgs ) ;
	console.log( "methodResult[" + txIndex + ",0] = %s", JSON.stringify( methodResult ) ) ;
	methodCall = {inputs: [{type: "address", name: "_owner", value: addressList[ random.range( addressList.length - 3 ) + 3 ]}], name: "GetLastBetUser", outputs: [{name: "", type: "uint256[]"}], type: "function"} ;
	console.log( "methodCall[" + txIndex + ",1] = %s", JSON.stringify( methodCall ) ) ;
	try {
		methodArgs = await deployedContract.methods[ "GetLastBetUser(address)" ]( methodCall.inputs[ 0 ].value ) ;
	} catch( methodError ) {
		methodArgs = { isError: 1, message: methodError.message } ;
	}
	methodResult = mergeCall( methodCall, methodArgs ) ;
	console.log( "methodResult[" + txIndex + ",1] = %s", JSON.stringify( methodResult ) ) ;
	methodCall = {inputs: [], name: "GetWinningAddress", outputs: [{name: "", type: "address"}], type: "function"} ;
	console.log( "methodCall[" + txIndex + ",2] = %s", JSON.stringify( methodCall ) ) ;
	try {
		methodArgs = await deployedContract.methods[ "GetWinningAddress()" ](  ) ;
	} catch( methodError ) {
		methodArgs = { isError: 1, message: methodError.message } ;
	}
	methodResult = mergeCall( methodCall, methodArgs ) ;
	console.log( "methodResult[" + txIndex + ",2] = %s", JSON.stringify( methodResult ) ) ;
	methodCall = {inputs: [{type: "address", name: "", value: addressList[ random.range( addressList.length - 3 ) + 3 ]}], name: "ownerBetsCount", outputs: [{name: "", type: "uint256"}], type: "function"} ;
	console.log( "methodCall[" + txIndex + ",3] = %s", JSON.stringify( methodCall ) ) ;
	try {
		methodArgs = await deployedContract.methods[ "ownerBetsCount(address)" ]( methodCall.inputs[ 0 ].value ) ;
	} catch( methodError ) {
		methodArgs = { isError: 1, message: methodError.message } ;
	}
	methodResult = mergeCall( methodCall, methodArgs ) ;
	console.log( "methodResult[" + txIndex + ",3] = %s", JSON.stringify( methodResult ) ) ;
	methodCall = {inputs: [{type: "address", name: "_owner", value: addressList[ random.range( addressList.length - 3 ) + 3 ]}], name: "GetUserBets", outputs: [{name: "", type: "uint256[]"}], type: "function"} ;
	console.log( "methodCall[" + txIndex + ",4] = %s", JSON.stringify( methodCall ) ) ;
	try {
		methodArgs = await deployedContract.methods[ "GetUserBets(address)" ]( methodCall.inputs[ 0 ].value ) ;
	} catch( methodError ) {
		methodArgs = { isError: 1, message: methodError.message } ;
	}
	methodResult = mergeCall( methodCall, methodArgs ) ;
	console.log( "methodResult[" + txIndex + ",4] = %s", JSON.stringify( methodResult ) ) ;
	methodCall = {inputs: [{type: "uint256", name: "_betId", value: random.range( maxRandom )}], name: "GetBet", outputs: [{name: "number", type: "uint256"}, {name: "isWinner", type: "bool"}, {name: "player", type: "address"}, {name: "timestamp", type: "uint32"}, {name: "JackpotWon", type: "uint256"}], type: "function"} ;
	console.log( "methodCall[" + txIndex + ",5] = %s", JSON.stringify( methodCall ) ) ;
	try {
		methodArgs = await deployedContract.methods[ "GetBet(uint256)" ]( methodCall.inputs[ 0 ].value ) ;
	} catch( methodError ) {
		methodArgs = { isError: 1, message: methodError.message } ;
	}
	methodResult = mergeCall( methodCall, methodArgs ) ;
	console.log( "methodResult[" + txIndex + ",5] = %s", JSON.stringify( methodResult ) ) ;
	methodCall = {inputs: [], name: "GetCurrentNumbers", outputs: [{name: "", type: "uint256"}, {name: "", type: "uint256"}, {name: "", type: "uint256"}], type: "function"} ;
	console.log( "methodCall[" + txIndex + ",6] = %s", JSON.stringify( methodCall ) ) ;
	try {
		methodArgs = await deployedContract.methods[ "GetCurrentNumbers()" ](  ) ;
	} catch( methodError ) {
		methodArgs = { isError: 1, message: methodError.message } ;
	}
	methodResult = mergeCall( methodCall, methodArgs ) ;
	console.log( "methodResult[" + txIndex + ",6] = %s", JSON.stringify( methodResult ) ) ;
}

contract( "Vitaluck", function( accounts ) {

	it( "TEST: Vitaluck(  )", async function( ) {
		await support.minerStop( ) ;
		addressList = [ "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000001", "address(this)" ].concat( accounts ).map( item => convertAddress( item ) ) ;
		const txOriginal = {blockNumber: "4976191", blockHash: "0xdadca2ec1a4e90c7dcf4939969e888e37f85a7396dc71463bce5a04d556cd751", timeStamp: "1516973359", hash: "0x5f51cec3233e28959a2f39a7eec8bddc8178747e9a6b3991db0c02c6439fcc5b", nonce: "2", transactionIndex: "14", from: "0x0a1f64527adbf775cebdb00937f0fb63d479a11a", to: 0, value: "0", gas: "1410422", gasPrice: "21000000000", input: "0x4fe9d8f5", contractAddress: "0xef7c7254c290df3d167182356255cdfd8d3b400b", cumulativeGasUsed: "1800969", txreceipt_status: "1", gasUsed: "1410422", confirmations: "2831872", isError: "0"} ;
		console.log( "txOriginal[0] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[5], to: 0, value: "0" }
		console.log( "txOptions[0] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Vitaluck", outputs: [], type: "function"} ;
		console.log( "txCall[0] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = Vitaluck.new( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 0, 1516973359 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		if( typeof txResult.receipt !== 'undefined' ) {
			console.log( "txResult[0] = %s", JSON.stringify( txResult.receipt ) ) ;
			process.exit( 1 ) ;
		} else {
			deployedContract = txResult;
			const txReceipt = await web3.eth.getTransactionReceipt( deployedContract.transactionHash ) ;
			const decodedLogs = Vitaluck.decodeLogs( txReceipt.logs ) ;
			txResult = { receipt: txReceipt, blockNumber: txReceipt.blockNumber, logs: decodedLogs, rawLogs: txReceipt.logs } ;
			deployedContract.address = txReceipt.contractAddress ;
			console.log( "contractAddress = %s", JSON.stringify( deployedContract.address ) ) ;
			addressList[2] = deployedContract.address ;
			console.log( "addressList = %s", JSON.stringify( addressList ) ) ;
			const bytecode = await web3.eth.getCode( deployedContract.address ) ;
			console.log( "code = %s", JSON.stringify( bytecode ) ) ;
			eventPrototypeList = deployedContract.abi.filter( item => item.type === "event" ) ;
			console.log( "eventPrototypeList = %s", JSON.stringify( eventPrototypeList ) ) ;
			methodPrototypeList = deployedContract.abi.filter( item => item.constant ) ;
			console.log( "methodPrototypeList = %s", JSON.stringify( methodPrototypeList ) ) ;
			console.log( "txResult[0] = %s", JSON.stringify( txResult.receipt ) ) ;
		}
		const fromBalanceOriginal = { address: addressListOriginal[5], balance: "311422500000000" } ;
		console.log( "fromBalanceOriginal[0] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[5], balance: ( await web3.eth.getBalance( addressList[5], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[0] = %s", JSON.stringify( fromBalance ) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[0,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[0,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 0", async function( ) {
		await constantFunction( 0, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976207", blockHash: "0x93540c964f3354b3a82cd2b9a7b2f5f3fe4e4c3ed2baf5f101f43e134896cf8d", timeStamp: "1516973566", hash: "0xd7edc95981531e8ef4338d5b4952d919e5eec0ef4d47ee533795d99ec029e1fd", nonce: "197", transactionIndex: "30", from: "0x46d9112533ef677059c430e515775e358888e38b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "93520", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "1086334", txreceipt_status: "1", gasUsed: "62347", confirmations: "2831856", isError: "0"} ;
		console.log( "txOriginal[1] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[3], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[1] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[1] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 1, 1516973566 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[1] = %s", JSON.stringify( txResult.receipt ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[3], balance: "150739663480809807" } ;
		console.log( "fromBalanceOriginal[1] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[1] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[3], balance: ( await web3.eth.getBalance( addressList[3], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[1] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[1] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[1,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[1,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 1", async function( ) {
		await constantFunction( 1, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976250", blockHash: "0x5b3c89ac98a5d163a60b3d46256b4c41124ee9789f012cf78380d38d004190af", timeStamp: "1516974143", hash: "0x71ccea3ef4411994796807a1f64d88b32eb1e01a1326516ac088342d11de053b", nonce: "198", transactionIndex: "46", from: "0x46d9112533ef677059c430e515775e358888e38b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "418195", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "1680565", txreceipt_status: "1", gasUsed: "278797", confirmations: "2831813", isError: "0"} ;
		console.log( "txOriginal[2] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[3], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[2] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[2] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 2, 1516974143 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[2] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[2,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x46d9112533ef677059c430e515775e358888e38b"}, {name: "number", type: "uint256", value: "287"}, {name: "won", type: "bool", value: true}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[2,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[3], balance: "150739663480809807" } ;
		console.log( "fromBalanceOriginal[2] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[2] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[3], balance: ( await web3.eth.getBalance( addressList[3], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[2] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[2] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[2,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[2,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 2", async function( ) {
		await constantFunction( 2, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976312", blockHash: "0x1e19307d063800d14212ab0ea3fbfa61a40efb48f1b02a84becfac1fb66e544d", timeStamp: "1516975271", hash: "0xd68e58007cbe00da756c3660e299497746324ea97282dbbcf4d8f0e3475147bd", nonce: "201", transactionIndex: "158", from: "0x46d9112533ef677059c430e515775e358888e38b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "260695", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "5280355", txreceipt_status: "1", gasUsed: "173797", confirmations: "2831751", isError: "0"} ;
		console.log( "txOriginal[3] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[3], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[3] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[3] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 3, 1516975271 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[3] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[3,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x46d9112533ef677059c430e515775e358888e38b"}, {name: "number", type: "uint256", value: "543"}, {name: "won", type: "bool", value: true}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[3,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[3], balance: "150739663480809807" } ;
		console.log( "fromBalanceOriginal[3] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[3] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[3], balance: ( await web3.eth.getBalance( addressList[3], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[3] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[3] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[3,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[3,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 3", async function( ) {
		await constantFunction( 3, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976322", blockHash: "0xfed83b18cf5be9fa591535c739e103ee8bdae1f125ae02a4800c018e7e8c4daf", timeStamp: "1516975405", hash: "0x7a3345e97fe6c7517136e32dbe7217f95641dfdfa4a67776451564910b6926d4", nonce: "202", transactionIndex: "61", from: "0x46d9112533ef677059c430e515775e358888e38b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "260695", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "2748155", txreceipt_status: "1", gasUsed: "173797", confirmations: "2831741", isError: "0"} ;
		console.log( "txOriginal[4] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[3], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[4] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[4] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 4, 1516975405 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[4] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[4,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x46d9112533ef677059c430e515775e358888e38b"}, {name: "number", type: "uint256", value: "811"}, {name: "won", type: "bool", value: true}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[4,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[3], balance: "150739663480809807" } ;
		console.log( "fromBalanceOriginal[4] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[4] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[3], balance: ( await web3.eth.getBalance( addressList[3], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[4] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[4] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[4,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[4,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 4", async function( ) {
		await constantFunction( 4, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976326", blockHash: "0x09a6c5d014e19bd0e9111a62e7f097fd2db48ee11bb784c6552bf30c10d3596f", timeStamp: "1516975453", hash: "0xf55ae34dc4351ca79b633e1b72effe170f54ae496748dc7b99b2a464364cacae", nonce: "203", transactionIndex: "31", from: "0x46d9112533ef677059c430e515775e358888e38b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "260695", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "1066379", txreceipt_status: "1", gasUsed: "184077", confirmations: "2831737", isError: "0"} ;
		console.log( "txOriginal[5] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[3], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[5] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[5] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 5, 1516975453 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[5] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[5,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x46d9112533ef677059c430e515775e358888e38b"}, {name: "number", type: "uint256", value: "907"}, {name: "won", type: "bool", value: true}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[5,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[3], balance: "150739663480809807" } ;
		console.log( "fromBalanceOriginal[5] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[5] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[3], balance: ( await web3.eth.getBalance( addressList[3], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[5] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[5] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[5,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[5,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 5", async function( ) {
		await constantFunction( 5, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976330", blockHash: "0xaefb83cef28545a8979b9fd0cfa7a0d8d80bee73f1d3129bbb26581aba50b0dd", timeStamp: "1516975509", hash: "0x5c7d45f14278f010ab585261da7f14673e01ca1e2eba6f5f6ba8d7157a7afcdf", nonce: "204", transactionIndex: "29", from: "0x46d9112533ef677059c430e515775e358888e38b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "276115", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "1682735", txreceipt_status: "1", gasUsed: "173797", confirmations: "2831733", isError: "0"} ;
		console.log( "txOriginal[6] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[3], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[6] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[6] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 6, 1516975509 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[6] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[6,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x46d9112533ef677059c430e515775e358888e38b"}, {name: "number", type: "uint256", value: "19"}, {name: "won", type: "bool", value: true}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[6,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[3], balance: "150739663480809807" } ;
		console.log( "fromBalanceOriginal[6] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[6] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[3], balance: ( await web3.eth.getBalance( addressList[3], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[6] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[6] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[6,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[6,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 6", async function( ) {
		await constantFunction( 6, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976332", blockHash: "0x8ebb353206118fe8e886559babba7becae921fd2a7363d91ad6e70dad0b7c502", timeStamp: "1516975542", hash: "0x8bde857cca53180b5cfbcea50272b78040683e65aac3034c3903179287ad0129", nonce: "205", transactionIndex: "39", from: "0x46d9112533ef677059c430e515775e358888e38b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "207402", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "1476880", txreceipt_status: "1", gasUsed: "173797", confirmations: "2831731", isError: "0"} ;
		console.log( "txOriginal[7] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[3], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[7] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[7] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 7, 1516975542 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[7] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[7,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x46d9112533ef677059c430e515775e358888e38b"}, {name: "number", type: "uint256", value: "85"}, {name: "won", type: "bool", value: true}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[7,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[3], balance: "150739663480809807" } ;
		console.log( "fromBalanceOriginal[7] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[7] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[3], balance: ( await web3.eth.getBalance( addressList[3], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[7] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[7] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[7,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[7,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 7", async function( ) {
		await constantFunction( 7, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976393", blockHash: "0x65b2d269a0195be83ff93287de35e8512981dca10c5899d87c0d13903a5a32bd", timeStamp: "1516976403", hash: "0xc89db5f3629d457e556014267235f45041968aba61b9eabcbbc1442def669a6e", nonce: "206", transactionIndex: "87", from: "0x46d9112533ef677059c430e515775e358888e38b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "260695", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "3078333", txreceipt_status: "1", gasUsed: "173797", confirmations: "2831670", isError: "0"} ;
		console.log( "txOriginal[8] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[3], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[8] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[8] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 8, 1516976403 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[8] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[8,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x46d9112533ef677059c430e515775e358888e38b"}, {name: "number", type: "uint256", value: "807"}, {name: "won", type: "bool", value: true}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[8,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[3], balance: "150739663480809807" } ;
		console.log( "fromBalanceOriginal[8] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[8] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[3], balance: ( await web3.eth.getBalance( addressList[3], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[8] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[8] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[8,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[8,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 8", async function( ) {
		await constantFunction( 8, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976508", blockHash: "0x182df5e2a70f4cc58d6e934d58dd6a8fc89acd55c1d30adcaa3b5bc716bdce4e", timeStamp: "1516978233", hash: "0x49e0deb03c068c13eb0b161ff13c5a546fec22a1a43aff38b4460c58b190d593", nonce: "0", transactionIndex: "29", from: "0x720b303d7803418fc2a5f4d5ba42928e9421c91f", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "229902", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "1114037", txreceipt_status: "1", gasUsed: "153268", confirmations: "2831555", isError: "0"} ;
		console.log( "txOriginal[9] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[6], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[9] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[9] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 9, 1516978233 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[9] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[9,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x720b303d7803418fc2a5f4d5ba42928e9421c91f"}, {name: "number", type: "uint256", value: "467"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[9,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[6], balance: "11982760000000000" } ;
		console.log( "fromBalanceOriginal[9] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[9] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[6], balance: ( await web3.eth.getBalance( addressList[6], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[9] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[9] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[9,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[9,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 9", async function( ) {
		await constantFunction( 9, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976512", blockHash: "0x6ebdd2f24b513e5ecf9f12639e084929686a0cb863ea07d036828361f8cbe5cd", timeStamp: "1516978304", hash: "0x04bfccbfc54223d7cdaefeb5f13c876086d50244e905cd36f87c2315c7624167", nonce: "1", transactionIndex: "55", from: "0x720b303d7803418fc2a5f4d5ba42928e9421c91f", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "207402", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "2194545", txreceipt_status: "1", gasUsed: "138268", confirmations: "2831551", isError: "0"} ;
		console.log( "txOriginal[10] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[6], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[10] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[10] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 10, 1516978304 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[10] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[10,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x720b303d7803418fc2a5f4d5ba42928e9421c91f"}, {name: "number", type: "uint256", value: "609"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[10,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[6], balance: "11982760000000000" } ;
		console.log( "fromBalanceOriginal[10] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[10] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[6], balance: ( await web3.eth.getBalance( addressList[6], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[10] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[10] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[10,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[10,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 10", async function( ) {
		await constantFunction( 10, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976619", blockHash: "0x92acc83a331cb76a5cd0bba502d29d03536622a10529cc812aef100d5d6a86f2", timeStamp: "1516979949", hash: "0xb54470b196118e99c2394b7aca2ae840cd7c42340574ac75fe7e9d3666a32e62", nonce: "207", transactionIndex: "32", from: "0x46d9112533ef677059c430e515775e358888e38b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "207402", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "1077087", txreceipt_status: "1", gasUsed: "173797", confirmations: "2831444", isError: "0"} ;
		console.log( "txOriginal[11] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[3], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[11] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[11] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 11, 1516979949 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[11] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[11,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x46d9112533ef677059c430e515775e358888e38b"}, {name: "number", type: "uint256", value: "899"}, {name: "won", type: "bool", value: true}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[11,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[3], balance: "150739663480809807" } ;
		console.log( "fromBalanceOriginal[11] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[11] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[3], balance: ( await web3.eth.getBalance( addressList[3], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[11] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[11] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[11,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[11,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 11", async function( ) {
		await constantFunction( 11, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976631", blockHash: "0x6748585da54ea5e06160e9c378becc00d4ee9543a6254e7d89d4bb3d231525ac", timeStamp: "1516980133", hash: "0xf1e3eb22ce5f270521ec1c1f4d67e5c77a8a6109d313ebc10281e2afb7d320ed", nonce: "208", transactionIndex: "80", from: "0x46d9112533ef677059c430e515775e358888e38b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "207402", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "2637804", txreceipt_status: "1", gasUsed: "138268", confirmations: "2831432", isError: "0"} ;
		console.log( "txOriginal[12] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[3], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[12] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[12] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 12, 1516980133 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[12] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[12,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x46d9112533ef677059c430e515775e358888e38b"}, {name: "number", type: "uint256", value: "267"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[12,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[3], balance: "150739663480809807" } ;
		console.log( "fromBalanceOriginal[12] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[12] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[3], balance: ( await web3.eth.getBalance( addressList[3], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[12] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[12] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[12,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[12,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 12", async function( ) {
		await constantFunction( 12, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976642", blockHash: "0x408f523b62a916a25e51eeb26a8a0d3f32d2c0f239b50d72747c0ca3095f5884", timeStamp: "1516980204", hash: "0x3c24ee708bf4ee392d7fa88f29cb4037697b71f9c8b76a831d79b7ab894063b5", nonce: "209", transactionIndex: "23", from: "0x46d9112533ef677059c430e515775e358888e38b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "207402", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "1010407", txreceipt_status: "1", gasUsed: "138268", confirmations: "2831421", isError: "0"} ;
		console.log( "txOriginal[13] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[3], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[13] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[13] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 13, 1516980204 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[13] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[13,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x46d9112533ef677059c430e515775e358888e38b"}, {name: "number", type: "uint256", value: "409"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[13,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[3], balance: "150739663480809807" } ;
		console.log( "fromBalanceOriginal[13] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[13] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[3], balance: ( await web3.eth.getBalance( addressList[3], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[13] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[13] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[13,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[13,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 13", async function( ) {
		await constantFunction( 13, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4976659", blockHash: "0xd6a14b52ef55122cfae9e110f583e6c60e465af9b1280a28ade21cd576f13627", timeStamp: "1516980513", hash: "0xbe3043e292f6cbf57b0c65716106832c20ce034d73914d7b97d404aefc197c9f", nonce: "211", transactionIndex: "68", from: "0x46d9112533ef677059c430e515775e358888e38b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "276115", gasPrice: "27500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "3296199", txreceipt_status: "1", gasUsed: "138268", confirmations: "2831404", isError: "0"} ;
		console.log( "txOriginal[14] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[3], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[14] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[14] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 14, 1516980513 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[14] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[14,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x46d9112533ef677059c430e515775e358888e38b"}, {name: "number", type: "uint256", value: "27"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[14,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[3], balance: "150739663480809807" } ;
		console.log( "fromBalanceOriginal[14] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[14] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[3], balance: ( await web3.eth.getBalance( addressList[3], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[14] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[14] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[14,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[14,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 14", async function( ) {
		await constantFunction( 14, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4977566", blockHash: "0x63b45137b0de492b3e28c1ad2774c44fc89b2b4edd6ba1c77d5344eadeabd8cb", timeStamp: "1516994302", hash: "0xfb3c48b99531d552ef374c4a918216d9bf0f445283d3d92f691df55c8bfab2fc", nonce: "790", transactionIndex: "115", from: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "283195", gasPrice: "4000000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "7802345", txreceipt_status: "1", gasUsed: "188797", confirmations: "2830497", isError: "0"} ;
		console.log( "txOriginal[15] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[7], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[15] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[15] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 15, 1516994302 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[15] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[15,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3"}, {name: "number", type: "uint256", value: "605"}, {name: "won", type: "bool", value: true}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[15,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[7], balance: "1697774041842612456" } ;
		console.log( "fromBalanceOriginal[15] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[15] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[7], balance: ( await web3.eth.getBalance( addressList[7], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[15] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[15] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[15,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[15,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 15", async function( ) {
		await constantFunction( 15, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4977963", blockHash: "0x45403fc29a00190d9e9d1f7dc7d9ab97a42517a85e31797ebb64979359fd0b79", timeStamp: "1516999402", hash: "0xd83eeef8c50832a7523c6a7257d0b6829d8a76f2b97b66c011f00f5227d7d842", nonce: "1173", transactionIndex: "171", from: "0x70580ea14d98a53fd59376dc7e959f4a6129bb9b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "283195", gasPrice: "3010000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "5530963", txreceipt_status: "1", gasUsed: "188797", confirmations: "2830100", isError: "0"} ;
		console.log( "txOriginal[16] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[8], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[16] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[16] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 16, 1516999402 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[16] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[16,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x70580ea14d98a53fd59376dc7e959f4a6129bb9b"}, {name: "number", type: "uint256", value: "805"}, {name: "won", type: "bool", value: true}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[16,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[8], balance: "7786673268408591" } ;
		console.log( "fromBalanceOriginal[16] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[16] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[8], balance: ( await web3.eth.getBalance( addressList[8], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[16] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[16] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[16,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[16,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 16", async function( ) {
		await constantFunction( 16, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4978011", blockHash: "0x2b189057bf91c49ae265ba0bb213d3154e38298cd733428ee76533455b070bd8", timeStamp: "1517000075", hash: "0x614033a1bc856e5bd248105a33e8bef5bef803abe69fdecba31d53b33e489857", nonce: "791", transactionIndex: "90", from: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "276115", gasPrice: "3000000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "3600820", txreceipt_status: "1", gasUsed: "138268", confirmations: "2830052", isError: "0"} ;
		console.log( "txOriginal[17] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[7], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[17] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[17] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 17, 1517000075 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[17] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[17,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3"}, {name: "number", type: "uint256", value: "151"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[17,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[7], balance: "1697774041842612456" } ;
		console.log( "fromBalanceOriginal[17] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[17] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[7], balance: ( await web3.eth.getBalance( addressList[7], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[17] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[17] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[17,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[17,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 17", async function( ) {
		await constantFunction( 17, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4978019", blockHash: "0x566601a6a0111698ffd409731b2a710241643af63d6eaa78eef181695367e784", timeStamp: "1517000215", hash: "0xfdf4e81d353f2753ed6a730d2bb52aab23ebd549856dbbc541cbaf648c2626e6", nonce: "792", transactionIndex: "66", from: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "207402", gasPrice: "3000000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "3432910", txreceipt_status: "1", gasUsed: "138268", confirmations: "2830044", isError: "0"} ;
		console.log( "txOriginal[18] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[7], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[18] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[18] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 18, 1517000215 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[18] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[18,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3"}, {name: "number", type: "uint256", value: "431"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[18,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[7], balance: "1697774041842612456" } ;
		console.log( "fromBalanceOriginal[18] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[18] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[7], balance: ( await web3.eth.getBalance( addressList[7], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[18] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[18] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[18,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[18,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 18", async function( ) {
		await constantFunction( 18, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4978044", blockHash: "0xe72a6f7fbd3608b8906c7353f28cc6469390be86e7a19ab0fdb1463893e73ae5", timeStamp: "1517000567", hash: "0x7f2270de64e7a2d86356e00b4054de2814403f6492f34ae10f3eafa57c2fc986", nonce: "793", transactionIndex: "206", from: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "207402", gasPrice: "5000000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "6440544", txreceipt_status: "1", gasUsed: "138268", confirmations: "2830019", isError: "0"} ;
		console.log( "txOriginal[19] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[7], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[19] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[19] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 19, 1517000567 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[19] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[19,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3"}, {name: "number", type: "uint256", value: "135"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[19,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[7], balance: "1697774041842612456" } ;
		console.log( "fromBalanceOriginal[19] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[19] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[7], balance: ( await web3.eth.getBalance( addressList[7], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[19] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[19] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[19,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[19,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 19", async function( ) {
		await constantFunction( 19, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4978050", blockHash: "0x20bfa3b3cc92676858f957327a075a29fd17489027957973aa8ed5e8416eff1c", timeStamp: "1517000674", hash: "0x99b5d04d27bf373f5eaff9769319db0cd30a43d89a170739d92c8fa2e7154da0", nonce: "794", transactionIndex: "208", from: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "207402", gasPrice: "5000000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "7336750", txreceipt_status: "1", gasUsed: "138268", confirmations: "2830013", isError: "0"} ;
		console.log( "txOriginal[20] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[7], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[20] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[20] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 20, 1517000674 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[20] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[20,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3"}, {name: "number", type: "uint256", value: "349"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[20,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[7], balance: "1697774041842612456" } ;
		console.log( "fromBalanceOriginal[20] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[20] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[7], balance: ( await web3.eth.getBalance( addressList[7], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[20] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[20] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[20,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[20,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 20", async function( ) {
		await constantFunction( 20, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4978060", blockHash: "0xb8ee0f07a2dc3ca6171658958a83a0ae26f4e7d20c6c1e2c2aee76c710e59acc", timeStamp: "1517000771", hash: "0x5495d78fca9a66c915db7d717d6ead332f510590a4231b2c41fe4a4ff18a8c50", nonce: "795", transactionIndex: "53", from: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "207402", gasPrice: "4000000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "1900439", txreceipt_status: "1", gasUsed: "138268", confirmations: "2830003", isError: "0"} ;
		console.log( "txOriginal[21] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[7], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[21] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[21] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 21, 1517000771 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[21] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[21,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3"}, {name: "number", type: "uint256", value: "543"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[21,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[7], balance: "1697774041842612456" } ;
		console.log( "fromBalanceOriginal[21] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[21] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[7], balance: ( await web3.eth.getBalance( addressList[7], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[21] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[21] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[21,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[21,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 21", async function( ) {
		await constantFunction( 21, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4978072", blockHash: "0x042acf056bacbf2d3854f787a30628484e0d24f77040a7a43a00e156e51c4693", timeStamp: "1517000943", hash: "0x2ee278ee86357d19d570733c414f57af4c6c33db0e1ada076790e16634ea2f38", nonce: "796", transactionIndex: "136", from: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "207402", gasPrice: "4000000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "4740450", txreceipt_status: "1", gasUsed: "173797", confirmations: "2829991", isError: "0"} ;
		console.log( "txOriginal[22] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[7], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[22] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[22] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 22, 1517000943 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[22] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[22,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x1a5fe261e8d9e8efc5064eeccc09b531e6e24bd3"}, {name: "number", type: "uint256", value: "887"}, {name: "won", type: "bool", value: true}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[22,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[7], balance: "1697774041842612456" } ;
		console.log( "fromBalanceOriginal[22] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[22] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[7], balance: ( await web3.eth.getBalance( addressList[7], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[22] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[22] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[22,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[22,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 22", async function( ) {
		await constantFunction( 22, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4978873", blockHash: "0xf6663f685842e59f5da5eb7c1585e250eff2d99735b08694338f5ceb6b2f1ac6", timeStamp: "1517013096", hash: "0x8a3acdbb763e646c8ccb0bf231120d7de6bc98b939769c43687f027f35bfc3d1", nonce: "1808", transactionIndex: "43", from: "0x70ebad820b1d70ff702b4e084ced819d8f04568b", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "229902", gasPrice: "5000000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "1585900", txreceipt_status: "1", gasUsed: "153268", confirmations: "2829190", isError: "0"} ;
		console.log( "txOriginal[23] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[9], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[23] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[23] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 23, 1517013096 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[23] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[23,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x70ebad820b1d70ff702b4e084ced819d8f04568b"}, {name: "number", type: "uint256", value: "193"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[23,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[9], balance: "854673012799373206" } ;
		console.log( "fromBalanceOriginal[23] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[23] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[9], balance: ( await web3.eth.getBalance( addressList[9], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[23] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[23] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[23,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[23,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 23", async function( ) {
		await constantFunction( 23, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4978943", blockHash: "0x683f05259d6dcd60f1428b8040dcc8ac5555942cb30a9e86d2bc7449ae307e85", timeStamp: "1517014120", hash: "0xf76b382ceb4090723472eb026d1d6490c85369e83c0c1e3abffb8146c1757506", nonce: "65", transactionIndex: "75", from: "0x9afbaa3003d9e75c35fde2d1fd283b13d3335f00", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "229902", gasPrice: "7500000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "2400555", txreceipt_status: "1", gasUsed: "153268", confirmations: "2829120", isError: "0"} ;
		console.log( "txOriginal[24] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[10], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[24] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[24] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 24, 1517014120 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[24] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[24,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x9afbaa3003d9e75c35fde2d1fd283b13d3335f00"}, {name: "number", type: "uint256", value: "241"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[24,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[10], balance: "5180890999999926" } ;
		console.log( "fromBalanceOriginal[24] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[24] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[10], balance: ( await web3.eth.getBalance( addressList[10], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[24] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[24] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[24,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[24,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 24", async function( ) {
		await constantFunction( 24, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "4980117", blockHash: "0xd65c962877860c573dc7fdee2247e14bd1fed3006dc6df52bccfb15822491766", timeStamp: "1517030948", hash: "0x899cf8af01907dd772606d25bb6382c5e025bed718ae7d6c1806868bdcbe3d83", nonce: "461", transactionIndex: "268", from: "0x64cdc23fadd389170b30f3f4b75b47ea12f65221", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "229902", gasPrice: "15000000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "6516677", txreceipt_status: "1", gasUsed: "188797", confirmations: "2827946", isError: "0"} ;
		console.log( "txOriginal[25] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[11], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[25] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[25] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 25, 1517030948 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[25] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[25,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0x64cdc23fadd389170b30f3f4b75b47ea12f65221"}, {name: "number", type: "uint256", value: "897"}, {name: "won", type: "bool", value: true}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[25,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[11], balance: "87953015566209117" } ;
		console.log( "fromBalanceOriginal[25] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[25] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[11], balance: ( await web3.eth.getBalance( addressList[11], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[25] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[25] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[25,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[25,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 25", async function( ) {
		await constantFunction( 25, deployedContract ) ;
	} ) ;

	it( "TEST: Play(  )", async function( ) {
		const txOriginal = {blockNumber: "5001667", blockHash: "0x4851918acffec6e648fed8c404a7a5df024ea087f125bbefcec9bca6024db45c", timeStamp: "1517344514", hash: "0x209138cd895e55b62fa9cab0057d8a2d542c6eb3698ee4da291d12504f4562f7", nonce: "52", transactionIndex: "22", from: "0xc54100fc034d412c21ba92ccf2d916374ac22555", to: "0xef7c7254c290df3d167182356255cdfd8d3b400b", value: "50000000000000000", gas: "200000", gasPrice: "30000000000", input: "0x0e2dce69", contractAddress: "", cumulativeGasUsed: "863861", txreceipt_status: "1", gasUsed: "153268", confirmations: "2806396", isError: "0"} ;
		console.log( "txOriginal[26] = %s", JSON.stringify( txOriginal ) ) ;
		const txOptions = { from: addressList[12], to: addressList[2], value: "50000000000000000" }
		console.log( "txOptions[26] = %s", JSON.stringify( txOptions ) ) ;
		const txCall = {inputs: [], name: "Play", outputs: [], type: "function"} ;
		console.log( "txCall[26] = %s", JSON.stringify( txCall ) ) ;
		var txRequest, txResult ;
		try {
			txRequest = deployedContract.methods[ "Play()" ]( txOptions ) ;
			await new Promise( (resolve) => { txRequest.on( "transactionHash", resolve ) } ) ;
		} catch( requestError ) {
			txRequest = { receipt: { isError: 1, message: requestError.message }, blockNumber: "latest", logs: [] } ;
		}
		await support.mineBlockWithTimestamp( 26, 1517344514 ) ;
		try {
			txResult = await txRequest ;
		} catch( resultError ) {
			txResult = { receipt: { isError: 1, message: resultError.message }, blockNumber: "latest", logs: [] } ;
		}
		console.log( "txResult[26] = %s", JSON.stringify( txResult.receipt ) ) ;
		var eventCallOriginal = {anonymous: false, inputs: [{indexed: false, name: "player", type: "address"}, {indexed: false, name: "number", type: "uint256"}, {indexed: false, name: "won", type: "bool"}], name: "NewPlay", type: "event"} ;
		console.log( "eventCallOriginal[26,0] = %s", JSON.stringify( eventCallOriginal ) ) ;
		var eventResultOriginal = [{name: "NewPlay", events: [{name: "player", type: "address", value: "0xc54100fc034d412c21ba92ccf2d916374ac22555"}, {name: "number", type: "uint256", value: "29"}, {name: "won", type: "bool", value: false}], address: "0xef7c7254c290df3d167182356255cdfd8d3b400b"}] ;
		console.log( "eventResultOriginal[26,0] = %s", JSON.stringify( eventResultOriginal ) ) ;
		const fromBalanceOriginal = { address: addressListOriginal[12], balance: "509288795711047568" } ;
		console.log( "fromBalanceOriginal[26] = %s", JSON.stringify( fromBalanceOriginal ) ) ;
		const toBalanceOriginal = { address: addressListOriginal[2], balance: "45000000000000000" } ;
		console.log( "toBalanceOriginal[26] = %s", JSON.stringify( toBalanceOriginal ) ) ;
		const fromBalance = { address: addressList[12], balance: ( await web3.eth.getBalance( addressList[12], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "fromBalance[26] = %s", JSON.stringify( fromBalance ) ) ;
		const toBalance = { address: addressList[2], balance: ( await web3.eth.getBalance( addressList[2], txResult.blockNumber ) ).toString( 10, 85) } ;
		console.log( "toBalance[26] = %s", JSON.stringify( toBalance) ) ;
		for( var eventIndex = 0; eventIndex < eventPrototypeList.length; eventIndex++ ) {
			const eventCall = eventPrototypeList[ eventIndex ] ;
			const eventLogs = txResult.logs.filter( item => item.event === eventCall.name && item.args.__length__ === eventCall.inputs.length ) ;
			if( eventLogs.length > 0 ) {
				console.log( "eventCall[26,%d] = %s", eventIndex, JSON.stringify( eventCall ) ) ;
				console.log( "eventResult[26,%d] = %s", eventIndex, JSON.stringify( eventLogs.map( item => mergeEvent( eventCall, item.args ) ) ) ) ;
			}
		}
	} ) ;

	it( "TEST: constantFunction 26", async function( ) {
		await constantFunction( 26, deployedContract ) ;
	} ) ;

	it( "TEST: check all blocks", async function( ) {
		const blocknumber = await support.getBlockNumber( ) ;
		for( var i = 0; i <= blocknumber; i++ ) {
			const block = await web3.eth.getBlock( i, true ) ;
			console.log( "block[%d] = %s", i, JSON.stringify( block ) ) ;
		}
	} )
} )
