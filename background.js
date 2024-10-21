chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "checkGrammar",
        title: "Check Grammar",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId === "checkGrammar" && info.selectionText) {
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBm91vHhnByN054IfDGKslmkk445TgXG_8', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: `Check the grammar of every sentence or word in the following text:\n\n${info.selectionText}` }
                            ]
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log(data);


        } catch (error) {
            console.error("Error checking grammar:", error);

        }
    }
});
