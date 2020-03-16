let db;
const request = indexedDB.open("budget", 1);

//Ready indexedDB if made for first time
request.onupgradeneeded = function(event){
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

//check database to move stuff to mongo if online
request.onsuccess = function(event){
  db = event.target.result;
  if (navigator.onLine){
    checkDatabase();
  }
}

request.onerror = function(event){
  console.log(`Error - ${event.target.errorCode}`);
}

function saveRecord(record){
  // Save something to indexedDB -- Called in index.js if mongodb store fails
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
}

function checkDatabase(){
  // create a transaction to check the contents of indexedDB
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = function(){
    if (getAll.result.length > 0){
      //Put everything in mongo if there is anything in indexedDB
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        //clear indexedDB after everything is moved to mongo
        const transaction = db.transaction(["pending"], "readwrite");
        const store = transaction.objectStore("pending");
        store.clear();
        location.reload();
      });
    }
  }
}

window.addEventListener("online", checkDatabase);