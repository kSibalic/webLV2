document.addEventListener('DOMContentLoaded', function() {
    // Globalna varijabla - cuvanje svih podataka
    let allMoviesData = [];
    let filteredData = [];
    let cartItems = [];
    
    // Učitavanje i parsiranje
    function loadMoviesData() {
      Papa.parse('../database/movies.csv', {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
          allMoviesData = results.data;
          filteredData = [...allMoviesData];
          displayMoviesData(allMoviesData);
          populateFilterOptions();
          setupEventListeners();
          setupCartFunctionality();
        },
        error: function(error) {
          console.error('Greška prilikom učitavanja CSV datoteke:', error);
        }
      });
    }

    // Prikaz podataka
    function displayMoviesData(data) {
      const tableBody = document.querySelector('#movies-table tbody');
      const noResults = document.getElementById('no-results');
      
      // Provjera
      if (!data || data.length === 0) {
        tableBody.innerHTML = '';
        noResults.style.display = 'block';
        return;
      }
      
      noResults.style.display = 'none';
      tableBody.innerHTML = '';
      
      const displayData = data.slice(0, 25);
      
      const countInfo = document.getElementById('count-info');
      countInfo.textContent = `Prikazano ${displayData.length} od ${data.length} filmova`;
      
      displayData.forEach(movie => {
        const row = document.createElement('tr');
        const movieId = `movie-${movie.title?.replace(/\s+/g, '-')?.toLowerCase()}-${movie.year || ''}`;
        
        row.innerHTML = `
          <td>${movie.title || 'N/A'}</td>
          <td>${movie.genre || 'N/A'}</td>
          <td>${movie.year || 'N/A'}</td>
          <td>${movie.duration || 'N/A'}</td>
          <td>${movie.avg_vote || 'N/A'}</td>
          <td>
            <button class="action-button add-to-cart" data-id="${movieId}">
              U košaricu
            </button>
          </td>
        `;
        
        row.dataset.movie = JSON.stringify({
          id: movieId,
          title: movie.title || 'N/A',
          genre: movie.genre || 'N/A',
          year: movie.year || 'N/A',
          duration: movie.duration || 'N/A',
          rating: movie.avg_vote || 'N/A'
        });
        
        tableBody.appendChild(row);
      });
      
      // Event listener za dodavanje u košaricu
      const addToCartButtons = document.querySelectorAll('.add-to-cart');
      addToCartButtons.forEach(button => {
        button.addEventListener('click', function(event) {
          const movieData = JSON.parse(this.closest('tr').dataset.movie);
          addToCart(movieData);
          this.classList.add('added-animation');
          setTimeout(() => {
            this.classList.remove('added-animation');
          }, 500);
        });
      });
    }
    
    function populateFilterOptions() {
      const genreFilter = document.getElementById('genre-filter');
      const genres = new Set();
      
      allMoviesData.forEach(movie => {
        if (movie.genre) {
          genres.add(movie.genre);
        }
      });
      
      genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreFilter.appendChild(option);
      });
      
      const countryFilter = document.getElementById('country-filter');
      const countries = new Set();
      
      allMoviesData.forEach(movie => {
        if (movie.country) {
          countries.add(movie.country);
        }
      });
      
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
      });
      
      const allYears = allMoviesData.map(movie => movie.year).filter(year => year);
      const minYear = Math.min(...allYears);
      const maxYear = Math.max(...allYears);
      
      const yearMin = document.getElementById('year-min');
      const yearMax = document.getElementById('year-max');
      
      yearMin.min = minYear;
      yearMin.max = maxYear;
      yearMin.placeholder = `Od (${minYear})`;
      
      yearMax.min = minYear;
      yearMax.max = maxYear;
      yearMax.placeholder = `Do (${maxYear})`;
    }
    
    function setupEventListeners() {
      const genreFilter = document.getElementById('genre-filter');
      const countryFilter = document.getElementById('country-filter');
      const yearMin = document.getElementById('year-min');
      const yearMax = document.getElementById('year-max');
      const ratingSlider = document.getElementById('rating-slider');
      const ratingValue = document.getElementById('rating-value');
      const resetButton = document.getElementById('reset-filters');
      
      ratingSlider.addEventListener('input', function() {
        ratingValue.textContent = this.value;
      });
      
      // Filtriranje podataka
      function applyFilters() {
        const selectedGenre = genreFilter.value;
        const selectedCountry = countryFilter.value;
        const minYearValue = yearMin.value ? parseInt(yearMin.value) : 0;
        const maxYearValue = yearMax.value ? parseInt(yearMax.value) : 9999;
        const minRating = parseFloat(ratingSlider.value);
        
        filteredData = allMoviesData.filter(movie => {
          // Žanr
          if (selectedGenre && movie.genre !== selectedGenre) return false;
          
          // Država
          if (selectedCountry && movie.country !== selectedCountry) return false;
          
          // Godina
          if (movie.year < minYearValue || movie.year > maxYearValue) return false;
          
          // Ocjena
          if (movie.avg_vote < minRating) return false;
          
          return true;
        });
        
        displayMoviesData(filteredData);
      }
      
      // Event listener za sve filtere
      genreFilter.addEventListener('change', applyFilters);
      countryFilter.addEventListener('change', applyFilters);
      yearMin.addEventListener('input', applyFilters);
      yearMax.addEventListener('input', applyFilters);
      ratingSlider.addEventListener('input', applyFilters);
      
      // Reset
      resetButton.addEventListener('click', function() {
        genreFilter.value = '';
        countryFilter.value = '';
        yearMin.value = '';
        yearMax.value = '';
        ratingSlider.value = 0;
        ratingValue.textContent = '0';
        
        filteredData = [...allMoviesData];
        displayMoviesData(filteredData);
      });
    }
    
    // Funkcionalnosti košarice
    function setupCartFunctionality() {
      const cartIcon = document.getElementById('cart-icon');
      const cartSidebar = document.getElementById('cart-sidebar');
      const closeCart = document.getElementById('close-cart');
      const overlay = document.getElementById('overlay');
      const rentButton = document.getElementById('rent-button');
      
      // Otvaranje košarice
      cartIcon.addEventListener('click', function() {
        cartSidebar.classList.add('open');
        overlay.classList.add('open');
      });
      
      // Zatvaranje košarice
      closeCart.addEventListener('click', function() {
        cartSidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
      
      // Zatvaranje košarice (overlay)
      overlay.addEventListener('click', function() {
        cartSidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
      
      rentButton.addEventListener('click', function() {
        if (cartItems.length === 0) {
          alert('Vaša košarica je prazna. Dodajte filmove prije posudbe.');
        } else {
          const movieTitles = cartItems.map(item => item.title).join(', ');
          alert(`Uspješno ste posudili sljedeće filmove: ${movieTitles}`);
          cartItems = [];
          updateCartDisplay();
        }
      });
    }
    
    // Dodavanje filma
    function addToCart(movieData) {
      // Provjera
      const existingItemIndex = cartItems.findIndex(item => item.id === movieData.id);
      
      if (existingItemIndex === -1) {
        cartItems.push(movieData);
        updateCartDisplay();
      } else {
        alert('Ovaj film je već u vašoj košarici!');
      }
    }
    
    function removeFromCart(movieId) {
      cartItems = cartItems.filter(item => item.id !== movieId);
      updateCartDisplay();
    }
    
    function updateCartDisplay() {
      const cartItemsContainer = document.getElementById('cart-items-container');
      const cartCount = document.getElementById('cart-count');
      const emptyCartMessage = document.getElementById('empty-cart-message');
      
      cartCount.textContent = cartItems.length;
      
      if (cartItems.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartItemsContainer.innerHTML = '';
        cartItemsContainer.appendChild(emptyCartMessage);
        return;
      }
      
      emptyCartMessage.style.display = 'none';
      cartItemsContainer.innerHTML = '';
      cartItemsContainer.appendChild(emptyCartMessage);
      
      cartItems.forEach(item => {
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
          <div class="cart-item-info">
            <h4>${item.title}</h4>
            <p>${item.genre}, ${item.year}</p>
          </div>
          <button class="remove-item" data-id="${item.id}">Ukloni</button>
        `;
        
        cartItemsContainer.appendChild(cartItemElement);
      });
      
      const removeButtons = document.querySelectorAll('.remove-item');
      removeButtons.forEach(button => {
        button.addEventListener('click', function() {
          const movieId = this.dataset.id;
          removeFromCart(movieId);
        });
      });
    }

    loadMoviesData();
  });