import { initRespiratorySystem, respiratorySimStep, getLungCapacity, getTarAcc, resetRespiratorySystem, airParticles } from './respiratory.js';
import { socialInfluence, familyInfluence, lifeStressLevel, updateFamilyInfluence, updateLifeStressLevel, updateSmokerFriends} from './social_circle.js';
import { updateMinSmokeAge, updateExerciseLevel, updatePublicSmokingBan, updateTaxLevel, publicSmokingMultiplier, updateImagePacks} from './national_policy.js';

var animationDelay = 100; 
var simTimer;
var isRunning = false;

var svg;
var bloodPath;
var pathElement;
var pathLength;

// ==================== Heart Initialization ====================
var bloodCells = [];
var baseBloodCellSpeed = 0.05;
var cellSpeed = baseBloodCellSpeed; // Add this line
var veinPathD = "M175 210V150H380V800";

var heartAttackRisk = 0;
var strokeRisk = 0;
var cancerRisk = 0;
var bloodPressure = 1;
var heart_oxygen_level = 100;
var heartStress = 0;

// ==================== Parameter Initialization ====================
var currentAge = 12;
const baseLifeExpectancy = 83;
var lifeExpectancy = 80;
var ageProgressionRate = 0.1; // how much age increases per step
var simulationYear = 0; // Years elapsed in simulation
var currentSticksPerDay =0;
var maxSticks = 0;
var startSmoking = false; // Flag to track if smoking starts
var isInRehab = false; // Flag to track if in rehab
var currentAgeRange = null;
var rehabAge = 0;
var yearsReducedfromStroke = 0; // Years reduced from stroke
var yearsReducedfromHeartAttack = 0;
var yearsReducedfromCancer = 5;

var exerciseFrequency = 3.8; // Frequency of exercise (day per week), assuming max 1hr per day
var exerciseIntensity = 5; // Intensity of exercise (1-10 scale) 
var exercise = exerciseFrequency * exerciseIntensity; // Total exercise level

var startSmokingAge = null; // Age when smoking starts
var maxSticksAge = null; // Age when sticks per day is highest
var maxSticksPerDay = 0; // Maximum sticks per day

// ==================== Social Circle Initialization ====================
// var familyInfluence = 0;
// var lifeStressLevel = 0.3;

// ==================== Brain Initialization ====================
var addictionFactor = 0; // 0 - 480 mg
var withdrawal_severity =0; // 0 to 1
var cognitive_decline = 0;  // 0 to 1
var neuroplasticity=0; // 0 to 1
var intelligenceFromPacks = 1; // 0.2 or 0.5
// ==================== Govt Intervention Initialization ====================
var recoSugarLevel = 0; // -1 to 1
var recoOilLevel = 0; // -1 to 1
var adjustedConsumptionFactor = 1; // Default to 1 (no adjustment)
var nicotineContent = 6;
var recoExerciseLevel = 0; // -1 to 1
var earlyRehabilitationTrigger = false; // Flag to track if early rehabilitation is triggered
var retirementAge = 63;
var rehabDuration = 0;
var hasStage1Cancer = false;

// ============== Death Initialization ==============
var ageOfDeath_heartAttack = null;
var ageOfDeath_stroke = null;
var ageOfDeath_cancer = null;
var ageOfDeath_lungCollapse = null;
var ageOfDeath_natural = null;
var ageOfDeath = null;
var causeOfDeath = null; // Variable to store the cause of death
var experiencedConditions = []; // Array to store experienced conditions

// ==================== Initialization ====================

window.addEventListener("load", init);

