document.addEventListener('DOMContentLoaded', function() {

    // Grab the divs by id from the jobs-display template
    const jobList = document.getElementById('affiliates-job-list');
    const paginationNav = document.getElementById('pagination-nav');
    let currentPage = 1;
    const perPage = affiliatesJobs.perPage; // Global variable from shortcode file

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
        // Temporarily show loading message
        jobList.innerHTML = '<h3 class="mx-auto">Loading jobs...</h3>';

        // Build URL with pagination parameters using the global variable field
        const urlWithParams = buildUrl(affiliatesJobs.restUrl, { page: currentPage, per_page: perPage });

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
                    html += `
                        <div class="card my-3">
                            <div class="card-block">
                                <h3 class="card-title">${job.title}</h3>
                                <p><strong>Company: ${job.author.name}</strong></p>
                                <p class="text-muted">Contact: ${job.contact}</p>
                                <div class="card-text">${job.content}</div>
                            </div>
                        </div>
                    `;
                });
                jobList.innerHTML = html;

                // Call renderPagination to create pagination links w/ total pages
                renderPagination(totalPages);
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

    // Initial load of job list
    loadJobList();
});