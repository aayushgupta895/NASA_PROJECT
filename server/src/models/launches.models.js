const launchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo');
const axios = require('axios')
const launches = new Map();

// let latestFlightNumber = 100;
const DEFAULT_FLIGHT_NUMBER = 100;


// saveLaunch(launch)
// launches.set(launch.serialNumber, launch);

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query'
async function  populateLaunch(){
    console.log('downloading the spaceX data....') 
   const response =  await axios.post(SPACEX_API_URL, {
        query : {},
        options : {
            pagination : false,
            populate :[
                {
                    path : 'rocket',
                    select : {
                        name : 1
                    }
                },
                {
                    path : 'payloads',
                    select :{
                        customers : 1
                    }
                }
            ]
        }
    })
    if(response.status !== 200){
        console.log('Problem while downloading spaceX data')
        throw new Error('Launch Data download failed')
    }
    const launchDocs = response.data.docs
    for(const launchDoc of launchDocs){
        const payloads = launchDoc['payloads']
        const customers = payloads.flatMap((payload) =>{
            return payload['customers']
        })
       const launch = {
        flightNumber : launchDoc['flight_number'],
        mission : launchDoc['name'],
        rocket : launchDoc['rocket']['name'],
        launchDate : launchDoc['date_local'],
        upcoming : launchDoc['upcoming'],
        success  : launchDoc['success'],
        customers,
       }
       console.log(`${launch.flightNumber} ${launch.mission}`)
       await saveLaunch(launch)
    }
}

async function loadLaunchData(){
   const firstLaunch =  await findLaunch({
        flightNumber : 1,
        rocket : 'Falcon 1',
        mission : 'FalconSat',
    })
     if(firstLaunch){
        console.log('launch data already loaded')
     }else {
        populateLaunch()
     }
    
}

async function findLaunch(filter){
    return await launchesDatabase.findOne(filter)
}
async function existsLaunchWithId(launchId){
    return await findLaunch({
        flightNumber : launchId
    });
}



async function getAllLaunches(skip, limit){
    return await launchesDatabase
    .find({}, { '_id': 0, '__v': 0 })
    .sort({flightNumber : 1})
    .skip(skip)
    .limit(limit)
}

async function saveLaunch(launch){
    await launchesDatabase.findOneAndUpdate(
        {
          flightNumber : launch.flightNumber  
        }, launch,{
            upsert : true
        })
}

async function getLatestFlightNumber(launch){
    const planet = await planets.findOne({
        keplerName : launch.target
    })
    if(!planet){
        throw new Error('No matching planet was found')
    }
    const latestLaunch = await launchesDatabase
    .findOne()
    .sort('-flightNumber') //sorting in descending order

    if(!latestLaunch){
        return DEFAULT_FLIGHT_NUMBER;
    }

    return latestLaunch.flightNumber;

}
 
async  function scheduleNewLaunch(launch){
    const newFlightNumber = await getLatestFlightNumber(launch) + 1;
    const newLaunch = Object.assign(launch, {
        success : true,
        upcoming : true,
        customers : ['Zero to Mastery', 'NASA'],
        flightNumber : newFlightNumber, 
    })
    await saveLaunch(newLaunch)
  }
// function addNewLaunch(launch){
//     latestFlightNumber++;
//     launches.set(
//         latestFlightNumber, 
//         Object.assign(launch,{
//         success : true,
//         upcoming : true,
//         customer : ['ISRO', 'NASA'],
//         flightNumber :  latestFlightNumber
//     }));
// }

async function abortLaunchById(launchId){
    const aborted =  await launchesDatabase.updateOne({
        flightNumber : launchId,
    },{
        upcoming : false,
        success : false,
    })

    return aborted.ok === 1 && aborted.nModified === 1;

}


module.exports = {
    loadLaunchData,
    existsLaunchWithId,
    getAllLaunches, 
    scheduleNewLaunch,
    abortLaunchById
};