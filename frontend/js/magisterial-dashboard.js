// Magisterial Court Dashboard JavaScript

// Check if user is logged in and has magisterial court role
const currentUser = checkAuth();
if (currentUser && currentUser.role !== 'magisterial') {
    // Redirect to appropriate dashboard based on role
    if (currentUser.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else if (currentUser.role === 'circuit') {
        window.location.href = 'circuit-dashboard.html';
    }
}

// Set current user name in the header
document.getElementById('currentUserName').textContent = currentUser ? currentUser.name : 'Magisterial Court';

// Handle logout
document.getElementById('logout').addEventListener('click', logout);

// Handle refresh button
document.getElementById('refresh-btn').addEventListener('click', function() {
    // Get the currently active page
    const activePage = document.querySelector('.page[style*="block"]');
    const activeMenuItem = document.querySelector('.menu-item.active');
    
    if (activePage && activeMenuItem) {
        const pageId = activePage.id;
        
        // Reload data based on current page
        if (pageId === 'dashboard-page') {
            loadDashboardData();
        } else if (pageId === 'staff-management-page') {
            loadAllStaff();
        } else if (pageId === 'active-staff-page') {
            loadStaffByStatus('active');
        } else if (pageId === 'retired-staff-page') {
            loadStaffByStatus('retired');
        } else if (pageId === 'dismissed-staff-page') {
            loadStaffByStatus('dismissed');
        } else if (pageId === 'on-leave-staff-page') {
            loadStaffByStatus('on_leave');
        } else if (pageId === 'settings-page') {
            loadMagisterialSettings();
        }
        
        // Show refresh animation
        const refreshIcon = this.querySelector('i');
        refreshIcon.classList.add('fa-spin');
        setTimeout(() => {
            refreshIcon.classList.remove('fa-spin');
        }, 1000);
    }
});

// Navigation between pages
const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');

menuItems.forEach(item => {
    if (item.id !== 'logout') {
        item.addEventListener('click', function() {
            // Remove active class from all menu items
            menuItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked menu item
            this.classList.add('active');
            
            // Hide all pages
            pages.forEach(page => page.style.display = 'none');
            
            // Show the selected page
            const pageId = this.getAttribute('data-page') + '-page';
            document.getElementById(pageId).style.display = 'block';
            
            // Load data for the selected page
            if (pageId === 'staff-management-page') {
                loadAllStaff();
            } else if (pageId === 'active-staff-page') {
                loadStaffByStatus('active');
            } else if (pageId === 'retired-staff-page') {
                loadStaffByStatus('retired');
            } else if (pageId === 'dismissed-staff-page') {
                loadStaffByStatus('dismissed');
            } else if (pageId === 'settings-page') {
                loadCourtSettings();
            }
        });
    }
});

// Get current magisterial court ID
function getCurrentMagisterialCourtId() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    
    // Find the current user
    const user = users.find(u => u.id === currentUser.id);
    
    if (user) {
        // Find the magisterial court with matching user ID
        for (const circuit of circuitCourts) {
            if (circuit.magisterialCourts) {
                const magisterial = circuit.magisterialCourts.find(m => m.userId === user.id);
                if (magisterial) {
                    return {
                        magisterialId: magisterial.id,
                        circuitId: circuit.id
                    };
                }
            }
        }
    }
    
    return null;
}

// Load dashboard data
function loadDashboardData() {
    const courtInfo = getCurrentMagisterialCourtId();
    
    if (!courtInfo) {
        console.error('Magisterial court not found');
        return;
    }
    
    // Get data from local storage
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    // Filter staff for this magisterial court
    const courtStaff = staffData.filter(staff => 
        staff.courtId === courtInfo.magisterialId && 
        staff.courtType === 'magisterial'
    );
    
    // Total staff count
    document.getElementById('staff-count').textContent = courtStaff.length;
    
    // Count by status
    const activeStaff = courtStaff.filter(staff => staff.employmentStatus === 'active');
    const retiredStaff = courtStaff.filter(staff => staff.employmentStatus === 'retired');
    const dismissedStaff = courtStaff.filter(staff => staff.employmentStatus === 'dismissed');
    
    document.getElementById('active-count').textContent = activeStaff.length;
    document.getElementById('retired-count').textContent = retiredStaff.length;
    document.getElementById('dismissed-count').textContent = dismissedStaff.length;
    
    // Load recent updates
    loadRecentUpdates(courtInfo.magisterialId);
}

