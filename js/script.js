// GSM Hamza Clone - JavaScript Functionality
const API_BASE = '/api';

class GSMHamzaApp {
    constructor() {
        this.init();
    }

    init() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.setupEventListeners();
        this.setupSearch();
        this.setupFilters();
        this.setupThemeToggle();
        this.setupMobileMenu();
        this.setupFavorites();
        this.loadFilesFromAPI();
        this.updateAuthUI();
    }

    async apiFetch(endpoint, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        if (!res.ok) throw await res.json();
        return res.json();
    }

    async loadFilesFromAPI() {
        try {
            const data = await this.apiFetch('/files?limit=6&sort=view_count');
            this.renderFileCards(data.files);
        } catch {
            this.loadSampleData();
        }
    }

    renderFileCards(files) {
        const grid = document.querySelector('.apps-grid');
        if (!grid || !files.length) return;
        grid.innerHTML = files.map(f => `
            <div class="app-card" data-id="${f.id}">
                <div class="app-thumb">
                    <div class="app-icon">${f.thumbnail_url ? `<img src="${f.thumbnail_url}" alt="${f.title}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">` : '<i class="fas fa-mobile-alt"></i>'}</div>
                    <span class="verified"><i class="fas fa-check"></i></span>
                </div>
                <div class="app-info">
                    <h3 class="app-title"><a href="/download/${f.slug}">${f.title}</a></h3>
                    <p class="app-desc">${f.description || ''}</p>
                    <div class="app-meta">
                        <span class="category">${f.category_name || ''}</span>
                        <span class="author">${f.author || 'GSM Hamza'}</span>
                        <span class="date">${new Date(f.updated_at || f.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="app-stats">
                        <span><i class="fas fa-star"></i> ${f.avg_rating} (${f.rating_count})</span>
                        <span><i class="fas fa-eye"></i> ${f.view_count?.toLocaleString()} views</span>
                        <span><i class="fas fa-download"></i> ${f.download_count} downloads</span>
                    </div>
                </div>
                <div class="app-actions">
                    <span class="price ${f.file_type}">${f.file_type === 'free' ? 'FREE' : f.file_type === 'paid' ? '$' + f.price : 'PREMIUM'}</span>
                    <button class="download-btn" data-id="${f.id}" data-type="${f.file_type}">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `).join('');
        grid.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleDownload(btn));
        });
    }

    updateAuthUI() {
        const signIn = document.querySelector('.top-link.dl-top-login, a[href*="login"]');
        const register = document.querySelector('.join-btn');
        if (this.user) {
            if (signIn) signIn.innerHTML = `<i class="fas fa-user"></i> ${this.user.username}`;
            if (register) register.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('.search-input');
        const searchBtn = document.querySelector('.search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e.target));
        });

        // Download buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDownload(e.target));
        });

        // Category cards
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCategoryClick(card);
            });
        });
    }

    setupSearch() {
        this.searchData = [
            'Samsung SM-S136DL U3 Universal Firehose Loader',
            'Samsung SM-A235F U8 Universal Firehose Loader',
            'Motorola Moto E13 XT2345-1',
            'Realme C33 RMX 3627 IMEI Repair',
            'Samsung KNOX File',
            'Dump File',
            'Firmware',
            'Stock Recovery'
        ];
    }

    handleSearch(query) {
        if (query.length < 2) return;

        const results = this.searchData.filter(item => 
            item.toLowerCase().includes(query.toLowerCase())
        );

        this.showSearchSuggestions(results);
    }

    showSearchSuggestions(results) {
        // Create or update search suggestions dropdown
        let dropdown = document.querySelector('.search-suggestions');
        
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'search-suggestions';
            document.querySelector('.search-wrapper').appendChild(dropdown);
        }

        if (results.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        dropdown.innerHTML = results.map(result => 
            `<div class="suggestion-item">${result}</div>`
        ).join('');

        dropdown.style.display = 'block';

        // Add click handlers to suggestions
        dropdown.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelector('.search-input').value = item.textContent;
                dropdown.style.display = 'none';
                this.performSearch(item.textContent);
            });
        });
    }

    performSearch(query) {
        console.log('Searching for:', query);
        // In a real app, this would make an API call
        this.showNotification(`Searching for "${query}"...`);
    }

    setupFilters() {
        this.currentFilter = 'all';
    }

    handleFilter(button) {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        button.classList.add('active');

        const filter = button.dataset.filter;
        this.currentFilter = filter;

        // Filter content based on selection
        this.filterContent(filter);
    }

    filterContent(filter) {
        const cards = document.querySelectorAll('.app-card, .featured-card');
        
        cards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'block';
            } else {
                // In a real app, cards would have data attributes for filtering
                const shouldShow = Math.random() > 0.3; // Simulate filtering
                card.style.display = shouldShow ? 'block' : 'none';
            }
        });

        this.showNotification(`Filtered by: ${filter}`);
    }

    setupThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';

        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
            this.applyTheme();
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.applyTheme();
    }

    applyTheme() {
        const body = document.body;
        const themeIcon = document.querySelector('.theme-toggle i');

        if (this.isDarkMode) {
            body.classList.add('dark-theme');
            if (themeIcon) {
                themeIcon.className = 'fas fa-sun';
            }
        } else {
            body.classList.remove('dark-theme');
            if (themeIcon) {
                themeIcon.className = 'fas fa-moon';
            }
        }
    }

    setupMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }
    }

    toggleMobileMenu() {
        // Create mobile menu overlay
        let overlay = document.querySelector('.mobile-menu-overlay');
        
        if (!overlay) {
            overlay = this.createMobileMenu();
        }

        overlay.classList.toggle('active');
    }

    createMobileMenu() {
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        
        overlay.innerHTML = `
            <div class="mobile-menu">
                <div class="mobile-menu-header">
                    <h3>Menu</h3>
                    <button class="close-mobile-menu">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <nav class="mobile-nav">
                    <a href="#" class="mobile-nav-link">
                        <i class="fas fa-home"></i> Home
                    </a>
                    <a href="#" class="mobile-nav-link">
                        <i class="fas fa-bolt"></i> Popular
                    </a>
                    <a href="#" class="mobile-nav-link">
                        <i class="fas fa-download"></i> Free Downloads
                    </a>
                    <a href="#" class="mobile-nav-link">
                        <i class="fas fa-star"></i> Premium
                    </a>
                    <a href="#" class="mobile-nav-link">
                        <i class="fas fa-th"></i> Categories
                    </a>
                    <a href="#" class="mobile-nav-link">
                        <i class="fas fa-envelope"></i> Contact
                    </a>
                </nav>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add close functionality
        overlay.querySelector('.close-mobile-menu').addEventListener('click', () => {
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });

        return overlay;
    }

    setupFavorites() {
        this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.updateFavoritesCount();
    }

    toggleFavorite(itemId, itemData) {
        const index = this.favorites.findIndex(fav => fav.id === itemId);
        
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.showNotification('Removed from favorites');
        } else {
            this.favorites.push({ id: itemId, ...itemData });
            this.showNotification('Added to favorites');
        }

        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.updateFavoritesCount();
    }

    updateFavoritesCount() {
        const countElement = document.querySelector('.widget-header .count');
        if (countElement) {
            countElement.textContent = this.favorites.length;
        }

        // Update favorites widget content
        this.renderFavorites();
    }

    renderFavorites() {
        const favoritesContent = document.querySelector('.widget-content');
        
        if (!favoritesContent) return;

        if (this.favorites.length === 0) {
            favoritesContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <p>No favorites yet</p>
                    <span>Click the ♡ button on any file to save it here</span>
                </div>
            `;
        } else {
            favoritesContent.innerHTML = this.favorites.map(fav => `
                <div class="favorite-item">
                    <span class="fav-title">${fav.title}</span>
                    <button class="remove-fav" data-id="${fav.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');

            // Add remove functionality
            favoritesContent.querySelectorAll('.remove-fav').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('.remove-fav').dataset.id;
                    this.toggleFavorite(id);
                });
            });
        }
    }

    handleDownload(button) {
        const card = button.closest('.app-card, .featured-card');
        const title = card.querySelector('.app-title, .card-title').textContent;
        
        // Simulate download process
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
        button.disabled = true;

        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-check"></i> Downloaded';
            button.style.background = '#10b981';
            
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-download"></i> Download';
                button.disabled = false;
                button.style.background = '';
            }, 2000);
        }, 1500);

        this.showNotification(`Starting download: ${title}`);
        this.updateDownloadStats();
    }

    handleCategoryClick(card) {
        const categoryName = card.querySelector('h3').textContent;
        this.showNotification(`Loading ${categoryName} category...`);
        
        // Simulate category loading
        setTimeout(() => {
            this.loadCategoryContent(categoryName);
        }, 500);
    }

    loadCategoryContent(category) {
        // In a real app, this would load category-specific content
        console.log('Loading category:', category);
        this.showNotification(`Loaded ${category} files`);
    }

    updateDownloadStats() {
        const downloadStats = document.querySelectorAll('.downloads');
        downloadStats.forEach(stat => {
            const current = parseInt(stat.textContent.match(/\d+/)[0]);
            stat.innerHTML = stat.innerHTML.replace(/\d+/, current + 1);
        });
    }

    loadSampleData() {
        // Simulate loading additional content
        this.addSampleCards();
        this.updateVisitorCount();
    }

    addSampleCards() {
        const appsGrid = document.querySelector('.apps-grid');
        if (!appsGrid) return;

        const sampleCards = [
            {
                title: 'Samsung SM-A025A U7 Universal Firehose Loader',
                desc: 'FRP Bypass, MDM Removal & Dead Boot Recovery Tool',
                category: 'Firehose Loader',
                rating: '0.0',
                views: '354',
                downloads: '0'
            },
            {
                title: 'Huawei Honor X7 CMA-LX2 Firmware Dump',
                desc: 'XML File | Emmc Repair Dongle Support',
                category: 'Dump File',
                rating: '0.0',
                views: '416',
                downloads: '0'
            }
        ];

        sampleCards.forEach(card => {
            const cardElement = this.createAppCard(card);
            appsGrid.appendChild(cardElement);
        });
    }

    createAppCard(data) {
        const card = document.createElement('div');
        card.className = 'app-card';
        
        card.innerHTML = `
            <div class="app-thumb">
                <div class="app-icon">
                    <i class="fas fa-mobile-alt"></i>
                </div>
                <span class="verified">
                    <i class="fas fa-check"></i>
                </span>
            </div>
            <div class="app-info">
                <h3 class="app-title">${data.title}</h3>
                <p class="app-desc">${data.desc}</p>
                <div class="app-meta">
                    <span class="category">${data.category}</span>
                    <span class="author">GSM Hamza</span>
                    <span class="date">Updated: Feb 20, 2025</span>
                </div>
                <div class="app-stats">
                    <span><i class="fas fa-star"></i> ${data.rating} (0)</span>
                    <span><i class="fas fa-eye"></i> ${data.views} views</span>
                    <span class="downloads"><i class="fas fa-download"></i> ${data.downloads} downloads</span>
                </div>
            </div>
            <div class="app-actions">
                <span class="price free">FREE</span>
                <button class="download-btn">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;

        // Add event listeners to new card
        const downloadBtn = card.querySelector('.download-btn');
        downloadBtn.addEventListener('click', (e) => this.handleDownload(e.target));

        return card;
    }

    updateVisitorCount() {
        const visitorCount = document.querySelector('.visitors-counter .count');
        if (visitorCount) {
            let count = parseInt(visitorCount.textContent.replace(',', ''));
            setInterval(() => {
                count += Math.floor(Math.random() * 3);
                visitorCount.textContent = count.toLocaleString();
            }, 30000); // Update every 30 seconds
        }
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GSMHamzaApp();
});

