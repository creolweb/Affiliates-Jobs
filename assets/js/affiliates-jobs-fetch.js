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
        jobList.innerHTML = '<p>Loading jobs...</p>';

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
                    jobList.innerHTML = '<p>No jobs listed at this time.</p>';
                    paginationNav.innerHTML = '';
                    return;
                }
                
                // Build job cards
                let html = '';
                data.forEach(function(job) {
                    html += `
                        <div class="job">
                            <h3>${job.title}</h3>
                            <div class="content">${job.content}</div>
                            <p>Contact: ${job.contact}</p>
                            <p>Company: ${job.author.name}</p>
                        </div>
                    `;
                });
                jobList.innerHTML = html;

                // Call renderPagination to create pagination links w/ total pages
                renderPagination(totalPages);
            })
            .catch(error => {
                console.error('Error fetching jobs:', error);
                jobList.innerHTML = '<p>Error loading jobs.</p>';
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
        
        let paginationHtml = '';
        // Previous button
        paginationHtml += `<a href="#" class="pagination-link" data-page="${currentPage - 1}" ${currentPage === 1 ? 'style="pointer-events:none;opacity:0.5;"' : ''}>Prev</a> `;

        // Numbered page links
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += `<a href="#" class="pagination-link" data-page="${i}" style="${i === currentPage ? 'font-weight:bold;' : ''}">${i}</a> `;
        }
        
        // Next button
        paginationHtml += `<a href="#" class="pagination-link" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'style="pointer-events:none;opacity:0.5;"' : ''}>Next</a> `;

        paginationNav.innerHTML = paginationHtml;

        // Attach event listeners for the pagination links
        Array.from(document.querySelectorAll('.pagination-link')).forEach(link => {
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