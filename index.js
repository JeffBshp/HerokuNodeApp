const pg = require('pg');
const querystring = require('querystring');
const mustacheExpress = require('mustache-express');
const util = require('util');
const express = require('express');

const q_get_last_id = 'SELECT id FROM Messages ORDER BY id DESC LIMIT 1';
const q_get_messages = 'SELECT * FROM Messages WHERE id > $1 AND id < $2 ORDER BY id ASC';
const q_post_message = 'INSERT INTO Messages(username, message) VALUES ($1, $2) RETURNING id, username, message';
const username_max_length = 50;
const message_max_length = 5000;
const initial_message_count = 20;
const max_messages_to_send = 40;

var app = express();
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

var lastId = 0;
getLastId();

function getLastId() {
    pg.connect(process.env.DATABASE_URL, function(error, client, done) {
		client.query(q_get_last_id, function(error, result) {
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
		client.query(q_get_messages, [fromId, toId], function(error, result) {
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
	response.render('pages/index');
});

app.get('/messages', function(request, response) {
    var fromId = lastId - initial_message_count;
    var toId = lastId + 1;
    getMessages(fromId, toId, response);
});

app.get('/messages/:fromId', function(request, response) {
    var fromId = Number(request.params.fromId);
    var toId = lastId + 1;
    if (toId - fromId - 1 > max_messages_to_send) {
        toId = fromId + max_messages_to_send + 1;
    }
    getMessages(fromId, toId, response);
});

app.get('/messages/:fromId/:toId', function(request, response) {
    var fromId = Number(request.params.fromId);
    var toId = Number(request.params.toId);
    if (toId - fromId - 1 > max_messages_to_send) {
        fromId = toId - max_messages_to_send - 1;
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

		if (username.length > username_max_length || message.length == 0 || message.length > message_max_length) {
			response.send(false);
		} else {
			pg.connect(process.env.DATABASE_URL, function(error, client, done) {
				client.query(q_post_message, [username, message], function(error, result) {
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

	// var form = new multiparty.Form();
	// form.parse(request, function(error, fields, files) {
	// 	if (error) {
	// 		response.writeHead(400, {'content-type': 'text/plain'});
	// 		response.end('Invalid request: ' + error.message);
	// 		return;
	// 	}

	// 	var username = fields.username[0].length == 0 ? 'Anonymous' : fields.username[0];
	// 	var message = fields.message[0];
	// 	console.log('Name: ', username, ', Message: ', message);

	// 	if (username.length > username_max_length || message.length == 0 || message.length > message_max_length) {
	// 		response.send(false);
	// 	} else {
	// 		pg.connect(process.env.DATABASE_URL, function(error, client, done) {
	// 			client.query(q_post_message, [username, message], function(error, result) {
	// 				done();
	// 				if (error) {
	// 					console.error(error);
	// 					response.send(error);
	// 				} else {
	// 					response.send(result);
	// 				}
	// 			});
	// 		});
	// 	}
	// });
});

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});
