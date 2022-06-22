// variable to hold db connection
let db;

// establish connection to IndexedDB database, set to version 1
const request = indexedDB.open('budget_tracker', 1);

// event for if database changes
request.onupgradeneeded = function(event) {
    // save reference to db
    const db = event.target.result;

    // creates object store and auto increments
    db.createObjectStore('new_entry', {autoIncrement: true});
};

// successful
request.onsuccess = function(event) {
    // when db is created successfully with object store or connection established, save a reference
    db = event.target.result;

    // if app is online, send local data to api
    if(navigator.onLine) {
        //uploadData function here
        //

    }
};

// if error
request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// function in case of new upload with no internet connection
function saveRecord(transaction) {
    // open new transaction with database - includes read and write permissions
    const transaction = db.transaction(['new_entry'], 'readwrite');

    // access object store of 'new_entry'
    const entryObjectStore = transaction.objectStore('new_entry');

    // add record to store
    entryObjectStore.add(transaction);
};

function uploadRecord() {
    // open transaction in db
    const transaction = db.transaction(['new_entry'], 'readwrite');

    // access object store
    const entryObjectStore = transaction.objectStore('new_entry');

    // get all records from store and set to variable
    const getAll = entryObjectStore.getAll();

    // on successful .getAll() this will run
    getAll.onsuccess = function() {
        // if data stored, send to api server
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open transaction
                const transaction = db.transaction(['new_entry'], 'readwrite');
                // access new_entry object store
                const entryObjectStore = transaction.objectStore('new_entry');
                // clear all items in store
                entryObjectStore.clear();

                alert('All saved transactions have been submitted');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
};

// listens for app coming back online
window.addEventListener('online', uploadRecord);