function init() {
    // Create the SVG drawing surface
    svg = d3.select("#bodySurface")
        .attr("width", 600)
        .attr("height", 300);

    // Create a group for both path and blood cells
    var veinGroup = svg.append("g")
        .attr("transform", "translate(260, 220)");

    // Append the path to the group
    bloodPath = veinGroup.append("path")
        .attr("id", "veinPath")
        .attr("d", veinPathD)
        .attr("stroke", "#BB2117")
        .attr("stroke-width", 10)
        .attr("fill", "none");

    // Store the group for later use when adding blood cells
    window.veinGroup = veinGroup;

    // Get the DOM element to measure the length of the path
    pathElement = document.getElementById("veinPath");
    pathLength = pathElement.getTotalLength();

    initRespiratorySystem(svg);

    document.getElementById("animationSpeed").addEventListener("input", function () {
        const speedValue = parseInt(this.value, 10); // Get the slider value
        animationDelay = 100 / speedValue; // Adjust animationDelay (higher speedValue = faster simulation)

        if (isRunning) {
            // Restart the simulation to apply the new delay
            window.clearInterval(simTimer);
            simTimer = window.setInterval(simStep, animationDelay);
        }
    });

// ============== Multiple Simulation Initialization =================

document.getElementById("runMultipleSimulations").addEventListener("click", function () {
    const numRuns = parseInt(prompt("Enter the number of simulation runs:")) || 10;
    runMultipleSimulations(numRuns);
});

// ==================== Simulation Initialization ====================
    // Initialize span values for sliders
    // document.getElementById("govt-intervention-value").textContent = document.getElementById("govt-intervention").value;
    document.getElementById("reco-sugar-value").textContent = document.getElementById("reco-sugar").value;
    document.getElementById("life-stress-value").textContent = document.getElementById("life-stress").value;
    document.getElementById("tax-value").textContent = document.getElementById("tax-slider").value;
    document.getElementById("nicotine-content-value").textContent = document.getElementById("nicotine-content-slider").value;
    document.getElementById("ex-int-value").textContent = document.getElementById("ex-int").value;
    document.getElementById("ex-fre-value").textContent = document.getElementById("ex-fre").value;

    //For Graphs
    initCharts();

    // Set up input event listeners
    document.getElementById("age").addEventListener("input", updateInitialAge);
    document.getElementById("sticks_a_day").addEventListener("input", function () {
        updateInitialSticks();
        updateHeartHealth();
    });
    document.getElementById("retirement_age").addEventListener("input", updateRetirementAge);
    document.getElementById("min-age").addEventListener("input", updateMinSmokeAge);

    // event listener for checkbox
    document.getElementById("reco-exercise").addEventListener("change", function () {
        updateExerciseLevel(this); // Pass the checkbox element
    });

    document.getElementById("family-influence").addEventListener("change", function () {
        updateFamilyInfluence(this); // Pass the checkbox element
    });

    document.getElementById("smoker-friends").addEventListener("change", function () {
        updateSmokerFriends(this);
    });

    document.getElementById("public-smoking").addEventListener("change", function () {
        updatePublicSmokingBan(this);
    });

    document.getElementById("smoking-image").addEventListener("change", function () {
        intelligenceFromPacks = updateImagePacks(this);
    });

    document.getElementById("early-rehabilitation").addEventListener("change", function () {
        earlyRehabilitationTrigger = this.checked;
    });

    // event listener for sliders
    // document.getElementById("govt-intervention").addEventListener("input", function () {
    //     govtInterventionLevel = parseFloat(this.value);
    //     updateSliderLabel(this, "govt-intervention-value")
    // });

    document.getElementById("tax-slider").addEventListener("input", function () {
        adjustedConsumptionFactor = updateTaxLevel(this); // Store the factor
        updateTaxLevel(this); // Dynamically update sticks per day
    });

    document.getElementById("reco-sugar").addEventListener("input", function () {
        recoSugarLevel= parseFloat(this.value);
        updateSliderLabel(this, "reco-sugar-value")
    });

    document.getElementById("reco-oil").addEventListener("input", function () {
        recoOilLevel = parseFloat(this.value);
        updateSliderLabel(this, "reco-oil-value")
    });

    document.getElementById("life-stress").addEventListener("input", function () {
        updateLifeStressLevel(this);
        // console.log("Life stress level set to:", lifeStressLevel);
    });

    document.getElementById("tax-slider").addEventListener("input", function () {
        updateSliderLabel(this, "tax-value");
    });

    document.getElementById("nicotine-content-slider").addEventListener("input", function () {
        nicotineContent = this.value;
        updateSliderLabel(this, "nicotine-content-value");
    });

    document.getElementById("ex-int").addEventListener("input", function () {
        exerciseIntensity = parseFloat(this.value);
        updateSliderLabel(this, "ex-int-value")
    });

    document.getElementById("ex-fre").addEventListener("input", function () {
        exerciseFrequency = parseFloat(this.value);
        updateSliderLabel(this, "ex-fre-value")
    });


    document.getElementById("StartORPause").addEventListener("click", startSimulation);



    // For tabs
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].addEventListener("click", function (event) {
            const tabName = this.getAttribute("data-tab"); // You'll need to add this attribute
            openTab(event, tabName);
        });
    }

    // Initialize health metrics
    updateInitialAge();
    updateInitialSticks();
    updateHeartHealth();
    updateExercise(); // Update exercise based on initial value

    calculateLifeExpectancy(); //Calculate life expectancy
    if (window.updateLifeExpectancyChart) {
        updateLifeExpectancyChart(simulationYear, lifeExpectancy);
    }
}

// ==================== Human Body Characteristics Functions ====================

function updateExercise() {
    exerciseFrequency = Math.min(7, exerciseFrequency + 2 * recoExerciseLevel); // Assuming max 1hr per day
    // Recalculate exercise
    exercise = exerciseFrequency * exerciseIntensity;
}

function updateInitialAge() {
    currentAge = parseFloat(document.getElementById("age").value) || 12;
    simulationYear = 0;
    calculateLifeExpectancy();
}

function updateInitialSticks() {


    const age = parseFloat(document.getElementById("age").value) || 12;
    const legalAge = parseFloat(document.getElementById("min-age").value) || 21;

    if (familyInfluence) {
        // Probability when there is family influence
        const maxAge = 21;
        const minProbability = 0.1; // 10% chance at age 12
        const maxProbability = 0.95; // 95% chance at age 21

        const probability = Math.min(
            maxProbability,
            Math.max(
                0,
                minProbability +
                ((currentAge - age) / (maxAge - age)) * (maxProbability - minProbability) -
                Math.max(0, legalAge - currentAge) * 0.2
            )
        );

        // console.log("Probability of starting smoking (with family influence):", probability);

        // Randomly decide if the person starts smoking
        if (Math.random() < probability) {
            currentSticksPerDay = 1;
            if (!startSmoking) { // Check if this is the first time starting
                startSmoking = true;
                startSmokingAge = currentAge; // Set initial age if starting immediately
            }
        }
        
    } else {
        // Probability when there is no family influence
        const maxAge = 25;
        const minProbability = 0.01; // 1% chance at age 12
        const maxProbability = 0.6; // 60% chance at age 25

        const probability = Math.min(
            maxProbability,
            Math.max(
                0,
                minProbability +
                ((currentAge - age) / (maxAge - age)) * (maxProbability - minProbability) -
                Math.max(0, legalAge - currentAge) * 0.2
            )
        );

        // console.log("Probability of starting smoking (without family influence):", probability);

        // Randomly decide if the person starts smoking
        // In the else block (no family influence)
        if (Math.random() < probability) {
            currentSticksPerDay = 1;
            if (!startSmoking) { // Check if this is the first time starting
                startSmoking = true;
                startSmokingAge = currentAge; // Set initial age if starting immediately
            }
        }}
    calculateLifeExpectancy();
}

