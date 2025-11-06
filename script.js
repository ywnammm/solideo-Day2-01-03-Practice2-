// Global variables
let map;
let directionsService;
let directionsRenderer;
let placesService;
let geocoder;
let currentPlan = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setDefaultDateTime();
});

// Initialize application
function initializeApp() {
    console.log('TravelMaster initialized');
}

// Setup event listeners
function setupEventListeners() {
    // Autocomplete for locations
    const departureInput = document.getElementById('departure');
    const destinationInput = document.getElementById('destination');

    if (departureInput) {
        departureInput.addEventListener('input', (e) => handleLocationInput(e, 'departure'));
    }

    if (destinationInput) {
        destinationInput.addEventListener('input', (e) => handleLocationInput(e, 'destination'));
    }
}

// Set default date and time to current
function setDefaultDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const dateTimeString = now.toISOString().slice(0, 16);
    document.getElementById('departure-time').value = dateTimeString;
}

// Handle location input with suggestions
function handleLocationInput(event, type) {
    const input = event.target.value;
    if (input.length < 2) {
        hideSuggestions(type);
        return;
    }

    // Korean major cities and landmarks
    const locations = [
        '서울역', '강남역', '인천국제공항', '김포공항', '부산역', '부산 해운대',
        '제주국제공항', '광주송정역', '대전역', '대구역', '울산역',
        '경주역', '전주역', '여수엑스포역', '속초고속버스터미널',
        '강릉역', '춘천역', '평창', '서울 명동', '서울 홍대입구',
        '부산 광안리', '제주 성산일출봉', '제주 한라산', '경주 불국사',
        '전주 한옥마을', '여수 오동도', '남해', '통영', '순천만',
        '안동 하회마을', '보령 대천', '태안', '속초 설악산'
    ];

    const filtered = locations.filter(loc =>
        loc.toLowerCase().includes(input.toLowerCase())
    );

    showSuggestions(filtered, type);
}

// Show location suggestions
function showSuggestions(suggestions, type) {
    const suggestionsDiv = document.getElementById(`${type}-suggestions`);
    if (!suggestionsDiv) return;

    if (suggestions.length === 0) {
        hideSuggestions(type);
        return;
    }

    suggestionsDiv.innerHTML = suggestions.map(suggestion =>
        `<div class="suggestion-item" onclick="selectSuggestion('${suggestion}', '${type}')">${suggestion}</div>`
    ).join('');

    suggestionsDiv.classList.add('active');
}

// Hide suggestions
function hideSuggestions(type) {
    const suggestionsDiv = document.getElementById(`${type}-suggestions`);
    if (suggestionsDiv) {
        suggestionsDiv.classList.remove('active');
    }
}

// Select a suggestion
function selectSuggestion(value, type) {
    document.getElementById(type).value = value;
    hideSuggestions(type);
}

// Scroll to planner section
function scrollToPlanner() {
    document.getElementById('planner').scrollIntoView({ behavior: 'smooth' });
}

