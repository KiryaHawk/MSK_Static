const API_URL = 'https://pto-api.onrender.com/api';

let selectedColor = "#808080"; // дефолтный серый

const colorPicker = new iro.ColorPicker("#colorPicker", {
    width: 200,
    color: selectedColor,
});

colorPicker.on('color:change', function(color) {
    selectedColor = color.hexString;
});

fetch(API_URL + '/get_colors')
    .then(r => r.json())
    .then(colors => {
        const colorsContainer = document.getElementById("availableColors");
        colors.forEach(color => {
            const colorElem = document.createElement("div");
            colorElem.style.backgroundColor = color;
            colorsContainer.appendChild(colorElem);

            colorElem.onclick = function() {
                colorPicker.color.set(color);
            };
        });
    });

ymaps.ready(function () {
    fetch('frontend/data/points.json')
        .then(response => response.json())
        .then(obj => {
            const searchControls = new ymaps.control.SearchControl({
                options: { float: 'right', noPlacemark: true }
            });

            const myMap = new ymaps.Map("map", {
                center: [55.76, 37.64],
                zoom: 7,
                controls: [searchControls]
            });

            ['geolocationControl', 'trafficControl', 'fullscreenControl', 'zoomControl', 'rulerControl', 'typeSelector']
                .forEach(control => myMap.controls.remove(control));

            const objectManager = new ymaps.ObjectManager({
                clusterize: true,
                clusterIconLayout: "default#pieChart",
                geoObjectOpenBalloonOnClick: true
            });

            fetch(API_URL + '/get_all')
                .then(r => r.json())
                .then(commMap => {
                    obj.features.forEach(feature => {
                        const [lon, lat] = feature.geometry.coordinates;
                        feature.geometry.coordinates = [lat, lon];

                        const id = String(feature.id || feature.properties.oto_id);

                        const color = commMap[id]?.color || feature.properties.color || "gray";
                        const comment = commMap[id]?.comment || feature.properties.comment || "";

                        feature.properties.color = color;
                        feature.properties.comment = comment;
                        feature.options = feature.options || {};
                        feature.options.preset = "islands#" + color + "Icon";
                        feature.properties.balloonContent = '';
                    });

                    objectManager.add(obj);
                    myMap.geoObjects.add(objectManager);
                    myMap.setBounds(objectManager.getBounds(), { checkZoomRange: true });

                    objectManager.objects.events.add('click', function (e) {
                        const objectId = e.get('objectId');
                        const obj = objectManager.objects.getById(objectId);

                        let balloonHtml = `
                            <div style="padding:8px;">
                                <b>${obj.properties.name || "Без названия"}</b><br>
                                <b>Адрес:</b> ${obj.properties.address || "—"}<br><br>
                                <label><b>Комментарий:</b><br>
                                    <textarea id="comment-edit" style="width:98%;min-height:48px;">${obj.properties.comment}</textarea>
                                </label><br><br>
                                <b>Цвет:</b><br>
                                <div id="balloonColorPicker"></div><br>
                                <button onclick="saveCommentAndColor('${objectId}')">Сохранить</button>
                            </div>`;

                        objectManager.objects.setObjectProperties(objectId, {
                            balloonContent: balloonHtml
                        });

                        objectManager.objects.balloon.open(objectId);

                        new iro.ColorPicker("#balloonColorPicker", {
                            width: 150,
                            color: obj.properties.color
                        }).on('color:change', function(color) {
                            selectedColor = color.hexString;
                        });
                    });

                    window._objectManager = objectManager;
                });
        });
});

window.saveCommentAndColor = function (id) {
    const comment = document.getElementById('comment-edit')?.value;

    fetch(`${API_URL}/set/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, color: selectedColor })
    }).then(() => {
        const obj = window._objectManager.objects.getById(Number(id));
        if (obj) {
            obj.properties.comment = comment;
            obj.properties.color = selectedColor;
            obj.options.preset = "islands#" + selectedColor + "Icon";

            window._objectManager.objects.setObjectOptions(id, obj.options);
            window._objectManager.objects.setObjectProperties(id, obj.properties);
        }

        alert("Сохранено!");
        window._objectManager.objects.balloon.close();
    });
};