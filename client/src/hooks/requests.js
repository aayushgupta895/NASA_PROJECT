const api_url = 'http://localhost:8000'
async function httpGetPlanets() {
    const response = await fetch(`${api_url}/planets`)

    return await response.json();
}

 // Load launches, sort by flight number, and return as JSON.
async function httpGetLaunches() {
   const response = await fetch(`${api_url}/launches`) 
    const fetchedLaunches =  await response.json()
    return fetchedLaunches.sort((a, b) => a.flightNumber - b.flightNumber)
}

async function httpSubmitLaunch(launch) {
    // TODO: Once API is ready.
    // Submit given launch data to launch system.
}

async function httpAbortLaunch(id) {
    // TODO: Once API is ready.
    // Delete launch with given ID.
}

export {
    httpGetPlanets,
    httpGetLaunches,
    httpSubmitLaunch,
    httpAbortLaunch,
};