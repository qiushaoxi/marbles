/* global bag, $, ws*/
/* global escapeHtml, toTitleCase, formatDate, known_companies, transfer_marble, record_company, show_tx_step, refreshHomePanel, auditingMarble*/
/* exported build_marble, record_company, build_user_panels, build_company_panel, build_notification, populate_users_marbles*/
/* exported build_a_tx, marbles */

var marbles = {};
var USERNAME = "";
// =================================================================================
//	UI Building
// =================================================================================
//build a marble
function build_marble(marble) {
	var html = '';
	// var colorClass = '';
	var size = 'largeMarble';
	var auditing = '';

	marbles[marble.id] = marble;

	marble.id = escapeHtml(marble.id);
	// marble.color = escapeHtml(marble.color);
	marble.owner.id = escapeHtml(marble.owner.id);
	marble.owner.username = escapeHtml(marble.owner.username);
	marble.owner.company = escapeHtml(marble.owner.company);
	var full_owner = escapeHtml(marble.owner.username.toLowerCase() + '.' + marble.owner.company);

	console.log('[ui] building marble: ', full_owner, marble.id.substring(0, 4) + '...');
	// if (marble.size == 16) size = 'smallMarble';
	// if (marble.color) colorClass = marble.color.toLowerCase() + 'bg';

	if(auditingMarble && marble.id ===  auditingMarble.id) auditing = 'auditingMarble';

	html += '<span id="' + marble.id + '" class="ball ' + size + ' ' + auditing + '" title="' + marble.id + '"';
	html += ' username="' + marble.owner.username + '" company="' + marble.owner.company + '" owner_id="' + marble.owner.id + '"><i></i></span>';

	$('.marblesWrap[owner_id="' + marble.owner.id + '"]').find('.innerMarbleWrap').prepend(html);
	$('.marblesWrap[owner_id="' + marble.owner.id + '"]').find('.noMarblesMsg').hide();
	return html;
}

//redraw the user's marbles
function populate_users_marbles(msg) {

	//reset
	console.log('[ui] clearing marbles for user ' + msg.owner_id);
	$('.marblesWrap[owner_id="' + msg.owner_id + '"]').find('.noMarblesMsg').show();

	for (var i in msg.marbles) {
		build_marble(msg.marbles[i]);
	}
}

//crayp resize - dsh to do, dynamic one
function size_user_name(name) {
	var style = '';
	if (name.length >= 10) style = 'font-size: 22px;';
	if (name.length >= 15) style = 'font-size: 18px;';
	if (name.length >= 20) style = 'font-size: 15px;';
	if (name.length >= 25) style = 'font-size: 11px;';
	return style;
}

//build all user panels
function build_user_panels(data) {
	USERNAME = USERNAME || $("#userField").text().toLowerCase();
	//reset
	console.log('[ui] clearing all user panels');
	$('.ownerWrap').html('');
	for (var x in known_companies) {
		known_companies[x].count = 0;
		known_companies[x].visible = 0;							//reset visible counts
	}
	for (var i in data) {
		if(data[i].username == USERNAME){
			build_my_panels(data[i]);
			continue;
		}
		var html = '';
		var colorClass = '';
		data[i].id = escapeHtml(data[i].id);
		data[i].username = escapeHtml(data[i].username);
		data[i].company = escapeHtml(data[i].company);
		record_company(data[i].company);
		known_companies[data[i].company].count++;
		known_companies[data[i].company].visible++;

		console.log('[ui] building owner panel ' + data[i].id);

		html += '<div id="user' + i + 'wrap" username="' + data[i].username + '" company="' + data[i].company +
			'" owner_id="' + data[i].id + '" class="marblesWrap ' + colorClass + '">';
		html += '<div class="legend" style="' + size_user_name(data[i].username) + '">';
		html += toTitleCase(data[i].username);
		html += '<span class="fa fa-thumb-tack marblesCloseSectionPos marblesFix" title="Never Hide Owner"></span>';
		html += '</div>';
		if(USERNAME=="admin"){
			html += '<div class="innerMarbleWrap"><i class="fa fa-plus addMarble"></i></div>';
		}
		else{
			html += '<div class="innerMarbleWrap"></div>';
		}
		html += '<div class="noMarblesMsg hint">没有合约</div>';
		html += '</div>';

		$('.companyPanel[company="' + data[i].company + '"]').find('.ownerWrap').append(html);
		$('.companyPanel[company="' + data[i].company + '"]').find('.companyVisible').html(known_companies[data[i].company].visible);
		$('.companyPanel[company="' + data[i].company + '"]').find('.companyCount').html(known_companies[data[i].company].count);
	}

	//drag and drop marble
	var s = ".innerMarbleWrap";
	if(USERNAME != "admin"){
		s = '#myPanel .innerMarbleWrap';
	}
	$('.innerMarbleWrap').sortable({ connectWith: s, items: 'span' }).disableSelection();
	$('.innerMarbleWrap').droppable({
		drop:
		function (event, ui) {
			var marble_id = $(ui.draggable).attr('id');
			var username = "";
			//  ------------ Delete Marble ------------ //
			if ($(event.target).attr('id') === 'trashbin') {
				username = $(ui.draggable).parents('.marblesWrap').attr('username');
				if(USERNAME == "admin" || USERNAME == username){
					console.log('removing marble', marble_id);
					show_tx_step({ state: 'building_proposal' }, function () {
						var obj = {
							type: 'delete_marble',
							id: marble_id,
							v: 1
						};
						ws.send(JSON.stringify(obj));
						$(ui.draggable).addClass('invalid bounce');
						refreshHomePanel();
					});
				}
			}

			//  ------------ Transfer Marble ------------ //
			else {
				username = $(event.target).parents('.marblesWrap').attr('username');
				if(USERNAME == "admin" || USERNAME == username){
					var dragged_owner_id = $(ui.draggable).attr('owner_id');
					var dropped_owner_id = $(event.target).parents('.marblesWrap').attr('owner_id');

					console.log('dropped a marble', dragged_owner_id, dropped_owner_id);
					if (dragged_owner_id != dropped_owner_id) {										//only transfer marbles that changed owners
						$(ui.draggable).addClass('invalid bounce');
						transfer_marble(marble_id, dropped_owner_id);
						return true;
					}
				}
			}
		}
	});

	//user count
	$('#foundUsers').html(data.length);
	$('#totalUsers').html(data.length);
}

