#!/usr/bin/env node

/*
   Mutasol implements the traditional mutation operators of imperative
   programming languages for solidity.

   The basic idea is to generate as a mutant a subtle variant that
   could have been created by the developer by mistake (AKA the competent
   programmer hypothesis).  We assume that typical mistakes include:

   * confusing literals (e.g 1 instead of 0)
   * confusing identifiers (e.g. require instead of assert)
   * confusing statements (e.g. break instead of continue)
   * confusing operators (e.g. += instead of -=)
   * forgetting operators (e.g. !)
   * forgetting statements or modifiers (e.g. return )
   * swapping parameters

   The program has one mandatory command line argument and several optional
   arguments as follows:

   -f file_name (mandatory)
     the name of the source file to be mutated. The file name should not have
     directory components.  The program only accepts input in UTF-8 format.

   -o int
     the number of copies of the original to be made (Default 10).

   -m int
     the maximum number of mutants to be generated (Default 100). This maximum
     is often not achievable for reasons explained below.

   -n int
     the number of attempts to generate mutants.

   -v version
     the compiler version to be used. (Default 0.4.24)

   -k
     Keep the files with the mutants that could not be compiled.  Normally these
     files are deleted.

   -s abefijlmprsx
     Each letter corresponds to a type of node in the AST that may be mutated.
     Restricting this set is useful for testing.

   -d
     Generate some debugging output.

   -c
     Generate script to download the solidity compile binaries.  The program
     expects the emscripten versions of the solidity compiler in the directory
     indicated by the variable 'solJsonDirectory'.  To download the binaries
     execute the following commands:

     $ cd $HOME/soljson/
     $ node mutasol.js -c >script.sh
     $ sh script.sh

   First the solidity compiler is called to read the source file and to generate
   the AST file.

   The source and the AST are linked because each AST node contains the position
   in the source file of the source text corresponding to the AST node.

   The source file will be copied -o times as the 'zero' mutation.

   Then all identifiers are extracted from the AST, and supplemented by the
   predefined identifiers, such as 'this', 'assert', 'now', etc. The list of
   identifiers is used to find a plausible alternative for a given identifier in
   a particular scope.  Some identifiers (e.g.  the predefined identifiers)
   cannot be used as lvalue, but the AST does not contain the necessary
   information to avoid this use.  Therefore each mutant is compiled to make
   sure that it is valid.

   All AST nodes that are in principle candidate for mutation are collected.
   This includes simple statements, literals, identifiers, function parameters,
   and operators.  Compound statements could also be included but it was felt
   that mutations to compund statements are not subtle.

   The main loop is run for a number of times specified by the -m command line
   option. Each run selects a mutation candidate at random from the candidate
   list and tries to find a mutants.

   The probability of selecting one of th categories of mutants is proportional
   to the number of operators, literals, indentfiers etc.  in a smart contract.
   The identifier category is usually the largest.

   Finally, the mutant will be written out to a file with the mutant number
   embedded in the file name. A hash of the file will be calculated. If a
   subsequent mutant has the same hash, it will be deleted to avoid duplicates.

   The target number of mutants will not be reached if: (1) no alternative for
   an identifier or literal with the same type and scope could be found, (2) a
   duplicate mutant is generated, (3) a mutant is generated that does not
   compile. In practice about 1% of the mutants fails to compile.

   Truffle tests can fail if a contract uses nameless arguments.  Therefore
   mutasol warns if such events are presnt in the source.

   At the end of each mutant a comment is appended with a lot of data on the
   mutation, including a diff so that it is easy to see what has been mutated.
*/

// Dependencies
const child_process = require( 'child_process' ) ;
const fs = require( 'fs' ) ;
const path = require( 'path' ) ;
const randomSeed = 0 ;
const random = require( 'random-seed' ).create( randomSeed ) ;
const stringify = require( 'json-stringify-safe' )
const md5 = require( 'md5' ) ;
const evm_decoder = require( './evm_decoder' ) ;
const comments = require( './comments' ) ;
const levenshtein = require('js-levenshtein');

// Debugging flag
var debug = false ;

// Remove duplicates from the array
function unique( arr ) {
	return arr.filter( ( elem, pos, arr ) => arr.indexOf( elem ) == pos ) ;
}

// Provide access to the locally stored emscripten versions of the solidity compiler.
const soljson = require( './soljson.js' ) ;

// The emscripten binaries of the comoiler versions are stored here
const soljsonDirectory = 'soljson' ;

// Use this compiler if the contract to be mtated does not contain a pragma solidity.
const defaultVersion = '0.4.24' ;

// All the tags that can be associated with functions, storage, variables etc.
const tagList = [ 'pure', 'view', 'payable', 'public', 'private', 'external', 'internal', 'constant', 'memory', 'storage', 'calldata' ] ;

// Extract the start position in the source file corresponding to the AST node data.
function bgn( node ) {
	const cmp = node.src.split( ':' ).map( ind => parseInt( ind ) ) ;
	return cmp[ 0 ] ;
}

// Extract the end position in the source file corresponding to the AST node data.
function end( node ) {
	const cmp = node.src.split( ':' ).map( ind => parseInt( ind ) ) ;
	return cmp[ 0 ] + cmp[ 1 ] ;
}

// Does the AST node represent a declaration?
function isDeclaration( node ) {
	return [ 'ContractDefinition', 'EventDefinition', 'FunctionDefinition', 'ModifierDefinition', 'StructDefinition', 'VariableDeclaration' ].indexOf( node.name ) >= 0 ;
}

// Does the AST node represent a jump statement?
function isJumpStatement( node ) {
	return	[ 'Break', 'Continue', 'Return', 'Throw' ].indexOf( node.name ) >= 0 ;
}

// Does the AST node represent a variable declaration where the varibale name is non-empty
function isVariableDeclaration( node ) {
	return	node.name === 'VariableDeclaration' && node.attributes.name.length > 0 ;
}

// Does the AST node possibly represent one of msg.sender, tx.origin, address(0), address(this)?
function isRValueAddress( node ) {
	return [ 'FunctionCall', 'MemberAccess' ].indexOf( node.name ) >= 0 && node.attributes.type.startsWith( 'address' ) ;
}

// Gather the essentials of the AST node. This is used for debugging, and warning messages.
function summariseNode( indent, node ) {
	var txt ;
	if( typeof node === 'undefined' ) {
		txt = 'undefined'
	} else if( node === null ) {
		txt = 'null'
	} else {
		txt = indent + ( node.id||'?' )+ ':' + ( node.name||'?' ) ;
		if ( typeof node.attributes !== 'undefined' ) {
			if( typeof node.attributes.type !== 'undefined' ) {
				txt += ' type:' + node.attributes.type ;
			}
			if( typeof node.attributes.name !== 'undefined' ) {
				txt += ' name:' + node.attributes.name ;
			}
			if( typeof node.attributes.value !== 'undefined' ) {
				txt += ' value:' + node.attributes.value ;
			}
			if( typeof node.attributes.scope !== 'undefined' ) {
				txt += ' scope:' + node.attributes.scope ;
			}
			if( typeof node.attributes.operator !== 'undefined' ) {
				txt += ' operator:' + node.attributes.operator ;
			}
			if( typeof node.attributes.referencedDeclaration !== 'undefined' ) {
				txt += ' ref:' + node.attributes.referencedDeclaration ;
			}
		}
		if ( typeof node.children !== 'undefined' ) {
			txt += ' #' + node.children.length ;
			if( node.children.length > 0 ) {
				txt += ' [' + summariseNode( '', node.children[ 0 ] ) + ']' ;
			}
		}
		if( txt.length > 150 ) {
			txt = txt.slice( 0, 150 ) + '...' ;
		}
	}
	return txt ;
}

