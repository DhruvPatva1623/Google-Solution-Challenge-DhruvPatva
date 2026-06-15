/**
 * Heuristic AI matching algorithms for scoring volunteer suitability to tasks
 */

/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Computes a compatibility score (0 to 100) between a volunteer profile and a task.
 * 
 * @param {Object} volunteer - The volunteer user profile (skills, location, history)
 * @param {Object} task - The task object (skills needed, coordinates)
 * @returns {number} The suitability match percentage (0 - 100)
 */
export function scoreVolunteerTaskFit(volunteer, task) {
  if (!volunteer || !task) return 0;

  let skillScore = 0;
  let distanceScore = 100;
  let reliabilityScore = 70; // Base baseline reliability

  // 1. Skill Matching (45% Weight)
  const taskSkills = task.skills || [];
  const volunteerSkills = volunteer.skills || volunteer.interests || [];

  if (taskSkills.length > 0 && volunteerSkills.length > 0) {
    const matchedSkills = taskSkills.filter(skill => 
      volunteerSkills.some(vSkill => vSkill.toLowerCase() === skill.toLowerCase())
    );
    skillScore = (matchedSkills.length / taskSkills.length) * 100;
  } else if (taskSkills.length === 0) {
    skillScore = 100; // General tasks require no specific skills
  }

  // 2. Proximity Scoring (40% Weight)
  const vLat = volunteer.lat || 23.0225; // Default Ahmedabad center
  const vLng = volunteer.lng || 72.5714;
  
  if (task.lat && task.lng) {
    const distanceKm = calculateHaversineDistance(vLat, vLng, task.lat, task.lng);
    // Score decays as distance grows (100% at 0km, linear decay up to 15km)
    distanceScore = Math.max(0, 100 - (distanceKm * 6.67)); 
  }

  // 3. Reliability & History Scoring (15% Weight)
  const completedMissions = volunteer.history?.length || 0;
  // Level scaling: +5 points per completed task, capped at 100%
  reliabilityScore = Math.min(100, 70 + (completedMissions * 5));

  // Weighted sum
  const finalScore = Math.round(
    (skillScore * 0.45) + 
    (distanceScore * 0.40) + 
    (reliabilityScore * 0.15)
  );

  return Math.min(100, Math.max(10, finalScore));
}
