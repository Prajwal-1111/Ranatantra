const mammoth = require("mammoth");

mammoth.extractRawText({ path: "public/rulebooks/Rantantra rules and regulations.docx" })
    .then(function (result) {
        var text = result.value;
        const fs = require('fs');
        fs.writeFileSync('extracted_rules.txt', text);
    })
    .catch(function (error) {
        console.error(error);
    });
