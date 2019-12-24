// Give names to the EVM instructions
const _EVM = {
	// Stop and arithmetic operations
	"0x00": 'STOP', "0x01": 'ADD', "0x02": 'MUL', "0x03": 'SUB', "0x04": 'DIV', "0x05": 'SDIV', "0x06": 'MOD', "0x07": 'SMOD',
	"0x08": 'ADDMOD', "0x09": 'MULMOD', "0x0a": 'EXP', "0x0b": 'SIGNEXTEND',
	// Comparison & bitwise logic operations
	"0x10": 'LT', "0x11": 'GT', "0x12": 'SLT', "0x13": 'SGT', "0x14": 'EQ', "0x15": 'ISZERO', "0x16": 'AND', "0x17": 'OR',
	"0x18": 'XOR', "0x19": 'NOT', "0x1a": 'BYTE', "0x1b": 'SHL', "0x1c": 'SHR', "0x1d": 'SAR',
	// SHA
	"0x20": 'SHA3',
	// Environmental information
	"0x30": 'ADDRESS', "0x31": 'BALANCE', "0x32": 'ORIGIN', "0x33": 'CALLER', "0x34": 'CALLVALUE', "0x35": 'CALLDATALOAD', "0x36": 'CALLDATASIZE', "0x37": 'CALLDATACOPY',
	"0x38": 'CODESIZE', "0x39": 'CODECOPY', "0x3a": 'GASPRICE', "0x3b": 'EXTCODESIZE', "0x3c": 'EXTCODECOPY', "0x3d": 'RETURNDATASIZE', "0x3e": 'RETURNDATACOPY',
	// Block information
	"0x40": 'BLOCKHASH', "0x41": 'COINBASE', "0x42": 'TIMESTAMP', "0x43": 'NUMBER', "0x44": 'DIFFICULTY', "0x45": 'GASLIMIT',
	// Stack, memory, storage and flow operations
	"0x50": 'POP', "0x51": 'MLOAD', "0x52": 'MSTORE', "0x53": 'MSTORE8', "0x54": 'SLOAD', "0x55": 'SSTORE', "0x56": 'JUMP', "0x57": 'JUMPI',
	"0x58": 'PC', "0x59": 'MSIZE',
	// Push operations
	"0x60": 'PUSH1', "0x61": 'PUSH2', "0x62": 'PUSH3', "0x63": 'PUSH4', "0x64": 'PUSH5', "0x65": 'PUSH6', "0x66": 'PUSH7', "0x67": 'PUSH8',
	"0x68": 'PUSH9', "0x69": 'PUSH10', "0x6a": 'PUSH11', "0x6b": 'PUSH12', "0x6c": 'PUSH13', "0x6d": 'PUSH14', "0x6e": 'PUSH15', "0x6f": 'PUSH16',
	"0x70": 'PUSH17', "0x71": 'PUSH18', "0x72": 'PUSH19', "0x73": 'PUSH20', "0x74": 'PUSH21', "0x75": 'PUSH22', "0x76": 'PUSH23', "0x77": 'PUSH24',
	"0x78": 'PUSH25', "0x79": 'PUSH26', "0x7a": 'PUSH27', "0x7b": 'PUSH28', "0x7c": 'PUSH29', "0x7d": 'PUSH30', "0x7e": 'PUSH31', "0x7f": 'PUSH32',
	// Duplication operations
	"0x80": 'DUP1', "0x81": 'DUP2', "0x82": 'DUP3', "0x83": 'DUP4', "0x84": 'DUP5', "0x85": 'DUP6', "0x86": 'DUP7', "0x87": 'DUP8',
	"0x88": 'DUP9', "0x89": 'DUP10', "0x8a": 'DUP11', "0x8b": 'DUP12', "0x8c": 'DUP13', "0x8d": 'DUP14', "0x8e": 'DUP15', "0x8f": 'DUP16',
	// Exchange operations
	"0x90": 'SWAP1', "0x91": 'SWAP2', "0x92": 'SWAP3', "0x93": 'SWAP4', "0x94": 'SWAP5', "0x95": 'SWAP6', "0x96": 'SWAP7', "0x97": 'SWAP8',
	"0x98": 'SWAP9', "0x99": 'SWAP10', "0x9a": 'SWAP11', "0x9b": 'SWAP12', "0x9c": 'SWAP13', "0x9d": 'SWAP14', "0x9e": 'SWAP15', "0x9f": 'SWAP16',
	// Logging operations
	"0xa0": 'LOG0', "0xa1": 'LOG1', "0xa2": 'LOG2', "0xa3": 'LOG3', "0xa4": 'LOG4', "0x5a": 'GAS', "0x5b": 'JUMPDEST',
	// System operations
	"0xf0": 'CREATE', "0xf1": 'CALL', "0xf2": 'CALLCODE', "0xf3": 'RETURN', "0xf4": 'DELEGATECALL', "0xf5": 'CREATE2',
	"0xfa": 'STATICCALL', "0xfd": 'REVERT', "0xfe": 'INVALID', "0xff": 'SELFDESTRUCT'
} ;