// Load recent staff updates
function loadRecentUpdates(courtId) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const recentUpdatesBody = document.getElementById('recent-updates-body');
    
    // Clear existing rows
    recentUpdatesBody.innerHTML = '';
    
    // Filter staff for this magisterial court
    const courtStaff = staffData.filter(staff => 
        staff.courtId === courtId && 
        staff.courtType === 'magisterial'
    );
    
    // Sort by updated date (most recent first)
    const sortedStaff = [...courtStaff].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
        const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
        return dateB - dateA;
    });
    
    // Get only the 5 most recent updates
    const recentStaff = sortedStaff.slice(0, 5);
    
    // Add rows to the table
    recentStaff.forEach(staff => {
        const row = document.createElement('tr');
        
        // Format date
        const updateDate = staff.updatedAt ? new Date(staff.updatedAt) : new Date(staff.createdAt);
        const formattedDate = updateDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        row.innerHTML = `
            <td>${staff.name}</td>
            <td>${staff.position}</td>
            <td><span class="status status-${staff.employmentStatus}">${staff.employmentStatus}</span></td>
            <td>${formattedDate}</td>
        `;
        
        recentUpdatesBody.appendChild(row);
    });
}

// Load all staff for the magisterial court
function loadAllStaff() {
    const courtInfo = getCurrentMagisterialCourtId();
    
    if (!courtInfo) {
        console.error('Magisterial court not found');
        return;
    }
    
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const staffManagementBody = document.getElementById('staff-management-body');
    
    // Clear existing rows
    staffManagementBody.innerHTML = '';
    
    // Filter staff for this magisterial court
    const courtStaff = staffData.filter(staff => 
        staff.courtId === courtInfo.magisterialId && 
        staff.courtType === 'magisterial'
    );
    
    // Sort by name
    const sortedStaff = [...courtStaff].sort((a, b) => a.name.localeCompare(b.name));
    
    // Add rows to the table
    sortedStaff.forEach(staff => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${staff.name}</td>
            <td>${staff.position}</td>
            <td>${staff.contact}</td>
            <td>${staff.education}</td>
            <td><span class="status status-${staff.employmentStatus}">${staff.employmentStatus}</span></td>
            <td class="action-buttons">
                <button class="btn btn-primary edit-staff-btn" data-staff-id="${staff.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-staff-btn" data-staff-id="${staff.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        staffManagementBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-staff-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            openEditStaffModal(staffId);
        });
    });
    
    document.querySelectorAll('.delete-staff-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            if (confirm('Are you sure you want to delete this staff member?')) {
                deleteStaff(staffId);
            }
        });
    });
}

