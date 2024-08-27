chrome.alarms.onAlarm.addListener(alarm => {
    chrome.notifications.create(alarm.name, {
        type: 'basic',
        title: '대중교통 알림',
        message: `버스나 지하철이 곧 도착합니다!`
    });
});
