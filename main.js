$(function() {
	const NebPay = require("nebpay");
	const nebPay = new NebPay();

	var serialNumber;
	var intervalQuery;
	var moves;
	//const callbackUrl = NebPay.config.mainnetUrl;
	//const contract = "n1jh7Peq1WVHN3A3EKdQc4V7q9WeBpTMVfk";
	const callbackUrl = NebPay.config.testnetUrl;
	const contract = "n1mxwW4K8bfwhcZrYMyJjCcxBSVvRu8wnvz";

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
			listener: loadGetStats
		});
	}

	function loadGetStats(response) {
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

	$('a[data-modal]').on('click', function() {
		$($(this).data('modal')).modal({
			fadeDuration: 100
		});
		moves = {
			one: null,
			two: null,
			three: null
		}
		return false;
	});

	$('.btn-switcher').click(function (e) {
		$(this).addClass("selected").siblings().removeClass("selected");
		moves[$(this).parent().attr("data-round")] = $(this).children().attr("data-choice");
	});

	$('#btn-create').click(function (e) {

	    var to = contract;
		var value = $("#bet").val();
	    var callFunction = "create";
	    var callArgs = [];
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
	}
});