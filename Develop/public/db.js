const pendingStore = 'pending';

const request = indexedDB.open('budget', 2);

request.onupgradeneeded = event => {
    const db = request.result;
    console.log(event);
    if (!db.objectStoreNames.contains(pendingStore)) {
        db.createObjectStore(pendingStore, { autoIncrement: true });
    }
};

request.onsuccess = event => {
    console.log(`Success ${event.type}`);
    if (navigator.online) {
        checkDatabase();
    }
};

request.onerror = event => console.error(event);

function checkDatabase() {
    const db = request.result;
    let transaction = db.transaction([ pendingStore ], 'readwrite');
    let store = transaction.objectStore(pendingStore);
    const getAll = store.getAll();

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: `POST`,
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, txt/plain, */*',
                    'Content-Type': 'application/json'
                }
            })

            .then(response => response.json())
            .then(() => {
                transaction = db.transaction([ pendingStore ], 'readwrite');
                store = transaction.objectStore(pendingStore);
                store.clear();
            });
        }
    };
}

function saveRecord(record) {
    const db = request.result;
    const transaction = db.transaction([ pendingStore ], 'readwrite');
    const store = transaction.objectStore(pendingStore);
    store.add(record);
}

window.addEventListener('online', checkDatabase);