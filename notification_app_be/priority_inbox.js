const { Log } = require('../logging_middleware/logger');

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzYXJhdmFuYXAuMjNhaW1Aa29uZ3UuZWR1IiwiZXhwIjoxNzc5MDg0NDcwLCJpYXQiOjE3NzkwODM1NzAsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI1MzIwMWFkYi1lYTRhLTQ2ZDctOGFiNy04Njc1NjY3NmRjYjEiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJzYXJhdmFuYSBwIiwic3ViIjoiM2EyOTYzMWQtMGU2NS00NDEyLTk1N2QtZDNkYzAzMTZhYTVkIn0sImVtYWlsIjoic2FyYXZhbmFwLjIzYWltQGtvbmd1LmVkdSIsIm5hbWUiOiJzYXJhdmFuYSBwIiwicm9sbE5vIjoiMjNhbHIwOTIiLCJhY2Nlc3NDb2RlIjoiUnlaQmN5IiwiY2xpZW50SUQiOiIzYTI5NjMxZC0wZTY1LTQ0MTItOTU3ZC1kM2RjMDMxNmFhNWQiLCJjbGllbnRTZWNyZXQiOiJSdkpYTkh6ZHR0WUpWQXRIIn0.0c5wiNhFVw-M7mBw0Y1ZwpJ8b-lO8-ZnWkDgCA6KhUc';
const API_URL = 'http://4.224.186.213/evaluation-service/notifications';

// Weights defined in the instructions
const TYPE_WEIGHTS = {
    'Placement': 3,
    'Result': 2,
    'Event': 1
};

async function fetchNotifications() {
    await Log('backend', 'info', 'service', 'Pulling notifications from server');
    try {
        const res = await fetch(API_URL, {
            headers: { 'Authorization': 'Bearer ' + AUTH_TOKEN }
        });
        
        if (!res.ok) {
            await Log('backend', 'error', 'service', 'Status code ' + res.status + ' returned from notifications API');
            throw new Error('API fetch failed');
        }
        
        const data = await res.json();
        await Log('backend', 'info', 'service', 'Fetched ' + data.notifications.length + ' raw notifications');
        return data.notifications;
    } catch (e) {
        await Log('backend', 'fatal', 'service', 'Could not retrieve notifications data: ' + e.message);
        return [];
    }
}

function processPriorityInbox(notifications, topN) {
    const processed = notifications.map(notif => {
        const weightScore = TYPE_WEIGHTS[notif.Type] || 0;
        // Convert timestamp to time value for recency sorting
        const timeScore = new Date(notif.Timestamp).getTime();
        
        return {
            ...notif,
            weightScore,
            timeScore
        };
    });

    // Sort by weight first, then by time to break ties
    processed.sort((a, b) => {
        if (b.weightScore !== a.weightScore) {
            return b.weightScore - a.weightScore; // Higher weight comes first
        }
        return b.timeScore - a.timeScore; // More recent comes first
    });

    // Return only the top N requested
    return processed.slice(0, topN);
}

async function main() {
    await Log('backend', 'info', 'service', 'Priority Inbox engine started');
    const rawData = await fetchNotifications();
    
    if (rawData.length === 0) {
        console.log('No notifications found.');
        return;
    }

    const priorityList = processPriorityInbox(rawData, 10);
    
    console.log('\n===== YOUR TOP 10 PRIORITY INBOX =====');
    priorityList.forEach((n, index) => {
        console.log('[' + (index + 1) + '] ' + n.Type.toUpperCase() + ' - ' + n.Message + ' (' + n.Timestamp + ')');
    });
    
    await Log('backend', 'info', 'service', 'Successfully rendered top 10 inbox');
}

main();
