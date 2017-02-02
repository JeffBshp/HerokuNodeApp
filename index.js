const pg = require('pg');
const querystring = require('querystring');
const mustacheExpress = require('mustache-express');
const util = require('util');
const express = require('express');

const queryGetLastId = 'SELECT id FROM Messages ORDER BY id DESC LIMIT 1';
const queryGetMessages = 'SELECT * FROM Messages WHERE id > $1 AND id < $2 ORDER BY id ASC';
const queryPostMessage = 'INSERT INTO Messages(username, message) VALUES ($1, $2) RETURNING id, username, message';
const usernameMaxLength = 50;
const messageMaxLength = 5000;
const initialMessageCount = 20;
const maxMessagesToSend = 40;

const app = express();
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.engine('mst', mustacheExpress(__dirname + '/views/partials'));
app.set('view engine', 'mst');
app.set('views', __dirname + '/views');

var lastId = 0;
getLastId();

function getLastId() {
    pg.connect(process.env.DATABASE_URL, function(error, client, done) {
		client.query(queryGetLastId, function(error, result) {
			done();
			if (error) {
				console.error(error);
			} else {
				lastId = Number(result.rows[0].id);
                console.log('Last message ID: ' + lastId);
			}
		});
	});
}

function getMessages(fromId, toId, response) {
    pg.connect(process.env.DATABASE_URL, function(error, client, done) {
		client.query(queryGetMessages, [fromId, toId], function(error, result) {
			done();
			if (error) {
				console.error(error);
                response.send(error);
			} else {
                response.send(result.rows);
			}
		});
	});
}

app.get('/', function(request, response) {
    var fromId = lastId - initialMessageCount;
    var toId = lastId + 1;
	response.render('pages/index', {messages: []});
});

app.get('/messages', function(request, response) {
    var fromId = lastId - initialMessageCount;
    var toId = lastId + 1;
    getMessages(fromId, toId, response);
});

app.get('/messages/:fromId', function(request, response) {
    var fromId = Number(request.params.fromId);
    var toId = lastId + 1;
    if (toId - fromId - 1 > maxMessagesToSend) {
        toId = fromId + maxMessagesToSend + 1;
    }
    getMessages(fromId, toId, response);
});

app.get('/messages/:fromId/:toId', function(request, response) {
    var fromId = Number(request.params.fromId);
    var toId = Number(request.params.toId);
    if (toId - fromId - 1 > maxMessagesToSend) {
        fromId = toId - maxMessagesToSend - 1;
    }
    getMessages(fromId, toId, response);
});

app.post('/messages', function(request, response) {

	var body = [];
	request.on('error', function(error) {
		console.error(error);
	}).on('data', function(chunk) {
		body.push(chunk);
	}).on('end', function() {
		body = Buffer.concat(body).toString();
		body = querystring.parse(body);

		var username = body.username.length == 0 ? 'Anonymous' : body.username;
		var message = body.message;

		if (username.length > usernameMaxLength || message.length == 0 || message.length > messageMaxLength) {
			response.send(false);
		} else {
			pg.connect(process.env.DATABASE_URL, function(error, client, done) {
				client.query(queryPostMessage, [username, message], function(error, result) {
					done();
					if (error) {
						console.error(error);
						response.send(error);
					} else {
                        lastId = Number(result.rows[0].id);
                        console.log('ID: ' + lastId + ', Name: "' + username + '", Message: "' + message + '"');
						response.send(result.rows[0]);
					}
				});
			});
		}
	});
});

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});
