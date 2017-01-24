var pg = require('pg');
var multiparty = require('multiparty');
var util = require('util');
var express = require('express');
var app = express();

const q_get_messages = 'SELECT * FROM Messages ORDER BY id DESC';
const q_post_message = 'INSERT INTO Messages(username, message) values ($1, $2)';

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  pg.connect(process.env.DATABASE_URL, function(error, client, done) {
    client.query(q_get_messages, function(error, result) {
      done();
      if (error) {
        console.error(error);
        response.send("Error " + error);
      } else {
        response.render('pages/index', {results: result.rows});
      }
    });
  });
});

app.post('/', function(request, response) {
  var form = new multiparty.Form();
  form.parse(request, function(error, fields, files) {
    if (error) {
      response.writeHead(400, {'content-type': 'text/plain'});
      response.end('Invalid request: ' + error.message);
      return;
    }

    pg.connect(process.env.DATABASE_URL, function(error, client, done) {
      client.query(q_post_message, [fields.username[0], fields.message[0]], function(error, result) {
        done();
        if (error) {
          console.error(error);
          response.send("Error " + error);
        } else {
          client.query(q_get_messages, function(error, result) {
            done();
            if (error) {
              console.error(error);
              response.send("Error " + error);
            } else {
              response.render('pages/index', {results: result.rows});
            }
          });
        }
      });
    });

    console.log('Name: ', fields.username[0], ', Message: ', fields.message[0]);
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
