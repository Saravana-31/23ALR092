const { Log } = require('../logging_middleware/logger');

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzYXJhdmFuYXAuMjNhaW1Aa29uZ3UuZWR1IiwiZXhwIjoxNzc5MDg0NDcwLCJpYXQiOjE3NzkwODM1NzAsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI1MzIwMWFkYi1lYTRhLTQ2ZDctOGFiNy04Njc1NjY3NmRjYjEiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJzYXJhdmFuYSBwIiwic3ViIjoiM2EyOTYzMWQtMGU2NS00NDEyLTk1N2QtZDNkYzAzMTZhYTVkIn0sImVtYWlsIjoic2FyYXZhbmFwLjIzYWltQGtvbmd1LmVkdSIsIm5hbWUiOiJzYXJhdmFuYSBwIiwicm9sbE5vIjoiMjNhbHIwOTIiLCJhY2Nlc3NDb2RlIjoiUnlaQmN5IiwiY2xpZW50SUQiOiIzYTI5NjMxZC0wZTY1LTQ0MTItOTU3ZC1kM2RjMDMxNmFhNWQiLCJjbGllbnRTZWNyZXQiOiJSdkpYTkh6ZHR0WUpWQXRIIn0.0c5wiNhFVw-M7mBw0Y1ZwpJ8b-lO8-ZnWkDgCA6KhUc';
const API_BASE_URL = 'http://4.224.186.213/evaluation-service';

async function grabDataFromApi(endpoint) {
    await Log('backend', 'info', 'service', 'Initating fetch for ' + endpoint + ' route');
    
    try {
        const res = await fetch(API_BASE_URL + '/' + endpoint, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + AUTH_TOKEN
            }
        });

        if (!res.ok) {
            await Log('backend', 'error', 'service', 'API rejected request for ' + endpoint + '. Status code: ' + res.status);
            throw new Error('Failed to pull data from ' + endpoint);
        }

        const payload = await res.json();
        await Log('backend', 'info', 'service', 'Successfully retrieved ' + endpoint + ' data');
        return payload;
    } catch (err) {
        await Log('backend', 'fatal', 'service', 'Network crash while accessing ' + endpoint);
        console.error('Whoops, hit a snag fetching ' + endpoint + ':', err.message);
        return null;
    }
}

function calcBestMaintenanceSchedule(vehiclesArr, mechanicHours) {
    const totalItems = vehiclesArr.length;
    const dpTable = Array(totalItems + 1).fill(0).map(() => Array(mechanicHours + 1).fill(0));

    for (let i = 1; i <= totalItems; i++) {
        const currentVehicle = vehiclesArr[i - 1];
        const cost = currentVehicle.Duration;
        const value = currentVehicle.Impact;

        for (let cap = 1; cap <= mechanicHours; cap++) {
            if (cost <= cap) {
                dpTable[i][cap] = Math.max(value + dpTable[i - 1][cap - cost], dpTable[i - 1][cap]);
            } else {
                dpTable[i][cap] = dpTable[i - 1][cap];
            }
        }
    }

    let maxFoundImpact = dpTable[totalItems][mechanicHours];
    let remainingCap = mechanicHours;
    const hitList = [];

    for (let i = totalItems; i > 0 && maxFoundImpact > 0; i--) {
        if (maxFoundImpact !== dpTable[i - 1][remainingCap]) {
            const grabbed = vehiclesArr[i - 1];
            hitList.push(grabbed.TaskID);
            maxFoundImpact -= grabbed.Impact;
            remainingCap -= grabbed.Duration;
        }
    }

    return { maxImpact: dpTable[totalItems][mechanicHours], tasks: hitList };
}

async function runScheduler() {
    await Log('backend', 'info', 'service', 'Scheduler script started up');

    const depotsData = await grabDataFromApi('depots');
    const vehiclesData = await grabDataFromApi('vehicles');

    if (!depotsData || !vehiclesData) {
        await Log('backend', 'error', 'service', 'Missing data, aborting schedule calculation');
        return;
    }

    const depots = depotsData.depots;
    const vehicles = vehiclesData.vehicles;

    await Log('backend', 'info', 'service', 'Crunching numbers for ' + depots.length + ' depots');
    
    for (const depot of depots) {
        const result = calcBestMaintenanceSchedule(vehicles, depot.MechanicHours);
        console.log('\n==================================');
        console.log('Depot ID: ' + depot.ID + ' (Capacity: ' + depot.MechanicHours + ' hrs)');
        console.log('Max Impact Found: ' + result.maxImpact);
        console.log('Scheduled Tasks: ' + result.tasks.length);
        
        await Log('backend', 'info', 'service', 'Finished computing for depot ' + depot.ID);
    }
    
    await Log('backend', 'info', 'service', 'Scheduling calculations all done!');
}

runScheduler();
