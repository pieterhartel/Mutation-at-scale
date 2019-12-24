module.exports = {
	compilers: {
		solc: {
			version: "0.4.19",
			optimizer: {
				enabled: true,
				runs: 200
			}
		}
	},
	networks: {
		test: {
			host: "127.0.0.1",
			port: 8545,
			network_id: "*" // Match any network id
		}
	}
} ;