// Load staff by status
function loadStaffByStatus(status) {
    const courtInfo = getCurrentMagisterialCourtId();
    
    if (!courtInfo) {
        console.error('Magisterial court not found');
        return;
    }
    
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const tableBodyId = status.replace('_', '-') + '-staff-body';
    const tableBody = document.getElementById(tableBodyId);
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Filter staff for this magisterial court with the specified status
    const filteredStaff = staffData.filter(staff => 
        staff.courtId === courtInfo.magisterialId && 
        staff.courtType === 'magisterial' && 
        staff.employmentStatus === status
    );
    
    // Sort by creation order (ID)
    const sortedStaff = [...filteredStaff].sort((a, b) => a.id - b.id);
    
    // Add rows to the table
    sortedStaff.forEach(staff => {
        const row = document.createElement('tr');
        
        // Create row content based on status
        let rowContent = `
            <td>${staff.name}</td>
            <td>${staff.position}</td>
            <td>${staff.contact}</td>
            <td>${staff.education}</td>
        `;
        
        // Add additional columns based on status
        if (status === 'retired') {
            rowContent += `<td>${formatDate(staff.retirementDate)}</td>`;
        } else if (status === 'dismissed') {
            rowContent += `<td>${formatDate(staff.dismissalDate)}</td>`;
        } else if (status === 'on_leave') {
            rowContent += `<td>${formatDate(staff.leaveStartDate || staff.updatedAt)}</td>`;
        }
        
        // Add action buttons
        rowContent += `
            <td class="action-buttons">
                <button class="btn btn-primary view-staff-btn" data-staff-id="${staff.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        row.innerHTML = rowContent;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-staff-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            viewStaffDetails(staffId);
        });
    });
}

// View staff details
function viewStaffDetails(staffId) {
    // This would typically open a modal with staff details
    // For now, we'll just open the edit modal
    openEditStaffModal(staffId);
}

// Load court settings
function loadCourtSettings() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const courtUser = users.find(user => user.id === currentUser.id);
    
    if (courtUser) {
        document.getElementById('court-username').value = courtUser.username;
        document.getElementById('court-name').value = courtUser.name;
    }
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Delete staff
function deleteStaff(staffId) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const staffIndex = staffData.findIndex(staff => staff.id === staffId);
    
    if (staffIndex !== -1) {
        staffData.splice(staffIndex, 1);
        localStorage.setItem('staffData', JSON.stringify(staffData));
        
        // Reload staff list
        loadAllStaff();
        
        // Reload dashboard data
        loadDashboardData();
        
        alert('Staff member deleted successfully');
    }
}

// Add Staff Modal
const addStaffModal = document.getElementById('add-staff-modal');
const addStaffBtn = document.getElementById('add-staff-btn');
const closeStaffModalBtns = document.querySelectorAll('.close');

// Edit Staff Modal
const editStaffModal = document.getElementById('edit-staff-modal');

// Open add staff modal
addStaffBtn.addEventListener('click', function() {
    // Show modal
    addStaffModal.style.display = 'block';
});

// Close modals
closeStaffModalBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        addStaffModal.style.display = 'none';
        editStaffModal.style.display = 'none';
    });
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === addStaffModal) {
        addStaffModal.style.display = 'none';
    } else if (event.target === editStaffModal) {
        editStaffModal.style.display = 'none';
    }
});

// Handle status change to show/hide date field
document.getElementById('staff-status').addEventListener('change', function() {
    const status = this.value;
    const dateContainer = document.getElementById('status-date-container');
    const dateLabel = document.getElementById('status-date-label');
    
    if (status === 'retired') {
        dateLabel.textContent = 'Retirement Date';
        dateContainer.style.display = 'block';
    } else if (status === 'dismissed') {
        dateLabel.textContent = 'Dismissal Date';
        dateContainer.style.display = 'block';
    } else {
        dateContainer.style.display = 'none';
    }
});

document.getElementById('edit-staff-status').addEventListener('change', function() {
    const status = this.value;
    const dateContainer = document.getElementById('edit-status-date-container');
    const dateLabel = document.getElementById('edit-status-date-label');
    
    if (status === 'retired') {
        dateLabel.textContent = 'Retirement Date';
        dateContainer.style.display = 'block';
    } else if (status === 'dismissed') {
        dateLabel.textContent = 'Dismissal Date';
        dateContainer.style.display = 'block';
    } else {
        dateContainer.style.display = 'none';
    }
});

// Handle add staff form submission
document.getElementById('add-staff-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const courtInfo = getCurrentMagisterialCourtId();
    
    if (!courtInfo) {
        alert('Magisterial court not found');
        return;
    }
    
    const name = document.getElementById('staff-name').value;
    const position = document.getElementById('staff-position').value;
    const contact = document.getElementById('staff-contact').value;
    const education = document.getElementById('staff-education').value;
    const status = document.getElementById('staff-status').value;
    
    // Get date if status is retired or dismissed
    let statusDate = null;
    if (status === 'retired' || status === 'dismissed') {
        statusDate = document.getElementById('status-date').value;
    }
    
    // Create staff data object
    const staffData = {
        name,
        position,
        courtType: 'magisterial',
        courtId: courtInfo.magisterialId,
        contact,
        education,
        employmentStatus: status
    };
    
    // Add date if provided
    if (statusDate) {
        if (status === 'retired') {
            staffData.retirementDate = statusDate;
        } else if (status === 'dismissed') {
            staffData.dismissalDate = statusDate;
        }
    }
    
    // Add staff member
    const result = addStaffMember(staffData);
    
    if (result.success) {
        alert(result.message);
        addStaffModal.style.display = 'none';
        
        // Reset form
        this.reset();
        
        // Reload staff list
        loadAllStaff();
        
        // Reload dashboard data
        loadDashboardData();
    } else {
        alert(result.message);
    }
});

// Open edit staff modal
function openEditStaffModal(staffId) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const staff = staffData.find(s => s.id === staffId);
    
    if (staff) {
        // Set form values
        document.getElementById('edit-staff-id').value = staff.id;
        document.getElementById('edit-staff-name').value = staff.name;
        document.getElementById('edit-staff-position').value = staff.position;
        document.getElementById('edit-staff-contact').value = staff.contact;
        document.getElementById('edit-staff-education').value = staff.education;
        document.getElementById('edit-staff-status').value = staff.employmentStatus;
        
        // Show/hide date field based on status
        const status = staff.employmentStatus;
        const dateContainer = document.getElementById('edit-status-date-container');
        const dateLabel = document.getElementById('edit-status-date-label');
        const dateField = document.getElementById('edit-status-date');
        
        if (status === 'retired') {
            dateLabel.textContent = 'Retirement Date';
            dateContainer.style.display = 'block';
            dateField.value = staff.retirementDate || '';
        } else if (status === 'dismissed') {
            dateLabel.textContent = 'Dismissal Date';
            dateContainer.style.display = 'block';
            dateField.value = staff.dismissalDate || '';
        } else {
            dateContainer.style.display = 'none';
        }
        
        // Show modal
        editStaffModal.style.display = 'block';
    }
}

// Handle edit staff form submission
document.getElementById('edit-staff-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const staffId = parseInt(document.getElementById('edit-staff-id').value);
    const name = document.getElementById('edit-staff-name').value;
    const position = document.getElementById('edit-staff-position').value;
    const contact = document.getElementById('edit-staff-contact').value;
    const education = document.getElementById('edit-staff-education').value;
    const status = document.getElementById('edit-staff-status').value;
    
    // Get date if status is retired or dismissed
    let statusDate = null;
    if (status === 'retired' || status === 'dismissed') {
        statusDate = document.getElementById('edit-status-date').value;
    }
    
    // Create updated staff data object
    const updatedData = {
        name,
        position,
        contact,
        education,
        employmentStatus: status
    };
    
    // Add date if provided
    if (statusDate) {
        if (status === 'retired') {
            updatedData.retirementDate = statusDate;
        } else if (status === 'dismissed') {
            updatedData.dismissalDate = statusDate;
        }
    }
    
    // Update staff member
    const result = updateStaffMember(staffId, updatedData);
    
    if (result.success) {
        alert(result.message);
        editStaffModal.style.display = 'none';
        
        // Reload staff list
        loadAllStaff();
        
        // Reload dashboard data
        loadDashboardData();
    } else {
        alert(result.message);
    }
});

// Handle settings form submission
document.getElementById('settings-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('court-username').value;
    const name = document.getElementById('court-name').value;
    const password = document.getElementById('court-password').value;
    const confirmPassword = document.getElementById('court-confirm-password').value;
    
    // Validate passwords match if provided
    if (password && password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Update court user
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(user => user.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].username = username;
        users[userIndex].name = name;
        
        if (password) {
            users[userIndex].password = password;
        }
        
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user in session storage
        const currentUserData = JSON.parse(sessionStorage.getItem('currentUser'));
        currentUserData.username = username;
        currentUserData.name = name;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUserData));
        
        // Update display name in header
        document.getElementById('currentUserName').textContent = name;
        
        // Update magisterial court name
        const courtInfo = getCurrentMagisterialCourtId();
        
        if (courtInfo) {
            const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
            const circuitIndex = circuitCourts.findIndex(court => court.id === courtInfo.circuitId);
            
            if (circuitIndex !== -1 && circuitCourts[circuitIndex].magisterialCourts) {
                const magisterialIndex = circuitCourts[circuitIndex].magisterialCourts.findIndex(
                    court => court.id === courtInfo.magisterialId
                );
                
                if (magisterialIndex !== -1) {
                    circuitCourts[circuitIndex].magisterialCourts[magisterialIndex].name = name;
                    localStorage.setItem('circuitCourts', JSON.stringify(circuitCourts));
                }
            }
        }
        
        alert('Settings updated successfully');
    }
});

// Export staff data
function exportStaffData(status) {
    const courtInfo = getCurrentMagisterialCourtId();
    
    if (!courtInfo) {
        console.error('Magisterial court not found');
        return;
    }
    
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    // Filter staff for this magisterial court
    let filteredStaff = staffData.filter(staff => 
        staff.courtId === courtInfo.magisterialId && 
        staff.courtType === 'magisterial'
    );
    
    // Filter by status if provided
    if (status) {
        filteredStaff = filteredStaff.filter(staff => staff.employmentStatus === status);
    }
    
    // Convert to CSV
    let csv = 'Name,Position,Contact,Education,Status\n';
    
    filteredStaff.forEach(staff => {
        csv += `"${staff.name}","${staff.position}","${staff.contact}","${staff.education}","${staff.employmentStatus}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${status || 'all'}_staff.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Print staff data
function printStaffData(status) {
    const courtInfo = getCurrentMagisterialCourtId();
    
    if (!courtInfo) {
        console.error('Magisterial court not found');
        return;
    }
    
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    // Get court name
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    let courtName = 'Magisterial Court';
    
    for (const circuit of circuitCourts) {
        if (circuit.magisterialCourts) {
            const magisterial = circuit.magisterialCourts.find(m => m.id === courtInfo.magisterialId);
            if (magisterial) {
                courtName = magisterial.name;
                break;
            }
        }
    }
    
    // Filter staff for this magisterial court
    let filteredStaff = staffData.filter(staff => 
        staff.courtId === courtInfo.magisterialId && 
        staff.courtType === 'magisterial'
    );
    
    // Filter by status if provided
    if (status) {
        filteredStaff = filteredStaff.filter(staff => staff.employmentStatus === status);
    }
    
    // Create a printable version
    let printContent = `
        <html>
        <head>
            <title>Staff Report - ${status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'} Staff</title>
            <style>
                body { font-family: Arial, sans-serif; }
                h1 { text-align: center; color: #2c3e50; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f8f9fa; color: #2c3e50; }
                .status { padding: 5px 10px; border-radius: 20px; font-size: 14px; }
                .status-active { background-color: #e8f7ef; color: #2ecc71; }
                .status-retired { background-color: #fef5e7; color: #f39c12; }
                .status-dismissed { background-color: #fdedeb; color: #e74c3c; }
                .print-header { display: flex; justify-content: space-between; align-items: center; }
                .print-date { font-size: 14px; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>Judiciary Staff Management System</h1>
                <div class="print-date">Printed on: ${new Date().toLocaleDateString()}</div>
            </div>
            <h2>${courtName} - ${status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'} Staff Report</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Contact</th>
                        <th>Education</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    filteredStaff.forEach(staff => {
        printContent += `
            <tr>
                <td>${staff.name}</td>
                <td>${staff.position}</td>
                <td>${staff.contact}</td>
                <td>${staff.education}</td>
                <td><span class="status status-${staff.employmentStatus}">${staff.employmentStatus}</span></td>
            </tr>
        `;
    });
    
    printContent += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Export format modal variables
let currentExportType = null;
let currentExportData = null;
const exportFormatModal = document.getElementById('export-format-modal');

// Add event listeners for export and print buttons
document.getElementById('export-staff-btn').addEventListener('click', function() {
    showExportFormatModal('all-staff');
});

document.getElementById('export-all-staff-btn').addEventListener('click', function() {
    showExportFormatModal('all-staff');
});

document.getElementById('export-active-staff-btn').addEventListener('click', function() {
    showExportFormatModal('active-staff');
});

document.getElementById('export-retired-staff-btn').addEventListener('click', function() {
    showExportFormatModal('retired-staff');
});

document.getElementById('export-dismissed-staff-btn').addEventListener('click', function() {
    showExportFormatModal('dismissed-staff');
});

document.getElementById('print-staff-btn').addEventListener('click', function() {
    printStaffData();
});

document.getElementById('print-all-staff-btn').addEventListener('click', function() {
    printStaffData();
});

document.getElementById('print-active-staff-btn').addEventListener('click', function() {
    printStaffData('active');
});

document.getElementById('print-retired-staff-btn').addEventListener('click', function() {
    printStaffData('retired');
});

document.getElementById('print-dismissed-staff-btn').addEventListener('click', function() {
    printStaffData('dismissed');
});

// Show export format modal
function showExportFormatModal(exportType) {
    currentExportType = exportType;
    exportFormatModal.style.display = 'block';
}

// Close export format modal
exportFormatModal.addEventListener('click', (e) => {
    if (e.target === exportFormatModal || e.target.classList.contains('close')) {
        exportFormatModal.style.display = 'none';
    }
});

// Handle export format selection
document.querySelectorAll('.export-option-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const format = this.getAttribute('data-format');
        exportFormatModal.style.display = 'none';
        handleExport(currentExportType, format);
    });
});

// Handle different export types and formats
function handleExport(exportType, format) {
    switch(exportType) {
        case 'all-staff':
            exportStaffDataWithFormat(null, format);
            break;
        case 'active-staff':
            exportStaffDataWithFormat('active', format);
            break;
        case 'retired-staff':
            exportStaffDataWithFormat('retired', format);
            break;
        case 'dismissed-staff':
            exportStaffDataWithFormat('dismissed', format);
            break;
    }
}

// Export staff data with format selection
function exportStaffDataWithFormat(status, format) {
    const courtInfo = getCurrentMagisterialCourtId();
    
    if (!courtInfo) {
        console.error('Magisterial court not found');
        return;
    }
    
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    // Filter staff for this magisterial court
    let filteredStaff = staffData.filter(staff => 
        staff.courtId === courtInfo.magisterialId && 
        staff.courtType === 'magisterial'
    );
    
    // Filter by status if provided
    if (status) {
        filteredStaff = filteredStaff.filter(staff => staff.employmentStatus === status);
    }
    
    const fileName = `${status || 'all'}_staff`;
    
    switch(format) {
        case 'excel':
            exportToExcel(filteredStaff, fileName, 'staff');
            break;
        case 'word':
            exportToWord(filteredStaff, fileName, 'staff');
            break;
        case 'pdf':
            exportToPDF(filteredStaff, fileName, 'staff');
            break;
    }
}

// Export to Excel (CSV format)
function exportToExcel(data, fileName, type) {
    let csv = '';
    
    if (type === 'staff') {
        csv = 'Name,Position,Contact,Education,Status\n';
        data.forEach(item => {
            csv += `"${item.name}","${item.position}","${item.contact}","${item.education}","${item.employmentStatus}"\n`;
        });
    }
    
    downloadFile(csv, `${fileName}.csv`, 'text/csv');
}

// Export to Word (HTML format)
function exportToWord(data, fileName, type) {
    let html = `
        <html>
        <head>
            <meta charset="utf-8">
            <title>${fileName}</title>
            <style>
                body { font-family: Arial, sans-serif; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>Staff Report</h1>
            <table>
    `;
    
    if (type === 'staff') {
        html += `
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Contact</th>
                        <th>Education</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.forEach(item => {
            html += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.position}</td>
                        <td>${item.contact}</td>
                        <td>${item.education}</td>
                        <td>${item.employmentStatus}</td>
                    </tr>
            `;
        });
    }
    
    html += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    downloadFile(html, `${fileName}.html`, 'text/html');
}

// Export to PDF (HTML with print instructions)
function exportToPDF(data, fileName, type) {
    let html = `
        <html>
        <head>
            <meta charset="utf-8">
            <title>${fileName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .instructions { background: #f0f8ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                @media print { .instructions { display: none; } }
            </style>
        </head>
        <body>
            <div class="instructions">
                <strong>Instructions:</strong> To save as PDF, press Ctrl+P (or Cmd+P on Mac) and select "Save as PDF" as the destination.
            </div>
            <h1>Staff Report</h1>
            <table>
    `;
    
    if (type === 'staff') {
        html += `
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Contact</th>
                        <th>Education</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.forEach(item => {
            html += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.position}</td>
                        <td>${item.contact}</td>
                        <td>${item.education}</td>
                        <td>${item.employmentStatus}</td>
                    </tr>
            `;
        });
    }
    
    html += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    // Open in new window for PDF generation
    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
}

// Helper function to download files
function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Mobile menu functionality
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobile-overlay');
    
    if (mobileMenuToggle && sidebar && mobileOverlay) {
        // Toggle mobile menu
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('mobile-open');
            mobileOverlay.classList.toggle('active');
        });
        
        // Close menu when clicking overlay
        mobileOverlay.addEventListener('click', function() {
            sidebar.classList.remove('mobile-open');
            mobileOverlay.classList.remove('active');
        });
        
        // Close menu when clicking menu items on mobile
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                if (window.innerWidth <= 767) {
                    sidebar.classList.remove('mobile-open');
                    mobileOverlay.classList.remove('active');
                }
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 767) {
                sidebar.classList.remove('mobile-open');
                mobileOverlay.classList.remove('active');
            }
        });
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard data on page load
    loadDashboardData();
    
    // Initialize mobile menu
    initializeMobileMenu();
});