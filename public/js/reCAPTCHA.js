document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById("login-form");
    
    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();
            // console.log("Form submission intercepted. Initiating reCAPTCHA token generation...");
            grecaptcha.ready(function() {
                grecaptcha.execute('6Le5GeYqAAAAAEZTAg_czNZeKJgqTyi8ReTc1Dha', {action: 'LOGIN'})
                .then(function(token) {
                    // console.log("reCAPTCHA token:", token);
                    document.getElementById('recaptchaResponse').value = token;
                    loginForm.submit();
                })
                .catch(function(error) {
                    console.error("Error generating reCAPTCHA token:", error);
                });
            });
        });
    }
});
