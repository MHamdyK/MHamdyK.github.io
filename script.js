document.addEventListener('DOMContentLoaded', function() {

    // --- Intersection Observer Setup for Scroll Reveal ---
    let revealObserver;
    if ('IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });
        const initialRevealElements = document.querySelectorAll('.reveal');
        initialRevealElements.forEach(element => {
            revealObserver.observe(element);
        });
    } else {
        console.log("Intersection Observer not supported. Showing all 'reveal' elements immediately.");
        const allRevealElements = document.querySelectorAll('.reveal');
        allRevealElements.forEach(element => element.classList.add('visible'));
    }

    // --- "Read More" Functionality ---
    function setupReadMore() {
        const descriptionContainers = document.querySelectorAll('.project-description');
        descriptionContainers.forEach(descContainer => {
            const paragraph = descContainer.querySelector('p');
            const footer = descContainer.nextElementSibling;
            if (!paragraph || !footer || !footer.classList.contains('project-footer')) {
                return;
            }
            // Temporarily remove truncation to get full height
            descContainer.classList.remove('truncated');
            const fullHeight = paragraph.scrollHeight;
            descContainer.classList.add('truncated');
            const truncatedHeight = descContainer.clientHeight;
            const needsReadMore = fullHeight > truncatedHeight + 5; // small buffer
            const existingButton = footer.querySelector('.read-more-btn');
            if (existingButton) {
                existingButton.remove();
            }
            if (needsReadMore) {
                const readMoreBtn = document.createElement('button');
                readMoreBtn.classList.add('read-more-btn');
                readMoreBtn.textContent = 'Read More';
                readMoreBtn.style.display = 'inline-block';
                footer.appendChild(readMoreBtn);
                readMoreBtn.addEventListener('click', function() {
                    const container = this.closest('.project-card').querySelector('.project-description');
                    container.classList.toggle('truncated');
                    this.textContent = container.classList.contains('truncated') ? 'Read More' : 'Read Less';
                });
            } else {
                descContainer.classList.remove('truncated');
            }
        });
    }
    setupReadMore();

    // --- GitHub Repository Fetch & Slider Setup ---
    const githubUsername = 'MHamdyK';
    const loadingElement = document.getElementById('github-projects-loading');
    // Fetch more repos (30 instead of 6)
    const apiUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=30`;
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(repos => {
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            // Exclude the highlighted repository if needed
            const highlightedRepoName = "Neural-Machine-Translation-Eng-Arb";
            const reposToDisplay = repos.filter(repo => repo.name !== highlightedRepoName);
            if (reposToDisplay.length === 0) {
                const repoListElement = document.getElementById('github-projects');
                if (repoListElement) {
                    repoListElement.innerHTML = '<p>No other public repositories found.</p>';
                }
                return;
            }
            // Append cards to the slider container
            const repoListElement = document.getElementById('github-projects');
            const fetchedRepoCards = [];
            reposToDisplay.forEach(repo => {
                const card = document.createElement('div');
                card.classList.add('project-card', 'reveal');
                // Title
                const title = document.createElement('h4');
                title.textContent = repo.name.replace(/[-_]/g, ' ');
                card.appendChild(title);
                // Description container
                const descriptionContainer = document.createElement('div');
                descriptionContainer.classList.add('project-description');
                const description = document.createElement('p');
                description.textContent = repo.description || 'No description provided.';
                descriptionContainer.appendChild(description);
                card.appendChild(descriptionContainer);
                // Footer with GitHub link
                const footer = document.createElement('div');
                footer.classList.add('project-footer');
                const link = document.createElement('a');
                link.href = repo.html_url;
                link.textContent = 'View on GitHub';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.classList.add('repo-link');
                footer.appendChild(link);
                card.appendChild(footer);
                // Append card to slider
                repoListElement.appendChild(card);
                fetchedRepoCards.push(card);
            });
            // Process intersection observer on new cards
            if (revealObserver) {
                fetchedRepoCards.forEach(card => {
                    revealObserver.observe(card);
                });
            } else {
                fetchedRepoCards.forEach(card => card.classList.add('visible'));
            }
            // Re-run Read More logic for new cards
            setTimeout(setupReadMore, 100);
            // Initialize the slider
            initializeSlider();
        })
        .catch(error => {
            console.error('Error fetching GitHub repositories:', error);
            if (loadingElement) {
                loadingElement.textContent = 'Failed to load repositories from GitHub.';
                loadingElement.style.color = '#ff6b6b';
            }
        });

    // --- Slider Initialization Function ---
    function initializeSlider() {
        const sliderWrapper = document.getElementById('github-slider');
        const sliderContainer = document.getElementById('github-projects');
        const prevButton = document.getElementById('slider-prev');
        const nextButton = document.getElementById('slider-next');
        const dotsContainer = document.getElementById('slider-dots');

        // Make sure the slider elements are visible now that repos are loaded
        if (sliderWrapper) {
            sliderWrapper.style.display = 'block';
        }
        if (dotsContainer) {
            dotsContainer.style.display = 'block';
        }

        // Set number of cards to show per slide (adjust as needed)
        const itemsPerSlide = 3;
        const cards = sliderContainer.querySelectorAll('.project-card');
        const totalCards = cards.length;
        const totalSlides = Math.ceil(totalCards / itemsPerSlide);
        let currentSlide = 0;

        function updateSlider() {
            const sliderWidth = sliderWrapper.offsetWidth;
            // Move sliderContainer by slider width per slide
            sliderContainer.style.transform = `translateX(-${currentSlide * sliderWidth}px)`;
            // Update active dot indicator
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        }

        // Build pagination dots
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                currentSlide = i;
                updateSlider();
            });
            dotsContainer.appendChild(dot);
        }

        // Add event listeners to arrow buttons
        prevButton.addEventListener('click', () => {
            if (currentSlide > 0) {
                currentSlide--;
                updateSlider();
            }
        });
        nextButton.addEventListener('click', () => {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                updateSlider();
            }
        });
        window.addEventListener('resize', updateSlider);
        updateSlider();
    }
});
