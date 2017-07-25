//-------------------------------------------------------------------
// Query Chaincode - read chaincode state
//-------------------------------------------------------------------
var baseHelper = require('../../node-api/app/helper.js');

function buildTarget(peer, org) {
	var target = null;
	if (typeof peer !== 'undefined') {
		let targets = baseHelper.newPeers([baseHelper.getPeerAddressByName(org, peer)]);
		if (targets && targets.length > 0) target = targets[0];
	}

	return target;
}


module.exports = function (logger) {
	var utils = require('fabric-client/lib/utils.js');
	var query_cc = {};

	//-------------------------------------------------------------------
	// Get Marble Index List
	//-------------------------------------------------------------------
	/*
		options: {
					channel_id: "channel id",
					chaincode_id: "chaincode id",
					chaincode_version: "v0",
					cc_function: "function_name"
					cc_args: ["argument 1"]
		}
	*/
	query_cc.query_chaincode = function (obj, options, cb) {
		var org='org1';
		var username='Terry';
		var peer = 'peer1';
		var channel = baseHelper.getChannelForOrg(org);
		var client = baseHelper.getClientForOrg(org);
		var target = buildTarget(peer, org);
		return baseHelper.getRegisteredUsers(username, org).then((user) => {
			tx_id = client.newTransactionID();
			// send query
			var request = {
				chaincodeId: 'marbles',
				txId: tx_id,
				fcn: options.cc_function,
				args: options.cc_args
			};
			return channel.queryByChaincode(request, target);
		}, (err) => {
			logger.info('Failed to get submitter \''+username+'\'');
			return 'Failed to get submitter \''+username+'\'. Error: ' + err.stack ? err.stack :
				err;
		}).then(
			function (response_payloads) {
				var formatted = format_query_resp(response_payloads);

				// --- response looks bad -- //
				if (formatted.parsed == null) {
					logger.debug('[fcw] Query response is empty', formatted.raw);
				}

				// --- response looks good --- //
				else {
					logger.debug('[fcw] Successful query transaction.'); //, formatted.parsed);
				}
				if (cb) return cb(null, formatted);
			}
			).catch(
			function (err) {
				logger.error('[fcw] Error in query catch block', typeof err, err);

				if (cb) return cb(err, null);
				else return;
			}
			);
	};

	//-----------------------------------------------------------------
	// Format Query Responses
	//------------------------------------------------------------------
	function format_query_resp(peer_responses) {
		var ret = {
			parsed: null,
			peers_agree: true,
			raw_peer_payloads: [],
		};
		var last = null;

		// -- iter on each peer's response -- //
		for (var i in peer_responses) {
			var as_string = peer_responses[i].toString('utf8');
			var as_obj = {};

			//logger.debug('[fcw] Peer ' + i, 'payload as str:', as_string, 'len', as_string.length);
			logger.debug('[fcw] Peer ' + i, 'len', as_string.length);
			ret.raw_peer_payloads.push(as_string);

			// -- compare peer responses -- //
			if (last != null) {								//check if all peers agree
				if (last !== as_string) {
					logger.warn('[fcw] warning - some peers do not agree on query', last, as_string);
					ret.peers_agree = false;
				}
				last = as_string;
			}

			try {
				if (as_string === '') {							//if its empty, thats okay... well its not great 
					as_obj = '';
				} else {
					as_obj = JSON.parse(as_string);				//if we can parse it, its great
				}
				logger.debug('[fcw] Peer ' + i, 'type', typeof as_obj);
				if (ret.parsed === null) ret.parsed = as_obj;	//store the first one here
			}
			catch (e) {
				if (as_string.indexOf('Error: failed to obtain') >= 0) {
					logger.error('[fcw] query resp looks like an error', typeof as_string, as_string);
					ret.parsed = null;
				} else {
					logger.warn('[fcw] warning - query resp is not json, might be okay.', typeof as_string, as_string);
					ret.parsed = as_string;
				}
			}
		}
		return ret;
	}

	return query_cc;
};

