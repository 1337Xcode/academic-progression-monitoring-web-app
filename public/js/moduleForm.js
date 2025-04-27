document.addEventListener('DOMContentLoaded', function() {
    const creditValueInput = document.getElementById('creditValue');
    
    if (creditValueInput) {
        creditValueInput.addEventListener('input', function(e) {
            const value = parseInt(this.value);
            if (value < 10 || value > 40) {
                this.setCustomValidity('Credit value must be between 10 and 40.');
            } else if (![10, 20, 30, 40].includes(value)) {
                this.setCustomValidity('Standard credit values are 10, 20, 30, or 40.');
            } else {
                this.setCustomValidity('');
            }
        });
    }
});
