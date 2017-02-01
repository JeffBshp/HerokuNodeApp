$(function() {
    
    const username_max_length = 50;
    const message_max_length = 5000;
    
    var $messageList = $('#message-list');
    var $usernameInput = $('#username');
    var $messageInput = $('#message');
    
    const message_template =
    '<li>' +
		'<div class="panel panel-default">' +
			'<div class="panel-heading container-fluid">' +
				'<div class="row">' +
					'<div class="col-md-6 col-sm-6 col-xs-6">' +
						'<h3 class="panel-title">{{username}}</h3>' +
					'</div>' +
					'<div class="col-md-6 col-sm-6 col-xs-6 message-id">' +
						'<h3 class="panel-title">{{id}}</h3>' +
					'</div>' +
				'</div>' +
			'</div>' +
			'<div class="panel-body">' +
                '{{message}}' +
			'</div>' +
		'</div>' +
	'</li>';
    
    function addMessage(message) {
        $messageList.prepend(Mustache.render(message_template, message));
    }
    
    $.ajax({
        type: 'GET',
        url: '/messages',
        success: function(messages) {
            $.each(messages, function(i, message) {
                addMessage(message);
            });
        },
        failure: function() {}
    });
    
	$('#submit').on('click', function() {
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
                    addMessage(newMessage);
                    $messageInput.val('').focus();
                },
				error: function() {}
			});
		}
	});
});