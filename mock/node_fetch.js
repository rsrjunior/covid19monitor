var fs = require("fs");
var http = require("https");

var options = {
	"method": "GET",
	"port": null,
	"headers": {
		"x-rapidapi-host": "covid-193.p.rapidapi.com",
		"x-rapidapi-key": "c3414d2c8dmshad47f98658f598fp1b458djsn9eb932b014d0"
	}
};

const urlCountries = "https://covid-193.p.rapidapi.com/countries";
const urlHistory = (name) => `https://covid-193.p.rapidapi.com/history?country=${name}`;
var countries;

var req = http.request(urlCountries, options, function (res) {
	var chunks = [];

	res.on("data", function (chunk) {
		chunks.push(chunk);
	});

	res.on("end", function () {
		var body = Buffer.concat(chunks);
		countries = JSON.parse(body.toString()).response;
		console.log(countries);
		fs.writeFileSync('countries.json', JSON.stringify(countries));
		countries.push("All");
		countries.map((name) => {
			var req2 = http.request(urlHistory(name), options, function (res) {
				var chunks = [];

				res.on("data", function (chunk) {
					chunks.push(chunk);
				});

				res.on("end", function () {
					var body = Buffer.concat(chunks);
					let history = JSON.parse(body.toString()).response;
					console.log(`Write data for ${name}...`);
					fs.writeFileSync(`${name}.json`, JSON.stringify(history));
				});
			});
			req2.end();
		});

	});
});

req.end();