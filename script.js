document.addEventListener('DOMContentLoaded', function() {

    // --- Intersection Observer Setup for Scroll Reveal ---
    let revealObserver; // Declare observer variable for scroll animations

    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                // When element becomes intersecting (visible)
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible'); // Add class to trigger animation
                    observer.unobserve(entry.target); // Stop observing once revealed
                }
            });
        }, {
            root: null, // Observe intersections relative to the viewport
            threshold: 0.15, // Trigger when 15% of the element is visible
            rootMargin: '0px 0px -50px 0px' // Trigger animation slightly before it's fully in view
        });

        // Find all elements with the 'reveal' class that are present on page load
        const initialRevealElements = document.querySelectorAll('.reveal');
        initialRevealElements.forEach(element => {
            // Start observing each initial element
            revealObserver.observe(element);
        });

    } else {
        // Fallback for very old browsers that don't support IntersectionObserver
        console.log("Intersection Observer not supported. Showing all 'reveal' elements immediately.");
        const allRevealElements = document.querySelectorAll('.reveal');
        allRevealElements.forEach(element => {
            element.classList.add('visible'); // Make them visible directly
        });
    }

    // --- "Read More" Functionality ---

    /**
     * Checks project description containers, adds truncation and 'Read More' button if needed.
     */
    function setupReadMore() {
        // Select all description wrapper divs
        const descriptionContainers = document.querySelectorAll('.project-description');

        descriptionContainers.forEach(descContainer => {
            const paragraph = descContainer.querySelector('p'); // Find the first paragraph inside
            const footer = descContainer.nextElementSibling; // Get the next sibling (should be the footer)

            // Basic checks to ensure elements exist
            if (!paragraph || !footer || !footer.classList.contains('project-footer')) {
                // console.warn('Skipping Read More setup for card - missing paragraph or footer.', descContainer.closest('.project-card'));
                return; // Skip if structure isn't right
            }

            // Temporarily remove truncation to measure full height accurately
            descContainer.classList.remove('truncated');
            const fullHeight = paragraph.scrollHeight;
            const visibleHeight = paragraph.clientHeight; // Height when constrained by CSS (or not)

            // Add truncation class back to check against CSS max-height
            descContainer.classList.add('truncated');
            const truncatedHeight = descContainer.clientHeight; // Get height *with* max-height style applied

            // Check if the full content height is greater than the height allowed by CSS truncation
            const needsReadMore = fullHeight > truncatedHeight + 5; // Add a small buffer (e.g., 5px)

            // Ensure no existing button before adding a new one
            const existingButton = footer.querySelector('.read-more-btn');
            if (existingButton) {
                 existingButton.remove(); // Remove if recalculating
            }

            if (needsReadMore) {
                // Create the "Read More" button
                const readMoreBtn = document.createElement('button');
                readMoreBtn.classList.add('read-more-btn');
                readMoreBtn.textContent = 'Read More';
                readMoreBtn.style.display = 'inline-block'; // Make it visible (CSS hides by default)

                // Append the button to the footer
                footer.appendChild(readMoreBtn);

                // Add the click event listener
                readMoreBtn.addEventListener('click', function() {
                    const container = this.closest('.project-card').querySelector('.project-description');
                    container.classList.toggle('truncated'); // Toggle the class

                    // Update button text
                    if (container.classList.contains('truncated')) {
                        this.textContent = 'Read More';
                    } else {
                        this.textContent = 'Read Less';
                        // Optional: Scroll the card into view slightly if it expands a lot
                        // container.closest('.project-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });

            } else {
                // If it doesn't need a button, ensure truncated class is removed
                 descContainer.classList.remove('truncated');
            }
        });
    }

    // Call setupReadMore initially to process cards already in the HTML
    setupReadMore();


    // --- GitHub Repository Fetch Logic ---
    const githubUsername = 'MHamdyK';
    const repoListElement = document.getElementById('github-projects');
    const loadingElement = document.getElementById('github-projects-loading');
    const apiUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=6`; // Fetch latest 6 repos

    fetch(apiUrl)
        .then(response => {
            // Check if the request was successful
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // Parse the JSON response
        })
        .then(repos => {
            // Hide the loading message
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            // Filter out a specific repository if needed (e.g., one already highlighted)
            const highlightedRepoName = "Neural-Machine-Translation-Eng-Arb";
            const reposToDisplay = repos.filter(repo => repo.name !== highlightedRepoName);

            // Check if there are any repositories left to display
            if (reposToDisplay.length === 0) {
                if (repoListElement) {
                    repoListElement.innerHTML = '<p>No other public repositories found.</p>';
                }
                return; // Exit if no repos to show
            }

            const fetchedRepoCards = []; // Array to hold newly created card elements

            // Loop through the repositories to display
            reposToDisplay.forEach(repo => {
                // Create the main card div
                const card = document.createElement('div');
                card.classList.add('project-card', 'reveal'); // Add base and reveal classes

                // Create and append the title (h4)
                const title = document.createElement('h4');
                title.textContent = repo.name.replace(/[-_]/g, ' '); // Format name
                card.appendChild(title);

                // Create the description wrapper div
                const descriptionContainer = document.createElement('div');
                descriptionContainer.classList.add('project-description');

                // Create and append the paragraph (p) inside the wrapper
                const description = document.createElement('p');
                description.textContent = repo.description || 'No description provided.'; // Use repo description or fallback text
                descriptionContainer.appendChild(description);
                card.appendChild(descriptionContainer); // Append wrapper to card

                // Create the footer div
                const footer = document.createElement('div');
                footer.classList.add('project-footer');

                // Create and append the GitHub link (a) inside the footer
                const link = document.createElement('a');
                link.href = repo.html_url;
                link.textContent = 'View on GitHub';
                link.target = '_blank'; // Open in new tab
                link.rel = 'noopener noreferrer';
                link.classList.add('repo-link');
                footer.appendChild(link);
                card.appendChild(footer); // Append footer to card

                // Append the fully constructed card to the list element in the HTML
                if (repoListElement) {
                    repoListElement.appendChild(card);
                }

                // Add the new card element to our array for later processing
                fetchedRepoCards.push(card);
            });

            // --- Process newly added GitHub repo cards ---

            // 1. Make the IntersectionObserver watch these new cards for scroll reveal
            if (revealObserver) { // Check if observer exists (i.e., supported)
                fetchedRepoCards.forEach(card => {
                    revealObserver.observe(card);
                });
            } else {
                 // If observer isn't supported, ensure they are visible anyway
                 fetchedRepoCards.forEach(card => card.classList.add('visible'));
            }


            // 2. Run the "Read More" setup again to check these new cards for truncation
            // Use a small delay to ensure styles are applied after appending
            setTimeout(setupReadMore, 100);


        })
        .catch(error => {
            // Handle errors during the fetch process
            console.error('Error fetching GitHub repositories:', error);
            if (loadingElement) {
                loadingElement.textContent = 'Failed to load repositories from GitHub.';
                loadingElement.style.color = '#ff6b6b'; // Error indication color
            }
        });

}); // End of DOMContentLoaded listener