function updateRetirementAge() {
    retirementAge = parseFloat(document.getElementById("retirement_age").value) || 63;
    // console.log("Retirement age set to:", retirementAge);
}

// Function to calculate life expectancy based on smoking habits
function calculateLifeExpectancy() {
    // Base life expectancy (for non-smokers)


    // Start with basic reduction: Each stick reduces life by 20 minutes
    let yearsReduced = currentSticksPerDay * (20 / 525600);

    // Additional reduction for smoking after age 40
    if (currentAge > 40 && currentSticksPerDay > 0) {
        const yearsSmokingAfter40 = Math.min(simulationYear, currentAge - 40);
        if (yearsSmokingAfter40 > 0) {
            // 0.25 years (3 months) per year smoking after 40
            yearsReduced += yearsSmokingAfter40 * 0.25;
        }
    }

    // Cap reduction based on smoking intensity (10 years for pack-a-day)
    const maxReduction = 10 * (currentSticksPerDay / 20);
    yearsReduced = Math.min(yearsReduced, maxReduction);

    // Calculate final life expectancy
    lifeExpectancy = baseLifeExpectancy - yearsReduced - yearsReducedfromStroke - yearsReducedfromHeartAttack - yearsReducedfromCancer;

    // Set upper and lower bounds
    // Upper bound: non-smokers could live up to 90
    // const upperBound = baseLifeExpectancy + 7;
    // // Lower bound: heavy smokers won't go below 60
    // const lowerBound = Math.max(60, currentAge);

    // Apply bounds
    // lifeExpectancy = Math.min(upperBound, Math.max(lowerBound, lifeExpectancy));

    return lifeExpectancy;
}

function getCurrentSticks(){
    return currentSticksPerDay
}

function updateHeartHealth() {
    // Currently sugar intake = government recommended sugar intake
    var cholesterol = 0;
    var recoSugarLevel = parseFloat(document.getElementById("reco-sugar").value); // -1 to 1
    var recoOilLevel = parseFloat(document.getElementById("reco-oil").value); // -1 to 1
    

    var lungCapacity = getLungCapacity();
    // const lungCapacity = lungHealth ? lungHealth.capacity : 100;

    // Calculate blood pressure: 1.0 is normal
    // Increases by 0.1 per cigarette stick
    // Increases/decreases by sugar level (0.5 is normal)
    cholesterol = recoOilLevel * 0.1; // Assuming oil level is a proxy for cholesterol
    bloodPressure = 1 + (currentSticksPerDay * 0.1) + (recoSugarLevel - 0.5) + (cholesterol - 0.5);


    // Combined impact (weighted to prioritize lung capacity)
    heart_oxygen_level = 100 - (currentSticksPerDay * 0.2) - ((100 - lungCapacity) * 0.3);

    // Ensure oxygen level stays within realistic bounds
    heart_oxygen_level = Math.min(100, Math.max(70, heart_oxygen_level));

    // Calculate heart stress based on both oxygen level and blood pressure
    // Heart stress increases when oxygen is low and blood pressure is high
    // Formula: higher values = more stress (0-100 scale)x
    heartStress = ((100 - heart_oxygen_level) * 0.5) + ((bloodPressure - 1) * 30);
    heartStress = Math.min(100, Math.max(0, heartStress)); // Clamp between 0-100

    // Calculate heart attack risk: 0-100%, increases non-linearly with sticks
    // Using sigmoid function to create realistic risk curve

    if (currentAge < 50) {
        heartAttackRisk = 1 / (1 + Math.exp(-0.08 * (heartStress - 50)));
    } else {
        heartAttackRisk = Math.max(1 / (1 + Math.exp(-0.3 * (heartStress - 35))), 1 / (1 + Math.exp(-0.1 * (heartStress - 40))));
    }

    // Calculate stroke risk: 0-100%, increases with blood pressure
    if (currentAge < 50) { 
        strokeRisk = 1 / (1 + Math.exp(-0.5 * (bloodPressure - 5)));
    } else {
        // strokeRisk = 1 / (1 + Math.exp(-1.1 * (bloodPressure - 3)));
        strokeRisk = 1 / (1 + Math.exp(-0.95 * (bloodPressure - 3)));
    }

    // Calculate cancer risk: 0-100%, increases with blood pressure
    if (currentAge < 40) { 
        cancerRisk = 1 / (1 + Math.exp(-0.05 * (currentSticksPerDay - 80)));
    } else {
        cancerRisk = Math.max(
            1 / (1 + Math.exp(-0.07 * (currentSticksPerDay - 30))),
            1 / (1 + Math.exp(-0.05 * (currentSticksPerDay - 30)))
        );
    }

    // Adjust cell speed based on blood pressure
    cellSpeed = baseBloodCellSpeed * bloodPressure;

    // Recalculate life expectancy
    calculateLifeExpectancy();

    // Only update visuals if simulation is running
    if (isRunning) {
        updateHealthIndicators();
    }
}

