let api_key = ""

let timeoutId;
const converter = new showdown.Converter();

function debounce(func, delay) {
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Function to send text to the grammar API
async function checkGrammar(text, inputElement) {
    if (!text) return;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${api_key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: `Check the grammar of this text and give the issue and suggestion separately with "ERROR" and "SUGGESTION" which only include sentence/word in an array of objects, must analyze the whole text and don't say anything about how to correct it:\n\n${text}` }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const markdownText = data.candidates[0].content.parts[0].text;
            const htmlContent = converter.makeHtml(markdownText);
            const grammafix = document.createElement('div')
            grammafix.classList.add('grammafix-k');
            grammafix.innerHTML = htmlContent;
            grammafix.style.display = 'none'
            inputElement.parentNode.appendChild(grammafix);

            const jsonCode = document.querySelector('.grammafix-k pre code').textContent;

            const grammarIssues = JSON.parse(jsonCode);
            // console.log(markdownText)
            const highlightedText = highlightErrors(text, grammarIssues);
            showGrammarIcon(inputElement, highlightedText);
        } else {
            removeGrammarIcon(inputElement);
        }
    } catch (error) {
        console.error("Error checking grammar:", error);
    }
}

// Function to highlight errors and create suggestion strings
function highlightErrors(inputText, errorData) {
    const suggestionsArray = []; // Array to hold formatted error-suggestion pairs

    errorData.forEach(item => {
        const { ERROR, SUGGESTION } = item;

        if (inputText.includes(ERROR)) {
            const errorWords = ERROR.split(" ");
            const suggestionWords = typeof SUGGESTION === "string" ? SUGGESTION.split(" ") : String(SUGGESTION).split(" ");


            // Highlight only unmatched error words with red underline
            let highlightedError = errorWords.map((word, index) => {
                if (word !== suggestionWords[index]) {
                    return `<span class="highlight-red">${word}</span>`;
                }
                return word;
            }).join(' ');

            // Construct the suggestion text in green
            let formattedSuggestion = suggestionWords.map((word, index) => {
                if (word !== errorWords[index]) {
                    return `<span style="color: black; font-weight:700">${word}</span>`;
                }
                return word;
            }).join(' ');

            // Push formatted strings to the suggestions array
            if (highlightedError !== formattedSuggestion) {
                suggestionsArray.push({ ERROR: highlightedError, SUGGESTION: formattedSuggestion });
            }
        }
    });


    return suggestionsArray;
}

// Function to create and show the grammar error icon
function showGrammarIcon(inputElement, errorData) {
    inputElement.parentNode.style.position = 'relative';
    removeGrammarIcon(inputElement);
    const rect = inputElement.getBoundingClientRect();

    const icon = document.createElement('div');
    icon.innerHTML = `<img src="https://res.cloudinary.com/profilepic/image/upload/v1728069917/icon128_rwkilo.png" alt="Grammafix logo" style="width: 20px; height: 20px;">`;
    icon.title = "Grammafix";
    icon.style.position = 'absolute';
    const iconX = rect.left;
    const iconY = rect.top;

    icon.style.left = `${iconX}px`;
    icon.style.top = `${iconY}px`;
    icon.style.cursor = 'pointer';
    icon.style.zIndex = '9999';
    icon.classList.add('grammar-icon');

    inputElement.parentNode.appendChild(icon);

    // Create the suggestion box
    let suggestionBox = document.createElement('div');
    suggestionBox.classList.add('grammar-suggestions');

    // Create the top div with a logo and close button
    let topDiv = document.createElement('div');
    topDiv.innerHTML = `
    <div class="topdiv">
        <img src="https://res.cloudinary.com/profilepic/image/upload/v1728069917/icon128_rwkilo.png" alt="Grammafix logo" style="width: 20px; height: 20px;">
        <div class="closebutton">✖</div>
    </div>`;
    suggestionBox.appendChild(topDiv);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('contentDiv');
    contentDiv.innerHTML = '<div class="sugge">Suggestions</div>';
    suggestionBox.appendChild(contentDiv);

    // Add formatted suggestions to the suggestion box
    console.log(errorData);
    if (errorData.length === 0) {
        contentDiv.innerHTML = '<div class="sugge">Suggestions</div><div style="color:gray; text-align:center; margin:20px 10px;">No Suggestions</div>'
    }
    const suggestions = errorData;
    suggestions.forEach(({ ERROR, SUGGESTION }) => {
        const divbox = document.createElement('div');
        divbox.classList.add('divbox');
        suggestionBox.appendChild(divbox);

        const suggestionLine = document.createElement('div');
        suggestionLine.innerHTML = ERROR;
        divbox.appendChild(suggestionLine);

        const suggestionLine2 = document.createElement('div');
        suggestionLine2.innerHTML = SUGGESTION;
        divbox.appendChild(suggestionLine2);

        const fixButton = document.createElement('button');
        fixButton.innerHTML = 'Correct';
        fixButton.classList.add('fix-button');

        fixButton.addEventListener('click', () => {
            inputElement.value = inputElement.value.replace(suggestionLine.innerText, suggestionLine2.innerText);

            checkGrammar(inputElement.value, inputElement);
        });

        divbox.appendChild(fixButton);
    });

    // Append the suggestion box to the input field's parent
    inputElement.parentNode.appendChild(suggestionBox);

    let isDragging = false;
    let offsetX, offsetY;

    topDiv.addEventListener('mousedown', (event) => {
        isDragging = true;
        offsetX = event.clientX - suggestionBox.offsetLeft;
        offsetY = event.clientY - suggestionBox.offsetTop;
        topDiv.style.cursor = 'move';
    });

    document.addEventListener('mousemove', (event) => {
        if (isDragging) {
            suggestionBox.style.left = `${event.clientX - offsetX}px`;
            suggestionBox.style.top = `${event.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        topDiv.style.cursor = 'default';
    });


    // Show the suggestion box when the grammar icon is clicked
    icon.addEventListener('click', () => {
        suggestionBox.style.display = 'block';
    });
    const closeButton = document.querySelector('.closebutton')
    closeButton.addEventListener('click', () => {
        suggestionBox.style.display = 'none';
    });
}

// Function to remove the grammar icon (if exists)
function removeGrammarIcon(inputElement) {
    const icon = inputElement.parentNode.querySelector('.grammar-icon');
    if (icon) {
        icon.remove();
    }
    const suggestionBox = inputElement.parentNode.querySelector('.grammar-suggestions')
    if (suggestionBox) {
        suggestionBox.remove();
    }
    const grammafix = inputElement.parentNode.querySelector('.grammafix-k')
    if (grammafix) {
        grammafix.remove();
    }
}

function attachGrammarCheckListeners() {
    const inputs = document.querySelectorAll('textarea, [contenteditable="true"]');

    inputs.forEach(input => {
        let hasCheckedGrammarOnFocus = false;

        const handleInput = debounce(() => {
            const text = input.textContent || input.value;
            checkGrammar(text, input);
        }, 500);

        input.addEventListener('focus', () => {
            if (!hasCheckedGrammarOnFocus) {
                const text = input.textContent || input.value;
                checkGrammar(text, input);
                hasCheckedGrammarOnFocus = true; 
            }

            input.addEventListener('input', handleInput);
        });
    });
}




// Start listening on page load
window.addEventListener('load', attachGrammarCheckListeners);

