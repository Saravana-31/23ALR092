const ALLOWED_STACKS = ['backend', 'frontend'];
const ALLOWED_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
const FRONTEND_PKGS = ['api', 'component', 'hook', 'page', 'state', 'style'];
const BACKEND_PKGS = ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service'];
const SHARED_PKGS = ['auth', 'config', 'middleware', 'utils'];

function validatePackageContext(targetStack, targetPkg) {
    if (SHARED_PKGS.includes(targetPkg)) return true;
    if (targetStack === 'frontend' && FRONTEND_PKGS.includes(targetPkg)) return true;
    if (targetStack === 'backend' && BACKEND_PKGS.includes(targetPkg)) return true;
    return false;
}

async function Log(stack, level, pkg, message) {
    const currentStack = String(stack).toLowerCase();
    const currentLevel = String(level).toLowerCase();
    const currentPkg = String(pkg).toLowerCase();

    if (!ALLOWED_STACKS.includes(currentStack)) {
        console.error('Logging failed: Unrecognized stack environment.');
        return;
    }
    if (!ALLOWED_LEVELS.includes(currentLevel)) {
        console.error('Logging failed: Unrecognized severity level.');
        return;
    }
    if (!validatePackageContext(currentStack, currentPkg)) {
        console.error('Logging failed: Package does not match the stack context.');
        return;
    }

    const logPayload = {
        stack: currentStack,
        level: currentLevel,
        package: currentPkg,
        message: message
    };

    try {
        const res = await fetch('http://4.224.186.213/evaluation-service/logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzYXJhdmFuYXAuMjNhaW1Aa29uZ3UuZWR1IiwiZXhwIjoxNzc5MDgzMzYyLCJpYXQiOjE3NzkwODI0NjIsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI2NTkzYTc0MC0yZGNlLTQ1OTgtOGY3MS0xYjk4NGQ2ZGE1ZTkiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJzYXJhdmFuYSBwIiwic3ViIjoiM2EyOTYzMWQtMGU2NS00NDEyLTk1N2QtZDNkYzAzMTZhYTVkIn0sImVtYWlsIjoic2FyYXZhbmFwLjIzYWltQGtvbmd1LmVkdSIsIm5hbWUiOiJzYXJhdmFuYSBwIiwicm9sbE5vIjoiMjNhbHIwOTIiLCJhY2Nlc3NDb2RlIjoiUnlaQmN5IiwiY2xpZW50SUQiOiIzYTI5NjMxZC0wZTY1LTQ0MTItOTU3ZC1kM2RjMDMxNmFhNWQiLCJjbGllbnRTZWNyZXQiOiJSdkpYTkh6ZHR0WUpWQXRIIn0.UsD3J5I7rW58n9nho3o5L5_4MQlZ8it54tNSLaAsKYY'
            },
            body: JSON.stringify(logPayload)
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Analytics server rejected the log entry. Status:', res.status, 'Response:', errorText);
        }
    } catch (err) {
        console.error('Could not reach the logging service.', err.message);
    }
}

module.exports = { Log };