// Function to update visual health indicators
function updateHealthIndicators() {
    // Update blood vessel appearance based on blood pressure
    bloodPath.attr("stroke", d3.interpolateRgb("#BB2117", "#fe0204")(bloodPressure - 1));
    // bloodPath.attr("stroke-width", 10 + (bloodPressure - 1) * 10)
    // .attr("stroke", d3.interpolateRgb("#BB2117", "#fe0204")(bloodPressure - 1));

    var lungCapacity = getLungCapacity();
    var tarAccumulation = getTarAcc();

    // Display risk values in the insights panel
    var insights = document.getElementById("insights");
    if (insights) {
        insights.innerHTML = "<h3>Health Metrics</h3>" +
            "<p>Current Age: " + currentAge.toFixed(1) + "</p>" +
            "<p>Years Simulated: " + simulationYear.toFixed(1) + "</p>" +
            "<p>Cigarettes/Day: " + currentSticksPerDay.toFixed(1) + "</p>" +
            "<p>Blood Pressure: " + bloodPressure.toFixed(2) + "x normal</p>" +
            "<p>Heart Attack Risk: " + (heartAttackRisk * 100).toFixed(1) + "%</p>" +
            "<p>Stroke Risk: " + (strokeRisk * 100).toFixed(1) + "%</p>" +
            "<p>Cancer Risk: " + (cancerRisk * 100).toFixed(1) + "%</p>" +
            "<p>Lung Capacity: " + lungCapacity.toFixed(2) + "%</p>" +
            "<p>Tar Accumulation: " + tarAccumulation.toFixed(1) + "%</p>" +
            "<p>Estimated Life Expectancy: " + lifeExpectancy.toFixed(1) + " years</p>" +
            "<p>Years of Life Lost: " + (baseLifeExpectancy - lifeExpectancy).toFixed(1) + "</p>";
    }

    // console.log("heartstress", heartStress);
    // console.log("heart attack risk", heartAttackRisk);
    // console.log("stroke risk", strokeRisk);
    // console.log("cancer risk", cancerRisk);

}

function triggerHeartAttack() {
    experiencedConditions.push("Heart Attack");
    const survivalProbability = 0.5; // 50% chance to survive
    if (Math.random() < survivalProbability) {
        alert("Heart attack occurred! The patient survived.");

        // Reduce life expectancy slightly
        yearsReducedfromHeartAttack += 2; // Decrease life expectancy by 1 year

        // Chance to reduce sticks per day to 1
        if (neuroplasticity < 0.5) { // 70% chance to reduce to 1 stick per day
            currentSticksPerDay = 1;
            alert("The patient has drastically reduced smoking to 1 stick per day after the heart attack.");
        } else {
            alert("The patient continues smoking at the same rate. He refuses to change his habits.");
        }

        // Update health metrics and indicators
        updateHeartHealth();
        updateHealthIndicators();
    } else {
        stopSimulation();
        document.getElementById("StartORPause").textContent = "Start";
        ageOfDeath_heartAttack = currentAge;
        ageOfDeath = ageOfDeath_heartAttack;
        causeOfDeath = "Heart Attack";
        alert("Heart attack occurred! The patient did not survive.");
        resetSimulation();
    }
}

function triggerLungCollapse(){
    stopSimulation();
    ageOfDeath_lungCollapse = currentAge;
    ageOfDeath = ageOfDeath_lungCollapse;
    causeOfDeath = "Lung Collapse";
    alert("The patient had died from lung collapse.");
    resetSimulation();
}

function triggerStroke() {
    const survivalProbability = 0.8; 
    experiencedConditions.push("Stroke");
    if (Math.random() < survivalProbability) {
        alert("Stroke occurred! The patient survived.");
        
        const influenceEffect = (familyInfluence + socialInfluence) * 0.2;

        // Reduce life expectancy slightly
        yearsReducedfromStroke += 8; // Decrease life expectancy by 8 years
        // console.log("Life Expectancy after stroke deduction:", lifeExpectancy);

        // Chance to reduce sticks per day to 1
        if (neuroplasticity < 0.5 && influenceEffect < 0 ) { // 70% chance to reduce to 1 stick per day
            currentSticksPerDay = 1;
            alert("The patient has drastically reduced smoking to 1 stick per day after the stroke.");
        } else {
            alert("The patient continues smoking at the same rate.");
        }

        // Update health metrics and indicators
        updateHeartHealth();
        updateHealthIndicators();
    } else {
        stopSimulation();
        ageOfDeath_stroke = currentAge;
        ageOfDeath = ageOfDeath_stroke;
        causeOfDeath = "Stroke";
        console.log("Death due to stroke with life expectancy:", lifeExpectancy);
        alert("Stroke occurred! The patient did not survive.");
        resetSimulation();
    }
}
function cogDeclineByAge(age) {
    // Constants for the logistic growth model
    const r = 0.1;  // Growth rate (adjust this for faster or slower increase)
    const t0 = 30;  // Inflection point (age at which cognitive decline starts increasing)
    return 1 / (1 + Math.exp(-r * (age - t0)));
}
function triggerStage1Cancer() {
    experiencedConditions.push("Stage 1 Cancer");
    alert("Patient has been diagnosed with Stage 1 cancer.");

    // Reduce life expectancy slightly
    yearsReducedfromCancer += 5; // Decrease life expectancy by 5 years

    // Chance to reduce sticks per day to 1
    if (neuroplasticity < 0.5) { // 70% chance to reduce to 1 stick per day
        currentSticksPerDay = 1;
        alert("The patient has drastically reduced smoking to 1 stick per day after the cancer diagnosis.");
    } else {
        alert("The patient continues smoking at the same rate.");
    }

    // Update health metrics and indicators
    updateHeartHealth();
    updateHealthIndicators();
}

function triggerStage4Cancer() {
    stopSimulation();
    ageOfDeath_cancer = currentAge;
    ageOfDeath = ageOfDeath_cancer;
    causeOfDeath = "Cancer";
    alert("Patient has been diagnosed with Stage 4 cancer. The patient passed away soon after.");
    resetSimulation();
}

