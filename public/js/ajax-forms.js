// Code was taken from a github repository and modified to fit the needs of the project

$(document).ready(function() {
    // Handle delete actions
    $('.delete-item').on('click', function() {
        const itemId = $(this).data('id');
        const url = $(this).data('url');
        console.log(`Deleting item with ID: ${itemId} from URL: ${url}`);
        $.ajax({
            url: url,
            type: 'POST',
            data: { id: itemId },
            success: function(response) {
                console.log('Delete successful:', response);
                location.reload();
            },
            error: function(xhr, status, error) {
                console.error('Error deleting item:', error);
                alert('Error deleting item');
            }
        });
    });

    // Handle update actions
    $('.update-form').on('submit', function(event) {
        event.preventDefault();
        const formData = $(this).serialize();
        const url = $(this).attr('action');
        console.log(`Updating item with data: ${formData} to URL: ${url}`);
        $.ajax({
            url: url,
            type: 'POST',
            data: formData,
            success: function(response) {
                console.log('Update successful:', response);
                location.reload();
            },
            error: function(xhr, status, error) {
                console.error('Error updating item:', error);
                alert('Error updating item');
            }
        });
    });

    // Handle file input change
    document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', function() {
            const fileName = this.nextElementSibling.querySelector('.file-name');
            fileName.textContent = this.files[0].name;
        });
    });
});
