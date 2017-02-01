$(function() {
    
    const username_max_length = 50;
    const message_max_length = 5000;
    
    var $messageList = $('#message-list');
    var $usernameInput = $('#username');
    var $messageInput = $('#message');
    var $submit = $('#submit');
    var $refresh = $('#refresh');
    var $top = $('#top');
    var $loadMore = $('#load-more');
    
    var firstId = 0;
    var lastId = 0;
    var messagesPerRequest = 10;
    
    const message_template =
    '<li>' +
		'<div class="panel panel-default">' +
			'<div class="panel-heading container-fluid">' +
				'<div class="row">' +
					'<div class="col-md-6 col-sm-6 col-xs-6">' +
						'<h3 class="panel-title">{{username}}</h3>' +
					'</div>' +
					'<div class="col-md-6 col-sm-6 col-xs-6 right-aligned-col">' +
						'<h3 class="panel-title">{{id}}</h3>' +
					'</div>' +
				'</div>' +
			'</div>' +
			'<div class="panel-body">' +
                '{{message}}' +
			'</div>' +
		'</div>' +
	'</li>';
    
    function prependMessages(messages) {
        $.each(messages, function(i, message) {
            $messageList.prepend(Mustache.render(message_template, message));
        });
    }
    
    function appendMessages(messages) {
        for (var i = messages.length - 1; i >= 0; i--) {
            $messageList.append(Mustache.render(message_template, messages[i]));
        }
    }
    
    function getMessages() {
        $.ajax({
            type: 'GET',
            url: '/messages/',
            success: function(messages) {
                if (messages.length > 0) {
                    prependMessages(messages);
                    firstId = Number(messages[0].id);
                    lastId = Number(messages[messages.length-1].id);
                } else {
                    //
                }
            },
            failure: function() {}
        });
    }
    
    function getNewMessages() {
        $.ajax({
            type: 'GET',
            url: '/messages/' + lastId,
            success: function(messages) {
                if (messages.length > 0) {
                    prependMessages(messages);
                    lastId = Number(messages[messages.length-1].id);
                }
            },
            failure: function() {}
        });
    }
    
    function getOldMessages() {
        $.ajax({
            type: 'GET',
            url: '/messages/' + (firstId - messagesPerRequest - 1) + '/' + firstId,
            success: function(messages) {
                if (messages.length > 0) {
                    appendMessages(messages);
                    firstId = Number(messages[0].id);
                }
            },
            failure: function() {}
        });
    }
    
    getMessages();
    
	$submit.on('click', function() {
		var username = $usernameInput.val();
		var message = $messageInput.val();
		if (username.length > username_max_length || message.length == 0 || message.length > message_max_length) {
			// not allowed
		} else {
			var data = {
				username: username,
				message: message
			};
			$.ajax({
				type: 'POST',
				url: '/messages',
				data: data,
				success: function(newMessage) {
                    //addMessage(newMessage);
                    getNewMessages();
                    $messageInput.val('').focus();
                },
				error: function() {}
			});
		}
	});
    
    $refresh.on('click', function() {
        getNewMessages();
        return false;
    });
    
    $top.on('click', function() {
        window.scrollTo(0, 0);
        return false;
    });
    
    $loadMore.on('click', function() {
        getOldMessages();
        return false;
    });
});