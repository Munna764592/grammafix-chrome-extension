document.getElementById('checkGrammar').addEventListener('click', async () => {
    const text = document.getElementById('textInput').value;

    if (text) {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBm91vHhnByN054IfDGKslmkk445TgXG_8', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'AIzaSyBm91vHhnByN054IfDGKslmkk445TgXG_8'
            },
            body: JSON.stringify({ text })
        });

        const data = await response.json();
        displayResults(data);
    }
});

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (data.errors && data.errors.length > 0) {
        data.errors.forEach(error => {
            const errorElement = document.createElement('p');
            errorElement.textContent = `${error.message} at position ${error.position}`;
            resultsDiv.appendChild(errorElement);
        });
    } else {
        resultsDiv.textContent = 'No grammar errors found!';
    }
}