// Function to update number of cigs
function updateSticksPerDay() {
    if (isInRehab) {
        // Do not update sticks per day during rehabilitation
        return currentSticksPerDay;
    }
    // Base progression from initial habits
    let newSticksPerDay = currentSticksPerDay;

    // Update addiction factor (makes it harder to quit the longer you smoke)
    addictionFactor = Math.min(1, addictionFactor + (0.01 * simulationYear * (currentSticksPerDay / 20) * (nicotineContent/6) ));

    let stressMultiplier;
    if (currentAge >= retirementAge) {
        // Gradually reduce stress after retirement (down to 50% of normal stress)
        stressMultiplier = Math.max(0.5, 1.0 - ((currentAge - 63) / 20));
    } else if (currentAge < 21) {
        stressMultiplier = 1
    } else {
        stressMultiplier = 1.0 + (simulationYear / 30); // Normal stress progression before retirement
    }

    // 1. Personal stress factor (increases with age and existing consumption)
    const stressFactor = (lifeStressLevel * 0.1 * stressMultiplier ) - (recoSugarLevel * 0.01) + (withdrawal_severity*10);

    // 2. Family influence (-1 to 1 scale)
    // Negative values decrease smoking, positive values increase
    const influenceEffect = (familyInfluence + socialInfluence) * 0.2;

    // 3. Random life events (can be positive or negative)
    let lifeEventImpact;
    if (currentAge > 21) {
        lifeEventImpact = (Math.random() - 0.5) * 0.2;
    } else {
        lifeEventImpact = 0;
    }
    
    // Check if person started smoking
    if (startSmoking || currentSticksPerDay > 0) {
        // Calculate net change, reduced by addiction (addiction makes it harder to reduce)
        let netChange = stressFactor + influenceEffect + lifeEventImpact; //need tweak life and cognitive 
        netChange *= adjustedConsumptionFactor;
        netChange *= publicSmokingMultiplier;
        // Apply change to current sticks per day
        newSticksPerDay += netChange;
    }
    


    // console.log("lifeStressLevel:", lifeStressLevel);
    // console.log("stressMultiplier:", stressMultiplier);
    // console.log("Stress Factor:", stressFactor);

    // Ensure smoking doesn't go below zero
    return Math.min(maxSticks, Math.max(0, newSticksPerDay));
}

function getMaxCigarettesForAge(age) {
    let mean, stdDev;

    // Define mean and standard deviation for each age group
    if (age < 18) {
        mean = 2;
        stdDev = 0.5; // Example: 95% CI ~ [1, 3]
    } else if (age < 25) {
        mean = 10;
        stdDev = 2; // Example: 95% CI ~ [6, 14]
    } else if (age < 35) {
        mean = 15;
        stdDev = 3; // Example: 95% CI ~ [9, 21]
    } else if (age < 45) {
        mean = 18;
        stdDev = 3; // Example: 95% CI ~ [9, 21]
    } else if (age < 55) {
        mean = 16;
        stdDev = 2; // Example: 95% CI ~ [12, 20]
    } else if (age >= 55) {
        mean = 14;
        stdDev = 2; // Example: 95% CI ~ [10, 18]
    }

    // Generate a random value within the 95% confidence interval
    const randomValue = generateRandomNormal(mean, stdDev);

    // Ensure the value is non-negative and return it
    return Math.max(0, randomValue);
}

// Helper function to generate a random value from a normal distribution
function generateRandomNormal(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Avoid 0
    while (v === 0) v = Math.random(); // Avoid 0
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v); // Box-Muller transform
    return z * stdDev + mean; // Scale and shift
}

function getAgeRange(age) {
    if (age < 18) return "<18";
    if (age < 25) return "18-24";
    if (age < 35) return "25-34";
    if (age < 45) return "35-44";
    if (age < 55) return "45-54";
    return "55+";
}

// ==================== Blood Cell Atributes ====================

function addDynamicBloodCell() {
    var cell = { progress: 0 };
    bloodCells.push(cell);
}

// Update the progress of each blood cell along the path
function updateBloodCells() {
    bloodCells.forEach(function (cell) {
        cell.progress += cellSpeed;
    });
    // Remove blood cells that have reached the end of the path
    bloodCells = bloodCells.filter(function (cell) {
        return cell.progress < 1;
    });
}

// ==================== SIM Core Atributes ====================

function updateSliderLabel(slider, labelId) {
    const value = parseFloat(slider.value);
    document.getElementById(labelId).textContent = value.toFixed(1);
}

// Update the positions of the red dots on the SVG drawing surface
function updateSurface() {
    // Bind bloodCells data to circle elements
    var cells = veinGroup.selectAll(".bloodCell").data(bloodCells);

    // Remove cells that are no longer in the data array
    cells.exit().remove();

    // Add new circle elements for any new blood cells
    var newCells = cells.enter().append("circle")
        .attr("class", "bloodCell")
        .attr("r", 5)
        .attr("fill", "red");

    // Position all blood cells along the path based on their progress
    svg.selectAll(".bloodCell")
        .attr("cx", function (d) {
            var point = pathElement.getPointAtLength((d.progress * pathLength));
            return point.x;
        })
        .attr("cy", function (d) {
            var point = pathElement.getPointAtLength((d.progress * pathLength));
            return point.y;
        });
}

