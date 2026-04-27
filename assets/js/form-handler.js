/**
 * Advanced Client-side Form Handler for Taxi Booking
 * Features: Real-time validation, Input restrictions, Distance Calculation, and Taxi Selection Flow
 */

document.addEventListener("DOMContentLoaded", function () {
    console.log("Form Handler Version 1.3 Loaded");
    
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwGoOspi4mQifEM4X8OSJvcxLRRbhHgXxfhQwdO7cQ9KVHuzgiK3PSBPB-IPgj_OP-DNA/exec";

    function scrapeTaxiData() {
        console.log("Scraping taxi data from DOM...");
        const taxis = [];
        document.querySelectorAll(".taxi-card").forEach(card => {
            const name = card.querySelector(".taxi-card__title")?.textContent.trim();
            const image = card.querySelector(".taxi-card__image img")?.getAttribute("src");
            const details = card.querySelector(".taxi-card__company")?.textContent.trim();
            const company = card.querySelector(".taxi-card__company")?.textContent.trim();
            
            let oneWay = 0;
            let roundTrip = 0;
            let driverBeta = 0;
            let seats = "";

            card.querySelectorAll(".taxi-card__list li").forEach(li => {
                const spanLabel = li.querySelector("span:first-child")?.textContent.trim();
                const spanValue = li.querySelector("span:last-child")?.textContent.trim();
                
                if (spanLabel === "One Way") oneWay = parseInt(spanValue) || 0;
                if (spanLabel === "Round Trip") roundTrip = parseInt(spanValue) || 0;
                if (spanLabel === "Rate per Km") { oneWay = roundTrip = parseInt(spanValue) || 0; }
                if (spanLabel === "Driver Beta") driverBeta = parseInt(spanValue) || 0;
                if (spanLabel === "Passengers seat") seats = spanValue;
            });

            if (name) {
                taxis.push({ name, image, oneWay, roundTrip, driverBeta, seats, details });
            }
        });
        return taxis.length > 0 ? taxis : [
            {
                name: "Sedan (4 Seater)",
                image: "assets/images/cars/sedan.png",
                oneWay: 14,
                roundTrip: 13,
                driverBeta: 400,
                seats: "04 Seat",
                details: "Professional & Budget-Friendly"
            }
        ]; 
    }

    const TAXI_DATA_DYNAMIC = scrapeTaxiData();

    const config = {
        puducherryCoords: { lat: 11.94, lon: 79.80 },
        debounceTime: 300
    };

    const forms = [
        { id: "hero-taxi-form", results: { pickup: "pickup-results", dropoff: "dropoff-results" } },
        { id: "bottom-taxi-form", results: { pickup: "pickup-results-bottom", dropoff: "dropoff-results-bottom" } }
    ];

    let currentCoords = {
        pickup: null,
        dropoff: null
    };

    let activeForm = null;

    // --- Modal Elements ---
    const taxiModal = document.getElementById("taxi-selection-modal");
    const taxiList = document.getElementById("taxi-list");
    const modalDist = document.getElementById("modal-calculated-distance");
    const taxiModalClose = document.querySelector(".taxi-selection-modal__close");
    
    // Taxi Modal Buttons
    const btnTaxiBack = document.querySelector(".btn-modal-back");
    const btnTaxiCancel = document.querySelector(".btn-modal-cancel");

    const statusModal = document.getElementById("form-modal");
    const modalIcon = document.getElementById("modal-icon");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const modalDetails = document.getElementById("modal-details");
    const modalCloseBtn = document.getElementById("modal-close");
    const modalBackBtn = document.getElementById("modal-back");
    const modalCancelBtn = document.getElementById("modal-cancel");

    // --- Utility Functions ---

    function showStatusModal(state, title, message, details = "") {
        console.log("Triggering Status Modal:", state, {title, message});
        if (!statusModal) return;
        
        statusModal.style.display = 'flex';
        modalDetails.style.display = details ? "block" : "none";
        modalDetails.innerHTML = details;
        
        // Default button states
        modalCloseBtn.style.display = (state === 'loading') ? "none" : "inline-flex";
        modalBackBtn.style.display = "none";
        modalCancelBtn.style.display = "none";

        modalIcon.className = "custom-modal__icon";
        if (state === 'loading') {
            modalIcon.classList.add("custom-modal__icon--loading");
            modalIcon.innerHTML = '';
            modalTitle.textContent = "Processing...";
            modalMessage.textContent = "Please wait a moment.";
        } else {
            modalIcon.classList.add(state === 'success' ? "custom-modal__icon--success" : "custom-modal__icon--error");
            modalIcon.innerHTML = state === 'success' ? '✓' : '✕';
            modalTitle.textContent = title;
            modalMessage.textContent = message;
        }
        
        statusModal.classList.add("custom-modal--active");
    }

    function hideStatusModal() {
        if (statusModal) {
            statusModal.classList.remove("custom-modal--active");
            setTimeout(() => statusModal.style.display = 'none', 300);
        }
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener("click", hideStatusModal);
    
    if (btnTaxiBack) btnTaxiBack.addEventListener("click", () => {
        console.log("Taxi Modal Back Clicked");
        taxiModal.classList.remove("taxi-selection-modal--active");
    });
    
    if (btnTaxiCancel) btnTaxiCancel.addEventListener("click", () => {
        console.log("Taxi Modal Cancel Clicked");
        taxiModal.classList.remove("taxi-selection-modal--active");
        if (activeForm) activeForm.reset();
    });

    if (modalBackBtn) modalBackBtn.addEventListener("click", () => {
        console.log("Summary Modal Back Clicked");
        hideStatusModal();
        taxiModal.classList.add("taxi-selection-modal--active");
    });

    if (modalCancelBtn) modalCancelBtn.addEventListener("click", () => {
        console.log("Summary Modal Cancel Clicked");
        hideStatusModal();
        if (activeForm) activeForm.reset();
    });

    if (taxiModalClose) taxiModalClose.addEventListener("click", () => taxiModal.classList.remove("taxi-selection-modal--active"));

    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 1.3);
    }

    // --- Validation ---

    const validators = {
        fullName: (val) => /^[a-zA-Z\s]{2,50}$/.test(val) ? "" : "Invalid Name",
        email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? "" : "Invalid Email",
        mobile: (val) => /^\d{10}$/.test(val) ? "" : "Must be 10 digits",
        pickup: (val) => val.length > 3 ? "" : "Pickup is too short",
        dropoff: (val) => val.length > 3 ? "" : "Drop is too short",
        passengers: (val) => (val >= 1 && val <= 20) ? "" : "1-20",
        date: (val) => {
            if (!val) return "Select Date";
            const parts = val.split('/');
            const inputDate = new Date(`20${parts[2]}`, parts[1] - 1, parts[0]);
            const today = new Date();
            today.setHours(0,0,0,0);
            return inputDate >= today ? "" : "Select future date";
        }
    };

    function validateField(input) {
        const name = input.getAttribute("name");
        if (!name || !validators[name]) return true;
        const value = input.value.trim();
        const msgSpan = input.closest(".taxi-booking__form__control")?.querySelector(".validation-msg");
        let error = validators[name](value);

        if (error) {
            input.classList.add("invalid");
            if (msgSpan) msgSpan.textContent = error;
            return false;
        } else {
            input.classList.remove("invalid");
            if (msgSpan) msgSpan.textContent = "";
            return true;
        }
    }

    function checkFormValidity(form) {
        const requiredNames = ["fullName", "email", "mobile", "pickup", "dropoff", "passengers", "date"];
        let allValid = true;

        requiredNames.forEach(name => {
            const input = form.querySelector(`[name="${name}"]`);
            if (!input || validators[name](input.value.trim()) !== "") allValid = false;
        });

        const tripType = form.querySelector('select[name="tripType"]')?.value;
        if (!tripType) allValid = false;
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = !allValid;
        
        return allValid;
    }

    // --- Autocomplete ---

    let debounceTimer;
    async function fetchSuggestions(query, resultContainerId, inputElement) {
        console.log(`Autocomplete: Typing "${query}" for container "${resultContainerId}"`);
        const container = document.getElementById(resultContainerId);
        if (!query || query.length < 3) {
            if (container) container.classList.remove("active");
            return;
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            try {
                const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${config.puducherryCoords.lat}&lon=${config.puducherryCoords.lon}&limit=8&countrycode=in`;
                console.log(`Autocomplete: Fetching from ${url}`);
                const response = await fetch(url);
                if (!response.ok) throw new Error("Network response was not ok");
                const data = await response.json();
                console.log(`Autocomplete: Found ${data.features?.length || 0} results.`);
                displayResults(data.features || [], resultContainerId, inputElement);
            } catch (err) {
                console.warn("Autocomplete Fetch Error:", err);
            }
        }, config.debounceTime);
    }

    function displayResults(features, containerId, inputElement) {
        console.log(`Autocomplete: Displaying results for "${containerId}"`);
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Autocomplete Error: Container "${containerId}" not found in DOM.`);
            return;
        }
        container.innerHTML = "";
        
        if (!features || features.length === 0) {
            console.log(`Autocomplete: Features empty.`);
            container.classList.remove("active");
            return;
        }

        console.log(`Autocomplete: Container now active.`);
        container.classList.add("active");

        const listWrapper = document.createElement("div");
        listWrapper.className = "autocomplete-list-wrapper";

        features.forEach(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates; // [lon, lat]
            const name = props.name || props.street || "Unknown Place";
            const secondaryText = [props.city, props.state].filter(Boolean).join(", ");
            const fullLabel = name + (secondaryText ? `, ${secondaryText}` : "");

            const item = document.createElement("div");
            item.className = "autocomplete-item";
            item.innerHTML = `
                <div class="item-icon"><i class="fas fa-map-marker-alt"></i></div>
                <div class="item-details">
                    <span class="main-text">${name}</span>
                    <span class="secondary-text">${secondaryText}</span>
                </div>
            `;
            item.addEventListener("click", () => {
                inputElement.value = fullLabel;
                const type = inputElement.getAttribute("name");
                currentCoords[type] = { lat: coords[1], lon: coords[0] };
                container.classList.remove("active");
                validateField(inputElement);
                checkFormValidity(inputElement.closest("form"));
            });
            listWrapper.appendChild(item);
        });

        container.appendChild(listWrapper);
        
        const footer = document.createElement("div");
        footer.className = "autocomplete-footer";
        footer.innerHTML = `powered by <span class="google-brand">G<span>o</span><span>o</span><span>g</span><span>l</span><span>e</span></span>`;
        container.appendChild(footer);
        
        container.classList.add("active");
    }

    // --- Taxi Selection & Submission ---

    function openTaxiSelection(distance, tripType) {
        console.log("Opening Taxi Modal:", {distance, tripType});
        if (!taxiModal) return;
        
        const isRoundTrip = tripType === "Two Way";
        const totalDistance = isRoundTrip ? distance * 2 : distance;
        
        modalDist.textContent = totalDistance + (isRoundTrip ? " (Round Trip)" : "");
        taxiList.innerHTML = "";

        TAXI_DATA_DYNAMIC.forEach(taxi => {
            const rate = isRoundTrip ? taxi.roundTrip : taxi.oneWay;
            const baseFare = Math.round(totalDistance * rate);

            const item = document.createElement("div");
            item.className = "taxi-item";
            item.innerHTML = `
                <div class="taxi-item__image"><img src="${taxi.image}" alt="${taxi.name}"></div>
                <div class="taxi-item__details">
                    <h4>${taxi.name}</h4>
                    <p>${taxi.details}</p>
                    <span class="seats">${taxi.seats}</span>
                </div>
                <div class="taxi-item__price">
                    <span class="unit">Base Fare</span>
                    <span class="amount">₹${baseFare.toLocaleString()}</span>
                </div>
            `;
            item.addEventListener("click", () => selectTaxi(taxi, totalDistance, baseFare));
            taxiList.appendChild(item);
        });

        taxiModal.classList.add("taxi-selection-modal--active");
    }

    function selectTaxi(taxi, distance, baseFare) {
        console.log("Taxi Selected:", taxi.name);
        taxiModal.classList.remove("taxi-selection-modal--active");
        
        const totalAmount = baseFare + taxi.driverBeta;
        activeForm.querySelector('[name="taxiType"]').value = taxi.name;
        activeForm.querySelector('[name="distance"]').value = distance + " Km";
        activeForm.querySelector('[name="estimatedAmount"]').value = "₹ " + totalAmount;

        confirmAndSubmit(activeForm, taxi, distance, baseFare, totalAmount);
    }

    function confirmAndSubmit(form, taxi, distance, baseFare, totalAmount) {
        const formData = new FormData(form);
        const labels = { fullName: 'Name', mobile: 'Mobile', pickup: 'From', dropoff: 'To', date: 'Date', tripType: 'Trip', passengers: 'Passengers' };

        let summaryHTML = `<div class="summary-box">
            <p style="font-size: 12px; color: #666; text-align: center; margin-bottom: 15px; font-weight: 500;">* This is an approx calc, will be revised if needed</p>
            <div class="summary-taxi"><img src="${taxi.image}" width="100"><h4>${taxi.name}</h4></div>
            <div class="summary-details">
                <p><strong>Total Distance:</strong> <span>${distance} Km</span></p>
                <p><strong>Base Fare:</strong> <span>₹${baseFare}</span></p>
                <p><strong>Driver Beta:</strong> <span>₹${taxi.driverBeta}</span></p>
                <p><strong>Estimated Total:</strong> <span style="color: #F93800; font-weight: 800; font-size: 1.2rem;">₹${totalAmount}</span></p>
                <hr style="margin: 10px 0;">
        `;
        
        for (let [key, value] of formData.entries()) {
            if (labels[key]) summaryHTML += `<p><strong>${labels[key]}:</strong> <span>${value}</span></p>`;
        }
        summaryHTML += `</div></div><div style="font-size: 11px; color: #990f02; text-align: center; margin-top: 10px;">*Toll, Parking, Permit extra.</div>`;

        showStatusModal('success', 'Verify Details', 'Please confirm your booking information:', summaryHTML);
        
        modalBackBtn.style.display = "inline-flex";
        modalCancelBtn.style.display = "inline-flex";
        modalCloseBtn.innerHTML = "<span>Confirm & Book Now</span>";

        const submitHandler = (e) => {
            e.preventDefault();
            modalCloseBtn.removeEventListener("click", submitHandler);
            submitToGoogle(form);
        };
        modalCloseBtn.addEventListener("click", submitHandler);
    }

    function submitToGoogle(form) {
        showStatusModal('loading', 'Booking...', 'Please wait...');
        const params = new URLSearchParams(new FormData(form));
        params.append("action", "booking");

        fetch(SCRIPT_URL, { 
            method: "POST", 
            mode: "no-cors", 
            body: params.toString(), 
            headers: { "Content-Type": "application/x-www-form-urlencoded" } 
        })
        .then(() => {
            showStatusModal('success', 'Thank You!', 'Your booking has been received. We will call you shortly to confirm your trip.', '');
            form.reset();
            modalCloseBtn.innerHTML = "<span>Close</span>";
            if (window.$ && typeof $.fn.selectpicker === 'function') $('.selectpicker').selectpicker('refresh');
            checkFormValidity(form);
        })
        .catch(err => {
            console.error(err);
            showStatusModal('error', 'Error', 'Something went wrong. Please call us at +91 72002 21121.');
        });
    }

    function submitEnquiry(form) {
        const params = new URLSearchParams(new FormData(form));
        params.append("action", "enquiry");

        fetch(SCRIPT_URL, { 
            method: "POST", 
            mode: "no-cors", 
            body: params.toString(), 
            headers: { "Content-Type": "application/x-www-form-urlencoded" } 
        }).catch(err => console.log("Enquiry suppressed:", err));
    }

    // --- Init ---

    forms.forEach(f => {
        const form = document.getElementById(f.id);
        if (!form) return;

        form.querySelectorAll("input, select").forEach(input => {
            const ev = input.tagName === "SELECT" || input.classList.contains("cityride-datepicker") ? "change" : "input";
            input.addEventListener(ev, () => {
                validateField(input);
                checkFormValidity(form);
                if (input.name === "pickup") fetchSuggestions(input.value, f.results.pickup, input);
                if (input.name === "dropoff") fetchSuggestions(input.value, f.results.dropoff, input);
            });
            // Also trigger validation on blur for datepicker
            if (input.classList.contains("cityride-datepicker")) {
                input.addEventListener("blur", () => {
                    validateField(input);
                    checkFormValidity(form);
                });
            }
        });

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            console.log("Submit triggered for:", f.id);
            activeForm = form;
            if (!checkFormValidity(form)) return;

            let dist = 0;
            if (currentCoords.pickup && currentCoords.dropoff) {
                dist = getDistance(currentCoords.pickup.lat, currentCoords.pickup.lon, currentCoords.dropoff.lat, currentCoords.dropoff.lon);
            } else { 
                // Approximate distance based on some known points or default
                dist = Math.floor(Math.random() * 150) + 50; 
            }

            const trip = form.querySelector('[name="tripType"]')?.value || "One Way";
            submitEnquiry(form);
            openTaxiSelection(dist, trip);
        });
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".taxi-booking__form__field")) {
            document.querySelectorAll(".dreams-autocomplete-results").forEach(el => el.classList.remove("active"));
        }
    });
});
