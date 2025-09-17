function togglePasswordVisibility() {
    var x = document.getElementById("password");
    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }
}

// not working on the page for unknown reason, trying to realize why
// function errorMessage(status) {
//     const p = document.getElementById("error__message");
//     if (success === "0") {
//         p.innerHTML = 'Введены неверные данные. Повторите попытку';
//     }
// }