// Print the given AST. This is used only for debugging.
function printAST( indent, node ) {
	if( isDeclaration( node ) || node.name === 'Identifier' ) {
		console.log( summariseNode( indent, node ) ) ;
	}
	if( typeof node.children !== 'undefined' ) {
		node.children.map( child => printAST( indent + '  ', child ) ) ;
	}
}

// Print the given identfier list. This is used only for debugging.
function printIdList( indent, idList ) {
	idList.map( node => {
		if( node != null ) {
			console.log( summariseNode( indent, node ) ) ;
		}
	} ) ;
}

// Traverse the AST and store the parent in each node. This makes the AST
// circular, which requires a bit of care when printing it. The parent reference is
// used by the mutation operators.
// Very old solidity compilers omit the id field, which this function will create as well.
// Return the maximum Id generated
function setParentId( parent, node, startId ) {
	node.parent = parent ;
	if( typeof setParentId.id === 'undefined' ) {
		setParentId.id = startId ;
	}
	if( typeof node.id === 'undefined' ) {
		node.id = setParentId.id ;
		setParentId.id ++ ;
	}
	if( typeof node.children !== 'undefined' ) {
		node.children.map( child => setParentId( node, child ) ) ;
	}
	return setParentId.id
}

// Traverse the AST and return the maximum node ID encountered.
function maxId( node ) {
	if( typeof maxId.id === 'undefined' ) {
		maxId.id = node.id ;
	}
	if( typeof node.children !== 'undefined' ) {
		node.children.map( child => maxId( child ) ) ;
	}
	if( node.id > maxId.id ) {
		maxId.id = node.id ;
	}
	return maxId.id ;
}

// Traverse the AST and copy scope values in the attributes where the scope is not set
// This will only work if there are declarations present with the scope set
function addMissingScope( node ) {
	if( typeof node.children !== 'undefined' &&
		node.children.length > 0 ) {
		const scopeList = node.children.filter( child => typeof child.attributes !== 'undefined' && typeof child.attributes.scope !== 'undefined' )  ;
		if( scopeList.length > 0 && scopeList.length < node.children.length ) {
			const scope = scopeList[ 0 ].attributes.scope ;
			node.children.map( child => {
				if( typeof child.attributes === 'undefined' ) {
					child.attributes = { scope: scope } ;
				} else {
					child.attributes.scope = scope ;
				}
			} ) ;
			if( debug ) {
				console.log( 'addMissingScope( node=%s )', summariseNode( 0, node ) ) ;
			}
		}
		node.children.map( child => addMissingScope( child ) ) ;
	}
}

// Traverse the AST and store each node id in the 'idList' array. This is needed
// for the random selection of nodes.
function collectIdList( idList, node ) {
	if( typeof idList[ node.id ] === 'undefined' ) {
		idList[ node.id ] = node ;
	} else {
		console.error( 'mutasol:warning: Duplicate ', summariseNode( 0, node ) ) ;
	}
	if( typeof node.children !== 'undefined' ) {
		node.children.map( child => collectIdList( idList, child ) ) ;
	}
}

// Is the AST node a special variable or function? This is compiler version dependent.
function isSpecialId( node ) {
	const value = node.attributes.value ;
	const type = node.attributes.type ;
	return	( value === 'abi' && type === 'abi' ) ||
		( value === 'addmod' && type === 'function (uint256,uint256,uint256) pure returns (uint256)' ) ||
		( value === 'assert' && type === 'function (bool) pure' ) ||
		( value === 'block' && type === 'block' ) ||
		( value === 'blockhash' && ( type === 'function (uint256) view returns (bytes32)' ) ) ||
		( value === 'gasleft' && type === 'function () view returns (uint256)' ) ||
		( value === 'keccak256' && type === 'function () pure returns (bytes32)' ) ||
		( value === 'msg' && type === 'msg' ) ||
		( value === 'mulmod' && type === 'function (uint256,uint256,uint256) pure returns (uint256)' ) ||
		( value === 'now' && type === 'uint256' ) ||
		( value === 'require' && ( type === 'function (bool) pure' || type === 'function (bool,string memory) pure' ) ) ||
		( value === 'revert' && ( type === 'function () pure' || type === 'function (string memory) pure' ) ) ||
		( value === 'ripemd160' && type === 'function () pure returns (bytes20)' ) ||
		( value === 'ecrecover' && type === 'function (bytes32,uint8,bytes32,bytes32) pure returns (address)' ) ||
		( value === 'selfdestruct' && type === 'function (address)' ) ||
		( value === 'sha256' && type === 'function () pure returns (bytes32)' ) ||
		( value === 'sha3' && type === 'function () pure returns (bytes32)' ) ||
		( value === 'suicide' && type === 'function (address)' ) ||
		( value === 'super' && ( type.startsWith( 'contract' ) || type.startsWith( 'library' ) ) ) ||
		( value === 'this' && ( type.startsWith( 'contract' ) || type.startsWith( 'library' ) ) ) ||
		( value === 'tx' && type === 'tx' ) ;
}

// Is the a special variable or function node potentially non-deterministic?
// This is used to issue warnings.
function isNonDeterministic( node ) {
	if( isSpecialId( node ) ) {
		const value = node.attributes.value ;
		return	( value === 'block' ) ||
			( value === 'now' ) ||
			( value === 'blockhash' ) ;
	} else {
		return false ;
	}
}

// Find the nearest function definition
function findDefinition( functionOrContract, node ) {
	while( node.name !== functionOrContract && node.name !== '*root*' ) {
		node = node.parent ;
	}
	return node ;
}

// Traverse the AST and store each node id of a special variable or function in
// the 'idList' array
function collectPredefinedIdList( srcName, idList, node ) {
	if( node.name === 'Identifier' ) {
		if( isNonDeterministic( node ) ) {
			const context = findDefinition( 'FunctionDefinition', node ) ;
			console.error( 'mutasol:warning: %s uses potentially non-determinstic special variable or function %s in function %s',
				srcName, node.attributes.value, ( context.attributes.name.length === 0 ? '*constructor*' : context.attributes.name ) ) ;
		}
		const ref = node.attributes.referencedDeclaration ;
		if( typeof idList[ ref ] === 'undefined' ) {
			idList[ ref ] = {
				'attributes': {
					'name': node.attributes.value,
					'type': node.attributes.type,
					'scope': 0 },
				'name': 'VariableDeclaration',
				'id': ref,
				'src': '0:0:0'
			}
		}
	}
	if( typeof node.children !== 'undefined' ) {
		node.children.map( child => collectPredefinedIdList( srcName, idList, child ) ) ;
	}
}