// Generate travel plan
async function generatePlan() {
    // Validate inputs
    const departure = document.getElementById('departure').value;
    const destination = document.getElementById('destination').value;
    const departureTime = document.getElementById('departure-time').value;
    const duration = parseInt(document.getElementById('duration').value);

    if (!departure || !destination || !departureTime || !duration) {
        alert('모든 필수 정보를 입력해주세요.');
        return;
    }

    // Get preferences
    const preferences = getPreferences();

    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate plan
    const plan = await createTravelPlan({
        departure,
        destination,
        departureTime,
        duration,
        preferences
    });

    currentPlan = plan;

    // Display results
    displayResults(plan);

    // Hide loading
    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

// Get user preferences
function getPreferences() {
    const interests = Array.from(document.querySelectorAll('input[name="interest"]:checked'))
        .map(cb => cb.value);

    const foodPreferences = Array.from(document.querySelectorAll('input[name="food"]:checked'))
        .map(cb => cb.value);

    const budget = parseInt(document.getElementById('budget').value);

    const pace = document.querySelector('input[name="pace"]:checked')?.value || 'moderate';

    const transportModes = Array.from(document.querySelectorAll('input[name="transport"]:checked'))
        .map(cb => cb.value);

    const optimization = document.querySelector('input[name="optimization"]:checked')?.value || 'balance';

    const includeDiscounts = document.getElementById('include-discounts')?.checked || false;

    return {
        interests,
        foodPreferences,
        budget,
        pace,
        transportModes,
        optimization,
        includeDiscounts
    };
}

// Create travel plan
async function createTravelPlan(data) {
    const { departure, destination, departureTime, duration, preferences } = data;

    // Generate transportation options
    const transportOptions = generateTransportOptions(departure, destination, preferences);

    // Select best option based on optimization preference
    const selectedTransport = selectBestTransport(transportOptions, preferences.optimization);

    // Generate daily itinerary
    const itinerary = generateItinerary(departure, destination, duration, preferences);

    // Calculate costs
    const costs = calculateCosts(selectedTransport, itinerary, preferences);

    return {
        departure,
        destination,
        departureTime,
        duration,
        preferences,
        transportOptions,
        selectedTransport,
        itinerary,
        costs
    };
}

// Generate transport options
function generateTransportOptions(departure, destination, preferences) {
    const options = [];
    const { transportModes, includeDiscounts } = preferences;

    // Base data (simulated)
    const distance = calculateDistance(departure, destination);

    if (transportModes.includes('train')) {
        const basePrice = distance * 0.15;
        const discountPrice = includeDiscounts ? basePrice * 0.85 : basePrice;
        options.push({
            type: 'train',
            name: 'KTX/새마을호',
            icon: 'fa-train',
            duration: Math.round(distance / 200 * 60), // minutes
            price: Math.round(discountPrice * 1000),
            originalPrice: Math.round(basePrice * 1000),
            hasDiscount: includeDiscounts,
            departureTime: '08:00',
            arrivalTime: calculateArrivalTime('08:00', Math.round(distance / 200 * 60)),
            comfort: 4,
            convenience: 5
        });
    }

    if (transportModes.includes('bus')) {
        const basePrice = distance * 0.08;
        const discountPrice = includeDiscounts ? basePrice * 0.9 : basePrice;
        options.push({
            type: 'bus',
            name: '고속버스/시외버스',
            icon: 'fa-bus',
            duration: Math.round(distance / 80 * 60), // minutes
            price: Math.round(discountPrice * 1000),
            originalPrice: Math.round(basePrice * 1000),
            hasDiscount: includeDiscounts,
            departureTime: '08:30',
            arrivalTime: calculateArrivalTime('08:30', Math.round(distance / 80 * 60)),
            comfort: 3,
            convenience: 4
        });
    }

    if (transportModes.includes('plane') && distance > 200) {
        const basePrice = distance * 0.3;
        const discountPrice = includeDiscounts ? basePrice * 0.7 : basePrice;
        options.push({
            type: 'plane',
            name: '국내선 항공편',
            icon: 'fa-plane',
            duration: Math.round(distance / 600 * 60 + 60), // minutes (including airport time)
            price: Math.round(discountPrice * 1000),
            originalPrice: Math.round(basePrice * 1000),
            hasDiscount: includeDiscounts,
            departureTime: '09:00',
            arrivalTime: calculateArrivalTime('09:00', Math.round(distance / 600 * 60 + 60)),
            comfort: 5,
            convenience: 3
        });
    }

    if (transportModes.includes('car')) {
        const basePrice = distance * 0.12;
        options.push({
            type: 'car',
            name: '렌터카',
            icon: 'fa-car',
            duration: Math.round(distance / 70 * 60), // minutes
            price: Math.round(basePrice * 1000),
            originalPrice: Math.round(basePrice * 1000),
            hasDiscount: false,
            departureTime: '08:00',
            arrivalTime: calculateArrivalTime('08:00', Math.round(distance / 70 * 60)),
            comfort: 5,
            convenience: 5
        });
    }

    return options;
}

// Calculate distance between cities (simulated)
function calculateDistance(departure, destination) {
    // Simplified distance calculation
    const distances = {
        '서울-부산': 325,
        '서울-제주': 450,
        '서울-광주': 268,
        '서울-대전': 140,
        '서울-대구': 237,
        '서울-강릉': 165,
        '부산-제주': 310,
        'default': 200
    };

    const key1 = `${normalizeCity(departure)}-${normalizeCity(destination)}`;
    const key2 = `${normalizeCity(destination)}-${normalizeCity(departure)}`;

    return distances[key1] || distances[key2] || distances['default'];
}

// Normalize city names for distance lookup
function normalizeCity(location) {
    const cityMap = {
        '서울': ['서울역', '강남역', '서울', '명동', '홍대입구'],
        '부산': ['부산역', '부산', '해운대', '광안리'],
        '제주': ['제주국제공항', '제주', '성산일출봉', '한라산'],
        '광주': ['광주송정역', '광주'],
        '대전': ['대전역', '대전'],
        '대구': ['대구역', '대구'],
        '강릉': ['강릉역', '강릉']
    };

    for (const [city, aliases] of Object.entries(cityMap)) {
        if (aliases.some(alias => location.includes(alias))) {
            return city;
        }
    }

    return location;
}

// Calculate arrival time
function calculateArrivalTime(departureTime, durationMinutes) {
    const [hours, minutes] = departureTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const arrivalHours = Math.floor(totalMinutes / 60) % 24;
    const arrivalMinutes = totalMinutes % 60;
    return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`;
}

// Select best transport option
function selectBestTransport(options, optimization) {
    if (options.length === 0) return null;

    switch (optimization) {
        case 'time':
            return options.reduce((best, current) =>
                current.duration < best.duration ? current : best
            );
        case 'cost':
            return options.reduce((best, current) =>
                current.price < best.price ? current : best
            );
        case 'balance':
        default:
            return options.reduce((best, current) => {
                const bestScore = best.price / 10000 + best.duration / 60;
                const currentScore = current.price / 10000 + current.duration / 60;
                return currentScore < bestScore ? current : best;
            });
    }
}

// Generate itinerary with real places
async function generateItinerary(departure, destination, duration, preferences) {
    const itinerary = [];
    const startDate = new Date(document.getElementById('departure-time').value);

    for (let day = 0; day < duration; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);

        const activities = await generateDayActivities(day, destination, preferences);

        const dayPlan = {
            day: day + 1,
            date: currentDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            }),
            activities: activities
        };

        itinerary.push(dayPlan);
    }

    return itinerary;
}

// Generate activities for a day using real Places API
async function generateDayActivities(dayIndex, destination, preferences) {
    const activities = [];
    const { interests, foodPreferences, pace } = preferences;

    const activitiesPerDay = pace === 'relaxed' ? 3 : pace === 'moderate' ? 4 : 6;

    try {
        // Morning activity - Search for real attraction
        const morningAttraction = await searchRealPlace(destination, interests[0] || 'history', 'attraction', dayIndex * 3);
        activities.push({
            time: '09:00',
            type: 'activity',
            icon: getActivityIcon(interests[0] || 'history'),
            title: morningAttraction.name,
            description: morningAttraction.description,
            address: morningAttraction.address,
            rating: morningAttraction.rating,
            reviews: morningAttraction.reviews,
            photo: morningAttraction.photo,
            placeId: morningAttraction.placeId,
            duration: pace === 'relaxed' ? 120 : pace === 'moderate' ? 90 : 60,
            cost: morningAttraction.cost || 15000
        });

        // Lunch - Search for real restaurant
        const lunchPlace = await searchRealPlace(destination, foodPreferences[0] || 'korean', 'restaurant', dayIndex * 3 + 1);
        activities.push({
            time: pace === 'relaxed' ? '12:00' : '11:30',
            type: 'food',
            icon: 'fa-utensils',
            title: lunchPlace.name,
            description: lunchPlace.description,
            address: lunchPlace.address,
            rating: lunchPlace.rating,
            reviews: lunchPlace.reviews,
            photo: lunchPlace.photo,
            placeId: lunchPlace.placeId,
            duration: 60,
            cost: getBudgetMealCost(preferences.budget, 'lunch')
        });

        // Afternoon activities
        if (activitiesPerDay >= 4) {
            const afternoonAttraction = await searchRealPlace(destination, interests[1] || 'nature', 'attraction', dayIndex * 3 + 2);
            activities.push({
                time: pace === 'relaxed' ? '14:00' : '13:00',
                type: 'activity',
                icon: getActivityIcon(interests[1] || 'nature'),
                title: afternoonAttraction.name,
                description: afternoonAttraction.description,
                address: afternoonAttraction.address,
                rating: afternoonAttraction.rating,
                reviews: afternoonAttraction.reviews,
                photo: afternoonAttraction.photo,
                placeId: afternoonAttraction.placeId,
                duration: pace === 'relaxed' ? 120 : 90,
                cost: afternoonAttraction.cost || 10000
            });
        }

        // Cafe time
        if (pace !== 'packed') {
            const cafePlace = await searchRealPlace(destination, 'cafe', 'cafe', dayIndex * 2);
            activities.push({
                time: pace === 'relaxed' ? '16:30' : '15:00',
                type: 'food',
                icon: 'fa-coffee',
                title: cafePlace.name,
                description: cafePlace.description,
                address: cafePlace.address,
                rating: cafePlace.rating,
                reviews: cafePlace.reviews,
                photo: cafePlace.photo,
                placeId: cafePlace.placeId,
                duration: 60,
                cost: 8000
            });
        }

        // Evening activity
        if (activitiesPerDay >= 5) {
            const eveningAttraction = await searchRealPlace(destination, interests[2] || 'photo', 'attraction', dayIndex * 3 + 3);
            activities.push({
                time: '17:30',
                type: 'activity',
                icon: getActivityIcon(interests[2] || 'photo'),
                title: eveningAttraction.name,
                description: eveningAttraction.description,
                address: eveningAttraction.address,
                rating: eveningAttraction.rating,
                reviews: eveningAttraction.reviews,
                photo: eveningAttraction.photo,
                placeId: eveningAttraction.placeId,
                duration: 90,
                cost: eveningAttraction.cost || 5000
            });
        }

        // Dinner
        const dinnerPlace = await searchRealPlace(destination, foodPreferences[1] || 'korean', 'restaurant', dayIndex * 3 + 4);
        activities.push({
            time: activitiesPerDay >= 5 ? '19:30' : '18:00',
            type: 'food',
            icon: 'fa-utensils',
            title: dinnerPlace.name,
            description: dinnerPlace.description,
            address: dinnerPlace.address,
            rating: dinnerPlace.rating,
            reviews: dinnerPlace.reviews,
            photo: dinnerPlace.photo,
            placeId: dinnerPlace.placeId,
            duration: 90,
            cost: getBudgetMealCost(preferences.budget, 'dinner')
        });

    } catch (error) {
        console.error('Error generating activities with real places:', error);
        // Fallback to static data if API fails
        return generateFallbackActivities(dayIndex, destination, preferences);
    }

    return activities;
}

// Search for real places using Google Places API
async function searchRealPlace(location, preference, category, offset = 0) {
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps.places) {
        return generateFallbackPlace(location, preference, category);
    }

    return new Promise((resolve) => {
        // Create a map element if not exists (required for PlacesService)
        let tempMap = map;
        if (!tempMap) {
            const tempDiv = document.createElement('div');
            tempMap = new google.maps.Map(tempDiv);
        }

        const service = new google.maps.places.PlacesService(tempMap);

        // Get location coordinates
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ address: location }, (results, status) => {
            if (status !== 'OK' || !results[0]) {
                resolve(generateFallbackPlace(location, preference, category));
                return;
            }

            const locationCoords = results[0].geometry.location;

            // Determine search parameters based on category and preference
            let searchRequest = {
                location: locationCoords,
                radius: 5000, // 5km radius
                language: 'ko'
            };

            if (category === 'restaurant') {
                searchRequest.type = 'restaurant';
                searchRequest.keyword = getRestaurantKeyword(preference);
            } else if (category === 'cafe') {
                searchRequest.type = 'cafe';
            } else { // attraction
                searchRequest.keyword = getAttractionKeyword(preference);
            }

            service.nearbySearch(searchRequest, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                    // Get place at offset or random
                    const index = Math.min(offset, results.length - 1);
                    const place = results[index];

                    // Get detailed information
                    service.getDetails({ placeId: place.place_id, language: 'ko' }, (details, detailsStatus) => {
                        if (detailsStatus === google.maps.places.PlacesServiceStatus.OK) {
                            resolve(formatPlaceData(details, category));
                        } else {
                            resolve(formatPlaceData(place, category));
                        }
                    });
                } else {
                    resolve(generateFallbackPlace(location, preference, category));
                }
            });
        });
    });
}

// Format place data from Google Places API
function formatPlaceData(place, category) {
    const photo = place.photos && place.photos.length > 0
        ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })
        : null;

    let description = '';
    if (place.editorial_summary && place.editorial_summary.overview) {
        description = place.editorial_summary.overview;
    } else if (place.types && place.types.length > 0) {
        description = `${place.types[0].replace(/_/g, ' ')} - 평점 ${place.rating || 'N/A'}점의 인기 장소`;
    } else {
        description = category === 'attraction' ? '방문할 가치가 있는 명소입니다.' : '현지에서 인기 있는 맛집입니다.';
    }

    return {
        name: place.name || '장소명 없음',
        description: description,
        address: place.vicinity || place.formatted_address || '주소 정보 없음',
        rating: place.rating || null,
        reviews: place.user_ratings_total || 0,
        photo: photo,
        placeId: place.place_id,
        cost: estimateCost(category, place.price_level)
    };
}

// Estimate cost based on category and price level
function estimateCost(category, priceLevel) {
    if (category === 'restaurant' || category === 'cafe') {
        return null; // Will be set by budget
    }

    // For attractions
    const costs = [0, 5000, 10000, 15000, 20000];
    return costs[priceLevel] || 10000;
}

// Get restaurant keyword based on preference
function getRestaurantKeyword(preference) {
    const keywords = {
        korean: '한식 맛집',
        seafood: '해산물 맛집',
        cafe: '카페',
        local: '로컬 맛집',
        'fine-dining': '파인다이닝 레스토랑'
    };
    return keywords[preference] || '맛집';
}

// Get attraction keyword based on interest
function getAttractionKeyword(interest) {
    const keywords = {
        history: '역사 문화 관광지',
        nature: '자연 공원 명소',
        food: '맛집 거리',
        shopping: '쇼핑 거리',
        activities: '체험 관광',
        photo: '포토존 명소'
    };
    return keywords[interest] || '관광지';
}

// Generate fallback place when API is not available
function generateFallbackPlace(location, preference, category) {
    const city = normalizeCity(location);

    if (category === 'restaurant' || category === 'cafe') {
        const name = getRestaurantName(city, preference, Math.floor(Math.random() * 4));
        return {
            name: name,
            description: '현지에서 인기 있는 맛집입니다.',
            address: `${city} 지역`,
            rating: (4.0 + Math.random()).toFixed(1),
            reviews: Math.floor(Math.random() * 500) + 100,
            photo: null,
            placeId: null,
            cost: null
        };
    } else {
        const name = getAttractionName(city, preference, 0, Math.floor(Math.random() * 4));
        return {
            name: name,
            description: '방문할 가치가 있는 명소입니다.',
            address: `${city} 지역`,
            rating: (4.0 + Math.random()).toFixed(1),
            reviews: Math.floor(Math.random() * 1000) + 200,
            photo: null,
            placeId: null,
            cost: 10000
        };
    }
}

// Generate fallback activities when API fails
function generateFallbackActivities(dayIndex, destination, preferences) {
    const activities = [];
    const { interests, foodPreferences, pace } = preferences;
    const activitiesPerDay = pace === 'relaxed' ? 3 : pace === 'moderate' ? 4 : 6;

    // Morning activity
    activities.push({
        time: '09:00',
        type: 'activity',
        icon: getActivityIcon(interests[0] || 'history'),
        title: getAttractionName(destination, interests[0] || 'history', dayIndex, 0),
        description: '현지의 유명 관광지를 방문합니다.',
        address: `${destination} 지역`,
        rating: (4.0 + Math.random()).toFixed(1),
        reviews: Math.floor(Math.random() * 1000) + 200,
        photo: null,
        duration: pace === 'relaxed' ? 120 : pace === 'moderate' ? 90 : 60,
        cost: 15000
    });

    // Lunch
    activities.push({
        time: pace === 'relaxed' ? '12:00' : '11:30',
        type: 'food',
        icon: 'fa-utensils',
        title: getRestaurantName(destination, foodPreferences[0] || 'local', dayIndex),
        description: '지역 특색을 담은 맛집입니다.',
        address: `${destination} 지역`,
        rating: (4.0 + Math.random()).toFixed(1),
        reviews: Math.floor(Math.random() * 500) + 100,
        photo: null,
        duration: 60,
        cost: getBudgetMealCost(preferences.budget, 'lunch')
    });

    // Afternoon activities
    if (activitiesPerDay >= 4) {
        activities.push({
            time: pace === 'relaxed' ? '14:00' : '13:00',
            type: 'activity',
            icon: getActivityIcon(interests[1] || 'nature'),
            title: getAttractionName(destination, interests[1] || 'nature', dayIndex, 1),
            description: '아름다운 자연 경관을 감상할 수 있습니다.',
            address: `${destination} 지역`,
            rating: (4.0 + Math.random()).toFixed(1),
            reviews: Math.floor(Math.random() * 1000) + 200,
            photo: null,
            duration: pace === 'relaxed' ? 120 : 90,
            cost: 10000
        });
    }

    if (pace !== 'packed') {
        activities.push({
            time: pace === 'relaxed' ? '16:30' : '15:00',
            type: 'food',
            icon: 'fa-coffee',
            title: getRestaurantName(destination, 'cafe', dayIndex + 50),
            description: '감성 넘치는 카페입니다.',
            address: `${destination} 지역`,
            rating: (4.0 + Math.random()).toFixed(1),
            reviews: Math.floor(Math.random() * 300) + 50,
            photo: null,
            duration: 60,
            cost: 8000
        });
    }

    if (activitiesPerDay >= 5) {
        activities.push({
            time: '17:30',
            type: 'activity',
            icon: getActivityIcon(interests[2] || 'photo'),
            title: getAttractionName(destination, interests[2] || 'photo', dayIndex, 2),
            description: '일몰과 야경을 감상할 수 있습니다.',
            address: `${destination} 지역`,
            rating: (4.0 + Math.random()).toFixed(1),
            reviews: Math.floor(Math.random() * 800) + 150,
            photo: null,
            duration: 90,
            cost: 5000
        });
    }

    activities.push({
        time: activitiesPerDay >= 5 ? '19:30' : '18:00',
        type: 'food',
        icon: 'fa-utensils',
        title: getRestaurantName(destination, foodPreferences[1] || 'korean', dayIndex + 100),
        description: '현지에서 유명한 저녁 맛집입니다.',
        address: `${destination} 지역`,
        rating: (4.0 + Math.random()).toFixed(1),
        reviews: Math.floor(Math.random() * 600) + 150,
        photo: null,
        duration: 90,
        cost: getBudgetMealCost(preferences.budget, 'dinner')
    });

    return activities;
}

// Get activity icon based on interest
function getActivityIcon(interest) {
    const icons = {
        history: 'fa-landmark',
        nature: 'fa-mountain',
        food: 'fa-utensils',
        shopping: 'fa-shopping-bag',
        activities: 'fa-hiking',
        photo: 'fa-camera'
    };
    return icons[interest] || 'fa-map-marker-alt';
}

// Get attraction name based on destination and interest
function getAttractionName(destination, interest, dayIndex, activityIndex) {
    const city = normalizeCity(destination);

    const attractions = {
        '서울': {
            history: ['경복궁', '창덕궁', '종묘', '덕수궁'],
            nature: ['남산타워', '한강공원', '북악스카이웨이', '서울숲'],
            photo: ['이화동 벽화마을', '북촌 한옥마을', '성수동 카페거리', '여의도 한강'],
            shopping: ['명동', '홍대', '강남', '이태원'],
            activities: ['롯데월드', '에버랜드', '서울랜드', '한강 자전거'],
            food: ['광장시장', '통인시장', '망원시장', '남대문시장']
        },
        '부산': {
            history: ['해동용궁사', '감천문화마을', '용두산공원', '부산 근대역사관'],
            nature: ['해운대 해수욕장', '광안리 해수욕장', '태종대', '이기대'],
            photo: ['감천문화마을', '청사포 다릿돌 전망대', '광안대교', '흰여울문화마을'],
            shopping: ['센텀시티', '서면', '남포동', '해운대 마켓'],
            activities: ['해운대 요트투어', '송도 케이블카', '아쿠아리움', '부산타워'],
            food: ['자갈치시장', '광복동 먹자골목', '해운대 미포', '송정 해변']
        },
        '제주': {
            history: ['성산일출봉', '만장굴', '삼성혈', '제주민속촌'],
            nature: ['한라산', '우도', '섭지코지', '산굼부리'],
            photo: ['카멜리아힐', '제주 동백포레스트', '월정리 해변', '협재 해수욕장'],
            shopping: ['제주 동문시장', '이호테우 해변', '제주신화월드', '중문 관광단지'],
            activities: ['승마 체험', '카트 체험', '스쿠버다이빙', '패러글라이딩'],
            food: ['동문시장', '제주 흑돼지 거리', '올레시장', '서귀포 매일올레시장']
        },
        'default': {
            history: ['역사 박물관', '전통 마을', '문화재', '사찰'],
            nature: ['자연 공원', '산책로', '전망대', '해변'],
            photo: ['포토존', '전망대', '야경 명소', '카페 거리'],
            shopping: ['재래시장', '쇼핑몰', '거리', '아울렛'],
            activities: ['레저 스포츠', '문화 체험', '공연 관람', '박물관'],
            food: ['전통 시장', '맛집 거리', '푸드코트', '유명 음식점']
        }
    };

    const cityAttractions = attractions[city] || attractions['default'];
    const interestAttractions = cityAttractions[interest] || cityAttractions['history'];

    return interestAttractions[activityIndex % interestAttractions.length];
}

// Get restaurant name
function getRestaurantName(destination, foodType, seed) {
    const city = normalizeCity(destination);

    const restaurants = {
        '서울': {
            korean: ['광장시장 할머니 순대', '을지로 한식당', '종로 백반집', '익선동 한정식'],
            seafood: ['노량진 수산시장', '광장시장 회센터', '강남 초밥', '마포 횟집'],
            cafe: ['연남동 카페', '성수동 카페', '이태원 루프탑 카페', '한남동 브런치 카페'],
            local: ['진미평양냉면', '이문설렁탕', '광장시장 빈대떡', '종로 족발'],
            'fine-dining': ['강남 파인다이닝', '청담동 레스토랑', '한남동 미슐랭', '서울 오마카세']
        },
        '부산': {
            korean: ['동래파전', '부산 밀면', '해운대 한정식', '서면 백반'],
            seafood: ['자갈치 횟집', '광안리 대게', '기장 멸치쌈밥', '송정 회센터'],
            cafe: ['해운대 바다뷰 카페', '광안리 카페', '감천 전망 카페', '청사포 카페'],
            local: ['돼지국밥 거리', '부산 어묵', '씨앗호떡', '밀면 맛집'],
            'fine-dining': ['해운대 파인다이닝', '센텀 레스토랑', '광안리 오션뷰 레스토랑', '마린시티 다이닝']
        },
        '제주': {
            korean: ['제주 흑돼지', '고기국수', '갈치조림', '해물뚝배기'],
            seafood: ['제주 횟집', '한치물회', '전복죽', '성게국'],
            cafe: ['애월 카페', '함덕 바다 카페', '우도 카페', '성산 일출 카페'],
            local: ['올레국수', '몸국', '제주 회센터', '흑돼지 거리'],
            'fine-dining': ['제주 파인다이닝', '중문 리조트 레스토랑', '애월 파인다이닝', '성산 오션뷰 레스토랑']
        },
        'default': {
            korean: ['전통 한식당', '현지 맛집', '한정식', '백반 맛집'],
            seafood: ['해산물 전문점', '생선구이', '회센터', '수산시장 식당'],
            cafe: ['현지 카페', '베이커리 카페', '전망 좋은 카페', '감성 카페'],
            local: ['향토 음식점', '로컬 맛집', '재래시장 먹거리', '특산 요리'],
            'fine-dining': ['파인다이닝', '고급 레스토랑', '미슐랭 가이드', '셰프 레스토랑']
        }
    };

    const cityRestaurants = restaurants[city] || restaurants['default'];
    const typeRestaurants = cityRestaurants[foodType] || cityRestaurants['korean'];

    return typeRestaurants[seed % typeRestaurants.length];
}

// Get meal cost based on budget
function getBudgetMealCost(budget, mealType) {
    const multiplier = mealType === 'dinner' ? 1.5 : 1;

    switch (budget) {
        case 0: return Math.round(8000 * multiplier);
        case 1: return Math.round(15000 * multiplier);
        case 2: return Math.round(30000 * multiplier);
        case 3: return Math.round(50000 * multiplier);
        default: return Math.round(15000 * multiplier);
    }
}

// Calculate costs
function calculateCosts(selectedTransport, itinerary, preferences) {
    const transportCost = selectedTransport ? selectedTransport.price * 2 : 0; // Round trip

    let accommodationCost = 0;
    let activityCost = 0;
    let foodCost = 0;

    itinerary.forEach(day => {
        day.activities.forEach(activity => {
            if (activity.type === 'food') {
                foodCost += activity.cost;
            } else {
                activityCost += activity.cost;
            }
        });
    });

    // Accommodation cost based on budget
    const nightlyRate = [50000, 80000, 150000, 300000][preferences.budget];
    accommodationCost = nightlyRate * (itinerary.length - 1);

    const totalCost = transportCost + accommodationCost + activityCost + foodCost;

    return {
        transport: transportCost,
        accommodation: accommodationCost,
        activities: activityCost,
        food: foodCost,
        total: totalCost
    };
}

// Display results
function displayResults(plan) {
    // Update summary cards
    document.getElementById('total-time').textContent =
        `${plan.duration}일 ${Math.floor(plan.selectedTransport.duration / 60)}시간`;

    document.getElementById('total-cost').textContent =
        `${plan.costs.total.toLocaleString()}원`;

    document.getElementById('total-distance').textContent =
        `${calculateDistance(plan.departure, plan.destination)}km`;

    const totalPlaces = plan.itinerary.reduce((sum, day) => sum + day.activities.length, 0);
    document.getElementById('total-places').textContent = `${totalPlaces}곳`;

    // Display transport options
    displayTransportOptions(plan.transportOptions, plan.selectedTransport);

    // Display itinerary
    displayItinerary(plan.itinerary);

    // Display cost breakdown
    displayCostBreakdown(plan.costs);

    // Initialize map
    initializeMap(plan);
}

// Display transport options
function displayTransportOptions(options, selected) {
    const container = document.getElementById('transport-options-container');

    container.innerHTML = options.map(option => {
        const isSelected = selected && option.type === selected.type;
        const isFastest = options.every(o => option.duration <= o.duration);
        const isCheapest = options.every(o => option.price <= o.price);

        return `
            <div class="transport-option-card ${isSelected ? 'selected' : ''}">
                <div class="transport-option-header">
                    <div class="transport-option-title">
                        <i class="fas ${option.icon}"></i>
                        <div>
                            <h4>${option.name}</h4>
                            <small>${option.departureTime} → ${option.arrivalTime}</small>
                        </div>
                    </div>
                    <div>
                        ${isFastest ? '<span class="badge fastest">최단시간</span>' : ''}
                        ${isCheapest ? '<span class="badge best-value">최저가</span>' : ''}
                        ${isSelected ? '<span class="badge" style="background: #2563eb;">선택됨</span>' : ''}
                    </div>
                </div>
                <div class="transport-option-details">
                    <div class="detail-item">
                        <span class="detail-label">소요시간</span>
                        <span class="detail-value">${Math.floor(option.duration / 60)}시간 ${option.duration % 60}분</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">요금</span>
                        <span class="detail-value">
                            ${option.hasDiscount ?
                                `<span style="text-decoration: line-through; color: #999; font-size: 0.9rem;">${option.originalPrice.toLocaleString()}원</span><br>` : ''}
                            ${option.price.toLocaleString()}원
                            ${option.hasDiscount ? '<span style="color: #ef4444; font-size: 0.875rem;"> (할인)</span>' : ''}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">편안함</span>
                        <span class="detail-value">${'★'.repeat(option.comfort)}${'☆'.repeat(5 - option.comfort)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">편리성</span>
                        <span class="detail-value">${'★'.repeat(option.convenience)}${'☆'.repeat(5 - option.convenience)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Display itinerary with enhanced place information
function displayItinerary(itinerary) {
    const container = document.getElementById('daily-itinerary');

    container.innerHTML = itinerary.map(day => `
        <div class="day-section">
            <div class="day-header">
                <div>
                    <div class="day-title">Day ${day.day}</div>
                    <div class="day-date">${day.date}</div>
                </div>
            </div>
            <div class="timeline">
                ${day.activities.map(activity => `
                    <div class="timeline-item ${activity.type}">
                        <div class="activity-card">
                            ${activity.photo ? `
                                <div class="activity-photo">
                                    <img src="${activity.photo}" alt="${activity.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1rem;">
                                </div>
                            ` : ''}
                            <div class="activity-header">
                                <div class="activity-title">
                                    <div class="activity-icon">
                                        <i class="fas ${activity.icon}"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <h5>${activity.title}</h5>
                                        ${activity.rating ? `
                                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
                                                <span style="color: #f59e0b; font-size: 0.875rem;">
                                                    ${'★'.repeat(Math.floor(activity.rating))}${'☆'.repeat(5 - Math.floor(activity.rating))}
                                                </span>
                                                <span style="font-size: 0.875rem; color: #6b7280;">
                                                    ${activity.rating} (리뷰 ${activity.reviews}개)
                                                </span>
                                            </div>
                                        ` : ''}
                                        ${activity.address ? `
                                            <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">
                                                <i class="fas fa-map-marker-alt"></i> ${activity.address}
                                            </div>
                                        ` : ''}
                                        <div class="activity-details" style="margin-top: 0.5rem;">
                                            ${activity.description}
                                        </div>
                                    </div>
                                </div>
                                <div class="activity-time">
                                    ${activity.time}
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb;">
                                <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: #6b7280;">
                                    <span><i class="fas fa-clock"></i> ${activity.duration}분</span>
                                    <span><i class="fas fa-won-sign"></i> ${activity.cost.toLocaleString()}원</span>
                                </div>
                                ${activity.placeId ? `
                                    <a href="https://www.google.com/maps/place/?q=place_id:${activity.placeId}"
                                       target="_blank"
                                       style="font-size: 0.875rem; color: #2563eb; text-decoration: none;">
                                        <i class="fas fa-external-link-alt"></i> 지도에서 보기
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Display cost breakdown
function displayCostBreakdown(costs) {
    const container = document.getElementById('cost-details');

    container.innerHTML = `
        <table class="cost-table">
            <thead>
                <tr>
                    <th>항목</th>
                    <th>상세</th>
                    <th>금액</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><i class="fas fa-bus"></i> 교통비</td>
                    <td>왕복 교통편</td>
                    <td>${costs.transport.toLocaleString()}원</td>
                </tr>
                <tr>
                    <td><i class="fas fa-hotel"></i> 숙박비</td>
                    <td>호텔/숙소 비용</td>
                    <td>${costs.accommodation.toLocaleString()}원</td>
                </tr>
                <tr>
                    <td><i class="fas fa-ticket-alt"></i> 관광/체험</td>
                    <td>입장료 및 활동비</td>
                    <td>${costs.activities.toLocaleString()}원</td>
                </tr>
                <tr>
                    <td><i class="fas fa-utensils"></i> 식비</td>
                    <td>식사 및 간식</td>
                    <td>${costs.food.toLocaleString()}원</td>
                </tr>
                <tr class="total-row">
                    <td colspan="2"><strong>총 예상 비용</strong></td>
                    <td><strong>${costs.total.toLocaleString()}원</strong></td>
                </tr>
            </tbody>
        </table>
        <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-radius: 0.5rem; color: #92400e;">
            <i class="fas fa-info-circle"></i> 실제 비용은 계절, 예약 시기, 개인 소비 패턴에 따라 달라질 수 있습니다.
        </div>
    `;
}

// Initialize map
function initializeMap(plan) {
    const mapElement = document.getElementById('map');

    // Check if Google Maps API is loaded
    if (typeof google === 'undefined') {
        mapElement.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center;">
                <i class="fas fa-map-marked-alt" style="font-size: 4rem; margin-bottom: 1rem;"></i>
                <h3 style="margin-bottom: 0.5rem;">경로 지도</h3>
                <p style="opacity: 0.9; margin-bottom: 1rem;">
                    ${plan.departure} → ${plan.destination}
                </p>
                <p style="font-size: 0.875rem; opacity: 0.8;">
                    Google Maps API 키를 설정하면 실제 지도와 경로가 표시됩니다.
                </p>
                <div style="margin-top: 2rem; padding: 1rem; background: rgba(255,255,255,0.2); border-radius: 0.5rem;">
                    <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">
                        <strong>총 거리:</strong> ${calculateDistance(plan.departure, plan.destination)}km
                    </p>
                    <p style="font-size: 0.875rem;">
                        <strong>이동 시간:</strong> ${Math.floor(plan.selectedTransport.duration / 60)}시간 ${plan.selectedTransport.duration % 60}분
                    </p>
                </div>
            </div>
        `;
        return;
    }

    // Initialize Google Map
    const mapOptions = {
        zoom: 7,
        center: { lat: 36.5, lng: 127.5 },
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
    };

    map = new google.maps.Map(mapElement, mapOptions);
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false
    });

    // Display route
    displayRoute(plan.departure, plan.destination);
}

// Display route on map
function displayRoute(origin, destination) {
    if (!directionsService || !directionsRenderer) return;

    const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.TRANSIT
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
        }
    });
}

