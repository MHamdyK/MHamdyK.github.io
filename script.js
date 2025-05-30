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
                threshold: 0.1, // Trigger when 10% visible (adjust if needed)
                rootMargin: '0px 0px -40px 0px' // Trigger slightly before fully in view
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
             // If observer is NOT supported (fallback case), make visible immediately
             else if (!('IntersectionObserver' in window)) {
                element.classList.add('visible');
             }
        }
    }

    // Find all initial elements with 'reveal' class and prepare them for observation
    document.querySelectorAll('.reveal').forEach(observeElement);

    // Initialize the observer after collecting initial elements
    initializeObserver();


    // --- "Read More" Functionality ---
    // Read More/Read Less accordion toggle for project cards
    // selector: CSS selector for cards to target (default '.project-card')
    function setupReadMore(selector = '.project-card') {
        const cards = document.querySelectorAll(selector);
        cards.forEach(card => {
          const descBox  = card.querySelector('.project-description');
          const paragraph = descBox?.querySelector('p');
          const footer    = card.querySelector('.project-footer');
          if (!descBox || !paragraph || !footer) return;
      
          // Remove old button if re-initializing
          footer.querySelectorAll('.read-more-btn').forEach(old => old.remove());
      
          // Determine if we need a button
          const wasTruncated = descBox.classList.contains('truncated');
          descBox.classList.remove('truncated');
          void paragraph.offsetHeight; // force reflow
          const fullHeight = paragraph.scrollHeight;
          const maxStyle   = window.getComputedStyle(descBox).maxHeight;
          const maxH       = parseFloat(maxStyle) || 100;
          const needsBtn   = fullHeight > maxH + 10;
          if (wasTruncated) descBox.classList.add('truncated');
      
          if (!needsBtn) {
            descBox.classList.remove('truncated');
            return;
          }
      
          // Add button and default to truncated
          descBox.classList.add('truncated');
          const btn = document.createElement('button');
          btn.className = 'read-more-btn';
          btn.textContent = 'Read More';
          btn.style.display = 'inline-block';
      
          // Place button before GitHub link if present
          const repoLink = footer.querySelector('.repo-link');
          if (repoLink) footer.insertBefore(btn, repoLink);
          else footer.appendChild(btn);
      
          // Accordion-style click handler
          btn.addEventListener('click', () => {
            const wasClosed = descBox.classList.contains('truncated');
            // Collapse all
            cards.forEach(c => {
              const d = c.querySelector('.project-description');
              const b = c.querySelector('.read-more-btn');
              d.classList.add('truncated');
              if (b) {
                b.textContent = 'Read More';
                b.style.display = 'inline-block';
              }
            });
            // Expand this one if it was closed
            if (wasClosed) {
              descBox.classList.remove('truncated');
              btn.textContent = 'Read Less';
            }
          });
        });
}

    // Call setupReadMore initially for cards already in HTML (highlighted projects)
    // Use a more specific selector to avoid the carousel track
    setupReadMore('.projects-grid > .project-card');


    // --- GitHub Repository Fetch & Carousel Setup ---
    const githubUsername = 'MHamdyK';
    const repoListElement = document.getElementById('github-projects'); // This is the carousel TRACK
    const loadingElement = document.getElementById('github-projects-loading');
    const carouselContainer = document.getElementById('github-carousel-container');
    // Select buttons within the container - check if they exist first
    const prevButton = carouselContainer?.querySelector('.carousel-button.prev');
    const nextButton = carouselContainer?.querySelector('.carousel-button.next');
    const dotsContainer = carouselContainer?.querySelector('.carousel-dots');
    const apiUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=12`; // Fetch more for carousel

    let githubRepos = []; // Store fetched repos
    let cardsPerSlide = 3; // Default, will be updated dynamically
    let totalCards = 0;
    let totalSlides = 0;
    let currentSlideIndex = 0;
    let cardWidthWithGap = 0; // Stores measured width + gap
    let resizeTimeout;

    // Check if essential carousel elements exist before proceeding
    if (!repoListElement || !loadingElement || !carouselContainer || !prevButton || !nextButton || !dotsContainer) {
        console.error("Carousel HTML elements not found. Cannot initialize GitHub carousel.");
        if (loadingElement) loadingElement.textContent = 'Error: Carousel structure missing in HTML.';
        // Optionally hide the container area if elements are missing
        if (carouselContainer) carouselContainer.style.display = 'none';
    } else {
        // Proceed with fetch only if elements are found
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(repos => {
                if (loadingElement) loadingElement.style.display = 'none';

                const highlightedRepoName = "Neural-Machine-Translation-Eng-Arb"; // Adjust if needed
                githubRepos = repos.filter(repo => repo.name !== highlightedRepoName && !repo.fork); // Filter out highlighted and forks
                totalCards = githubRepos.length;

                if (totalCards === 0) {
                    carouselContainer.innerHTML = '<p style="text-align: center; color: var(--dim-text-color); padding: 20px;">No other public repositories found.</p>';
                    return; // Exit if no repos
                }

                // Clear the track before adding new cards
                repoListElement.innerHTML = '';
                const cardAddPromises = []; // Track card processing

                githubRepos.forEach((repo, index) => {
                    // --- Create Card Element ---
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

                    // Add Tech Tags
                    if (repo.topics && repo.topics.length > 0 || repo.language) {
                         const tagsWrapper = document.createElement('div');
                         tagsWrapper.classList.add('tech-tags');
                         if (repo.topics) {
                             repo.topics.slice(0, 4).forEach(topic => { // Limit tags
                                 const tagSpan = document.createElement('span');
                                 tagSpan.classList.add('tag');
                                 tagSpan.textContent = topic;
                                 tagsWrapper.appendChild(tagSpan);
                             });
                         }
                         // Add language if it exists and isn't already a topic (case-insensitive check)
                         if (repo.language && !(repo.topics?.map(t => t.toLowerCase()).includes(repo.language.toLowerCase()))) {
                             const langTag = document.createElement('span');
                             langTag.classList.add('tag');
                             langTag.textContent = repo.language;
                             tagsWrapper.appendChild(langTag);
                         }
                         // Only append wrapper if it has tags
                         if (tagsWrapper.children.length > 0) {
                            footer.appendChild(tagsWrapper);
                         }
                    }

                    // Add GitHub Link
                    const link = document.createElement('a');
                    link.href = repo.html_url;
                    link.textContent = 'View on GitHub';
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.classList.add('repo-link');
                    footer.appendChild(link); // Append link (Read More button will be inserted before it if needed)

                    card.appendChild(footer);
                    repoListElement.appendChild(card); // Append card to the track


                    // --- Process Card (Observe & Read More) ---
                    observeElement(card); // Add to observer queue

                    // Use a minimal delay for setupReadMore to allow rendering
                    cardAddPromises.push(Promise.resolve());
                });

                // --- Initialize Carousel after all cards are processed ---
                Promise.all(cardAddPromises).then(() => {
                    // 1️⃣ Initialize Read More on all carousel cards at once
                    setupReadMore('#github-projects .project-card');
                  
                    // 2️⃣ Then set up the carousel UI
                    setupCarousel();
                  
                    // 3️⃣ Finally, reveal the container
                    carouselContainer.style.visibility = 'visible';
                    carouselContainer.style.opacity = '1';
                    carouselContainer.style.transition = 'opacity 0.5s ease-in-out';
                });

            })
            .catch(error => {
                console.error('Error fetching GitHub repositories:', error);
                if (loadingElement) {
                    loadingElement.textContent = 'Failed to load repositories from GitHub.';
                    loadingElement.style.color = '#ff6b6b';
                }
                 // Hide the container on error
                if (carouselContainer) {
                    carouselContainer.innerHTML = '<p style="text-align: center; color: var(--dim-text-color); padding: 20px;">Failed to load repositories.</p>';
                    carouselContainer.style.visibility = 'visible'; // Make error visible
                }
            });
    } // End of else block (checking if elements exist)


    // --- Carousel Logic Functions ---

    function getCardsPerSlide() {
        const screenWidth = window.innerWidth;
        // Match breakpoints used in CSS for consistency
        if (screenWidth <= 768) return 1; // Mobile
        if (screenWidth <= 992) return 2; // Tablet
        return 3; // Desktop
    }

    function updateCarouselState() {
        // Make sure elements exist before proceeding
        if (!repoListElement) return;

        cardsPerSlide = getCardsPerSlide();
        totalSlides = cardsPerSlide > 0 ? Math.ceil(totalCards / cardsPerSlide) : 0;

        const firstCard = repoListElement.querySelector('.project-card');
        if (!firstCard) {
            cardWidthWithGap = 0; // Reset if no cards
            return;
        }

        const cardStyle = window.getComputedStyle(firstCard);
        const trackStyle = window.getComputedStyle(repoListElement);
        const cardGap = parseFloat(trackStyle.gap) || 0; // Get gap from track
        const cardMargin = parseFloat(cardStyle.marginLeft) + parseFloat(cardStyle.marginRight);

        // Calculate the space one card takes up, including its gap
        cardWidthWithGap = firstCard.offsetWidth + cardMargin + cardGap;

        // Clamp currentSlideIndex to valid range
        currentSlideIndex = Math.max(0, Math.min(currentSlideIndex, totalSlides - 1));
    }

    function updateCarouselUI() {
        // Check for required elements and valid state
        if (!repoListElement || !prevButton || !nextButton || !dotsContainer || totalSlides <= 0 || cardWidthWithGap <= 0) {
            // Optionally hide controls if state is invalid
             if(prevButton) prevButton.style.visibility = 'hidden';
             if(nextButton) nextButton.style.visibility = 'hidden';
             if(dotsContainer) dotsContainer.style.visibility = 'hidden';
            return;
        }

        // Calculate translateX: Move left by index * number_of_cards_per_slide * width_of_one_card_plus_gap
        // Ensure we don't multiply by zero cardsPerSlide
        const effectiveCardsPerSlide = Math.max(1, cardsPerSlide);
        const translateX = currentSlideIndex * effectiveCardsPerSlide * cardWidthWithGap;

        repoListElement.style.transform = `translateX(-${translateX}px)`;

        // Update Dots
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlideIndex);
        });

        // Update Buttons State
        prevButton.disabled = currentSlideIndex === 0;
        nextButton.disabled = currentSlideIndex >= totalSlides - 1;

        // Update Controls Visibility
        const controlsShouldBeVisible = totalSlides > 1;
        prevButton.style.visibility = controlsShouldBeVisible ? 'visible' : 'hidden';
        nextButton.style.visibility = controlsShouldBeVisible ? 'visible' : 'hidden';
        dotsContainer.style.visibility = controlsShouldBeVisible ? 'visible' : 'hidden';
    }

    // --- Debounced Resize Handler ---
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const oldTotalSlides = totalSlides;
            updateCarouselState(); // Recalculate sizes and slide count

            // If the number of slides changed, need to rebuild dots and update UI fully
            if (oldTotalSlides !== totalSlides) {
                // Re-create dots if the number of slides changed
                createDots();
            }
            // Always update UI after state change on resize
            updateCarouselUI();
        }, 250); // Debounce time
    }

    // --- Function to Create Dots ---
    function createDots() {
         if (!dotsContainer) return;
         dotsContainer.innerHTML = ''; // Clear existing dots
         if (totalSlides > 1) {
             for (let i = 0; i < totalSlides; i++) {
                 const dot = document.createElement('button');
                 dot.classList.add('carousel-dot');
                 dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                 dot.addEventListener('click', () => {
                     currentSlideIndex = i;
                     updateCarouselUI(); // Update UI on dot click
                 });
                 dotsContainer.appendChild(dot);
             }
         }
    }

    // --- Main Carousel Setup Function ---
    function setupCarousel() {
        // Check required elements exist
        if (totalCards === 0 || !repoListElement || !prevButton || !nextButton || !dotsContainer) {
             console.log("Skipping carousel setup: Not enough cards or missing elements.");
            return;
        }

        console.log("Setting up carousel..."); // Debug log

        updateCarouselState(); // Initial calculation of sizes and slide count

        // Create Dot Indicators
        createDots();

        // --- Add Button Listeners ---
        // Remove potential old listeners by cloning (safer than removeEventListener)
        const newPrevButton = prevButton.cloneNode(true);
        prevButton.parentNode.replaceChild(newPrevButton, prevButton);

        const newNextButton = nextButton.cloneNode(true);
        nextButton.parentNode.replaceChild(newNextButton, nextButton);

        // Add listeners to the *new* buttons
        newPrevButton.addEventListener('click', () => {
            if (currentSlideIndex > 0) { // Check boundary
                currentSlideIndex--;
                updateCarouselUI();
            }
        });

        newNextButton.addEventListener('click', () => {
             if (currentSlideIndex < totalSlides - 1) { // Check boundary
                currentSlideIndex++;
                updateCarouselUI();
            }
        });
        // --- End Button Listeners ---

        // Initial UI state update (position, dots, buttons)
        updateCarouselUI();

        // Add Resize Listener (Debounced)
        window.removeEventListener('resize', handleResize); // Ensure no duplicates
        window.addEventListener('resize', handleResize);
    }


}); // End of DOMContentLoaded listener