// Return the length of the data if this is a PUSHxx instruction, 0 otherwise.
function _isPUSH( opcode ) {
	const opcodeInt = parseInt( opcode ) ;
	if( opcodeInt >= 0x60 && opcodeInt < 0x80 ) {
		return 1 + opcodeInt - 0x60 ;
	} else {
		return 0 ;
	}
}

// Return 1 if this is a JUMPDEST instruction, 0 otherwise.
function _isJUMPDEST( opcode ) {
	if( opcode === "0x5b" ) {
		return 1 ;
	} else {
		return 0 ;
	}
}

// Break the bytecode up in basic blocks of instructions. The input must be trimmed and it must not start with 0x.
function _bytecode2basicblockList( data ) {
	if( typeof data === 'undefined' ) {
		return [] ;
	}
	var basicblockList = []
	var current = 0 ;
	basicblockList[ current ] = [] ;
	var pc = 0 ;
	while( data.length > 0 ) {
		const opcode = '0x' + data.slice( 0, 2 ) ;
		const name = ( typeof _EVM[ opcode ] !== 'undefined' ? _EVM[ opcode ] : 'UNDEFINED' ) ;
		const instr = {
			pc: pc,
			opcode: opcode,
			name: name
		} ;
		data = data.slice( 2 ) ;
		pc += 1 ;
		const length = _isPUSH( opcode ) ;
		if( length > 0 ) {
			const args = data.slice( 0, 2 * length ).replace( /^0*/, '' ) ;
			instr.args = '0x' + ( args.length === 0 ? '0' : args ) ;
			data = data.slice( 2 * length ) ;
			pc += length ;
		} else if( _isJUMPDEST( opcode ) === 1 ) {
			current ++ ;
			basicblockList[ current ] = [ ] ;
		}
		basicblockList[ current ].push( instr ) ;
	}
	return basicblockList ;
}

// Extract a list of jump destinations from the basic block list
function _basicblockList2jumpDestList( basicblockList ) {
	var result = [] ;
	basicblockList.map( block => {
		block.map( item => {
			if( _isJUMPDEST( item.opcode ) === 1 ) {
				result.push( '0x' + item.pc.toString( 16 ) ) ;
			}
		} )
	} ) ;
	return result ;
}

