document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('#message-tabs li');
    
    tabs.forEach(tab => {
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