// Traverse the AST and store potential mutation targets in the 'candidateList'
// array. Currently mutasol does not handle contracts with imports so that symbols
// originating from imported files draw a warning. The upshot of this is that
// sometimes no alternatives for identifiers can be found, thus limiting the number
// of mutations. For code downloaded from Etherscan.io this is not a problem since
// all contracts are normally bundled into one file.
function collectCandidateList( srcName, idList, candidateList, node, selectFlags ) {
	if( selectFlags.indexOf( 'a' ) >= 0 && node.name === 'Assignment' ) {
		candidateList.push( node ) ;
	} else if( selectFlags.indexOf( 'b' ) >= 0 && node.name === 'BinaryOperation' ) {
		candidateList.push( node ) ;
	} else if( selectFlags.indexOf( 'e' ) >= 0 && node.name === 'ExpressionStatement' ) {
		candidateList.push( node ) ;
	} else if( selectFlags.indexOf( 'i' ) >= 0 && node.name === 'Identifier' ) {
		candidateList.push( node ) ;
	} else if( selectFlags.indexOf( 'j' ) >= 0 && isJumpStatement( node ) ) {
		candidateList.push( node ) ;
	} else if( selectFlags.indexOf( 'l' ) >= 0 && node.name === 'Literal' ) {
		candidateList.push( node ) ;
	} else if( selectFlags.indexOf( 'r' ) >= 0 && isRValueAddress( node ) ) {
		candidateList.push( node ) ;
	} else if( selectFlags.indexOf( 't' ) >= 0 && node.name === 'Tag' ) {
		candidateList.push( node ) ;
	} else if( selectFlags.indexOf( 'u' ) >= 0 && node.name === 'UnaryOperation' ) {
		candidateList.push( node ) ;
	} else if( selectFlags.indexOf( 'v' ) >= 0 && isVariableDeclaration( node ) ) {
		candidateList.push( node ) ;
	}
	if( typeof node.children !== 'undefined' ) {
		node.children.map( child => collectCandidateList( srcName, idList, candidateList, child, selectFlags ) ) ;
	}
}

// Randomly select an alternative to 'current', which should occur in one of the
// option rows. Return 'current' if no alternative could be found, which would the
// case if 'current' does not occur at all, or if the array of options has just one
// element. The options parameter must be an array of an array of strings.
function getRandomAlternative( current, options ) {
	if( debug ) {
		console.log( 'getRandomAlternative( current=%s, options=%s )', current, JSON.stringify( options ) ) ;
	}
	for( var i = 0; i < options.length; i++ ) {
		if( options[ i ].indexOf( current ) >= 0 ) {
			const filtered = options[ i ].filter( item => item != current ) ;
			if( filtered.length > 0 ) {
				const r = random.range( filtered.length ) ;
				return filtered[ r ] ;
			}
		}
	} ;
	return current ;
}

// Return the Nth child or null
function getNthChild( node, index, name ) {
	var result = null ;
	if( typeof node.children !== 'undefined' && node.children.length > index ) {
		if( name === '' || node.children[ index ].name === name ) {
			result = node.children[ index ] ;
		}
	}
	return result ;
}

// Generate the code to replace current by alternative. CurrentCode and AlternativeCode are strings.
function replaceCode( rule, node, bgnPos, srcCode, currentCode, alternativeCode, endPos, mutationRule ) {
	const bgnCode = srcCode.substring( 0, bgnPos ) ;
	const endCode = srcCode.substring( endPos, srcCode.length ) ;
	const tgtCode = bgnCode + ' /*mutation*/ ' + alternativeCode + ' /*noitatum*/ ' + endCode ;
	const context = srcCode.substring( bgn( node.parent ), end( node.parent ) ) ;
	const start = bgnPos - bgn( node.parent ) ;
	return {
		rule: rule,
		context: context,
		start: start,
		current: currentCode,
		alternative: alternativeCode,
		tgtCode: tgtCode
	} ;
}

// Generate the code to swap the current and the alternative. Here current and alternative are nodes.
function swapCode( rule, node, srcName, srcCode, current, alternative ) {
	const bgnCode = srcCode.substring( 0, bgn( current ) ) ;
	const currentCode = srcCode.substring( bgn( current ), end( current ) ) ;
	const midCode = srcCode.substring( end( current ), bgn( alternative ) ) ;
	const alternativeCode = srcCode.substring( bgn( alternative ), end( alternative ) ) ;
	const endCode = srcCode.substring( end( alternative ), srcCode.length ) ;
	const tgtCode = bgnCode + ' /*mutation*/ ' + alternativeCode + midCode + currentCode + ' /*noitatum*/ ' + endCode ;
	const context = srcCode.substring( bgn( node.parent ), end( node.parent ) ) ;
	const start = bgn( node ) - bgn( node.parent ) ;
	return {
		rule: rule,
		context: context,
		start: start,
		current: currentCode + midCode + alternativeCode,
		alternative: alternativeCode + midCode + currentCode,
		tgtCode: tgtCode
	}
}

// Try to mutate an assignment operator by replacing it with another, compatible operator.
// This may generate invalid code, for example if in the assignment
// 'lockTime[_address] = trimLockTime;' the assignment operator is mutated into *=,
// an error message like 'Operator *= not compatible with types uint256[] storage
// ref and uint256[] memory' occcurs.
function mutateAssignment( srcName, srcCode, idList, node ) {
	if( debug ) {
		console.log( 'mutateAssignment( node=%s )', summariseNode( 0, node ) );
	}
	if( node.attributes.type.match( /^int[0-9]*/ ) || node.attributes.type.match( /^uint[0-9]*/ ) ) {
		const current = node.attributes.operator ;
		const options = [	['/=', '%='],
					['=', '+=', '-=', '*='],
					['>>=', '<<='],
					['|=', '^=', '&=']
				] ;
		const alternative = getRandomAlternative( current, options ) ;
		if( current !== alternative &&
			typeof node.children !== 'undefined' && node.children.length === 2 ) {
			return replaceCode( 'AOR', node, end( node.children[ 0 ] ), srcCode, current, alternative, bgn( node.children[ 1 ] ) ) ;
		}
	}
	return null ;
}

// Try to mutate a binary operator by replacing it with another, compatible
// operator. This may genererate code that does not compile, for example when a *
// is replaced by a - in an expression such as this: x * 9 / 10000000000000000000.
// The quotient is a 'rational constant' that cannot be subtracted from an integer.
// Anther issue that migth occur if a positive constant expression becomes
// negative. For example if the + mutates into a - in the expresion 'new
// bytes(1+65)'.
function mutateBinaryOperation( srcName, srcCode, idList, node ) {
	if( debug ) {
		console.log( 'mutateBinaryOperation( node=%s )', summariseNode( 0, node ) );
	}
	const current = node.attributes.operator ;
	const options = [	['&&', '||'],
				['**'],
				['+', '-', '*'],
				['/', '%'],
				['<', '>', '<=', '>=', '==', '!='],
				['>>', '<<'],
				['|', '^', '&']
			] ;
	const alternative = getRandomAlternative( current, options ) ;
	if( current !== alternative &&
		typeof node.children !== 'undefined' && node.children.length === 2 ) {
		return replaceCode( 'BOR', node, end( node.children[ 0 ] ), srcCode, current, alternative, bgn( node.children[ 1 ] ) ) ;
	}
	return null ;
}

// Mutate an Expression statement by removing it.
function mutateExpressionStatement( srcName, srcCode, idList, node ) {
	if( debug ) {
		console.log( 'mutateExpressionStatement( node=%s )', summariseNode( 0, node ) );
	}
	const current = srcCode.substring( bgn( node ), end( node ) ) ;
	const alternative = 'true' ;
	if( current !== alternative ) {
		return replaceCode( 'ESD', node, bgn( node ), srcCode, current, alternative, end( node ) ) ;
	}
	return null ;
}

