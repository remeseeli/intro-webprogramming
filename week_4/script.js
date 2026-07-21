document.getElementById("submit-data").addEventListener("click", async function(event) {
    // Prevent the form from refreshing the page
    event.preventDefault();

    const query = document.getElementById("input-show").value;
    const container = document.querySelector(".show-container");

    // Clear previous search results before new ones
    container.innerHTML = "";

    const url = "https://api.tvmaze.com/search/shows?q=" + query;

    try {
        const response = await fetch(url);
        const data = await response.json();
        // Loop through the API response array
        data.forEach(item => {
            const show = item.show;

            // Create the main wrapper div
            const showData = document.createElement("div");
            showData.className = "show-data";

            // Create and append the image element
            const img = document.createElement("img");
            // Check if the show has an image before setting the src attribute
            if (show.image && show.image.medium) {
                img.src = show.image.medium;
            }
            // Create the info container
            const showInfo = document.createElement("div");
            showInfo.className = "show-info";
            // Create and append the title
            const title = document.createElement("h1");
            title.innerText = show.name;
            showInfo.appendChild(title);
            // Append the summary (comes already with <p> tags)
            if (show.summary) {
                showInfo.innerHTML += show.summary;
            }
            // Append the image and info container to the main wrapper
            showData.appendChild(img);
            showData.appendChild(showInfo);

            // Append the complete showData element to the DOM container
            container.appendChild(showData);
        });

    } catch (error) {
        console.error("Error fetching data:", error);
    }
});