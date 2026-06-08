/** 
Function that changes the h1 text to "moi maailma"
*/
function modifyText() {
    const helloWorldText = document.getElementById("helloWorldh1");
    console.log("hello world");
    helloWorldText.innerHTML = "Moi maailma";
}
/**
 * Function that adds an li element to the HTML ul element with text from textarea
 * help researched at: https://www.w3schools.com/js/js_htmldom_nodes.asp
 */
function addListElement() {
    const element = document.getElementById("my-list");
    const newListItem = document.createElement("li");
    const textArea = document.getElementById("input");
    const text = textArea.value;
    newListItem.innerHTML = text;
    element.append(newListItem);
}