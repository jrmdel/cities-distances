const express = require('express');
const router = express.Router();
const stations = require('../services/stations');
const journeys = require('../services/journeys');
const lines = require('../services/lines');
const fs = require('fs');
const db = require('../connectors/db');
const utils = require('../utils/utils')

router.get('/', (req,res)=>{
    res.json({"msg": "Hello World"})
})

router.get('/stations', async (req,res)=>{
    try {
        let pagination = await stations.getPagination();
        let end = Math.ceil(pagination.total_result/pagination.items_per_page)-1;
        let data = null;
        let arr = [];
        for(let i=0; i<=end; i++){
            if(i%10==0) console.log(`i = ${i}, arr = ${arr.length}`)
            data = await stations.getDataFrom(i);
            arr = arr.concat(data.data.stop_areas.map(item=>{
                let { timezone, codes, ...rest } = item;
                return { ...rest }
            }))
        }
        fs.writeFileSync('./data/stations.json', JSON.stringify(arr,null,2));
        res.json({"msg":"File saved", "pagination": pagination, "items":arr.length });
    } catch (error) {
        res.json({"msg":"An error occured", "error":error})
    }
})

router.get('/stations/:id', async (req,res)=>{
    try {
        let data = await stations.getDataFrom(req.params.id);
        res.json(data.data);
    } catch (error) {
        res.json({"msg":"An error occured", "error":error})
    }
})

router.post('/stations', async (req,res)=>{
    let driver = db.getDb();
    let session = driver.session();
    let raw = fs.readFileSync('./data/stations.json');
    let data = JSON.parse(raw);
    // Filter to keep only the unique cities
    let stop_points = data.filter(item=>item.name!="" && item.administrative_regions).map(item=>{
        return { "name":item?.name||"", "lat":item?.coord?.lat||"", "lon":item?.coord?.lon||"", "city":item?.administrative_regions[0]?.name||"", "cityLat":item?.administrative_regions[0]?.coord?.lat||"" }
    })
    console.log(`Stop points : ${stop_points.length}`)
    console.log(stop_points[0])
    try {
        for (const stop_point of stop_points) {
            await session.run(
                "MATCH (c:City) WHERE c.name=$city AND c.lat=$cityLat MERGE (s:Station { name: $name, lat: $lat, lon: $lon })-[r:Is_in]->(c)",
                stop_point
            )
        }
        await session.close()
        res.json({ "msg": "Import successful", "Stop points": stop_points.length });
    } catch(error){
        console.error(error);
        res.json({"msg": "Failed"})
    }
})

router.post('/cities', async (req,res)=>{
    let driver = db.getDb();
    let session = driver.session();
    let raw = fs.readFileSync('./data/stations.json');
    let data = JSON.parse(raw);
    // Filter to keep only the unique cities
    let cities = [...new Set(data
    .filter(item=>item.name!="" && item.administrative_regions)
    .map(stop_area=>{
        let { name, zip_code, coord, ...rest } = stop_area.administrative_regions[0];
        return JSON.stringify({ "name":name, "zip_code":zip_code, "lat":coord.lat, "lon":coord.lon })
    }))]
    console.log(`Extracted distinct cities : ${cities.length}`)
    try {
        /*for (const city of cities) {
            await session.run("CREATE (c:City { name: $name, zip_code: $zip_code, lat: $lat, lon: $lon })", JSON.parse(city))
        }
        await session.close()*/
        fs.writeFileSync("./data/cities.json", JSON.stringify([...new Set(cities)].map(item=>JSON.parse(item)), null, 2));
        res.json({ "msg": "Import successful", "cities": cities.length, "example": cities[0] });
    } catch(error){
        console.error(error);
        res.json({"msg": "Failed"})
    }
})

/*
router.get('/journeys/:start/:end', async (req,res)=>{
    try {
        let pagination = await journeys.getPagination();
        //let end = Math.ceil(pagination.total_result/pagination.items_per_page)-1;
        let data = null;
        let arr = [];
        let cpt = 0;
        for(let i=0; i<=req.params.end; i++){
            if(Math.floor(100*i/req.params.end)>cpt) {
                cpt+=1;
                console.log(`${cpt}% ...`)
            }
            data = await journeys.getDataFrom(i);
            arr = arr.concat(data.data.vehicle_journeys.map(item=>{
                let { journey_pattern, disruptions, validity_pattern, codes, ...rest } = item;
                return { ...rest }
            }))
        }
        fs.writeFileSync(`./data/journeys-${req.params.start}-${req.params.end}.json`, JSON.stringify(arr,null,2));
        res.json({"msg":"File saved", "pagination": pagination, "items":arr.length });
    } catch (error) {
        res.json({"error":error})
    }
})
*/

