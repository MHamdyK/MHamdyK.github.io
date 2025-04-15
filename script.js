document.addEventListener('DOMContentLoaded', function() {

    // --- Intersection Observer Setup for Scroll Reveal ---
    let revealObserver;
    const elementsToObserve = new Set(); // Keep track of elements added for observation

    function initializeObserver() {
        // Check if IntersectionObserver is supported
        if ('IntersectionObserver' in window) {
            revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target); // Stop observing once revealed
                        elementsToObserve.delete(entry.target); // Remove from our tracking set
                    }
                });
            }, {
                root: null,
                threshold: 0.15, // Trigger when 15% visible
                rootMargin: '0px 0px -50px 0px' // Trigger slightly before fully in view
            });

            // Observe elements already marked
            elementsToObserve.forEach(element => revealObserver.observe(element));

        } else {
            // Fallback for very old browsers
            console.log("Intersection Observer not supported. Showing all 'reveal' elements immediately.");
            elementsToObserve.forEach(element => {
                element.classList.add('visible');
            });
            elementsToObserve.clear(); // Clear the set as they are all visible now
        }
    }

    // Function to add an element to be observed
    function observeElement(element) {
        if (element && element.classList.contains('reveal')) {
            elementsToObserve.add(element);
            // If observer is already initialized, observe immediately
            if (revealObserver) {
                revealObserver.observe(element);
            }
        }
    }

    // Find all initial elements with 'reveal' class and prepare them for observation
    document.querySelectorAll('.reveal').forEach(observeElement);

    // Initialize the observer after collecting initial elements
    initializeObserver();


    // --- "Read More" Functionality ---
    function setupReadMore(containerSelector = '.project-card') {
        // Allow specifying a container, defaults to all project cards
        const projectCards = document.querySelectorAll(containerSelector);

        projectCards.forEach(card => {
            const descContainer = card.querySelector('.project-description');
            const paragraph = descContainer?.querySelector('p'); // Optional chaining
            const footer = card.querySelector('.project-footer'); // Find footer within the card

            if (!paragraph || !footer) {
                 // console.warn('Skipping Read More setup for card - missing paragraph or footer.', card);
                return; // Skip if structure isn't right
            }

            // Temporarily remove truncation to measure full height accurately
            const wasTruncated = descContainer.classList.contains('truncated');
            descContainer.classList.remove('truncated');
            // Force reflow/repaint might be needed in some complex cases, but usually not
            // void paragraph.offsetWidth;
            const fullHeight = paragraph.scrollHeight;
            const currentHeight = paragraph.clientHeight; // Height possibly constrained by CSS or naturally fitting

            // Add truncation class back *if it was there* or if needed for measurement
            if (wasTruncated) descContainer.classList.add('truncated');

            // Decide max height based on CSS or calculate dynamically if needed
            // Using a fixed value based on CSS max-height is simpler here
            const cssMaxHeight = 100; // Match the max-height in CSS for .truncated
            const needsReadMore = fullHeight > cssMaxHeight + 10; // Add a slightly larger buffer

            // Ensure no existing button before adding a new one
            const existingButton = footer.querySelector('.read-more-btn');
             if (existingButton) {
                 existingButton.remove(); // Remove if recalculating
             }
             // Reset state before adding button/removing class
            descContainer.classList.remove('truncated'); // Start untruncated unless button is added


            if (needsReadMore) {
                descContainer.classList.add('truncated'); // Add truncated class back
                const readMoreBtn = document.createElement('button');
                readMoreBtn.classList.add('read-more-btn');
                readMoreBtn.textContent = 'Read More';
                readMoreBtn.style.display = 'inline-block'; // Make it visible

                // Find a suitable place in the footer (e.g., append or insert before a link)
                 const repoLink = footer.querySelector('.repo-link');
                 if (repoLink) {
                     footer.insertBefore(readMoreBtn, repoLink); // Place before GitHub link
                 } else {
                     footer.appendChild(readMoreBtn); // Append if no link
                 }


                readMoreBtn.addEventListener('click', function() {
                    const container = this.closest('.project-card').querySelector('.project-description');
                    container.classList.toggle('truncated'); // Toggle the class

                    // Update button text
                    this.textContent = container.classList.contains('truncated') ? 'Read More' : 'Read Less';

                    // Optional: Recalculate carousel height if card height changes drastically
                    // (Requires more complex carousel setup)
                });

            }
            // No else needed: we removed truncated class earlier if button wasn't needed
        });
    }

    // Call setupReadMore initially for cards already in HTML
    setupReadMore('.projects-grid:not(.carousel-track) .project-card'); // Target only non-carousel cards initially


    // --- GitHub Repository Fetch & Carousel Setup ---
    const githubUsername = 'MHamdyK';
    const repoListElement = document.getElementById('github-projects'); // This is now the carousel TRACK
    const loadingElement = document.getElementById('github-projects-loading');
    const carouselContainer = document.getElementById('github-carousel-container');
    const prevButton = carouselContainer.querySelector('.carousel-button.prev');
    const nextButton = carouselContainer.querySelector('.carousel-button.next');
    const dotsContainer = carouselContainer.querySelector('.carousel-dots');
    const apiUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=12`; // Fetch more for carousel

    let githubRepos = []; // Store fetched repos
    let cardsPerSlide = 3; // Default, will be updated dynamically
    let totalCards = 0;
    let totalSlides = 0;
    let currentSlideIndex = 0;
    let cardWidth = 0; // Includes margin/gap
    let trackWidth = 0;
    let resizeTimeout;


    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(repos => {
            if (loadingElement) loadingElement.style.display = 'none';

            const highlightedRepoName = "Neural-Machine-Translation-Eng-Arb"; // Example, adjust if needed
            githubRepos = repos.filter(repo => repo.name !== highlightedRepoName && !repo.fork); // Filter out highlighted and forks
            totalCards = githubRepos.length;

            if (totalCards === 0) {
                if (carouselContainer) carouselContainer.innerHTML = '<p style="text-align: center; color: var(--dim-text-color);">No other public repositories found.</p>';
                return; // Exit if no repos
            }

            // Clear the track before adding new cards
            repoListElement.innerHTML = '';
            const fetchedRepoCards = []; // Array to hold newly created card elements

            githubRepos.forEach(repo => {
                const card = document.createElement('div');
                card.classList.add('project-card', 'reveal'); // Add base and reveal classes

                const title = document.createElement('h4');
                title.textContent = repo.name.replace(/[-_]/g, ' ');
                card.appendChild(title);

                const descriptionContainer = document.createElement('div');
                descriptionContainer.classList.add('project-description'); // Initially not truncated

                const description = document.createElement('p');
                description.textContent = repo.description || 'No description provided.';
                descriptionContainer.appendChild(description);
                card.appendChild(descriptionContainer);

                const footer = document.createElement('div');
                footer.classList.add('project-footer');

                 // Add Tech Tags (Example: using repo topics or language)
                 if (repo.topics && repo.topics.length > 0) {
                     const tagsWrapper = document.createElement('div');
                     tagsWrapper.classList.add('tech-tags');
                     repo.topics.slice(0, 4).forEach(topic => { // Limit tags shown
                         const tagSpan = document.createElement('span');
                         tagSpan.classList.add('tag');
                         tagSpan.textContent = topic;
                         tagsWrapper.appendChild(tagSpan);
                     });
                     // Add language as a tag if not already in topics
                     if (repo.language && !repo.topics.includes(repo.language.toLowerCase())) {
                         const langTag = document.createElement('span');
                         langTag.classList.add('tag');
                         langTag.textContent = repo.language;
                         tagsWrapper.appendChild(langTag);
                     }
                      footer.appendChild(tagsWrapper); // Add tags wrapper to footer
                 }


                const link = document.createElement('a');
                link.href = repo.html_url;
                link.textContent = 'View on GitHub';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.classList.add('repo-link');
                // Insert link after tags or append if no tags
                 const tagsWrapper = footer.querySelector('.tech-tags');
                 if (tagsWrapper) {
                    footer.insertBefore(link, tagsWrapper.nextSibling); // Place after tags
                 } else {
                    footer.appendChild(link); // Append if no tags
                 }

                card.appendChild(footer);
                repoListElement.appendChild(card); // Append card to the track
                fetchedRepoCards.push(card);

                // --- Process each card *as it's added* ---
                // 1. Make IntersectionObserver watch this new card for scroll reveal
                 observeElement(card); // Add to observer queue

                // 2. Run Read More setup for this specific card
                 setupReadMore(`#${repoListElement.id} > .project-card:last-child`); // Target the newly added card specifically
            });

            // --- Initialize Carousel after all cards are added ---
            if (totalCards > 0) {
                setupCarousel();
                 carouselContainer.style.visibility = 'visible'; // Show the carousel now
            }

        })
        .catch(error => {
            console.error('Error fetching GitHub repositories:', error);
            if (loadingElement) {
                 loadingElement.textContent = 'Failed to load repositories from GitHub.';
                 loadingElement.style.color = '#ff6b6b';
            }
             if (carouselContainer) carouselContainer.style.display = 'none'; // Hide container on error
        });

    // --- Carousel Logic ---

    function getCardsPerSlide() {
        const screenWidth = window.innerWidth;
        if (screenWidth <= 768) return 1; // Mobile
        if (screenWidth <= 992) return 2; // Tablet
        return 3; // Desktop
    }

    function updateCarouselState() {
        cardsPerSlide = getCardsPerSlide();
        totalSlides = Math.ceil(totalCards / cardsPerSlide);

        // Get the first card's dimensions *after* it's rendered
        const firstCard = repoListElement.querySelector('.project-card');
        if (!firstCard) return; // No cards

        const cardStyle = window.getComputedStyle(firstCard);
        const cardMargin = parseFloat(cardStyle.marginRight) + parseFloat(cardStyle.marginLeft); // Though we use gap, check margins just in case
        const cardGap = parseFloat(window.getComputedStyle(repoListElement).gap) || 25; // Get gap from CSS

        // Calculate width of a single card + its gap portion
        // cardWidth = firstCard.offsetWidth + cardMargin; // Simpler if using only gap
        cardWidth = firstCard.offsetWidth + cardGap;


        // Correct track width calculation based on total cards
        trackWidth = (firstCard.offsetWidth * totalCards) + (cardGap * (totalCards -1)) ; // Total width of all cards + gaps between them
        repoListElement.style.width = `${trackWidth}px`; // Explicitly set track width MAYBE NOT NEEDED with flex

        // Clamp currentSlideIndex if layout changes reduced totalSlides
        currentSlideIndex = Math.max(0, Math.min(currentSlideIndex, totalSlides - 1));

    }

    function updateCarouselUI() {
        if (!repoListElement || totalSlides <= 0) return; // Exit if no track or slides

        // Calculate the amount to translate the track
        // We move by 'slides', where each slide contains 'cardsPerSlide' cards
        const slideWidth = cardWidth * cardsPerSlide; // Width of a full slide including gaps within it
        // We need to calculate the offset based on the starting position of the slide index
        // Offset = index * (width of 'cardsPerSlide' cards + gaps for 'cardsPerSlide' cards)
        // A simpler approach: calculate offset based on the width of the container viewport
         const containerWidth = repoListElement.parentElement.offsetWidth; // Width of the visible area

        // Calculate translateX: move left by the width of 'currentSlideIndex' full slides
        // Each slide moves by the width of 'cardsPerSlide' items plus their gaps.
        // Let's use the cardWidth which includes the gap spacing calculation from updateCarouselState
         let translateX = currentSlideIndex * cardWidth * cardsPerSlide;

         // Adjust calculation slightly - need to move by index * number_of_cards_per_slide * width_of_one_card_plus_gap
         translateX = currentSlideIndex * (cardWidth * cardsPerSlide); // This seems more direct
         // Check boundary conditions - don't translate beyond the end
         const maxTranslateX = trackWidth - containerWidth + (parseFloat(window.getComputedStyle(repoListElement).gap) || 25); // Max scroll left pos
        // translateX = Math.min(translateX, maxTranslateX); // Clamp maximum translation DOESNT work correctly with slide logic

        // Correct translateX: move by the index multiplied by the width of a slide (which is cardsperslide * cardwidth).
        translateX = currentSlideIndex * (cardWidth * cardsPerSlide);


        repoListElement.style.transform = `translateX(-${translateX}px)`;

        // Update Dots
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlideIndex);
        });

        // Update Buttons
        prevButton.disabled = currentSlideIndex === 0;
        nextButton.disabled = currentSlideIndex >= totalSlides - 1;

        // Hide controls if only one slide
        const controlsShouldBeVisible = totalSlides > 1;
        prevButton.style.display = controlsShouldBeVisible ? 'flex' : 'none';
        nextButton.style.display = controlsShouldBeVisible ? 'flex' : 'none';
        dotsContainer.style.display = controlsShouldBeVisible ? 'block' : 'none';

    }

    function setupCarousel() {
        if (totalCards === 0 || !repoListElement) return;

        updateCarouselState(); // Initial calculation

        // Create Dots
        dotsContainer.innerHTML = ''; // Clear existing dots
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => {
                currentSlideIndex = i;
                updateCarouselUI();
            });
            dotsContainer.appendChild(dot);
        }

        // Add Button Listeners
        prevButton.addEventListener('click', () => {
            if (currentSlideIndex > 0) {
                currentSlideIndex--;
                updateCarouselUI();
            }
        });

        nextButton.addEventListener('click', () => {
             if (currentSlideIndex < totalSlides - 1) {
                currentSlideIndex++;
                updateCarouselUI();
            }
        });

        // Initial UI update
        updateCarouselUI();

        // Add Resize Listener (Debounced)
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                 const oldSlidesPerPage = cardsPerSlide;
                 updateCarouselState(); // Recalculate sizes and slide count
                 // If the number of slides per page changed, we might need to recreate dots
                 if (oldSlidesPerPage !== cardsPerSlide || dotsContainer.children.length !== totalSlides) {
                     setupCarousel(); // Re-run full setup if layout significantly changes
                 } else {
                    updateCarouselUI(); // Just update position and controls if layout is similar
                 }

            }, 250); // Wait 250ms after resize stops
        });
    }

}); // End of DOMContentLoaded listener