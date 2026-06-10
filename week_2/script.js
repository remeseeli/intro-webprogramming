/* Here the submit is done via a button instead of the form's default submit method
Because codegrade would probably f it up...
Tremendous help for this code was found from:
https://www.w3schools.com/html/html_forms.asp
and
https://www.w3schools.com/js/js_htmldom_eventlistener.asp
and
// From https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications#example_using_object_urls_to_display_images
..and rest from chatting with Google Gemini (mostly image upload part)
*/

// Select button that acts to submit data
const submitButton = document.querySelector("#submit-data");
submitButton.addEventListener("click", addRow);
// Select clear button to clear table
const clearButton = document.querySelector("#clear-button");
clearButton.addEventListener("click", clearTable);
// Task 5: Image upload support
const fileSelect = document.getElementById("fileSelect");
const imgInput = document.getElementById("input-file");
fileSelect.addEventListener("click", (e) => {
    e.preventDefault(); // prevent navigation to "#"
    if (imgInput) {
        imgInput.click();
    }
});
imgInput.addEventListener("change", handleFiles);

function addRow(e) {
    // prevents refresh
    e.preventDefault();
    // Select table from HTML
    const table = document.querySelector("#table-body");
    // Select username, email and admin status from input field
    const username = document.getElementById("input-username").value;
    const email = document.getElementById("input-email").value;
    const admin = document.getElementById("input-admin").checked;
    // "X" if admin is checked, "-" if not
    const adminStatus = admin ? "X" : "-";
    // Handle image on submission
    const file = imgInput.files[0];
    let imgElement = null;
    // If file was uploaded, create new img element, and update with image
    if(file) {
        imgElement = document.createElement("img");
        imgElement.src = URL.createObjectURL(file);
        imgElement.height = 64;
        imgElement.width = 64;
    }
    /* Task 4: If username exists, edit existing table data
    Help for the loop from:
    https://www.geeksforgeeks.org/javascript/javascript-loop-through-table-cells-using-js/ 
    and Google Gemini AI
    */ 
    for (let i = 0; i < table.rows.length; i++) { 
        // Loop through rows
        let row = table.rows[i];
        if (row.cells[0].innerHTML === username) {
            row.cells[1].innerHTML = email;
            row.cells[2].innerHTML = adminStatus;
            // Update image ONLY if a new one was uploaded
            if (imgElement) {
                row.cells[3].innerHTML = ""; // Clear out the old image
                row.cells[3].appendChild(imgElement); // Append the new one
            }
            // Exit function, data is updated
            return;
        }
    }
    // Create a new row to append data to
    const newRow = document.createElement("tr");
    // Create data cells
    const newEmailCell = document.createElement("td");
    const newUnamCell = document.createElement("td");
    const newAdminCell = document.createElement("td");
    const newImageCell = document.createElement("td");
    // Set new cell's data
    newUnamCell.innerHTML = username;
    newEmailCell.innerHTML = email;
    newAdminCell.innerHTML = adminStatus;
    // If image was found, attach it to cell
    if (imgElement) {
        newImageCell.appendChild(imgElement);
    }
    
    // Append data cells to row
    newRow.append(newUnamCell);
    newRow.append(newEmailCell);
    newRow.append(newAdminCell);
    newRow.append(newImageCell);
    // Append row to table
    table.append(newRow);
}

function clearTable(e) {
    e.preventDefault();
    const table = document.querySelector("#table-body");
    // Set table contents (excluding header) to empty string
    table.innerHTML = "";

}