function simStep() {
    if (!isRunning) return;

    // Update simulation time and smoking habit
    simulationYear += ageProgressionRate;
    currentAge = parseFloat(document.getElementById("age").value) + simulationYear;

    document.getElementById("age-value").textContent = currentAge.toFixed(0);
    console.log(currentAge.toFixed(0));

    // After updating currentSticksPerDay in simStep()
    if (currentSticksPerDay > 0 && !startSmoking) {
        startSmoking = true;
        startSmokingAge = currentAge; // Record the age when smoking starts
        console.log("Smoking started at age:", startSmokingAge);
    }

    // Track the age and sticks per day when sticks per day is highest
    if (currentSticksPerDay > maxSticksPerDay) {
        maxSticksPerDay = currentSticksPerDay;
        maxSticksAge = currentAge;
        console.log("New max sticks per day:", maxSticksPerDay, "at age:", maxSticksAge);
    }

    updatePublicSmokingBan(document.getElementById("public-smoking"));

    if (isInRehab && currentAge - rehabAge >= rehabDuration) {
        alert(`Rehabilitation period is over. Simulator can freely smoke.`);
        isInRehab = false;
        startSmoking = true; // Allow smoking to resume
    }

    // Prevent smoking updates during rehabilitation
    if (isInRehab) {
        respiratorySimStep(isRunning, currentSticksPerDay); // Continue other simulation steps
        updateBloodCells();
        updateSurface();
        updateHeartHealth();
        updateHealthIndicators();
        return; // Skip smoking-related updates
    }

    // Check if the user has started smoking
    if (!startSmoking) {
        updateInitialSticks();
    }

    // Trigger rehab if smoking starts before the minimum smoking age
    const legalAge = parseFloat(document.getElementById("min-age").value) || 21;
    if (startSmoking && currentAge < legalAge && !isInRehab && earlyRehabilitationTrigger) {
        rehabAge = currentAge;
        rehab();
        return; // Exit the step to prevent further updates during rehab
    }

    let previousSticks = currentSticksPerDay;

    // Recalculate maxSticks if the age transitions to a new range
    const newAgeRange = getAgeRange(currentAge);
    if (newAgeRange !== currentAgeRange) {
        currentAgeRange = newAgeRange;
        maxSticks = getMaxCigarettesForAge(currentAge);
    }

    // Update sticks per day based on progression
    currentSticksPerDay = updateSticksPerDay();
    currentSticksPerDay = Math.min(maxSticks, Math.max(0, currentSticksPerDay));

    if (currentSticksPerDay > 0) {
        updateCigaretteImage();
    }
    
    // Cognitive decline because of age
    const cognitiveDeclineByAge = cogDeclineByAge(currentAge)
    const drop = previousSticks - currentSticksPerDay;

    // === Update Withdrawal Severity ===
    if (previousSticks > 0 && currentSticksPerDay < previousSticks) {
        // Withdrawal kicks in when there's a drop in consumption
        withdrawal_severity = Math.min(1, withdrawal_severity + (drop / 20) * addictionFactor ); // Scale based on drop and addiction
        const recoveryBoost = (drop / previousSticks) * 0.05; // scale down recovery rate
        cognitive_decline = Math.max(0, cognitive_decline - recoveryBoost);
    } else if ( currentSticksPerDay > 0) {
        const declineRate = 0.002 * currentSticksPerDay; // More sticks per day = faster decline
        withdrawal_severity = Math.max(0, (withdrawal_severity - 0.01 ));// If no reduction or still smoking, slowly ease withdrawal
        cognitive_decline = Math.min(1, cognitive_decline + declineRate); // Small passive increase in decline due to continued smoking
    }else {
        // Fully quit: withdrawal easing and brain recovery
        withdrawal_severity = Math.max(0, (withdrawal_severity - 0.02));
        cognitive_decline = Math.max(0, cognitive_decline - 0.005); // Recovery phase: reduce cognitive decline slowly
    }

    neuroplasticity = Math.max(0, cognitive_decline * intelligenceFromPacks + cognitiveDeclineByAge*0.5 - exercise/70);
   

    // Update health metrics
    updateHeartHealth();

    if (heartAttackRisk > 0.3 && Math.random() < heartAttackRisk / 40) {
        console.log("Heart Attack Triggered: Risk =", heartAttackRisk);
        triggerHeartAttack();
    }
    if (strokeRisk > 0.2 && Math.random() < strokeRisk / 10) {
        console.log("Pre Stroke Triggered: Risk =", strokeRisk, "Life Expectancy before trigger =", lifeExpectancy);
        triggerStroke();
        console.log("Post Stroke Triggered: Risk =", strokeRisk, "Life Expectancy after trigger=", lifeExpectancy);
    }
    if (cancerRisk > 0.2 && Math.random() < cancerRisk / 50) {
        console.log("Cancer Triggered: Risk =", cancerRisk);
        if (!hasStage1Cancer) {
            triggerStage1Cancer();
            hasStage1Cancer = true;
        } else {
            triggerStage4Cancer();
        }
    }
    var lungCapacity = getLungCapacity();
    // console.log("Lung Capacity",lungCapacity)
    if (lungCapacity < 20 && Math.random() > lungCapacity / 50) {
        triggerLungCollapse();
    }

    respiratorySimStep(isRunning, currentSticksPerDay);

    // Regular simulation steps
    var spawnProbability = 0.1 * bloodPressure;
    if (Math.random() < spawnProbability) {
        addDynamicBloodCell();
    }

    updateBloodCells();
    updateSurface();

    // Update the life expectancy chart with new data
    if (window.updateLifeExpectancyChart) {
        updateLifeExpectancyChart(currentAge, lifeExpectancy);
    }

    // Check if we've reached life expectancy
    if (currentAge >= lifeExpectancy) {
        console.log("Simulation Ended: Current Age =", currentAge, "Life Expectancy =", lifeExpectancy);
        stopSimulation();
        ageOfDeath_natural = currentAge;
        ageOfDeath = ageOfDeath_natural;
        causeOfDeath = "Natural Causes";
        return;
    }

    console.log("Current Age:", currentAge, "Current Sticks Per Day:", currentSticksPerDay);
    console.log("Start Smoking Age:", startSmokingAge, "Max Sticks Age:", maxSticksAge, "Max Sticks Per Day:", maxSticksPerDay);
}

