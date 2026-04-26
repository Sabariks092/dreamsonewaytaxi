/**
 * Advanced Client-side Form Handler for Taxi Booking
 * Features: Real-time validation, Input restrictions, and Location Autocomplete
 */

document.addEventListener("DOMContentLoaded", function () {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyLIVA8ShW5U7FMtSzPCdtGLhhKJ9RHe3vlHiAC02b-fREpqyJfmPmUYaClVOWNf8gjQ/exec";

    // --- Configuration ---
    const config = {
        puducherryCoords: { lat: 11.94, lon: 79.80 },
        searchRadiusKm: 50,
        debounceTime: 300
    };

    const forms = [
        { id: "hero-taxi-form", results: { pickup: "pickup-results", dropoff: "dropoff-results" } },
        { id: "bottom-taxi-form", results: { pickup: "pickup-results-bottom", dropoff: "dropoff-results-bottom" } }
    ];

    const modal = document.getElementById("form-modal");
    const modalIcon = document.getElementById("modal-icon");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const modalDetails = document.getElementById("modal-details");
    const modalCloseBtn = document.getElementById("modal-close");

    // --- Utility Functions ---

    function showModal(state, title, message, details = "") {
        modal.style.display = 'flex';
        modalIcon.className = "custom-modal__icon";
        modalCloseBtn.style.display = "none";
        modalDetails.style.display = details ? "block" : "none";
        modalDetails.innerHTML = details;

        if (state === 'loading') {
            modalIcon.classList.add("custom-modal__icon--loading");
            modalIcon.innerHTML = '';
        } else if (state === 'success') {
            modalIcon.classList.add("custom-modal__icon--success");
            modalIcon.innerHTML = '✓';
            modalCloseBtn.style.display = "inline-flex";
        } else if (state === 'error') {
            modalIcon.classList.add("custom-modal__icon--error");
            modalIcon.innerHTML = '✕';
            modalCloseBtn.style.display = "inline-flex";
        }
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.add("custom-modal--active");
    }

    function hideModal() {
        modal.classList.remove("custom-modal--active");
        modal.style.display = 'none';  // ADD THIS LINE
    }

    modalCloseBtn.addEventListener("click", hideModal);

    // --- Validation Logic ---

    const validators = {
        fullName: (val) => /^[a-zA-Z\s]{2,50}$/.test(val) ? "" : "Please enter a valid name (letters only).",
        email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? "" : "Please enter a valid email address.",
        mobile: (val) => /^\d{10}$/.test(val) ? "" : "Mobile number must be exactly 10 digits.",
        pickup: (val) => val.length > 3 ? "" : "Please enter a valid pickup location.",
        dropoff: (val) => val.length > 3 ? "" : "Please enter a valid drop location.",
        passengers: (val) => {
            const n = parseInt(val);
            return (n >= 1 && n <= 10) ? "" : "Passenger count must be between 1 and 10.";
        }
    };

    function restrictInput(e, type) {
        const key = e.key;
        if (["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(key)) return;

        if (type === 'alpha') {
            if (!/^[a-zA-Z\s]$/.test(key)) e.preventDefault();
        } else if (type === 'number') {
            if (!/^\d$/.test(key)) e.preventDefault();
        }
    }

    function validateField(input) {
        const name = input.getAttribute("name");
        const value = input.value.trim();
        const msgSpan = input.parentElement.querySelector(".validation-msg");
        
        let error = "";
        if (validators[name]) {
            error = validators[name](value);
        }

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
        const requiredInputs = form.querySelectorAll("input[required]");
        const submitBtn = form.querySelector('button[type="submit"]');
        let allValid = true;

        requiredInputs.forEach(input => {
            if (!validators[input.name] || validators[input.name](input.value.trim()) !== "") {
                allValid = false;
            }
        });

        submitBtn.disabled = !allValid;
    }

    // --- Autocomplete Logic ---

    let debounceTimer;
    async function fetchSuggestions(query, resultContainerId, inputElement) {
        const container = document.getElementById(resultContainerId);
        if (!container) return;

        if (query.length < 3) {
            container.classList.remove("active");
            return;
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            try {
                // Corrected parameter for country filtering: countrycode=in
                const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${config.puducherryCoords.lat}&lon=${config.puducherryCoords.lon}&limit=10&countrycode=in`;
                
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network response was not ok');
                
                const data = await response.json();
                displayResults(data.features, resultContainerId, inputElement);
            } catch (err) {
                console.error("Autocomplete error:", err);
                const container = document.getElementById(resultContainerId);
                if (container) container.classList.remove("active");
            }
        }, config.debounceTime);
    }

    function displayResults(features, containerId, inputElement) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = "";
        
        if (!features || features.length === 0) {
            container.classList.remove("active");
            return;
        }

        // Create a scrollable list wrapper for suggestions
        const listWrapper = document.createElement("div");
        listWrapper.className = "autocomplete-list-wrapper";

        features.forEach(feature => {
            const props = feature.properties;
            const name = props.name || "";
            
            // Build secondary text
            const secondaryParts = [];
            if (props.street) secondaryParts.push(props.street);
            if (props.city) secondaryParts.push(props.city);
            if (props.state) secondaryParts.push(props.state);
            const secondaryText = secondaryParts.join(", ");
            
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
                container.classList.remove("active");
                validateField(inputElement);
                checkFormValidity(inputElement.closest("form"));
            });
            listWrapper.appendChild(item);
        });

        container.appendChild(listWrapper);

        // Add "powered by Google" footer outside the scrollable wrapper
        const footer = document.createElement("div");
        footer.className = "autocomplete-footer";
        footer.innerHTML = `
            <span style="font-size: 11px; color: #70757a;">powered by </span>
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google" class="google-powered" style="height: 14px; margin-left: 4px; vertical-align: middle;">
        `;
        container.appendChild(footer);

        container.classList.add("active");
    }

    // --- Initialize Forms ---

    forms.forEach(formData => {
        const form = document.getElementById(formData.id);
        if (!form) return;

        const inputs = form.querySelectorAll("input");
        
        inputs.forEach(input => {
            const name = input.getAttribute("name");

            // 1. Restrictions
            input.addEventListener("keydown", (e) => {
                if (['fullName', 'pickup', 'dropoff'].includes(name)) restrictInput(e, 'alpha');
                if (['mobile', 'passengers'].includes(name)) restrictInput(e, 'number');
            });

            // 2. Real-time Validation
            input.addEventListener("input", () => {
                validateField(input);
                checkFormValidity(form);

                // 3. Autocomplete triggers
                if (name === 'pickup') fetchSuggestions(input.value, formData.results.pickup, input);
                if (name === 'dropoff') fetchSuggestions(input.value, formData.results.dropoff, input);
            });
        });

        // Close autocomplete when clicking outside
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".taxi-booking__form__field")) {
                document.querySelectorAll(".autocomplete-results").forEach(el => el.classList.remove("active"));
            }
        });

        // 4. Submission
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            showModal('loading', 'Processing...', 'Please wait while we secure your booking.');

            const data = new FormData(form);
            const params = new URLSearchParams(data);

            // Generate Details HTML for the popup
            const labels = {
                fullName: 'Name',
                email: 'Email',
                mobile: 'Mobile',
                pickup: 'Pick up',
                dropoff: 'Drop off',
                passengers: 'Passengers',
                taxiType: 'Taxi Type',
                date: 'Date',
                time: 'Time'
            };
            let detailsHTML = "";
            data.forEach((value, key) => {
                if (labels[key]) {
                    detailsHTML += `<p><strong>${labels[key]}:</strong> <span>${value}</span></p>`;
                }
            });

            // Add Additional Charges Legend
            detailsHTML += `
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 11px; color: #990f02; font-weight: 600; line-height: 1.4; text-align: center;">
                    *Toll, parking, and permit will be extra charges in the bill.
                </div>
            `;

            fetch(SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: params.toString(),
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            })
            .then(() => {
                showModal('success', 'Thanks for choosing us', 'Our team will reach you within 24 hrs', detailsHTML);
                form.reset();
                if (window.$ && typeof $.fn.selectpicker === 'function') $('.selectpicker').selectpicker('refresh');
                checkFormValidity(form);
            })
            .catch(error => {
                console.error("Error!", error);
                showModal('error', 'Booking Failed', '❌ Something went wrong. Please try again or call us directly.');
            });
        });
    });
});