// Try to mutate an identifier by replacing it with another identifier with the
// same type, scope and constancy. If an identifier with a constant value is chosen as an
// lvalue, the mutant will not compile.  Another issue that might occur is that
// the mutation might create a cyclic dependency, for example if in  the
// declaration 'a = b + 1', the b is mutated to an a.
function mutateIdentifier( srcName, srcCode, idList, node ) {
	if( debug ) {
		console.log( 'mutateIdentifier( node=%s, parent=%s )', summariseNode( 0, node ), summariseNode( 0, node.parent ) );
	}
	const current = node.attributes.value ;
	const refNode = idList[ node.attributes.referencedDeclaration ] ;
	if( typeof refNode !== 'undefined' ) {
		var options = [ ] ;
		idList.map( item => {
			if( item !== null &&
				item.name === 'Identifier' ) {
				const itemRefNode = idList[ item.attributes.referencedDeclaration ] ;
				if( typeof itemRefNode !== 'undefined' &&
					item.attributes.type === node.attributes.type &&
					itemRefNode.attributes.constant === refNode.attributes.constant &&
					itemRefNode.attributes.scope === refNode.attributes.scope ) {
						options.push( item.attributes.value ) ;
				}
			}
		} ) ;
		options = unique( options ) ;
        	const isModifierInvocation = ( typeof node.parent !== 'undefined' ? node.parent.name === 'ModifierInvocation' : false ) ;
		if( isModifierInvocation ) {
			options.push( '' ) ; /* Allow modifier invocation to be deleted */
		}
		const alternative = getRandomAlternative( current, [ options ] ) ;
		if( current !== alternative ) {
			return replaceCode( ( isModifierInvocation ? 'MORD' : 'ITSCR' ), node, bgn( node ), srcCode, current, alternative, end( node ) ) ;
		}
	}
	return null ;
}

// Try to mutate a jump statement by replacing it by another jump statement or
// by removing it. It seems that some Return nodes have an associated node.src that
// includes a semicolom, e.g. 'return ;'. The 'endKludge' tries to deal with this.
function mutateJumpStatement( srcName, srcCode, idList, node, compilerVersion ) {
	if( debug ) {
		console.log( 'mutateJumpStatement( node=%s )', summariseNode( 0, node ) );
	}
	var current = node.name.toLowerCase() ;
	const options = [	[ 'break', 'continue', 'true' ],
				[ 'return', ( compilerVersion >= '0.5.0' ? 'revert()' : 'throw' ), 'true' ],
			] ;
	const alternative = getRandomAlternative( current, options ) ;
	if( current !== alternative ) {
		const endKludge = ( typeof node.children === 'undefined' || node.children.length === 0 ? bgn( node ) + current.length : end( node ) ) ;
		current = srcCode.substring( bgn( node ), end( node ) ) ;
		return replaceCode( 'JSRD', node, bgn( node ), srcCode, current, alternative, endKludge ) ;
	}
	return null ;
}

// Try to mutate a literal by replacing it with another compatible literal.
// This may generate code that does not compile for example if a mutayion causes a
// divsion by 0. An attempt has been made to avoid this in case the denominator is
// a constant, rather than a constant expression.
function mutateLiteral( srcName, srcCode, idList, node ) {
	if( debug ) {
		console.log( 'mutateLiteral( node=%s, node.parent=%s )', summariseNode( 0, node ), summariseNode( 0, node.parent ) );
	}
	const current = srcCode.substring( bgn( node ), end( node ) ).toLowerCase() ;
	var options ;
	if( node.attributes.token === 'number' &&
		node.attributes.type !== null &&
		node.attributes.type.startsWith( 'int_const' ) &&
		( node.attributes.subdenomination||null ) === null &&
		typeof node.attributes.value !== 'undefined' &&
		node.attributes.value.match( /^0x[0-9a-f]{40}$/ ) ) {
		options = [ current, 'msg.sender', 'tx.origin', 'address(this)', 'address(0)' ] ;
		const alternative = getRandomAlternative( current, [ options ] ) ;
		if( current !== alternative ) {
			return replaceCode( 'LR_A', node, bgn( node ), srcCode, current, alternative, end( node ) ) ;
		}
	} else if( node.attributes.token === 'number' &&
		node.attributes.type !== null &&
		node.attributes.type.startsWith( 'address' ) ) {
		options = [ current, 'msg.sender', 'tx.origin', 'address(this)', 'address(0)' ] ;
		const alternative = getRandomAlternative( current, [ options ] ) ;
		if( current !== alternative ) {
			return replaceCode( 'LR_A', node, bgn( node ), srcCode, current, alternative, end( node ) ) ;
		}
	} else if( node.attributes.token === 'bool' ) {
		options = [ 'true', 'false' ] ;
		const alternative = getRandomAlternative( current, [ options ] ) ;
		if( current !== alternative ) {
			return replaceCode( 'LR_B', node, bgn( node ), srcCode, current, alternative, end( node ) ) ;
		}
	} else if( node.attributes.token === 'number' &&
		node.attributes.type !== null &&
		node.attributes.type.match( /int_const/ ) &&
		( node.attributes.subdenomination||null ) === null ) {
		const value = parseInt( node.attributes.value ) ;
		if( isNaN( value ) || ! Number.isSafeInteger( value ) ) {
			options = [ value ] ;
		} else {
			options = [ value, value + 1, value - 1, 0, 1 ].filter( item => item >= 0 ) ;
		}
		if( node.parent.name === 'BinaryOperation' && ( node.parent.attributes.operator === '/' || node.parent.attributes.operator === '%' ) ) {
			options = options.filter( item => item !== 0 ) ;
		}
		options = unique( options.map( item => item.toString() ) ) ;
		const alternative = getRandomAlternative( current, [ options ] ) ;
		if( current !== alternative ) {
			return replaceCode( 'LR_I', node, bgn( node ), srcCode, current, alternative, end( node ) ) ;
		}
	} else if( node.attributes.token === 'string' ) {
		const alternative = '""' ;
		return replaceCode( 'LR_S', node, bgn( node ), srcCode, current, alternative, end( node ) ) ;
	}
	return null ;
}

// Try to mutate tx.origin, msg.sender, address(0), or address(this)
function mutateRValueAddress( srcName, srcCode, idList, node ) {
	if( debug ) {
		console.log( 'mutateRValueAddress( node=%s )', summariseNode( 0, node ) );
	}
	var current = '' ;
	var options = [] ;
	if( node.name === 'FunctionCall' &&
		node.attributes.type.startsWith( 'address' ) &&
		node.attributes.type_conversion &&
		typeof node.children !== 'undefined' && node.children.length === 2 ) {
		const child = node.children[ 1 ] ;
		if( child.name === 'Identifier' && child.attributes.value === 'this' ) {
			current = 'address(this)' ;
			options = [ 'tx.origin', 'msg.sender', 'address(0)', current ] ;
		} else if( child.name === 'Literal' && child.attributes.value === '0' ) {
			current = 'address(0)' ;
			options = [ 'tx.origin', 'msg.sender', current, 'address(this)' ] ;
		}
	} else if( node.name === 'MemberAccess' &&
		node.attributes.type.startsWith( 'address' ) &&
		typeof node.children !== 'undefined' && node.children.length === 1 ) {
		const child = node.children[ 0 ] ;
		if( child.attributes.value === 'tx' && node.attributes.member_name === 'origin' ) {
			current = 'tx.origin' ;
			options = [ current, 'msg.sender', 'address(0)', 'address(this)' ] ;
		} else if( child.attributes.value === 'msg' && node.attributes.member_name === 'sender' ) {
			current = 'msg.sender' ;
			options = [ 'tx.origin', current, 'address(0)', 'address(this)' ] ;
		}
	}
	if( current.length > 0 ) {
		const alternative = getRandomAlternative( current, [ options ] ) ;
		if( current !== alternative ) {
			return replaceCode( 'RAR', node, bgn( node ), srcCode, current, alternative, end( node ) ) ;
		}
	}
	return null ;
}

