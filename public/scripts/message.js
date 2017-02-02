$(function() {
    
    const $messageList = $('#message-list');
    const $usernameInput = $('#username');
    const $messageInput = $('#message');
    
    var firstId = 0;
    var lastId = 0;
    const usernameMaxLength = 50;
    const messageMaxLength = 5000;
    const messagesPerRequest = 10;
    const message_template = $('#message-template').html();
    
    Mustache.parse(message_template);
    getMessages();
    
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
                    $messageList.html('');
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
        
        if (lastId <= 0) {
            getMessages();
            return;
        }
        
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
    
	$('#submit').on('click', function() {
		var username = $usernameInput.val();
		var message = $messageInput.val();
		if (username.length > usernameMaxLength || message.length == 0 || message.length > messageMaxLength) {
			//
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
                    getNewMessages();
                    $messageInput.val('').focus();
                },
				error: function() {}
			});
		}
	});
    
    $('#refresh').on('click', function() {
        getNewMessages();
        return false;
    });
    
    $('#load-more').on('click', function() {
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
        return false;
    });
    
    $('#top').on('click', function() {
        window.scrollTo(0, 0);
        return false;
    });
});