// Save itinerary
function saveItinerary() {
    if (!currentPlan) {
        alert('저장할 일정이 없습니다.');
        return;
    }

    const data = JSON.stringify(currentPlan, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `여행계획_${currentPlan.departure}_${currentPlan.destination}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('여행 일정이 저장되었습니다!');
}

// Share itinerary
function shareItinerary() {
    if (!currentPlan) {
        alert('공유할 일정이 없습니다.');
        return;
    }

    const shareText = `${currentPlan.departure} → ${currentPlan.destination} ${currentPlan.duration}일 여행\n예상 비용: ${currentPlan.costs.total.toLocaleString()}원`;

    if (navigator.share) {
        navigator.share({
            title: 'TravelMaster 여행 계획',
            text: shareText,
            url: window.location.href
        }).catch(err => console.log('공유 취소:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            alert('여행 일정이 클립보드에 복사되었습니다!');
        });
    }
}

// Print itinerary
function printItinerary() {
    window.print();
}

// Reset planner
function resetPlanner() {
    if (confirm('현재 계획을 삭제하고 새로 시작하시겠습니까?')) {
        currentPlan = null;
        document.getElementById('results').style.display = 'none';
        document.getElementById('departure').value = '';
        document.getElementById('destination').value = '';
        setDefaultDateTime();
        document.getElementById('duration').value = '3';

        // Reset checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = cb.id === 'include-discounts';
        });

        // Reset radio buttons
        document.querySelectorAll('input[name="pace"]').forEach(radio => {
            radio.checked = radio.value === 'moderate';
        });

        document.querySelectorAll('input[name="optimization"]').forEach(radio => {
            radio.checked = radio.value === 'time';
        });

        // Reset budget slider
        document.getElementById('budget').value = '1';

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