// Try to mutate a Tag by replacing it with another Tag or by removing it.
function mutateTag( srcName, srcCode, idList, node ) {
	if( debug ) {
		console.log( 'mutateTag( node=%s )', summariseNode( 0, node ) ) ;
	}
	const current = node.attributes.value.toLowerCase() ;
	const options = [	[ 'memory', 'storage', 'calldata', ' ' ],
				[ 'public', 'private', 'internal', 'external', 'constant', ' ' ],
				[ 'payable', ' ' ]
			] ;
	const alternative = getRandomAlternative( current, options ) ;
	if( current !== alternative ) {
		return replaceCode( 'TRD', node, bgn( node ), srcCode, current, alternative, end( node ) ) ;
	}
	return null ;
}

// Try to mutate a unary operator by replacing with another, compatible operator
// or by deleting it.
function mutateUnaryOperation( srcName, srcCode, idList, node ) {
	if( debug ) {
		console.log( 'mutateUnaryOperation( node=%s )', summariseNode( 0, node ) );
	}
	const current = node.attributes.operator ;
	const options = [	['!', ''],
				['++', '--'],
				['-', '' ],
				['~', '']
			] ;
	const alternative = getRandomAlternative( current, options ) ;
	if( current !== alternative && node.children.length >= 1 ) {
		if( node.attributes.prefix ) {
			return replaceCode( 'UORD', node, bgn( node ), srcCode, current, alternative, bgn( node.children[ 0 ] ) ) ;
		} else {
			return replaceCode( 'UORD', node, end( node.children[ 0 ] ), srcCode, current, alternative, end( node ) ) ;
		}
	}
	return null ;
}

// Try to mutate a variable declaration by sawpping it with another variable with the same type, and scope.
function mutateVariableDeclaration( srcName, srcCode, idList, node ) {
	if( debug ) {
		console.log( 'mutateVariableDeclaration( node=%s )', summariseNode( 0, node ) );
	}
	const current = node ;
	var options = [ ] ;
	idList.map( item => {
		if( item !== null &&
			item.id != node.id &&
			isVariableDeclaration( item ) &&
			item.attributes.constant === node.attributes.constant &&
			/* item.attributes.stateVariable === node.attributes.stateVariable && */
			/* item.attributes.storageLocation === node.attributes.storageLocation && */
			/* item.attributes.visibility === node.attributes.visibility && */
			item.attributes.type === node.attributes.type &&
			item.attributes.scope === node.attributes.scope ) {
			options.push( item ) ;
		}
	} ) ;
	if( options.length > 0 ) {
		const r = random.range( options.length ) ;
		const alternative = options[ r ] ;
		if( bgn( current ) < bgn( alternative ) ) {
			return swapCode( 'VDTSCS', node, srcName, srcCode, current, alternative ) ;
		} else {
			return swapCode( 'VDTSCS', node, srcName, srcCode, alternative, current ) ;
		}
	}
	return null ;
}

// Given a potential target node for mutation, try to find an alternative.
// Return the complete source of the mutant if found, null otherwise.
function mutate( srcName, srcCode, idList, node, compilerVersion ) {
	if( node.name === 'Assignment' ) {
		return mutateAssignment( srcName, srcCode, idList, node ) ;
	} else if( node.name === 'BinaryOperation' ) {
		return mutateBinaryOperation( srcName, srcCode, idList, node ) ;
	} else if( node.name === 'ExpressionStatement' ) {
		return mutateExpressionStatement( srcName, srcCode, idList, node ) ;
	} else if( node.name === 'Identifier' ) {
		return mutateIdentifier( srcName, srcCode, idList, node ) ;
	} else if( isJumpStatement( node ) ) {
		return mutateJumpStatement( srcName, srcCode, idList, node, compilerVersion ) ;
	} else if( node.name === 'Literal' ) {
		return mutateLiteral( srcName, srcCode, idList, node ) ;
	} else if( isRValueAddress( node ) ) {
		return mutateRValueAddress( srcName, srcCode, idList, node ) ;
	} else if( node.name === 'Tag' ) {
		return mutateTag( srcName, srcCode, idList, node ) ;
	} else if( node.name === 'UnaryOperation' ) {
		return mutateUnaryOperation( srcName, srcCode, idList, node ) ;
	} else if( node.name === 'VariableDeclaration' ) {
		return mutateVariableDeclaration( srcName, srcCode, idList, node ) ;
	} else {
		return null ;
	}
}

// Read the source file
function readSrcCode( srcName ) {
	try {
		return fs.readFileSync( srcName, 'utf8' ) ;
	} catch( error ) {
		console.error( 'mutasol:fatal: cannot read source %s (%s)', srcName, error.message ) ;
		process.exit( 1 ) ;
	}
}

// Write a mutant to a file
function writeTgtCode( tgtName, tgtCode ) {
	try {
		fs.writeFileSync( tgtName, tgtCode, 'utf8' ) ;
	} catch( error ) {
		console.error( 'mutasol:fatal: cannot write %s (%s)', tgtName, error.message ) ;
		process.exit( 1 ) ;
	}
}

// Delete the file indicated by the first parameter or exit if an error occurs
function unlinkFile( fileName ) {
	try {
		fs.unlinkSync( fileName ) ;
	} catch( e ) {
		console.error( 'mutasol:fatal: cannot unlink %s (%s)', fileName, error.message ) ;
		process.exit( 1 ) ;
	}
}

// Diff the original and the mutant
function diffSrcTgt( srcName, tgtName ) {
	const cmd = 'diff --strip-trailing-cr ' + srcName + ' ' + tgtName ;
	try {
		return child_process.execSync( cmd ).toString() ;
	} catch( error ) {
		if( error.status === 1 ) {
			return error.stdout.toString() ;
		} else {
			console.error( 'mutasol:fatal: cannot exec %s', cmd, error ) ;
			process.exit( 1 ) ;
		}
	}
}

// Append key data and the diff to the mutant file
function appendTgtCode( cnt, total, srcData, node, mutData, tgtData, diff ) {
	const nodeName = ( isJumpStatement( node ) ? 'JumpStatement' : ( isRValueAddress( node ) ? 'RValueAddress' : node.name ) ) ;
	const result = {
		system: {
			// date: Date.now( ),
			pwd: process.env.PWD,
			compilerVersion: srcData.compilerVersion
		},
		original: {
			name: srcData.name,
			errors: srcData.errors,
			warnings: srcData.warnings
		},
		changes: {
			rule: mutData.rule,
			cnt: cnt,
			total: total,
			name: nodeName,
			id: node.id,
			context: mutData.context,
			start: mutData.start,
			current: mutData.current,
			alternative: mutData.alternative
		},
		mutant: {
			name: tgtData.name,
			errors: tgtData.errors,
			warnings: tgtData.warnings
		}
	}
	formattedResult = ( '\nbegin_mutation_summary:\n' + JSON.stringify( result, null, '  ' ) +
		'\nend_mutation_summary\nbegin_diff:\n' + diff + 'end_diff' ).replace( /\n/g, '\n\/\/ ' ) ;
	try {
		fs.appendFileSync( tgtData.name, formattedResult, 'utf8' ) ;
	} catch( error ) {
		console.error( 'mutasol:fatal: cannot append %s (%s)', tgtData.name, error.message ) ;
		process.exit( 1 ) ;
	}
}

