function diffMinutes(start,end){
    let a1 = parseInt(start.slice(0,2));
    let a2 = parseInt(start.slice(2,4));
    let b1 = parseInt(end.slice(0,2));
    let b2 = parseInt(end.slice(2,4));
    let res = 0;
    if(a2>b2){
        res += b2+60-a2;
        a1++;
    } else res += b2-a2;
    if(a1>b1){
        return res += 60*(b1+24-a1);
    } else return res += 60*(b1-a1);
}

function parseJourneys(data){
    let res = [];
    data.forEach(line => {
        line.stop_times.map((stop,index,arr)=>{
            for(let i=index+1; i<arr.length; i++){
                res.push({
                    "from":stop.name,
                    "to":arr[i].name,
                    "time": diffMinutes(stop.departure_time, arr[i].arrival_time)
                })
            }
        })
    });
    return res;
}

module.exports = {
    "diffMinutes": diffMinutes,
    "parseJourneys": parseJourneys
};