// Format the basicblockList ready for printing. The pretty === true format includes the pc and arguments. If
// pretty === false, each instruction will sit on a separate line such that the line number == pc + 1.
// If verbose === true, arguments that are not jump destinations will be printed too.
function _basicblockList2formattedBytecode( pretty, verbose, basicblockList ) {
	const jumpDestList = _basicblockList2jumpDestList( basicblockList ) ;
	var formattedBytecode = '' ;
	var lineCnt = 0 ;
	basicblockList.map( block => {
		block.map( item => {
			if( pretty ) {
				const pc = '0x' + item.pc.toString( 16 ) ;
				formattedBytecode += pc + '\t' + item.opcode + ' ' ;
			} else {
				if( lineCnt != item.pc ) {
					console.error( '_basicblockList2formattedBytecode out of sync', lineNo, item.pc ) ;
					process.exit( 1 ) ;
				}
			}
			formattedBytecode += item.name ;
			if( typeof item.args !== 'undefined' && verbose ) { // There is an argument and we want to show it
				if( jumpDestList.indexOf( item.args ) < 0 ) { // The argument is not in the list of jump destinations
					formattedBytecode += '\t' + item.args ;
				} else {
					formattedBytecode += '\tjump_destination' ;
				}
			}
			if( ! pretty ) {
				const length = _isPUSH( item.opcode ) ;
				formattedBytecode += '\n'.repeat( length ) ;
				lineCnt += length ;
			}
			formattedBytecode += '\n' ;
			lineCnt ++ ;
		} )
	} ) ;
	return formattedBytecode ;
}

// Extract the list of list of opcodes from the basicblockList.
function _basicblockList2opcodeListList( basicblockList ) {
	var opcodeListList = [] ;
	basicblockList.map( block => {
		opcodeListList.push( block.map( item => item.opcode ) ) ;
	} ) ;
	return opcodeListList ;
}

// Extract the instructionSpace object from the basicblockList.
function _basicblockList2instructionSpace( basicblockList ) {
	var instructionSpace = new Object( ) ;
	basicblockList.map( block => {
		block.map( item => {
			const pc = '0x' + item.pc.toString( 16 ) ;
			instructionSpace[ pc ] = item.name ;
		} )
	} ) ;
	return instructionSpace ;
}

// Extract the undefined instruction list from the basicblockList.
function _basicblockList2undefinedList( basicblockList ) {
	var undefinedList = [] ;
	basicblockList.map( block => {
		block.map( item => {
			if( item.name === 'UNDEFINED' ) {
				item.pc_hex = '0x' + item.pc.toString( 16 ) ;
				undefinedList.push( item ) ;
			}
		} )
	} ) ;
	return undefinedList ;
}

// Separate the byte code and the meta data. The input must be trimmed and it must not start with 0x
function _splitBytecodeMetadata( bytecodeMetadata ) {
	var bytecode = bytecodeMetadata ;
	var metadataList = [] ;
	while( bytecode.length >= 86 ) {
		if( bytecode.slice( -86 ).startsWith( 'a165627a7a72305820' ) && bytecode.slice( -4 ) === '0029' ) { // 0xa1 0x65 'b' 'z' 'z' 'r' '0' 0x58 0x20 ... 0x00 0x29
			metadataList.push( bytecode.slice( -86 + 18, -4 ) ) ;
			bytecode = bytecode.slice( 0, -86 ) ;
		} else if( bytecode.slice( -114 ).startsWith( 'a265627a7a72305820' ) && bytecode.slice( -4 ) === '0037' ) { // 0xa2 0x65 'b' 'z' 'z' 'r' '0' 0x58 0x20 ... 0x00 0x37
			metadataList.push( bytecode.slice( -114 + 18, -4 ) ) ;
			bytecode = bytecode.slice( 0, -114 ) ;
		} else {
			break ;

		}
	}
	return { bytecode, metadataList } ;
}

module.exports = {
	isPUSH: _isPUSH,
	isJUMPDEST: _isJUMPDEST,
	bytecode2basicblockList: _bytecode2basicblockList,
	basicblockList2jumpDestList: _basicblockList2jumpDestList,
	basicblockList2formattedBytecode: _basicblockList2formattedBytecode,
	basicblockList2opcodeListList: _basicblockList2opcodeListList,
	basicblockList2instructionSpace: _basicblockList2instructionSpace,
	basicblockList2undefinedList: _basicblockList2undefinedList,
	splitBytecodeMetadata: _splitBytecodeMetadata
} ;