router.post('/journeys', async (req,res)=>{
    try {
        console.time("Init");
        let driver = db.getDb();
        let session = driver.session();
        let data = JSON.parse(fs.readFileSync('./data/lines-998.json'));
        console.timeEnd("Init");
        console.time("Parsing");
        let links = utils.parseJourneys(data);
        console.timeEnd("Parsing");
        console.time("Loop")
        for (let i = 0; i < links.length; i++) {
            try {
                await session.run(
                    "MATCH (a:Station) WHERE a.name=$from MATCH (b:Station) WHERE b.name=$to MERGE (a)-[r:Linked]->(b) ON CREATE SET r.time=$time ON MATCH SET r.time=(r.time + $time - ABS(r.time - $time))/2",
                    links[i]
                );
                if(i%100==0) console.log(`${i}/${links.length}`)
            } catch (error) {
                console.error(`Error occurred at index ${i}`);
            }
        }
        console.timeEnd("Loop");
        res.json({"msg":"Success"})
    } catch (error) {
        res.json({"error":error})
    }
})

/**
 * Get the data related to the lines' ID found in data/lines-id-YYYYMMDD.json
 * Parse it and store it under data/lines-XXX.json where XXX is the number of lines
 */
router.get('/journeys/from/:YYYYMMDD', async (req,res)=>{
    try {
        if(!req.params.YYYYMMDD.match(/^[0-9]{8}$/g)) throw Error("Query should contain a date with format YYYYMMDD eg. 20210822")
        let ids = JSON.parse(fs.readFileSync(`./data/lines-id-${req.params.YYYYMMDD}.json`));
        let result = [];
        for (let i = 0; i < ids.length; i++) {
            try {
                let data = await lines.getVehicleJourneys(ids[i], 0, 1000);
                let vj = data.data.vehicle_journeys;
                let patterns = new Set(vj.filter(item=>!item?.id?.includes(':modified')).map(item=>item?.journey_pattern?.id || null))
                let relevent = Array.from(patterns).filter(i=>i!=null).map(jp=>{
                    let { trip, journey_pattern, stop_times, ...rest} = vj.find(o=>o.journey_pattern.id==jp)
                    return {
                        "trip": trip?.id,
                        "journey_pattern":journey_pattern?.id,
                        "stop_times":stop_times.map(item=>{
                            return {
                                "name":item?.stop_point?.name||"",
                                "lat": item?.stop_point?.coord?.lat||"",
                                "lon": item?.stop_point?.coord?.lon||"",
                                "arrival_time":item?.arrival_time||"",
                                "departure_time":item?.departure_time
                            }
                        })
                    }
                })
                console.log(`${i}/${ids.length} : Adding ${relevent.length} journeys`);
                result = result.concat(relevent);
            } catch (err) {
                console.error(`ID ${ids[i]} at index ${i} failed`)
            }
        }
        res.json({"msg": `Vehicle journeys = ${result.length}`})
        fs.writeFileSync(`./data/lines-${ids.length}.json`, JSON.stringify(result,null,2));
    } catch (error) {
        console.error("Oups : "+error)
        res.status(404).json({"error":error?.message||"An error occured"});
    }
})

/**
 * Create a json file containing all the lines ID currently available
 * The file is created in the folder data under the name 'lines-id-YYYYMMDD.json' where YYYYMMDD is the date when the data has been retrieved
 */
router.get('/lines/all', async (req,res)=>{
    try {
        let filename = `lines-id-${(new Date()).toISOString().split('T')[0].replace("-","").replace("-","")}.json`;
        let data = await lines.getDataFrom(0,1000);
        let arr = [].concat(data?.data?.lines.map(line=>line.id) || []);
        let end = Math.ceil(data.data.pagination.total_result/1000)-1;
        for (let i = 1; i <= end; i++) {
            data = await lines.getDataFrom(i,1000);
            arr = arr.concat(data?.data?.lines.map(line=>line.id) || []);
        }
        console.log(`Number of lines : ${arr.length}`);
        res.json({"msg": `File ${filename} created with size = ${arr.length}` })
        fs.writeFileSync(`./data/${filename}`, JSON.stringify(arr,null,2));
    } catch (error) {
        console.error("Oups : "+error)
        res.json({"error": error?.message || "An error occured"});
    }
})

router.get('/connections/:number', async (req,res)=>{
    try {
        let driver = db.getDb();
        let session = driver.session();
        let cities = JSON.parse(fs.readFileSync("./data/cities.json"));
        cities = cities.map(item=>item.name);
        let result = [];
        let query = `MATCH (a:City {name:$city})-[*..${req.params.number}]-(b:City) RETURN count(DISTINCT b) AS count`
        for(let i=0; i<cities.length; i++){
            try {
                if(i%10==0) console.log(`${i}/${cities.length}`)
                let data = await session.run(
                    query, 
                    {"city":cities[i]}
                )
                result.push({ "city":cities[i], "links":data.records[0].get('count').toNumber() });
            } catch (err) {
                console.error(`Request for ${cities[i]} failed : ${err.message}`)
            }
        }
        await session.close();
        result.sort((a,b)=>b.links-a.links);
        res.json({"msg":"OK", result});
    } catch (error) {
        console.error("Oups : "+error)
        res.json(error)
    }
})

module.exports = router;