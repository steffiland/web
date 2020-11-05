const requestButtonSelector = '.push-requestbutton';
const hour24 = 86400000; // in milliseconds
const showPushTimeout = 3600000; // 1h
var href;
var pushTimeouts = [];
var pushIntervals = [];

function onGranted() {
    $(requestButtonSelector).css('background-color', 'limegreen');
    Push.create("FlyLady", {
        body: "Push-Benachrichtigungen sind aktiviert!",
        icon: "/icon.png", //optional
        timeout: 5000,
        onClick: function () {
            console.log(this);
        } //*/
    });
    $('.push-info').html('Push-Benachrichtigungen sind aktiviert.');
}

function onDenied() {
    $(requestButtonSelector).css('background-color', 'red');
    $('.push-info').html('Achtung! Keine Push-Benachrichtigungen möglich!');
}

// requestButton.onclick = function() {
function requestPermissions() {
    Push.Permission.request(onGranted, onDenied);
}

function deleteOldSchedules() {
    var i;
    while (i = pushIntervals.pop()) { clearInterval(i); }
    while (i = pushTimeouts.pop()) { clearTimeout(i); }
}

function schedulePushNotifications(json) {
    var data;
    var now = new Date();
    try {
        console.log(json);
        data = JSON.parse(json);
        Object.keys(data).forEach(function(key) {
            var time = data[key].split(':',2);
            var hour = parseInt(time[0]);
            var min =  parseInt(time[1]);
            
            var later = new Date(now.getFullYear() , now.getMonth(), now.getDate(), hour, min, 0, 0);
            if (later.getTime() - now.getTime() < 0) {
                later = new Date(later.getTime() + hour24); // it's after 10am, try 10am tomorrow.
            }
            //console.log('Key : ' + key + ', Value : ' + data[key]);
            //send Push Notification at the specified time and then every 24hours
            console.log('scheduled Push Notification for ' + key + ' at ' + later.toLocaleString());
            $('.push-info').append('<br />Nächste Push-Nachricht für "' + key + '": ' + later.toLocaleString());
            pushTimeouts.push( setTimeout(function() {
                sendPush(key);
                pushIntervals.push( setInterval(sendPush, hour24, key));
            }, later.getTime() - now.getTime()));
        }); //*/
    } catch (e) {
        console.warn("%o", e);
    }
   
}

function sendPush(text) {
    Push.create("FlyLady", {
        body: text,
        //link: "flylady.html#Wochenplantag", //not working: https://github.com/Nickersoft/push.js/issues/102
        timeout: showPushTimeout,
        onClick: function () {
            window.focus();
            window.location.href = href + '#' + text;
            this.close();
        },
    });
}

function logPushStatus() {
    if (Push.Permission.has()) {
        $('.push-info').text('Push-Benachrichtigungen sind aktiviert.');
    } else {
        $('.push-info').text('Achtung! Keine Push-Benachrichtigungen möglich!');
    }
}

//$(window).load(function() {
$(document).ready(function () {

    href = window.location.href.split('.html')[0] + '.html';

    logPushStatus();

    $(requestButtonSelector).click(function() {
        requestPermissions();
        logPushStatus();
        deleteOldSchedules();
        schedulePushNotifications($('.scheduleData').first().text());
    });
    
    // hole Content aus dem Tiddler mit der CSS Klasse 'scheduleData'
    window.setTimeout(function() {
        //console.log($('[data-tiddler-title="Dienstag"]').html());
        
    }, 3000);
    
    schedulePushNotifications($('.scheduleData').first().text());
    
});
