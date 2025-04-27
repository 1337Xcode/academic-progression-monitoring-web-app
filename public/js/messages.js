// This script handles the tab switching functionality for the messages page.
document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('#message-tabs li');
    
    tabs.forEach(tab => { // for each tab, add a click event listener
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            const tabContentId = `${tab.dataset.tab}-tab`;
            document.getElementById(tabContentId).style.display = 'block';
        });
    });
});