/*
    This function is loosely based on the one found here:
    http://www.weanswer.it/blog/optimize-css-javascript-remove-comments-php/
*/
function _removeComments(str) {
	str = ('__' + str + '__').split('');
	var mode = {
		singleQuote: false,
		doubleQuote: false,
		blockComment: false,
		lineComment: false,
		condComp: false
	};
	for (var i = 0, l = str.length; i < l; i++) {
		if (mode.singleQuote) {
			if (str[i] === "'" && str[i-1] !== '\\') {
				mode.singleQuote = false;
			}
			continue;
		}

		if (mode.doubleQuote) {
			if (str[i] === '"' && str[i-1] !== '\\') {
				mode.doubleQuote = false;
			}
			continue;
		}

		if (mode.blockComment) {
			if (str[i] === '*' && str[i+1] === '/') {
				str[i+1] = '';
				mode.blockComment = false;
			}
			str[i] = '';
			continue;
		}

		if (mode.lineComment) {
			if (str[i+1] === '\n' || str[i+1] === '\r') {
				mode.lineComment = false;
			}
			str[i] = '';
			continue;
		}

		if (mode.condComp) {
			if (str[i-2] === '@' && str[i-1] === '*' && str[i] === '/') {
				mode.condComp = false;
			}
			continue;
		}

		mode.doubleQuote = str[i] === '"';
		mode.singleQuote = str[i] === "'";

		if (str[i] === '/') {
			if (str[i+1] === '*' && str[i+2] === '@') {
				mode.condComp = true;
				continue;
			}
			if (str[i+1] === '*') {
				str[i] = '';
				mode.blockComment = true;
				continue;
			}
			if (str[i+1] === '/') {
				str[i] = '';
				mode.lineComment = true;
				continue;
			}
		}
	}
	return str.join('').slice(2, -2);
}

module.exports = {
        removeComments: _removeComments
} ;
