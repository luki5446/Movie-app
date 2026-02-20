const API_URL = window.location.origin; // Render.com pe apna URL automatically aa jayega
let currentPage = 1;
let currentCategory = 'All';
let currentSearch = '';
let settings = {};

// Cache Settings
const CACHE_KEY = 'moviesCache';
const CACHE_TIME = 3 * 60 * 60 * 1000; // 3 hours

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadCategories();
  loadMovies();
  
  document.getElementById('searchBox').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    currentPage = 1;
    loadMovies();
  });
  
  document.getElementById('refreshBtn').addEventListener('click', () => {
    clearCache();
    loadMovies();
    alert('Cache cleared! Fresh data loaded.');
  });
  
  document.getElementById('closePopup').addEventListener('click', () => {
    document.getElementById('moviePopup').style.display = 'none';
  });
});

// Load Settings
async function loadSettings() {
  try {
    const res = await fetch(`${API_URL}/api/settings`);
    settings = await res.json();
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

// Load Categories
async function loadCategories() {
  try {
    const res = await fetch(`${API_URL}/api/categories`);
    const categories = await res.json();
    
    const catDiv = document.getElementById('categories');
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'cat-btn';
      btn.textContent = cat;
      btn.dataset.cat = cat;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = cat;
        currentPage = 1;
        loadMovies();
      });
      catDiv.appendChild(btn);
    });
  } catch (err) {
    console.error('Categories load error:', err);
  }
}

// Check Cache
function getCache() {
  const cache = localStorage.getItem(CACHE_KEY);
  if (!cache) return null;
  
  const data = JSON.parse(cache);
  const now = new Date().getTime();
  
  if (now - data.timestamp > CACHE_TIME) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
  
  return data;
}

// Save Cache
function saveCache(movies) {
  const data = {
    movies,
    timestamp: new Date().getTime()
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

// Clear Cache
function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

// Load Movies (with cache)
async function loadMovies() {
  try {
    // Cache se load karo agar available hai
    const cache = getCache();
    
    let url = `${API_URL}/api/movies?page=${currentPage}`;
    if (currentCategory !== 'All') url += `&category=${currentCategory}`;
    if (currentSearch) url += `&search=${currentSearch}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    // Cache save karo
    if (!currentSearch && currentCategory === 'All') {
      saveCache(data.movies);
    }
    
    displayMovies(data.movies);
    displayPagination(data.currentPage, data.totalPages);
  } catch (err) {
    console.error('Movies load error:', err);
  }
}

// Display Movies
function displayMovies(movies) {
  const grid = document.getElementById('moviesGrid');
  grid.innerHTML = '';
  
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}">
            <h3>${movie.title}</h3>
        `;
    card.addEventListener('click', () => showMoviePopup(movie));
    grid.appendChild(card);
  });
}

// Show Movie Popup with Ad
function showMoviePopup(movie) {
  if (settings.adsEnabled) {
    showAd(settings.movieAdTimer, () => {
      openMovieDetails(movie);
    });
  } else {
    openMovieDetails(movie);
  }
}

// Open Movie Details
function openMovieDetails(movie) {
  const popup = document.getElementById('moviePopup');
  const body = document.getElementById('popupBody');
  
  body.innerHTML = `
        <div class="movie-details">
            <img src="${movie.poster}" alt="${movie.title}">
            <h2>${movie.title}</h2>
            <p><strong>Rating:</strong> ${movie.rating}</p>
            <p><strong>Category:</strong> ${movie.category}</p>
            <p>${movie.story}</p>
            <h3>Download Links:</h3>
            <button class="download-btn" onclick="downloadClick('${movie.downloads.link1}')">📥 Download 480p</button>
            <button class="download-btn" onclick="downloadClick('${movie.downloads.link2}')">📥 Download 720p</button>
            <button class="download-btn" onclick="downloadClick('${movie.downloads.link3}')">📥 Download 1080p</button>
        </div>
    `;
  
  popup.style.display = 'block';
}

// Download Click Handler
function downloadClick(link) {
  if (settings.adsEnabled) {
    showAd(settings.downloadAdTimer, () => {
      window.open(link, '_blank');
    });
  } else {
    window.open(link, '_blank');
  }
}

// Show Ad
function showAd(duration, callback) {
  const adPopup = document.getElementById('adPopup');
  const adFrame = document.getElementById('adFrame');
  const adTimer = document.getElementById('adTimer');
  const skipBtn = document.getElementById('skipAd');
  
  adFrame.src = settings.adBanner;
  adPopup.style.display = 'block';
  skipBtn.style.display = 'none';
  
  let timeLeft = duration;
  adTimer.textContent = `Ad: ${timeLeft}s`;
  
  const interval = setInterval(() => {
    timeLeft--;
    adTimer.textContent = `Ad: ${timeLeft}s`;
    
    if (timeLeft <= 0) {
      clearInterval(interval);
      skipBtn.style.display = 'block';
    }
  }, 1000);
  
  skipBtn.onclick = () => {
    adPopup.style.display = 'none';
    adFrame.src = '';
    callback();
  };
}

// Pagination
function displayPagination(current, total) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Previous';
  prevBtn.disabled = current === 1;
  prevBtn.addEventListener('click', () => {
    currentPage--;
    loadMovies();
  });
  
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next →';
  nextBtn.disabled = current === total;
  nextBtn.addEventListener('click', () => {
    currentPage++;
    loadMovies();
  });
  
  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Page ${current} of ${total}`;
  pageInfo.style.color = '#fff';
  pageInfo.style.padding = '10px';
  
  pagination.appendChild(prevBtn);
  pagination.appendChild(pageInfo);
  pagination.appendChild(nextBtn);
}
