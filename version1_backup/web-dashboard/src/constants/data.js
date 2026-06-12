export const IMPACT_DATA = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  datasets: [{ 
    label: 'Direct Beneficiaries Helped', 
    data: [1200, 3100, 2800, 4899], 
    borderColor: '#ec4899', 
    backgroundColor: 'transparent', 
    tension: 0.4, 
    borderWidth: 3, 
    pointBackgroundColor: '#ec4899', 
    pointBorderColor: '#ffffff', 
    pointBorderWidth: 2, 
    pointRadius: 5 
  }]
};

export const LANDING_TASKS = [
  { title: 'Emergency Medical Supply Drop', dist: '1.2 km', score: 98, type: 'CRITICAL', color: '#ef4444', skills: ['First Aid', 'Driving'] },
  { title: 'Elderly Food Assistance', dist: '3.4 km', score: 85, type: 'URGENT', color: '#f97316', skills: ['Cooking', 'Transport'] },
  { title: 'Local School Renovation Aid', dist: '5.0 km', score: 76, type: 'ROUTINE', color: '#10b981', skills: ['Painting', 'Carpentry'] }
];

export const LEADERBOARD_DATA = [
  { name: 'Priya Sharma', city: 'Mumbai', pts: 4820, badge: '🥇' },
  { name: 'Rahul Verma', city: 'Delhi', pts: 3950, badge: '🥈' },
  { name: 'Ananya Iyer', city: 'Bangalore', pts: 3100, badge: '🥉' },
  { name: 'Dhruv Patva', city: 'Ahmedabad', pts: 1450, badge: '4' },
  { name: 'Kamal Singh', city: 'Jaipur', pts: 1200, badge: '5' },
];

export const TESTIMONIALS = [
  { name: 'Meera Deshpande', role: 'Beneficiary', text: 'CommunityConnect helped me receive medical supplies within 15 minutes during an emergency. The volunteer was guided right to my doorstep.', rating: 5 },
  { name: 'Akshaya Patra NGO', role: 'Partner NGO', text: 'We mobilized 500 volunteers in 24 hours during the Gujarat floods. 3x faster volunteer coordination than any other platform.', rating: 5 },
  { name: 'Ravi Kumar', role: 'Volunteer', text: 'The gamification keeps me motivated. I have completed 120 hours and earned my blockchain certificate. It feels amazing to give back.', rating: 5 },
];

export const GOVT_SCHEMES = [
  { name: 'PM-KISAN', benefit: '₹6,000/year', eligible: true, desc: 'Direct income support for farming families' },
  { name: 'Ayushman Bharat', benefit: '₹5 Lakh/year', eligible: true, desc: 'Health insurance for below-poverty families' },
  { name: 'MGNREGA', benefit: '100 days work', eligible: true, desc: 'Guaranteed rural employment scheme' },
  { name: 'PM Awas Yojana', benefit: 'Housing subsidy', eligible: false, desc: 'Affordable housing for urban poor' },
];