// ==================== UI Atributes ====================

// Optional: Functions to control the simulation
function startSimulation() {
    if (!isRunning) {
        if (!isInRehab) { // Only allow smoking updates if not in rehab
            maxSticks = getMaxCigarettesForAge(currentAge);
            currentSticksPerDay = parseFloat(document.getElementById("sticks_a_day").value) || 0;
        }
        maxSticks = getMaxCigarettesForAge(currentAge);

        currentSticksPerDay = parseFloat(document.getElementById("sticks_a_day").value) || 0;
        // console.log("started sim with", currentSticksPerDay, "sticks per day");
        // Start the simulation
        simTimer = window.setInterval(simStep, animationDelay);
        isRunning = true;
        document.getElementById("StartORPause").textContent = "Pause";

        // Update initial indicators now that simulation has started
        updateHealthIndicators();
    } else {
        // Pause the simulation
        window.clearInterval(simTimer);
        isRunning = false;
        document.getElementById("StartORPause").textContent = "Start";
    }
}
function resetSimulation() {
    // Stop the simulation
    if (isRunning) {
        window.clearInterval(simTimer);
        isRunning = false;
        document.getElementById("StartORPause").textContent = "Start";
    }

    // Reset simulation values
    bloodCells = [];
    svg.selectAll(".bloodCell").remove();
    currentSticksPerDay = 0; // Reset current sticks to initial value
    currentAge = 12;
    simulationYear = 0;

    // Reset the chart data
    if (window.DataViz) {
        DataViz.resetData('lifeExpectancy');
    }

    // Update displays
    // updateHeartHealth();
    // calculateLifeExpectancy();

    // Update the chart with initial values
    if (window.updateLifeExpectancyChart) {
        updateLifeExpectancyChart(currentAge, lifeExpectancy);
    }

}

function stopSimulation() {
    if (isRunning) {
        window.clearInterval(simTimer);
        isRunning = false;
    }
}

function openTab(evt, tabName) {
    // Hide all tab content
    var tabcontents = document.getElementsByClassName("tab-content");
    for (var i = 0; i < tabcontents.length; i++) {
        tabcontents[i].classList.remove("active");
    }

    // Remove active class from all tab buttons
    var tablinks = document.getElementsByClassName("tab-button");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    // Show the specific tab content
    document.getElementById(tabName).classList.add("active");

    // Add active class to the button that opened the tab
    evt.currentTarget.classList.add("active");
}

function updateCigaretteImage() {
    const imageContainer = document.getElementById("cigarette-image");

    if (parseFloat(currentSticksPerDay.toFixed(1)) > 0) {
        imageContainer.innerHTML = `<img src="/public/img/cig.png" alt="Cigarette" style="width: 50px; height: auto;">`;
    } else {
        imageContainer.innerHTML = ""; // Clear the image if sticks per day is 0
    }
}

function rehab() {
    if (isInRehab) {
        console.log("Rehabilitation is already in progress. No new session will be triggered.");
        return; // Exit if already in rehab
    }

    // Stop smoking for a random duration between 3 and 11 years
    rehabDuration = Math.floor(Math.random() * 8) + 3; // Random number between 3 and 11
    alert(`You were caught smoking below the minimum age. Rehabilitation will prevent you from smoking for ${rehabDuration} years.`);

    // Reset smoking habits
    currentSticksPerDay = 0;
    startSmoking = false;
    isInRehab = true;

    // Reset risks to their original values
    heartAttackRisk = 0;
    strokeRisk = 0;
    cancerRisk = 0;

    // Update health metrics and visuals
    updateHeartHealth();
    updateHealthIndicators();
}