// strip comments and WhiteSpace, maitaining the position of everythin else
function stripComment( txt ) {
	var result = '' ;
	var lineComment = false ;
	var blockComment = false ;
	for( var i = 0; i < txt.length; i++ ) {
		const c = txt.charAt( i ) ;
		const d = ( i === txt.length ? '\n' : txt.charAt( i + 1 ) ) ;
		if( lineComment ) {
			if( c === '\n' ) {
				lineComment = false ;
			}
			result += ' ' ;
		} else if( blockComment ) {
			if( c === '*' && d == '/' ) {
				blockComment = false ;
				i++ ;
				result += '  ' ;
			} else {
				result += ' ' ;
			}
		} else {
			if( c === '/' && d == '/' ) {
				lineComment = true ;
				i++ ;
				result += '  ' ;
			} else if( c === '/' && d == '*' ) {
				blockComment = true ;
				i++ ;
				result += '  ' ;
			} else if( c.trim( ).length == 0 ) {
				result += ' ' ;
			} else {
				result += c ;
			}
		}
	}
	return result ;
}

// Traverse the AST and check for missing attributes of Function Definitions
function addMissingTags( srcName, srcCode, node, maxId ) {
	if( typeof addMissingTags.nodeId === 'undefined' ) {
		addMissingTags.nodeId = maxId ;
	}
	if( [ 'FunctionDefinition', 'VariableDeclaration' ].indexOf( node.name ) >= 0 ) {
		var coverList = [ { bgnPos: 0, endPos: bgn( node ) }, { bgnPos: end( node ), endPos: srcCode.length } ] ;
		if( typeof node.children !== 'undefined' ) {
			node.children.map( child => {
				coverList.push( { bgnPos: bgn( child ), endPos: end( child ) } )
			} ) ;
		}
		coverList = coverList.filter( item => item.bgnPos < item.endPos ).sort( ( a, b ) => a.bgnPos >= b.bgnPos ) ;
		for( var index = 1; index < coverList.length; index ++ ) {
			var bgnPos = coverList[ index - 1 ].endPos ;
			var endPos = coverList[ index ].bgnPos ;
			const rawValue = srcCode.substring( bgnPos, endPos ) ;
			const strippedValue = stripComment( rawValue ) ;
			const valueList = strippedValue
				.split( / +/ )
				.filter( item => item.length > 0 )
				.filter( ( item, index, array ) => ! ( index > 0 && array[ index - 1 ] === 'function' ) ) // ignore function name
				.filter( item => tagList.indexOf( item ) >= 0 ) ; // only proper tags
			valueList.map( item => {
				const shift = strippedValue.indexOf( item ) ;
				const src = ( bgnPos + shift ).toString() + ':' + item.length.toString() + ':0' ;
				addMissingTags.nodeId ++ ;
				if( debug ) {
					console.log( bgnPos, endPos, rawValue.length, strippedValue.length, item, src, addMissingTags.nodeId ) ;
				}
				const tagNode = {
					attributes: {
						value: item
					},
					children: [],
					id: addMissingTags.nodeId,
					name: 'Tag',
					src: src,
					parent: node
				} ;
				node.children.push( tagNode ) ;
			} ) ;
		}
	}
	if( typeof node.children !== 'undefined' ) {
		node.children.map( child => addMissingTags( srcName, srcCode, child, maxId ) ) ;
	}
	return addMissingTags.nodeId ;
}

// Traverse the AST and check for nameless event arguments and contract types in the constructors
function printWarnings( srcName, srcCode, idList, node ) {
	if( node.name === 'VariableDeclaration' && node.attributes.name.length === 0 ) {
		const scopeNode = idList[ node.attributes.scope ] ;
		if( typeof scopeNode !== 'undefined' && scopeNode.name === 'EventDefinition' ) {
			const contextFunction = findDefinition( 'FunctionDefinition', node ) ;
			const contextContract = findDefinition( 'ContractDefinition', node ) ;
			console.error( 'mutasol:warning: %s uses nameless event argument of type %s for event %s in function %s, contract %s',
				srcName, node.attributes.type, scopeNode.attributes.name, contextFunction.attributes.name, contextContract.attributes.name ) ;
		}
	}
	if( node.name === 'FunctionCall' && node.attributes.type_conversion !== 'undefined' &&
		typeof node.children !== 'undefined' && node.children.length === 2 ) {
		const contextContract = findDefinition( 'ContractDefinition', node ) ;
		const contextFunction = findDefinition( 'FunctionDefinition', node ) ;
		const operandNode = node.children[ 1 ] ;
		if( node.attributes.type_conversion && node.attributes.type.match( /contract / ) ) {
			const name = contextFunction.attributes.name ;
			console.error( 'mutasol:warning: %s contains type conversion of %s to %s in function %s, contract %s',
				srcName, operandNode.attributes.type, node.attributes.type, ( name.length === 0 ? 'constuctor' : name ), contextContract.attributes.name ) ;
		}
	}
	if( node.name === 'VariableDeclaration' && node.parent.name === 'ParameterList' && typeof node.attributes.type !== 'undefined' && node.attributes.type.match( /contract / ) ) {
		const contextContract = findDefinition( 'ContractDefinition', node ) ;
		const contextFunction = node.parent.parent ;
		console.error( 'mutasol:warning: %s contains argument of type %s in function %s, contract %s',
			srcName, node.attributes.type, contextFunction.attributes.name, contextContract.attributes.name ) ;
	}
	if( node.name === 'NewExpression' && typeof node.attributes.type !== 'undefined' && node.attributes.type.match( /contract/ ) ) {
		const contextContract = findDefinition( 'ContractDefinition', node ) ;
		const contextFunction = findDefinition( 'FuctionDefinition', node ) ;
		console.error( 'mutasol:warning: %s contains new of type %s in function %s, contract %s',
			srcName, node.attributes.type, contextFunction.attributes.name, contextContract.attributes.name ) ;
	}
	if( typeof node.children !== 'undefined' ) {
		node.children.map( child => printWarnings( srcName, srcCode, idList, child ) ) ;
	}
}

// Reformat the default error message from the solidity compiler
function reformatMessage( srcName, item ) {
	if( typeof item.sourceLocation === 'undefined' ) {
		const component = item.formattedMessage.split( ':' ) ;
		return srcName + ':' + component[ 1 ] + ':' + component[ 2 ] + ':' + item.message ;
	} else {
		return srcName + ':' + item.sourceLocation.start + ':' + item.sourceLocation.end + ':' + item.message ;
	}
}

// Compile the source of a smart contract and return key data
function soljsonCompile( compilerVersion, srcName, srcCode, settings ) {
	const output = soljson.emscriptenCompile( process.env.HOME + '/' + soljsonDirectory, compilerVersion, srcCode, settings ) ;
	const contractBytecodeMetadata = {} ;
	if( typeof output.contracts !== 'undefined' && typeof output.contracts.Task !== 'undefined' ) {
		const task = output.contracts.Task ;
		const nameList = Object.keys( task ) ;
		nameList.map( name => {
			if( typeof task[ name ] !== 'undefined' && typeof task[ name ].evm !== 'undefined' && typeof task[ name ].evm.bytecode !== 'undefined' ) {
				contractBytecodeMetadata[ name ] = evm_decoder.splitBytecodeMetadata( task[ name ].evm.bytecode.object ) ;
			} else {
				console.error( 'mutasol:fatal: bytecode of contract %s not found', name ) ;
				process.exit( 1 ) ;
			}
		} ) ;
	}
	const warnings = ( typeof output.errors !== 'undefined' ?
		output.errors.filter( item => item.severity === 'warning' ).map( item => reformatMessage( srcName, item ) ) : [] ) ;
	const errors = ( typeof output.errors !== 'undefined' ?
		output.errors.filter( item => item.severity === 'error' ).map( item => reformatMessage( srcName, item ) ) : [] ) ;
	const ast = ( typeof output.sources !== 'undefined' &&
		typeof output.sources.Task !== 'undefined' &&
		typeof output.sources.Task.legacyAST !== 'undefined' ? output.sources.Task.legacyAST : [] ) ;
	result = {
		name: srcName,
		contractBytecodeMetadata: contractBytecodeMetadata,
		compilerVersion: compilerVersion,
		warnings: warnings,
		errors: errors,
		ast: ast
	}
	return result ;
}

