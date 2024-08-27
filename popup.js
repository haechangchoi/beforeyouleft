document.getElementById('searchStops').addEventListener('click', () => {
    const radius = document.getElementById('radiusInput').value;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            const apiKey = 'jBJwyuCH5ykdwvc7Cx3n%2FYNUoOvia%2BnuNSriW1HLMnA';
            let url = `https://api.odsay.com/v1/api/pointSearch?apiKey=${apiKey}&x=${longitude}&y=${latitude}&radius=${radius}&stationClass=1:2&output=json`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.result && data.result.station) {
                        const stations = data.result.station;
                        let stopsListHTML = '<ul>';
                        stations.forEach(station => {
                            const direction = station.stationClass === 1 ? "(버스)" : "(지하철)";
                            const stationDirection = station.stationClass === 1 ? '' : (station.stationName.includes('Up') ? '(상행)' : '(하행)');
                            stopsListHTML += `<li data-id="${station.stationID}" data-class="${station.stationClass}" data-name="${station.stationName}">${station.stationName} ${direction} ${stationDirection}</li>`;
                        });
                        stopsListHTML += '</ul>';
                        document.getElementById('stopsList').innerHTML = stopsListHTML;

                        // 정류장 선택 시
                        document.querySelectorAll('#stopsList li').forEach(item => {
                            item.addEventListener('click', () => {
                                const stationID = item.getAttribute('data-id');
                                const stationClass = item.getAttribute('data-class');
                                const stationName = item.getAttribute('data-name');

                                setAlertForStation(stationID, stationClass, stationName);
                            });
                        });
                    } else {
                        document.getElementById('stopsList').innerText = '지정된 반경 내에 대중교통 정류장이 없습니다.';
                    }
                })
                .catch(error => {
                    console.error('Error fetching stop data:', error);
                    document.getElementById('stopsList').innerText = '대중교통 정보를 가져오는 중 오류가 발생했습니다.';
                });
        });
    } else {
        alert('Geolocation이 지원되지 않는 브라우저입니다.');
    }
});

function setAlertForStation(stationID, stationClass, stationName) {
    const apiKey = 'jBJwyuCH5ykdwvc7Cx3n%2FYNUoOvia%2BnuNSriW1HLMnA';

    let url;
    if (stationClass == '1') {  // 버스 정류장
        url = `https://api.odsay.com/v1/api/realtimeStation?apiKey=${apiKey}&stationID=${stationID}`;
    } else if (stationClass == '2') {  // 지하철역
        // 지하철 시간표 조회 API 사용
        url = `https://api.odsay.com/v1/api/searchSubwaySchedule?apiKey=${apiKey}&stationID=${stationID}&output=json`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            let stopsDetailsHTML = `<h3>선택한 정류장: ${stationName}</h3>`;
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();

            if (stationClass == '1' && data.result && data.result.real) { // 버스 정류장 실시간 정보가 있을 경우
                data.result.real.forEach(bus => {
                    const direction = bus.updownFlag === '1' ? '상행' : '하행';
                    stopsDetailsHTML += `<p>버스 번호: ${bus.routeNm}, 방향: ${direction}, 도착 예정 시간: ${Math.round(bus.arrival1.arrivalSec / 60)}분 후</p>`;
                });
            } else if (stationClass == '2' && data.result && data.result.weekdaySchedule) { // 지하철역 시간표 정보가 있을 경우
                const upSchedules = data.result.weekdaySchedule.up.filter(schedule => {
                    const departureMinutes = parseInt(schedule.departureTime.split(':')[0]) * 60 + parseInt(schedule.departureTime.split(':')[1]);
                    return departureMinutes >= nowMinutes && departureMinutes <= nowMinutes + 60;
                });

                const downSchedules = data.result.weekdaySchedule.down.filter(schedule => {
                    const departureMinutes = parseInt(schedule.departureTime.split(':')[0]) * 60 + parseInt(schedule.departureTime.split(':')[1]);
                    return departureMinutes >= nowMinutes && departureMinutes <= nowMinutes + 60;
                });

                if (upSchedules.length > 0) {
                    stopsDetailsHTML += `<h4>상행:</h4>`;
                    upSchedules.forEach(schedule => {
                        stopsDetailsHTML += `<p>출발 시간: ${schedule.departureTime}, 열차 종류: ${schedule.subwayClass === 0 ? '일반' : '급행'}</p>`;
                    });
                }

                if (downSchedules.length > 0) {
                    stopsDetailsHTML += `<h4>하행:</h4>`;
                    downSchedules.forEach(schedule => {
                        stopsDetailsHTML += `<p>출발 시간: ${schedule.departureTime}, 열차 종류: ${schedule.subwayClass === 0 ? '일반' : '급행'}</p>`;
                    });
                }

                if (upSchedules.length === 0 && downSchedules.length === 0) {
                    stopsDetailsHTML += `<p>1시간 내 도착하는 열차가 없습니다.</p>`;
                }
            } else {
                stopsDetailsHTML += `<p>도착 정보를 가져올 수 없습니다.</p>`;
            }

            document.getElementById('result').innerHTML = stopsDetailsHTML;
        })
        .catch(error => {
            console.error('Error fetching arrival data:', error);
            document.getElementById('result').innerText = '도착 정보를 가져오는 중 오류가 발생했습니다.';
        });
}