async function runMultipleSimulations(numRuns) {
    const deathAges = [];
    const simulationResults = []; // Array to store simulation results
    const listOfDeath = {
        "Heart Attack": 0,
        "Stroke": 0,
        "Cancer": 0,
        "Lung Collapse": 0,
        "Natural Causes": 0
    };
    let originalAlert = window.alert; // Save the original alert function

    // Override alert and other UI-related functions
    window.alert = function () {}; // No-op function to suppress alerts
    let originalUpdateHealthIndicators = updateHealthIndicators;
    let originalUpdateCigaretteImage = updateCigaretteImage;
    let originalUpdateSurface = updateSurface;
    updateHealthIndicators = function () {}; // No-op function
    updateSurface = function () {};
    updateCigaretteImage = function () {}; // No-op function

    // Get the progress bar element
    const progressBar = document.getElementById("simulationProgress");
    progressBar.value = 0; // Reset progress bar
    progressBar.max = numRuns; // Set the maximum value to the number of runs

    for (let i = 0; i < numRuns; i++) {
        console.log(`Running simulation ${i + 1} of ${numRuns}...`);
        isRunning = false; // Ensure simulation is not running
        resetSimulationState();

        let sticksAtDeath = 0; // Variable to store sticks per day at the age of death
        let cancerRiskAtDeath = 0;
        let heartAttackRiskAtDeath = 0;
        let strokeRiskAtDeath = 0;
        let lungCapacityAtDeath = 0;
        let lifeExpectancyAtDeath = 0; // Variable to store life expectancy at the age of death
        // let experiencedConditions = []; // Track health conditions experienced

        // Override health event triggers to track conditions
        // const originalTriggerHeartAttack = triggerHeartAttack;
        // const originalTriggerStroke = triggerStroke;
        // const originalTriggerStage1Cancer = triggerStage1Cancer;

        // triggerHeartAttack = function () {
            
        //     originalTriggerHeartAttack.apply(this, arguments);
        // };

        // triggerStroke = function () {
        //     experiencedConditions.push("Stroke");
        //     originalTriggerStroke.apply(this, arguments);
        // };

        // triggerStage1Cancer = function () {
        //     experiencedConditions.push("Stage 1 Cancer");
        //     originalTriggerStage1Cancer.apply(this, arguments);
        // };

        while (ageOfDeath === null) {
            simulationYear += ageProgressionRate; // Increment simulation year
            currentAge = parseFloat(document.getElementById("age").value) + simulationYear; // Update current age
            isRunning = true; // Ensure simulation is running
            simStep();

            // Capture values right before the simulation ends
            if (ageOfDeath === null) {
                sticksAtDeath = currentSticksPerDay;
                cancerRiskAtDeath = cancerRisk;
                lifeExpectancyAtDeath = lifeExpectancy;
                heartAttackRiskAtDeath = heartAttackRisk;
                strokeRiskAtDeath = strokeRisk;
                lungCapacityAtDeath = getLungCapacity();
            }
        }

        // Add the age of death to the array
        deathAges.push(ageOfDeath);

        // Calculate the gradient
        let gradient = "N/A"; // Default value if smoking never starts or max sticks is not recorded
        if (startSmokingAge !== null && maxSticksAge !== null && maxSticksAge !== startSmokingAge) {
            gradient = (maxSticksPerDay - 1) / (maxSticksAge - startSmokingAge); // Assuming 1 stick per day at start age
            gradient = gradient.toFixed(2); // Round to 2 decimal places
        }

        // Collect data for the current simulation
        const result = [
            i + 1, // Simulation Number
            ageOfDeath, // Age at Death
            causeOfDeath, // Cause of Death
            lifeExpectancyAtDeath.toFixed(1), // Life Expectancy
            sticksAtDeath.toFixed(1), // Sticks per Day at Age of Death
            (heartAttackRiskAtDeath * 100).toFixed(1), // Heart Attack Risk at Death
            (strokeRiskAtDeath * 100).toFixed(1), // Stroke Risk at Death
            (cancerRiskAtDeath * 100).toFixed(1), // Cancer Risk at Death
            lungCapacityAtDeath.toFixed(1), // Lung Capacity at Death
            experiencedConditions.length > 0 ? `"${experiencedConditions.join(", ")}"` : "None", // Health conditions experienced in one cell
            gradient // Gradient between the two points
        ];
        simulationResults.push(result);

        // Record the cause of death
        if (listOfDeath[causeOfDeath]) {
            listOfDeath[causeOfDeath] += 1;
        } else {
            listOfDeath[causeOfDeath] = 1;
        }

        // Restore original health event triggers
        // triggerHeartAttack = originalTriggerHeartAttack;
        // triggerStroke = originalTriggerStroke;
        // triggerStage1Cancer = originalTriggerStage1Cancer;

        // Update the progress bar
        progressBar.value = i + 1;

        // Allow the browser to update the DOM
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Restore the original functions
    window.alert = originalAlert;
    updateHealthIndicators = originalUpdateHealthIndicators;
    updateCigaretteImage = originalUpdateCigaretteImage;
    updateSurface = originalUpdateSurface;

    // Add headers to the CSV data
    const csvData = [
        ["Simulation Number", "Age at Death", "Cause of Death", "Life Expectancy", "Sticks per Day at Death", "Heart Attack Risk", "Stroke Risk", "Cancer Risk", "Lung Capacity", "Health Conditions Experienced", "Gradient"],
        ...simulationResults
    ];

    // Export the CSV file
    exportToCSV(csvData, "Multiple Simulation Results.csv");

    // Plot the histogram of death ages
    plotMultiSimHistogram(deathAges);

    // Plot the histogram of count of cause of death
    plotMultiSimBarChartCOD(listOfDeath);

    // Reset the progress bar after completion
    progressBar.value = 0;
}

function resetSimulationState() {
    currentAge = 12;
    simulationYear = 0;
    maxSticks = getMaxCigarettesForAge(currentAge);
    startSmoking = false;
    isInRehab = false;
    startSmokingAge = null; // Reset start smoking age
    maxSticksAge = null; // Reset max sticks age
    maxSticksPerDay = 0; 
    rehabAge = 0;
    rehabDuration = 0;
    addictionFactor = 0;
    withdrawal_severity = 0;
    cognitive_decline = 0;
    neuroplasticity = 0;
    bloodPressure = 1;
    heart_oxygen_level = 100;
    heartStress = 0;
    heartAttackRisk = 0;
    strokeRisk = 0;
    cancerRisk = 0;
    currentSticksPerDay = 0;
    yearsReducedfromStroke = 0;
    yearsReducedfromHeartAttack = 0;
    yearsReducedfromCancer = 5;
    lifeExpectancy = calculateLifeExpectancy();
    hasStage1Cancer = false;
    ageOfDeath = null;
    ageOfDeath_heartAttack = null;
    ageOfDeath_stroke = null;
    ageOfDeath_cancer = null;
    ageOfDeath_lungCollapse = null;
    ageOfDeath_natural = null;
    causeOfDeath = null;
    currentAgeRange = null;
    bloodCells = [];
    experiencedConditions = []; // Track health conditions experienced
    resetRespiratorySystem(); // Reset the respiratory system state
    if (typeof airParticles !== "undefined") airParticles.length = 0;
    updateInitialSticks();
    console.log("resetSimulationState: ageOfDeath reset to", ageOfDeath, "currentAge:", currentAge, "sticks:", currentSticksPerDay);
}

function exportToCSV(data, filename) {
    const csvContent = data.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export {
    startSimulation,
    resetSimulation,
    getCurrentSticks,
    updateHeartHealth,
    updateSliderLabel,
    startSmoking,
    simulationYear
}