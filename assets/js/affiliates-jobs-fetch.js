document.addEventListener('DOMContentLoaded', function() {

    // Grab the divs and search element from the template
    const jobList = document.getElementById('affiliates-job-list');
    const paginationNav = document.getElementById('pagination-nav');
    const searchInput = document.getElementById('job-search');

    let currentPage = 1;
    const perPage = affiliatesJobs.perPage; // Global variable from shortcode file
    let searchTerm = ''; // Holds the current search query

    // Helper: Debounce function (delays execution until after user stops typing)
    function debounce(func, delay) {
        let debounceTimer;
        return function(...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }


    // Builds query string parameters for URL using the params object
    // Important for pagination and any other parameters
    function buildUrl(url, params) {
        const query = Object.keys(params)
            .map(key => key + '=' + encodeURIComponent(params[key]))
            .join('&');
        return url + (url.indexOf('?') === -1 ? '?' : '&') + query;
    }

    // Load job list
    function loadJobList() {
        // Temporarily show loading message and clear pagination
        jobList.innerHTML = '<h3 class="mx-auto">Loading jobs...</h3>';
        paginationNav.innerHTML = '';

        const params = { page: currentPage, per_page: perPage };
        if (searchTerm) {
            params.search = searchTerm;
        }
        const urlWithParams = buildUrl(affiliatesJobs.restUrl, params);

        // Fetch job data from the API
        // Use cache: 'no-store' to ensure fresh data is fetched
        fetch(urlWithParams, { cache: 'no-store' })
            .then(response => {
                // Try to read total pages from headers (if available)
                const totalPages = parseInt(response.headers.get('X-WP-TotalPages'), 10) || 1;
                return response.json().then(data => ({ data, totalPages }));
            })
            .then(({ data, totalPages }) => {
                // If API returns a message or empty array, show a fallback message
                if ( !data || (Array.isArray(data) && data.length === 0) || data.message ) {
                    jobList.innerHTML = '<h3 class="mx-auto">No jobs listed at this time.</h3>';
                    paginationNav.innerHTML = '';
                    return;
                }
                
                // Build job cards
                let html = '';
                data.forEach(function(job) {
                    const maxChars = 300;
                    const truncatedContent = job.content.length > maxChars ? job.content.substring(0, maxChars) + '...' : job.content;
                    html += `
                        <div class="card my-3">
                            <div class="card-block">
                                <h3 class="card-title">${job.title}</h3>
                                <p><strong>Company: ${job.author.name}</strong></p>
                                <p class="text-muted">Contact: ${job.contact}</p>
                                <div class="card-text">${truncatedContent}</div>
                                <button class="btn btn-primary my-4 view-job-button" data-id="${job.id}">View Details</button>                                
                            </div>
                        </div>
                    `;
                });
                jobList.innerHTML = html;

                // Call renderPagination to create pagination links w/ total pages
                renderPagination(totalPages);
                
                // Attach event listeners to "View Details" buttons
                Array.from(document.querySelectorAll('.view-job-button')).forEach(button => {
                    button.addEventListener('click', function(e) {
                        e.preventDefault();
                        const jobId = this.getAttribute('data-id');
                        loadJobDetails(jobId);
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching jobs:', error);
                jobList.innerHTML = '<h3 class="mx-auto">Error loading jobs.</h3>';
                paginationNav.innerHTML = '';
            });
    }

    // Render pagination links
    function renderPagination(totalPages) {
        // Do not render pagination if only one page exists
        if (totalPages <= 1) {
            paginationNav.innerHTML = '';
            return;
        }
        
        let paginationHtml = '<ul class="pagination justify-content-center">';
        // Previous button
        paginationHtml += `<li ${currentPage === 1 ? 'class="page-item disabled"' : 'class="page-item"'}><a href="#" data-page="${currentPage - 1}" class="page-link">Prev</a></li> `;

        // Numbered page links
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += `<li ${currentPage === i ? 'class="page-item active"' : 'class="page-item"'}><a href="#" data-page="${i}" class="page-link">${i}</a></li> `;
        }
        
        // Next button
        paginationHtml += `<li ${currentPage === totalPages ? 'class="page-item disabled"' : 'class="page-item"'}><a href="#" data-page="${currentPage + 1}" class="page-link">Next</a></li> `;
        
        // Close pagination list
        paginationHtml += '</ul>';

        paginationNav.innerHTML = paginationHtml;

        // Attach event listeners for the pagination links
        Array.from(document.querySelectorAll('.page-link')).forEach(link => {
            link.addEventListener('click', function(e) {

                // Prevent default link behavior to avoid page reload
                e.preventDefault();
                const page = parseInt(this.getAttribute('data-page'), 10);

                if (page >= 1 && page <= totalPages && page !== currentPage) {
                    // Update current page and reload job list
                    currentPage = page;
                    loadJobList();
                }
            });
        });
    }

    // Load full details for a single job
    function loadJobDetails(jobId) {
        
        // Hide the search bar when displaying job details
        if (searchInput) {
            searchInput.style.display = 'none';
        }

        // Show loading message in jobList and remove pagination
        jobList.innerHTML = '<h3 class="mx-auto">Loading job details...</h3>';
        paginationNav.innerHTML = '';

        // Construct detail URL and fetch the job detail
        const detailUrl = affiliatesJobs.restUrl + '/' + jobId;
        fetch(detailUrl, { cache: 'no-store' })
            .then(response => response.json())
            .then(job => {
                // Build and display the job detail card
                const detailHtml = `
                    <div class="card my-3">
                        <div class="card-block">
                            <h3 class="card-title">${job.title}</h3>
                            <p><strong>Company: ${job.author}</strong></p>
                            <p class="text-muted">Contact: ${job.contact}</p>
                            <div class="card-text">${job.job_description}</div>
                            <button class="btn btn-secondary my-4" id="back-to-list">Back to List</button>
                        </div>
                    </div>
                `;
                jobList.innerHTML = detailHtml;

                // Add event listener to the back button to reload the list
                document.getElementById('back-to-list').addEventListener('click', function(e) {
                    e.preventDefault();
                    // Re-display the search bar when going back to the list
                    if (searchInput) {
                        searchInput.style.display = '';
                    }
                    loadJobList();
                });
            })
            .catch(error => {
                console.error('Error fetching job details:', error);
                jobList.innerHTML = '<h3 class="mx-auto">Error loading job details.</h3>';
            });
    }

    // Attach an input event listener to the search field using debounce
    // This will delay the search function until the user stops typing
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            searchTerm = e.target.value.trim();
            currentPage = 1; // reset page to 1
            loadJobList();
        }, 500)); // 500ms delay
    }

    // Initial load of job list
    loadJobList();
});