// Add CSS for dynamic elements
const dynamicStyles = `
<style>
.search-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    z-index: 1000;
    max-height: 200px;
    overflow-y: auto;
}

.suggestion-item {
    padding: 12px 15px;
    cursor: pointer;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.2s;
}

.suggestion-item:hover {
    background: #f8fafc;
}

.suggestion-item:last-child {
    border-bottom: none;
}

.mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s;
}

.mobile-menu-overlay.active {
    opacity: 1;
    visibility: visible;
}

.mobile-menu {
    position: absolute;
    top: 0;
    right: 0;
    width: 280px;
    height: 100%;
    background: white;
    transform: translateX(100%);
    transition: transform 0.3s;
}

.mobile-menu-overlay.active .mobile-menu {
    transform: translateX(0);
}

.mobile-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e2e8f0;
}

.close-mobile-menu {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
}

.mobile-nav {
    padding: 20px 0;
}

.mobile-nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px 20px;
    text-decoration: none;
    color: #475569;
    transition: all 0.3s;
}

.mobile-nav-link:hover {
    background: #f8fafc;
    color: #0d9e00;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s;
}

.notification.show {
    transform: translateX(0);
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px 20px;
    color: #475569;
}

.notification-content i {
    color: #0d9e00;
}

.favorite-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f1f5f9;
}

.favorite-item:last-child {
    border-bottom: none;
}

.fav-title {
    font-size: 14px;
    color: #475569;
}

.remove-fav {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 5px;
}

.dark-theme {
    background: #0f172a;
    color: #e2e8f0;
}

.dark-theme .header,
.dark-theme .section,
.dark-theme .widget,
.dark-theme .app-card,
.dark-theme .featured-card,
.dark-theme .category-card {
    background: #1e293b;
    border-color: #334155;
}

.dark-theme .search-input {
    background: #334155;
    border-color: #475569;
    color: #e2e8f0;
}

.dark-theme .quick-links-bar {
    background: #1e293b;
    border-color: #334155;
}

@media (max-width: 768px) {
    .mobile-menu {
        width: 100%;
    }
    
    .notification {
        left: 20px;
        right: 20px;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', dynamicStyles);