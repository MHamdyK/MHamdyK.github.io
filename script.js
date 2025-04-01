document.addEventListener('DOMContentLoaded', function() {
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

            // Filter out the specific repo already highlighted if needed
            const highlightedRepoName = "Neural-Machine-Translation-Eng-Arb";
            const reposToDisplay = repos.filter(repo => repo.name !== highlightedRepoName);


            if (reposToDisplay.length === 0) {
                 repoListElement.innerHTML = '<p>No public repositories found or failed to load.</p>';
                 return;
            }

            reposToDisplay.forEach(repo => {
                const card = document.createElement('div');
                card.classList.add('project-card'); // Reuse the project card style

                const title = document.createElement('h4');
                title.textContent = repo.name.replace(/[-_]/g, ' '); // Replace hyphens/underscores with spaces

                const description = document.createElement('p');
                description.textContent = repo.description || 'No description provided.'; // Handle null descriptions

                const link = document.createElement('a');
                link.href = repo.html_url;
                link.textContent = 'View on GitHub';
                link.target = '_blank'; // Open in new tab
                link.rel = 'noopener noreferrer';
                link.classList.add('repo-link');


                card.appendChild(title);
                card.appendChild(description);
                card.appendChild(link); // Append link last

                repoListElement.appendChild(card);
            });
        })
        .catch(error => {
             loadingElement.textContent = 'Failed to load repositories from GitHub.';
             loadingElement.style.color = '#ff6b6b'; // Error color
            console.error('Error fetching GitHub repositories:', error);
        });
});