function build_my_panels(data){
	var html = '';
	if($("#myPanel .ownerWrap").html()!=""){
		data.id = escapeHtml(data.id);
		data.username = escapeHtml(data.username);
		data.company = escapeHtml(data.company);
		html += '<div class="ownerWrap"></div>';
		$('#myPanel').append(html);
	}
	
	html = "";
	html += '<div id="user' + '999' + 'wrap" username="' + data.username + '" company="' + data.company +
		'" owner_id="' + data.id + '" class="marblesWrap">';
	html += '<div class="legend" style="' + size_user_name(data.username) + '">';
	html += '我的合约';
	html += '</div>';
	html += '<div class="innerMarbleWrap"><i class="fa fa-plus addMarble"></i></div>';
	html += '<div class="noMarblesMsg hint">没有合约</div>';
	html += '</div>';
	$("#myPanel .ownerWrap").append(html);
	
}

//build company wrap
function build_company_panel(company) {
	company = escapeHtml(company);
	console.log('[ui] building company panel ' + company);

	var mycss = '';
	if (company === escapeHtml(bag.marble_company)) mycss = 'myCompany';

	var html = '';
	html += '<div class="companyPanel" company="' + company + '">';
	html += '<div class="companyNameWrap ' + mycss + '">';
	html += '<span class="companyName">' + company + '&nbsp;-&nbsp;</span>';
	html += '<span class="companyVisible">0</span>/';
	html += '<span class="companyCount">0</span>';
	if (company === escapeHtml(bag.marble_company)) {
		html += '<span class="fa fa-exchange floatRight"></span>';
	}
	else {
		html += '<span class="fa fa-long-arrow-left floatRight"></span>';
	}
	html += '</div>';
	html += '<div class="ownerWrap"></div>';
	html += '</div>';
	$('#allUserPanelsWrap').append(html);
}

//build a notification msg, `error` is boolean
function build_notification(error, msg) {
	var html = '';
	var css = '';
	var iconClass = 'fa-check';
	if (error) {
		css = 'warningNotice';
		iconClass = 'fa-minus-circle';
	}

	html += '<div class="notificationWrap ' + css + '">';
	html += '<span class="fa ' + iconClass + ' notificationIcon"></span>';
	html += '<span class="noticeTime">' + formatDate(Date.now(), '%M/%d %I:%m:%s') + '&nbsp;&nbsp;</span>';
	html += '<span>' + escapeHtml(msg) + '</span>';
	html += '<span class="fa fa-close closeNotification"></span>';
	html += '</div>';
	return html;
}


//build a tx history div
function build_a_tx(data, pos) {
	var html = '';
	var username = '-';
	var company = '-';
	var id = '-';
	var time = '';
	var deadline = '';
	if(data.txTime){
		time = new Date(parseInt(data.txTime)*1000).Format("yyyy/MM/dd HH:mm:ss");
	}
	if(data.value && data.value.term){
		deadline = new Date(parseInt(data.value.term)*1000).Format("yyyy/MM/dd HH:mm:ss");
	}
	if(data &&  data.value && data.value.owner && data.value.owner.username) {
		username = data.value.owner.username;
		company = data.value.owner.company;
		id = data.value.owner.id;
	}

	html += '<div class="txDetails">';
	html +=		'<div class="txCount">' + time + '</div>';
	html +=		'<p>';
	html +=			'<div class="marbleLegend">交易流水: </div>';
	html +=			'<div class="marbleName txId">' + data.txId.substring(0, 14) + '...</div>';
	html +=		'</p>';
	html +=		'<p>';
	html +=			'<div class="marbleLegend">所属人: </div>';
	html +=			'<div class="marbleName">' + username + '</div>';
	html +=		'</p>';
	html +=		'<p>';
	html +=			'<div class="marbleLegend">公司: </div>';
	html +=			'<div class="marbleName">' + company  + '</div>';
	html +=		'</p>';
	html +=		'<p>';
	html +=			'<div class="marbleLegend">标的: </div>';
	html +=			'<div class="marbleName">' + data.value.target  + '</div>';
	html +=		'</p>';
	html +=		'<p>';
	html +=			'<div class="marbleLegend">全额: </div>';
	html +=			'<div class="marbleName">' + data.value.price  + '</div>';
	html +=		'</p>';
	html +=		'<p>';
	html +=			'<div class="marbleLegend">期限: </div>';
	html +=			'<div class="marbleName">' + deadline  + '</div>';
	html +=		'</p>';
	html +=		'<p>';
	html +=			'<div class="marbleLegend">执行价: </div>';
	html +=			'<div class="marbleName">' + data.value.execution  + '</div>';
	html +=		'</p>';
	html +=		'<p>';
	html +=			'<div class="marbleLegend">权利金: </div>';
	html +=			'<div class="marbleName">' + data.value.royalties  + '</div>';
	html +=		'</p>';

	html +=	'</div>';
	return html;
}
