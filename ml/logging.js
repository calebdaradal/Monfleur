// Mock log data
const mockLogs = [
    {
        timestamp: '2024-01-15 14:30:25',
        type: 'upload',
        user: 'Alice Smith',
        action: 'Character uploaded',
        details: 'ML-247 uploaded successfully'
    },
    {
        timestamp: '2024-01-15 14:15:10',
        type: 'edit',
        user: 'Moderator',
        action: 'Character approved',
        details: 'ML-246 status changed to approved'
    },
    {
        timestamp: '2024-01-15 13:45:33',
        type: 'edit',
        user: 'Bob Johnson',
        action: 'Profile updated',
        details: 'ML-245 owner information updated'
    },
    {
        timestamp: '2024-01-15 12:20:15',
        type: 'system',
        user: 'System',
        action: 'Database backup',
        details: 'Automated daily backup completed'
    }
];

let filteredLogs = [...mockLogs];

document.addEventListener('DOMContentLoaded', function() {
    renderLogs();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('logTypeFilter').addEventListener('change', filterLogs);
    document.getElementById('logDateFilter').addEventListener('change', filterLogs);
}

function filterLogs() {
    const typeFilter = document.getElementById('logTypeFilter').value;
    const dateFilter = document.getElementById('logDateFilter').value;
    
    filteredLogs = mockLogs.filter(log => {
        const matchesType = typeFilter === 'all' || log.type === typeFilter;
        // For demo purposes, we'll just filter by type
        // In a real app, you'd implement date filtering
        return matchesType;
    });
    
    renderLogs();
}

function renderLogs() {
    const tbody = document.getElementById('logsTableBody');
    
    tbody.innerHTML = filteredLogs.map(log => `
        <tr>
            <td>${log.timestamp}</td>
            <td><span class="log-type ${log.type}">${log.type}</span></td>
            <td>${log.user}</td>
            <td>${log.action}</td>
            <td>${log.details}</td>
        </tr>
    `).join('');
}

function exportLogs() {
    alert('Export functionality would be implemented here');
}