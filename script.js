document.addEventListener('DOMContentLoaded', function() {

    // --- Intersection Observer Setup for Scroll Reveal ---
    let revealObserver; // Declare observer variable in a scope accessible by fetch

    if ('IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Stop observing the element once it's visible
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null, // Use the viewport
            threshold: 0.15, // Element is 15% visible
            rootMargin: '0px 0px -50px 0px' // Trigger slightly before it enters viewport
        });

        // Observe all elements initially present with the 'reveal' class
        const initialRevealElements = document.querySelectorAll('.reveal');
        initialRevealElements.forEach(element => {
            revealObserver.observe(element);
        });

    } else {
        // Fallback for browsers that don't support IntersectionObserver
        console.log("Intersection Observer not supported. Showing all 'reveal' elements immediately.");
        const allRevealElements = document.querySelectorAll('.reveal');
        allRevealElements.forEach(element => {
            element.classList.add('visible'); // Just make them visible
        });
    }

    // --- GitHub Repository Fetch Logic (runs after observer setup) ---
    const githubUsername = 'MHamdyK';
    const repoListElement = document.getElementById('github-projects');
    const loadingElement = document.getElementById('github-projects-loading');
    const apiUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=6`; // Fetch latest 6 repos

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(repos => {
            loadingElement.style.display = 'none'; // Hide loading message

            const highlightedRepoName = "Neural-Machine-Translation-Eng-Arb";
            const reposToDisplay = repos.filter(repo => repo.name !== highlightedRepoName);

            if (reposToDisplay.length === 0) {
                repoListElement.innerHTML = '<p>No other public repositories found.</p>';
                return;
            }

            reposToDisplay.forEach(repo => {
                // 1. Create the card element
                const card = document.createElement('div');

                // 2. Add BOTH 'project-card' and 'reveal' classes
                card.classList.add('project-card', 'reveal');

                // 3. Create and append title, description, link (as before)
                const title = document.createElement('h4');
                title.textContent = repo.name.replace(/[-_]/g, ' ');

                const description = document.createElement('p');
                description.textContent = repo.description || 'No description provided.';

                const link = document.createElement('a');
                link.href = repo.html_url;
                link.textContent = 'View on GitHub';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.classList.add('repo-link');

                card.appendChild(title);
                card.appendChild(description);
                card.appendChild(link);

                // 4. Append the fully formed card to the list in the DOM
                repoListElement.appendChild(card);

                // 5. Tell the observer to watch this NEW card (if observer exists)
                if (revealObserver) { // Check if IntersectionObserver is supported and was created
                    revealObserver.observe(card);
                } else {
                    // If IntersectionObserver isn't supported, ensure the card is visible immediately
                    // (It should already be visible due to the fallback earlier,
                    // but this doesn't hurt)
                    card.classList.add('visible');
                }
            });
        })
        .catch(error => {
            loadingElement.textContent = 'Failed to load repositories from GitHub.';
            loadingElement.style.color = '#ff6b6b'; // Error color
            console.error('Error fetching GitHub repositories:', error);
        });

}); // End of DOMContentLoaded listener