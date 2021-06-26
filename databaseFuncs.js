const sqlite = require('sqlite3').verbose();
const fs = require('fs');

function isInDataBase(authorID) {
  
  return new Promise((resolve, reject) => {
    let db = new sqlite.Database('./database.db', sqlite.OPEN_READONLY);
    var query = "SELECT * FROM data WHERE discordID = ?";
  
    db.get(query, [authorID], function (err, row) {
      if(err){
          reject(err)
      }
      if (row == undefined) {
        resolve([false])
      }
        db.close();
        resolve([true, row])
    });
    
  });
  }

  function getData(authorID) {
    return new Promise((resolve, reject) => {
      let db = new sqlite.Database('./database.db', sqlite.OPEN_READONLY);
      var query = "SELECT * FROM data WHERE discordID = ?";
    
      db.serialize(() => {
        db.get(query, [authorID], function (err, row) {
          if(err){
            reject(`An error occured while fetching data. Please report this. ERROR_2: ${err}`)
          }
          if (row == undefined) {
            reject(`An error occured while fetching data. Please report this: ERROR_1`)
          }
            db.close();
            resolve(row)
        });
      });

    });
    }

  function changeData(authorID, data, query) {
    return new Promise((resolve, reject) => {
      let db = new sqlite.Database('./database.db', sqlite.OPEN_READWRITE);

      db.serialize(() => {
        db.run(query, [data, authorID], function (err) {
          if(err){
            reject(`An error occured while writing data. Please report this. ERROR_2: ${err}`)
        }
          db.close();
          resolve();
        
        });
      });
        
    });
    }


                      function getRow(authorID) {
                        return new Promise((resolve, reject) => {
                          let db = new sqlite.Database('./database.db', sqlite.OPEN_READONLY);
                          var query = "SELECT * FROM data WHERE discordID = ?";
                        
                          db.serialize(() => {
                            db.get(query, [authorID], function (err, row) {
                              if(err){
                                  reject(`An error occured while fetching data. Please report this. ERROR_2: ${err}`)
                              }
                              if (row == undefined) {
                                reject(`An error occured while fetching data. Please report this. ERROR_1: Row Undefined`)
                              }
                                db.close();
                                resolve(row)
                            });
                          });
                    
                        });
                        }

                        function getUserCount() {
                          return new Promise((resolve, reject) => {
                            let db = new sqlite.Database('./database.db', sqlite.OPEN_READONLY);
                            var query = "SELECT count(1) FROM data";
                          
                            db.serialize(() => {
                              db.get(query, function (err, row) {
                            
                                  db.close();
                                  resolve(row)
                              });
                            });
                      
                          });
                          }

                          function getTable() {
                            return new Promise((resolve, reject) => {
                              let db = new sqlite.Database('./database.db', sqlite.OPEN_READONLY);
                              var query = "SELECT * FROM data";
                            
                              db.serialize(() => {
                                db.all(query, function (err, table) {
                                  if(err){
                                      reject(`An error occured while fetching data. Please report this. ERROR_2: ${err}`)
                                  }
                                    db.close();
                                    resolve(table)
                                });
                              });
                        
                            });
                            }

                        function deleteData(authorID) {
                          return new Promise((resolve, reject) => {
                            let db = new sqlite.Database('./database.db', sqlite.OPEN_READWRITE);
                          
                            db.serialize(() => {
                              db.run("DELETE FROM data WHERE discordID=(?)", authorID, function(err) {
                                if (err) {
                                  reject(`An error occured while deleting data. Please report this. ERROR_15: ${err}`);
                                }
                                db.close();
                                  resolve();
                              });
                            });
                      
                          });
                        }

                    

module.exports = { isInDataBase, getData, changeData, deleteData, getRow, getUserCount, getTable };