$(function() {
	const NebPay = require("nebpay");
	const nebPay = new NebPay();
	const CREATE = "create";
	const JOIN = "join";

	var serialNumber;
	var intervalQuery;
	var moves = {
		one: null,
		two: null,
		three: null
	};
	var modalStatus;
	//const callbackUrl = NebPay.config.mainnetUrl;
	//const contract = "n1jh7Peq1WVHN3A3EKdQc4V7q9WeBpTMVfk";
	const callbackUrl = NebPay.config.testnetUrl;
	const contract = "n1nRaWFtRoWB6oUFAqBNneE8XMMGGNdATQZ";

	getStats();

	function getStats() {

		var to = contract;
		var value = 0;
		var callFunction = "getStats";
		var callArgs = null;

		nebPay.simulateCall(to, value, callFunction, callArgs, {
			qrcode: {
			    showQRCode: false
			},
			listener: getStatsListener
		});
	}

	function getStatsListener(response) {
		if (response.execute_err == "" || response.execute_err == "insufficient balance") {
			var result = JSON.parse(response.result);
			$("#gamesCreated").html(result.games);
			$("#nasTransacted").html(toNas(result.value));
		} else {
			setTimeout(function() {
				getStats()
			}, 5000);
		}
	};

	function getGames() {

		var to = contract;
		var value = 0;
		var callFunction = "getGames";
		var callArgs = null;

		nebPay.simulateCall(to, value, callFunction, callArgs, {
			qrcode: {
			    showQRCode: false
			},
			listener: getGamesListener
		});
	};

	function getGamesListener(response) {
		if (response.execute_err == "" || response.execute_err == "insufficient balance") {
			var result = JSON.parse(response.result);
			$('#gamesToJoin').html("");
			result.forEach(function(element) {
				$('#gamesToJoin').append('<tr>\
					<td>'+element.game+'</td>\
					<td>'+toNas(element.value)+'</td>\
					<td><a class="button button-primary" href="#create" rel="modal:open" id="joinMatch" data-game="'+element.game+'" data-value="'+toNas(element.value)+'">Join</a></td>\
					</tr>');
			})
		} else {
			setTimeout(function() {
				getGames()
			}, 5000);
		}
	};

	function getLedger() {

		var to = contract;
		var value = 0;
		var callFunction = "getLedger";
		var callArgs = null;

		nebPay.simulateCall(to, value, callFunction, callArgs, {
			qrcode: {
			    showQRCode: false
			},
			listener: getLedgerListener
		});
	};

	function getLedgerListener(response) {
		if (response.execute_err == "" || response.execute_err == "insufficient balance") {
			var result = JSON.parse(response.result);

			$('#ledgerList').html("")

			result.forEach(function(element) {
				var yourMovesHTML = "";
				var oppMovesHTML = "";
				(element.yourMoves).forEach((move) => {
					yourMovesHTML = yourMovesHTML + '<i class="far fa-hand-'+move+'"></i> '
				});

				(element.opponentMoves).forEach((move) => {
					oppMovesHTML = oppMovesHTML + '<i class="far fa-hand-'+move+'"></i> '
				});

				var html = '<tr>\
								<td>\
									<div class="row">\
										<div class="six columns">\
											You\
										</div>\
										<div class="six columns">\
											'+yourMovesHTML+'\
										</div>\
									</div>\
									<div class="row">\
										<div class="six columns">\
											Opp\
										</div>\
										<div class="six columns">\
											'+oppMovesHTML+'\
										</div>\
									</div>\
								</td>\
								<td class="'+element.result+'">'+element.result+' '+toNas(element.value)+'</td>\
								<td><a class="button button-primary" href="https://explorer.nebulas.io/#/tx/'+element.hash+'" style="padding:0 15px" target="_blank">View</a></td>\
							</tr>';

				$('#ledgerList').append(html)
			})

		} else {
			setTimeout(function() {
				getLedger()
			}, 5000);
		}
	};

	$('a[data-modal]').on('click', function() {
		$($(this).data('modal')).modal({
			fadeDuration: 100
		});
		getGames()
		getLedger()
		return false;
	});

	$('.btn-switcher').click(function (e) {
		$(this).addClass("selected").siblings().removeClass("selected");
		moves[$(this).parent().attr("data-round")] = $(this).children().attr("data-choice");
	});

	$('#btn-create').click(function (e) {

	    var to = contract;
		var value = $("#bet").val();
		var callFunction;
	    
	    var callArgs = [];

		if (modalStatus == CREATE) {
			callFunction = "create";
		}
		if (modalStatus == JOIN) {
			callFunction = "play";
			callArgs.push($("#address").val())
		}

	    callArgs.push(moves.one)
	    callArgs.push(moves.two)
	    callArgs.push(moves.three)
	    callArgs = JSON.stringify(callArgs);

		serialNumber = nebPay.call(to, parseFloat(value), callFunction, callArgs, {
			qrcode: {
				showQRCode: false
			},
			callback: callbackUrl,
			listener: createListener
		});
		intervalQuery = setInterval(function() {
			createIntervalQuery();
		}, 20000);

		$('#waiting').modal();

		return false;
	});

	function createListener(response) {
	};

	function createIntervalQuery() {
		nebPay.queryPayInfo(serialNumber, {
			callback: callbackUrl
		})
		.then(function(response) {
			var respObject = JSON.parse(response)
			if (respObject.code === 0) {
				clearInterval(intervalQuery);
			}
			console.log(response)
		})
		.catch(function(err) {
			console.log(JSON.stringify(err));
		});
	};

	function toNas(value) {
		return parseInt(value) * Math.pow(10,(-18));
	};

	$('.create-modal').on($.modal.BEFORE_CLOSE, function(event, modal) {
		moves = {
			one: null,
			two: null,
			three: null
		}
		$("#bet").val("");
		$('.create-modal').find("li").removeClass("selected");
	});

	$("div .create").on("click", function() {
		modalStatus = CREATE
		$("#create .title").html("Create game")
		$("#create #btn-create").html("Create")
		$("#create #bet").css("display", "block")
		$("#create #willBet").css("display", "none")
	});

	$(document).on("click", "a#joinMatch", function() {
		modalStatus = JOIN
		var game = $(this).attr("data-game")
		var value = $(this).attr("data-value")

		$("#create .title").html("Match vs. " + game)
		$("#create #btn-create").html("Join")
		$("#create #bet").css("display", "none")
		$("#create #willBet").css("display", "block")
		$("#create #willBet strong").html(value)

		$("#create #bet").val(value)
		$("#create #address").val(game)
	});

});