// Compile the source of a smart contract and return the AST, errors and warnings
function compileSrcCode( compilerVersion, srcName, srcCode ) {
	const settings = {
		optimizer: {
			enabled: true,
			runs: 200
		},
		metadata: {
			useLiteralContent: true
		},
		outputSelection: {
			'*': {
				'*': [ 'evm.bytecode' ],
				'': [ 'legacyAST' ]
			}
		}
	} ;
	return soljsonCompile( compilerVersion, srcName, srcCode, settings ) ;
}
// Compile the mutant and return errors and warnings
function compileTgtCode( compilerVersion, tgtName, tgtCode ) {
	const settings = {
		optimizer: {
			enabled: true,
			runs: 200
		},
		metadata: {
			useLiteralContent: true
		},
		outputSelection: {
			'*': {
				'*': [ 'evm.bytecode' ]
			}
		}
	} ;
	return soljsonCompile( compilerVersion, tgtName, tgtCode, settings ) ;
}

// Concatenate the bytecodes of all contracts and calculate the hash of the result
function hashBytecode( bytecodeMetadata ) {
	const nameList = Object.keys( bytecodeMetadata ).sort( ( a, b ) => a.localeCompare( b ) ) ;
	const result = nameList.map( name => name + ':0x' + bytecodeMetadata[ name ].bytecode ).join( '\n' )
	// console.log( result ) ;
	return md5( result ) ;
}

// Count the number of variable declarations, and specifically the int and uint types
function variableDeclarationCnt( idList ) {
	var varCnt = { all: 0, address: 0, bool: 0, byte: 0, int: 0, string: 0, uint: 0, other: 0 } ;
	idList.map( node => {
		if( node != null && node.name === 'VariableDeclaration' ) {
			varCnt.all ++ ;
			if( node.attributes.type.match( /^address$/ ) ) {
				varCnt.address ++ ;
			} else if( node.attributes.type.match( /^bool$/ ) ) {
				varCnt.bool ++ ;
			} else if( node.attributes.type.match( /^byte[0-9]*/ ) ) {
				varCnt.byte ++ ;
			} else if( node.attributes.type.match( /^int[0-9]*/ ) ) {
				varCnt.int ++ ;
			} else if( node.attributes.type.match( /^string/ ) ) {
				varCnt.string ++ ;
			} else if( node.attributes.type.match( /^uint[0-9]*/ ) ) {
				varCnt.uint ++ ;
			} else {
				varCnt.other ++ ;
			}
		}
	} ) ;
	return varCnt ;
}

// Investigate the consistent use of modifier
function modifierMain( idList, srcCode ) {
	const functionList = idList.filter( node => node.name === 'FunctionDefinition' ) ;
	functionList.map( ( node, index ) => {
		const children = ( typeof node.children === 'undefined' ? [] : node.children ) ;
		node.headerList = [] ;
		node.modifierList = [] ;
		children.map( child => {
			if( child.name === 'ModifierInvocation' ) {
				node.modifierList.push( child ) ;
			} else {
				node.headerList.push( child ) ;
			}
			const source = srcCode.substring( bgn( child ), end( child ) ) ;
			child.stripped = comments.removeComments( source ).replace( /[	 ]*\n[	 ]*/g, ' ' ) ;
		} ) ;
		node.headerStripped = node.headerList.map( child => child.stripped ).join( ' ' ) ;
		node.modifierStripped = node.modifierList.map( child => child.stripped ).join( ' ' ) ;
		console.log( '%d#%d:	%s	%s	%s', index, node.modifierList.length, node.modifierStripped, node.attributes.name, node.headerStripped ) ;
	} ) ;
	functionList.map( ( node_i, i ) => {
		functionList.map( ( node_k, k ) => {
			if( k < i && node_i.modifierList.length != node_k.modifierList.length ) {
				const len = Math.max( node_i.headerStripped.length, node_k.headerStripped.length ) ;
				const diff = levenshtein( node_i.headerStripped, node_k.headerStripped ) / len ;
				if( diff < 0.3 ) {
					console.log( '\n%d,%d:	%d', k, i, diff ) ;
					console.log( '%d#%d:	%s	%s	%s', k, node_k.modifierList.length, node_k.modifierStripped, node_k.attributes.name, node_k.headerStripped ) ;
					console.log( '%d#%d:	%s	%s	%s', i, node_i.modifierList.length, node_i.modifierStripped, node_i.attributes.name, node_i.headerStripped ) ;
				}
			}
		} ) ;
	} ) ;
	console.error( 'mutasol:done' ) ;
}

