
let map1 = L.map('map1').setView([53.430127, 14.564802], 18);
L.tileLayer.provider('Esri.WorldImagery').addTo(map1);

document.getElementById("saveButton").addEventListener("click", function() {
    leafletImage(map1, function (err, canvas) {
        if (err) {
            console.error("Błąd generowania obrazu mapy:", err);
            return;
        }

        let rasterMap = document.getElementById("map2");
        rasterMap.innerHTML = "";

        const img = new Image();
        img.src = canvas.toDataURL();
        img.style.width = "100%";
        img.style.height = "100%";
        rasterMap.appendChild(img);

        img.onload = function() {
            splitImageIntoPieces(img);
        };
    });
});


document.getElementById("getLocation").addEventListener("click", function() {
    if (!navigator.geolocation) {
        console.log("Geolokalizacja nie jest wspierana.");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        map1.setView([lat, lon]);
    }, error => {
        console.error("Błąd pobierania lokalizacji:", error);
    });
});

// Shuffle puzzle pieces in the container
function shufflePuzzle() {
    const container = document.getElementById("map3");
    const items = Array.from(container.children);
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    container.innerHTML = "";
    items.forEach(item => container.appendChild(item));
}

// Create a grid on `map4` for the drop area
function createPuzzleGrid(rows, cols) {
    const grid = document.getElementById("map4");
    grid.innerHTML = "";
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    const totalCells = rows * cols;
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement("div");
        cell.classList.add("item");
        grid.appendChild(cell);
    }
}

createPuzzleGrid(4,4);

// Split the image into 16 pieces and add drag-and-drop functionality
function splitImageIntoPieces(image) {
    const numRows = 4;
    const numCols = 4;
    const pieceWidth = image.width / numCols;
    const pieceHeight = image.height / numRows;

    const pieceContainer = document.getElementById("map3");
    pieceContainer.innerHTML = "";

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const canvas = document.createElement("canvas");
            canvas.width = pieceWidth;
            canvas.height = pieceHeight;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, col * pieceWidth, row * pieceHeight, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);

            const img = new Image();
            img.src = canvas.toDataURL();
            img.classList.add('item');
            img.dataset.position = `${row}-${col}`;
            img.dataset.correctPosition = `${row}-${col}`;
            img.draggable = true;

            pieceContainer.appendChild(img);
        }
    }

    
    shufflePuzzle();
    enableDragAndDrop();
}

// Enable drag-and-drop functionality for puzzle pieces
function enableDragAndDrop() {
    const items = document.querySelectorAll('.item');
    items.forEach(item => {
        item.addEventListener("dragstart", function(event) {
            this.style.opacity = "0.4";
            event.dataTransfer.setData("text", this.dataset.position);
        });
        item.addEventListener("dragend", function() {
            this.style.opacity = "1";
        });
    });

    const dropArea = document.getElementById("map4");
    dropArea.addEventListener("dragover", event => event.preventDefault());
    dropArea.addEventListener("drop", function(event) {
        event.preventDefault();
        const draggedPosition = event.dataTransfer.getData("text");
        const draggedItem = document.querySelector(`[data-position="${draggedPosition}"]`);

        const rect = dropArea.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const col = Math.floor(x / (dropArea.offsetWidth / 4));
        const row = Math.floor(y / (dropArea.offsetHeight / 4));

        draggedItem.style.gridColumnStart = col + 1;
        draggedItem.style.gridRowStart = row + 1;
        dropArea.appendChild(draggedItem);

        checkIfPuzzleCompleted();
    });
}


function checkIfPuzzleCompleted() {
    const pieces = document.querySelectorAll(".item");
    const isComplete = Array.from(pieces).every(piece => {
        const currentPos = `${piece.style.gridRowStart - 1}-${piece.style.gridColumnStart - 1}`;
        return currentPos === piece.dataset.correctPosition;
    });

    if (isComplete) {
        showNotification("Gratulacje! Puzzle zostały poprawnie ułożone.");
    }
}

// Show notification on completion
function showNotification(message) {
    if (!("Notification" in window)) {
        alert("Twoja przeglądarka nie obsługuje powiadomień.");
        return;
    }

    if (Notification.permission === "granted") {
        new Notification(message);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(message);
            }
        });
    }
}
