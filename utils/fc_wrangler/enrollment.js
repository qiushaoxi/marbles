//-------------------------------------------------------------------
// Enrollment HFC Library
//-------------------------------------------------------------------

module.exports = function (logger) {
	var path = require('path');
	var common = require(path.join(__dirname, './common.js'))(logger);
	var enrollment = {};
	var baseHelper = require('../../node-api/app/helper.js');


	enrollment.enroll = function (options, cb) {
		
		baseHelper.getOrgAdmin("org1")
		.then(function (submitter) {
			if (cb) cb(null, { chain: baseHelper.getChannelForOrg("org1"), client:baseHelper.getClientForOrg("org1"), submitter: submitter });
			return;
		}).catch(
			// --- Failure --- //
			function (err) {
				logger.error('[fcw] Failed to get enrollment ' + options.uuid, err.stack ? err.stack : err);
				var formatted = common.format_error_msg(err);

				if (cb) cb(formatted);
				return;
			}
			);
	};


	return enrollment;
};