// Drive the mutator
function mutateMain( argData ) {
	if( ! fs.existsSync( argData.srcName ) ) {
		console.error( 'mutasol:fatal: file %s not found', argData.srcName ) ;
		process.exit( 1 ) ;
	}
	const srcCode = readSrcCode( argData.srcName ) ;
	const srcData = compileSrcCode( argData.compilerVersion, argData.srcName, srcCode ) ;
	if( srcData.errors.length > 0 ) {
		console.error( srcData.errors.join( '\n' ) ) ;
		console.error( 'mutasol:fatal: %s has %d compilation errors', argData.srcName, srcData.errors.length ) ;
		process.exit( 1 ) ;
	}
	var srcHashTable = [ ] ; // used to avoid duplicates of sources
	srcHashTable.push( md5( srcCode ) ) ;
	var bytecodeHashTable = [ ] ; // used to avoid duplicates of bytecodes
	bytecodeHashTable.push( hashBytecode( srcData.contractBytecodeMetadata ) ) ;
	console.error( 'mutasol:info: original %s (#s=%s, #b=%s)', JSON.stringify( argData ).replace( /"/g, '' ), srcHashTable[ 0 ], bytecodeHashTable[ 0 ] ) ;
	if( srcData.warnings.length > 0 ) {
		console.error( srcData.warnings.join( '\n' ) ) ;
		console.error( 'mutasol:warning: %s has %d compilation warnings', argData.srcName, srcData.warnings.length ) ;
	}
	const maxId1 = maxId( srcData.ast ) ;
	const maxId2 = setParentId( { name: '*root*', attributes: { name: '*root*' } }, srcData.ast, maxId1 ) ;
	const maxId3 = addMissingTags( argData.srcName, srcCode, srcData.ast, maxId2 ) ;
	if( debug ) {
		console.log( 'maxId', maxId1, maxId2, maxId3 ) ;
	}
	addMissingScope( srcData.ast ) ;
	if( debug ) {
		console.log( '\n--------------AST\n' ) ;
		printAST( '', srcData.ast ) ;
		console.log( '\n--------------Raw AST\n' ) ;
		console.log( stringify( srcData.ast, null, '  ' ) ) ;
		const nameList = Object.keys( srcData.contractBytecodeMetadata ).sort( ( a, b ) => a.localeCompare( b ) ) ;
		nameList.map( name => {
			console.log( '\n--------------Bytecode %s\n', name ) ;
			console.log( stringify( srcData.contractBytecodeMetadata[ name ].bytecode, null, '  ' ) ) ;
			if( typeof srcData.contractBytecodeMetadata[ name ].metadataList !== 'undefined' ) {
				console.log( '\n--------------Metadata list %s\n', name ) ;
				srcData.contractBytecodeMetadata[ name ].metadataList.map( metadata => {
					console.log( 'bzzr://%s', metadata ) ;
				} ) ;
			}
		} ) ;
	}
	var idList = [] ;
	collectIdList( idList, srcData.ast ) ;
	collectPredefinedIdList( argData.srcName, idList, srcData.ast ) ;
	if( debug ) {
		console.log( '\n--------------idList\n' ) ;
		printIdList( '', idList ) ;
	}
	var candidateList = [ ] ;
	collectCandidateList( argData.srcName, idList, candidateList, srcData.ast, argData.selectFlags ) ;
	if( debug ) {
		console.log( '\n--------------candidateList\n' ) ;
		printIdList( '', candidateList ) ;
		console.log( '' ) ;
	}
	printWarnings( argData.srcName, srcCode, idList, srcData.ast ) ;
	if( candidateList.length === 0 ) {
		console.error( 'mutasol:fatal: no candidates for mutation in %s with flag(s) %s', argData.srcName, argData.selectFlags ) ;
		process.exit( 0 ) ;
	}
	var cnt = 0 ;
	if( argData.maxOrg === 0 && argData.maxMut === 0 ) {
		modifierMain( idList, srcCode ) ;
		return ;
	}
	for( var i = 0; i < argData.maxOrg; i++) {
		const tgtName = argData.srcName + '_' + cnt + '.mut' ;
		writeTgtCode( tgtName, srcCode ) ;
		cnt++ ;
	}
	var tce = { equivalent: 0, duplicate: 0 } ;
	for( var i = 0; i < argData.maxNrTries && cnt <= argData.maxMut; i++) {
		const node = candidateList[ random.range( candidateList.length ) ] ;
		const mutData = mutate( argData.srcName, srcCode, idList, node, argData.compilerVersion ) ;
		if( mutData === null ) {
			console.error( 'mutasol:info: %s no alternative %s (id=%d)',
				argData.srcName, node.name, node.id ) ;
		} else {
			const srcNewHash = md5( mutData.tgtCode ) ;
			if( srcHashTable.filter( srcOldHash => srcOldHash === srcNewHash ).length > 0 ) {
				console.error( 'mutasol:info: %s duplicate source %s (id=%d, cnt=%d, #s=%s)',
					argData.srcName, mutData.rule, node.id, cnt, srcNewHash ) ;
			} else {
				const tgtData = compileTgtCode( argData.compilerVersion, argData.srcName, mutData.tgtCode ) ;
				const tgtName = argData.srcName + '_' + cnt + '.mut' ;
				writeTgtCode( tgtName, mutData.tgtCode ) ;
				const diff = diffSrcTgt( argData.srcName, tgtName ) ;
				appendTgtCode( cnt, candidateList.length, srcData, node, mutData, Object.assign( tgtData, { name: tgtName } ), diff ) ;
				if( tgtData.errors.length > 0 ) {
					console.error( 'mutasol:info: %s compilation failed %s (id=%d, cnt=%d, errors=%d, #s=%s)',
						argData.srcName, mutData.rule, node.id, cnt, tgtData.errors.length, srcNewHash ) ;
					if( ! argData.keepFailures ) {
						cnt -- ;
						unlinkFile( tgtName ) ;
					}
				} else {
					const bytecodeNewHash = hashBytecode( tgtData.contractBytecodeMetadata ) ;
					if( bytecodeHashTable.filter( bytecodeOldHash => bytecodeOldHash === bytecodeNewHash ).length > 0 ) {
						console.error( 'mutasol:info: %s duplicate bytecode %s (id=%d, cnt=%d, #b=%s)',
							argData.srcName, mutData.rule, node.id, cnt, bytecodeNewHash ) ;
						if( ! argData.keepFailures ) {
							cnt -- ;
							unlinkFile( tgtName ) ;
						}
						if( bytecodeNewHash === bytecodeHashTable[ 0 ] ) {
							tce.equivalent ++ ;
						} else {
							tce.duplicate ++ ;
						}
					} else {
						srcHashTable.push( srcNewHash ) ;
						bytecodeHashTable.push( bytecodeNewHash ) ;
						const delta = tgtData.warnings.length - srcData.warnings.length ;
						console.error( 'mutasol:info: %s mutation %s (id=%d, cnt=%d, delta_warnings=%d, #s=%s, #b=%s)',
							argData.srcName, mutData.rule, node.id, cnt, delta, srcNewHash, bytecodeNewHash ) ;
					}
				}
				cnt++ ;
			}
		}
	}
	const varCnt = variableDeclarationCnt( idList ) ;
	console.error( 'mutasol:info: %d mutants out of %d generated for %d candidates (tce %s, var %s)',
		cnt - argData.maxOrg, argData.maxMut, candidateList.length, JSON.stringify( tce ).replace( /"/g, '' ), JSON.stringify( varCnt ).replace( /"/g, '' ) ) ;
}

// Show how to use mutasol
function usage( ) {
	console.error( 'usage: mutasol [ -c | -f file_name | -d | -k | -m int | -n int | -o int | -s <letters> ] | -v version] ' ) ;
	process.exit( 1 ) ;
}

// Main function
function main () {
	var srcName = '' ;
	var compilerVersion = defaultVersion ;
	var compilerRelease = false ;
	var keepFailures = false ;
	var maxMut = 100 ;
	var maxNrTries = 1000 ;
	var maxOrg = 10 ;
	var selectFlags = [...'abcdefghijklmnopqrstuvwxyz'] ;
	for( var i = 2; i < process.argv.length; i++ ) {
		if( process.argv[ i ] === '-c' ) {
			compilerRelease = true ;
		} else if( process.argv[ i ] === '-f' ) {
			i++ ;
			srcName = path.basename( process.argv[ i ] ) ;
			if( srcName !== process.argv[ i ] ) {
				usage( ) ;
			}
		} else if( process.argv[ i ] === '-d' ) {
			debug = true ;
		} else if( process.argv[ i ] === '-k' ) {
			keepFailures = true ;
		} else if( process.argv[ i ] === '-m' ) {
			i++ ;
			maxMut = parseInt( process.argv[ i ] ) ;
			if( isNaN( maxMut ) ) {
				usage( ) ;
			}
		} else if( process.argv[ i ] === '-n' ) {
			i++ ;
			maxNrTries = parseInt( process.argv[ i ] ) ;
			if( isNaN( maxNrTries ) ) {
				usage( ) ;
			}
		} else if( process.argv[ i ] === '-o' ) {
			i++ ;
			maxOrg = parseInt( process.argv[ i ] ) ;
			if( isNaN( maxOrg ) ) {
				usage( ) ;
			}
		} else if( process.argv[ i ] === '-s' ) {
			i++ ;
			if( process.argv[ i ].length === 0 ) {
				usage( ) ;
			}
			selectFlags = process.argv[ i ].split( '' ) ;
		} else if( process.argv[ i ] === '-v' ) {
			i++ ;
			const components = process.argv[ i ].split( '.' ).map( item => parseInt( item ) ) ;
			const check = components.reduce( ( accu, item ) => accu || isNaN( item ), false ) || components.length !== 3 ;
			if( check ) {
				usage( ) ;
			}
			compilerVersion = components.map( item => item.toString() ).join( '.' ) ;
		} else {
			usage( ) ;
		}
	}
	if( compilerRelease ) {
		console.log( soljson.fetchReleases( ) ) ;
	} else {
		const argData = {
			srcName: srcName,
			compilerVersion: compilerVersion,
			keepFailures: keepFailures,
			maxMut: maxMut,
			maxNrTries: maxNrTries,
			maxOrg: maxOrg,
			selectFlags: selectFlags
		} ;
		mutateMain( argData ) ;
	}
}

main() ;
