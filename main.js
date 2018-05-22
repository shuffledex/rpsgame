const NebPay = require("nebpay");
const nebPay = new NebPay();

var serialNumber;
var intervalQuery;
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
		$("#nasTransacted").html(result.value);
	} else {
		setTimeout(function() {
			getStats()
		}, 5000);
	}
};

$(function() {
	$('a[data-modal]').on('click', function() {
		$($(this).data('modal')).modal({
			fadeDuration: 100
		});
		return false;
	});

	$(".btn-switcher").click(function (e) {
		$(this).addClass("selected").siblings().removeClass("selected");
	});
});