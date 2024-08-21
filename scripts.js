// Initialize EmailJS
emailjs.init("X3pvE6awcR4Xy1c0F");

// Function to parse date
function parseDate(dateString) {
    if (!dateString) {
        console.error("Date string is undefined or null:", dateString);
        return null;
    }

    // Check if the dateString is already in ISO 8601 format
    if (dateString.includes("T")) {
        const date = new Date(dateString);
        if (isNaN(date)) {
            console.error("Invalid date format:", dateString);
            return null;
        }
        return date;
    }

    // Adjust parsing based on expected format if not ISO
    const [datePart, timePart] = dateString.split(", ");
    if (!datePart || !timePart) {
        console.error("Date or time part is missing:", dateString);
        return null;
    }

    // Date format: DD/MM/YYYY
    const [day, month, year] = datePart.split("/");
    if (!day || !month || !year) {
        console.error("Date parts are incomplete:", datePart);
        return null;
    }

    return new Date(`${year}-${month}-${day}T${timePart}`);
}


// Load initial data
document.addEventListener("DOMContentLoaded", () => {
    const initialData = document.getElementById("initial-data").textContent;
    const alerts = JSON.parse(initialData);
    loadAlerts(alerts);
});

// Function to load alerts into the DOM
function loadAlerts(alerts) {
    const alertList = document.getElementById("alert-list");
    alertList.innerHTML = ''; // Clear existing alerts

    alerts.forEach(alert => {
        const parsedDate = parseDate(alert.date);
        if (!parsedDate) return; // Skip if date parsing fails

        const alertCard = document.createElement("div");
        alertCard.className = `alert-card ${alert.status}`;
        
        alertCard.innerHTML = `
            <i class="fas ${getIcon(alert.importance)}"></i>
            <div class="alert-message">${alert.message}</div>
            <div class="alert-description">${alert.description}</div>
            <div class="alert-date">Date: ${parsedDate.toLocaleString()}</div>
            <div class="alert-status">Status: ${capitalize(alert.status)}</div>
        `;
        
        alertList.appendChild(alertCard);
    });

    updatePagination();
}

// Helper function to capitalize the first letter of a string
function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// Get icon based on importance
function getIcon(importance) {
    switch (importance) {
        case "high":
            return "fa-exclamation-circle";
        case "medium":
            return "fa-info-circle";
        case "low":
            return "fa-check-circle";
        default:
            return "fa-circle";
    }
}

// Handle form submission
document.getElementById("alert-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const alertData = {
        message: formData.get("alert-message"),
        description: formData.get("alert-description"),
        importance: formData.get("alert-importance"),
        status: formData.get("alert-status"),
        name: formData.get("user-name"),
        email: formData.get("user-email"),
        phone: formData.get("user-phone"),
        date: new Date().toISOString() // Add the current date/time
    };

    // Send email using EmailJS
    emailjs.send("service_ep8c6h4", "template_8bjemjg", alertData)
        .then(response => {
            Swal.fire({
                icon: 'success',
                title: 'Alert Submitted',
                text: 'Your alert has been successfully submitted!',
            });
            loadAlerts([...getAlertsFromDOM(), alertData]); // Add the new alert to the list
            document.getElementById("alert-form").reset(); // Reset the form
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Submission Error',
                text: 'There was an error submitting your alert. Please try again.',
            });
            console.error("EmailJS Error:", error);
        });
});

// Get alerts from the DOM
function getAlertsFromDOM() {
    const alerts = [];
    document.querySelectorAll(".alert-card").forEach(card => {
        const dateText = card.querySelector(".alert-date").textContent.replace('Date: ', '');
        const date = parseDate(dateText);

        // Check if the date is valid
        if (!date) {
            console.error('Invalid date value:', dateText);
            return; // Skip this alert if the date is invalid
        }

        const alert = {
            message: card.querySelector(".alert-message").textContent,
            description: card.querySelector(".alert-description").textContent,
            date: date.toISOString(),
            importance: card.classList.contains('high') ? 'high' :
                        card.classList.contains('medium') ? 'medium' :
                        'low',
            status: card.classList.contains('new') ? 'new' :
                    card.classList.contains('in-progress') ? 'in-progress' :
                    'resolved'
        };
        alerts.push(alert);
    });
    return alerts;
}

// Handle pagination
let currentPage = 1;
const alertsPerPage = 3;

function updatePagination() {
    const alertCards = document.querySelectorAll(".alert-card");
    const totalPages = Math.ceil(alertCards.length / alertsPerPage);

    const prevButton = document.getElementById("prev-btn");
    const nextButton = document.getElementById("next-btn");
    const pageInfo = document.getElementById("page-info");

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;

    alertCards.forEach((card, index) => {
        card.style.display = (index >= (currentPage - 1) * alertsPerPage && index < currentPage * alertsPerPage) ? 'block' : 'none';
    });
}

document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        updatePagination();
    }
});

document.getElementById("next-btn").addEventListener("click", () => {
    const totalPages = Math.ceil(document.querySelectorAll(".alert-card").length / alertsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
    }
});

// Handle search and filter
document.getElementById("search-input").addEventListener("input", updateAlerts);
document.getElementById("date-filter").addEventListener("change", updateAlerts);

function updateAlerts() {
    const searchQuery = document.getElementById("search-input").value.toLowerCase();
    const selectedDate = document.getElementById("date-filter").value;
    
    const alertCards = document.querySelectorAll(".alert-card");

    alertCards.forEach(card => {
        const message = card.querySelector(".alert-message").textContent.toLowerCase();
        const date = card.querySelector(".alert-date").textContent.replace('Date: ', '');
        const isDateMatch = !selectedDate || date.startsWith(selectedDate);
        const isSearchMatch = !searchQuery || message.includes(searchQuery);

        card.style.display = isDateMatch && isSearchMatch ? 'block' : 'none';
    });

    updatePagination();
}

// Handle export
document.getElementById("export-btn").addEventListener("click", () => {
    const alertCards = document.querySelectorAll(".alert-card");
    const alerts = Array.from(alertCards).map(card => {
        return {
            message: card.querySelector(".alert-message").textContent,
            description: card.querySelector(".alert-description").textContent,
            date: card.querySelector(".alert-date").textContent.replace('Date: ', ''),
            importance: card.classList.contains('high') ? 'high' :
                        card.classList.contains('medium') ? 'medium' :
                        'low',
            status: card.classList.contains('new') ? 'new' :
                    card.classList.contains('in-progress') ? 'in-progress' :
                    'resolved'
        };
    });

    const csv = Papa.unparse(alerts);
    const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'alerts.csv');
    link.click();
});
