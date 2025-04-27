// This script handles grade file upload
document.addEventListener('DOMContentLoaded', function() {
    const gradesCsvFileInput = document.getElementById('gradesCsvFile');
    if (gradesCsvFileInput) {
        gradesCsvFileInput.addEventListener('change', function() {
            const fileName = document.getElementById('gradesFileName');
            if(this.files.length > 0) {
                fileName.textContent = this.files[0].name;
            } else {
                fileName.textContent = 'No file selected';
            }
        });
    }

    document.querySelectorAll('.delete-grade-form').forEach(form => {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            const enrollmentId = this.dataset.enrollmentId;
            // Extract the CSRF token from the form's action URL or a hidden input if available
            // Assuming the action URL contains the token like: /admin/grades/delete?_csrf=TOKEN
            const csrfToken = this.action.split('_csrf=')[1]; // Simple extraction, might need adjustment

            try {
                const response = await fetch(this.action, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrfToken // Send CSRF token in headers
                    },
                    body: JSON.stringify({ enrollmentId }) // Stringify content for JSON
                });

                if (response.ok) {
                    const row = document.getElementById(`grade-${enrollmentId}`);
                    if (row) {
                        row.remove();
                    } else {
                         console.warn(`Row with ID grade-${enrollmentId} not found.`);
                    }
                } else {
                    const errorData = await response.json(); // Assuming server sends JSON error
                    console.error('Failed to delete grade:', errorData.message || 'Unknown error');
                    // Optionally display an error message to the user
                    alert(`Failed to delete grade: ${errorData.message || 'Please try again.'}`);
                }
            } catch (error) {
                console.error('Error submitting delete request:', error);
                alert('An error occurred while trying to delete the grade. Please check the console.');
            }
        });
    });
});
