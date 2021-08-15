const neo4j = require('neo4j-driver');
let driver;

function initDb(callback){
    try {
        try {
            driver = neo4j.driver(
                'neo4j://localhost',
                neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD)
            )
        } catch {
            callback(new Error("Driver init failed"));
        }
        // A test to see if the DB instance is active
        var session = driver.session();
        session.run('MATCH (n) RETURN n LIMIT 1')
        .then((res)=>{ 
            if(res) callback(null)
        }).catch(()=>{
            callback(new Error("Db might not be up and running. Check \'$ sudo systemctl status neo4j.service\'"))
        });
    } catch (error) {
        callback(error)
    }
}

function getDb(){
    return driver
}

async function closeDb(){
    await driver.close()
}

module.exports = {
    getDb,
    closeDb,
    initDb
}