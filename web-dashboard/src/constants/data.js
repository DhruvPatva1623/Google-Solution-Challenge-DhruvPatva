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
  { id: 1, title: 'Emergency Medical Supply Drop', dist: '1.2 km', score: 98, type: 'CRITICAL', color: '#ef4444', skills: ['First Aid', 'Driving'], lat: 23.0338, lng: 72.5856 },
  { id: 2, title: 'Elderly Food Assistance', dist: '3.4 km', score: 85, type: 'URGENT', color: '#f97316', skills: ['Cooking', 'Transport'], lat: 23.0120, lng: 72.5532 },
  { id: 3, title: 'Local School Renovation Aid', dist: '5.0 km', score: 76, type: 'ROUTINE', color: '#10b981', skills: ['Painting', 'Carpentry'], lat: 23.0450, lng: 72.5612 }
];

export const LEADERBOARD_DATA = [
  { name: 'Anjali Desai', city: 'Surat', pts: 4820, badge: '🥇' },
  { name: 'Rahul Verma', city: 'Delhi', pts: 3950, badge: '🥈' },
  { name: 'Ananya Iyer', city: 'Bangalore', pts: 3100, badge: '🥉' },
  { name: 'Sam Patel', city: 'Mumbai', pts: 1450, badge: '4' },
  { name: 'Kamal Singh', city: 'Jaipur', pts: 1200, badge: '5' },
];

export const TESTIMONIALS = [
  { name: 'Meera Deshpande', role: 'Beneficiary', text: 'CommunityConnect helped me receive medical supplies within 15 minutes during an emergency. The volunteer was guided right to my doorstep.', rating: 5 },
  { name: 'Akshaya Patra NGO', role: 'Partner NGO', text: 'We mobilized 500 volunteers in 24 hours during the Gujarat floods. 3x faster volunteer coordination than any other platform.', rating: 5 },
  { name: 'Ravi Kumar', role: 'Volunteer', text: 'The gamification keeps me motivated. I have completed 120 hours and earned my digital seal certificate. It feels amazing to give back.', rating: 5 },
];

export const GOVT_SCHEMES = [
  {
    name: 'PM-KISAN (Samman Nidhi)',
    desc: 'Direct income support of ₹6,000/year for landholding farmers.',
    benefit: '₹6,000 / year',
    category: 'Agriculture',
    link: 'https://pmkisan.gov.in/'
  },
  {
    name: 'Ayushman Bharat (PM-JAY)',
    desc: 'Free health coverage for secondary & tertiary hospital treatment.',
    benefit: '₹5 Lakh / family / year',
    category: 'Healthcare',
    link: 'https://www.pmjay.gov.in/'
  },
  {
    name: 'MGNREGA (Wage Employment)',
    desc: 'Guaranteed 100 days of wage employment for rural households.',
    benefit: '100 days work / year',
    category: 'Rural Development',
    link: 'https://nrega.nic.in/'
  },
  {
    name: 'PM Awas Yojana (PMAY-U/G)',
    desc: 'Financial assistance to build/improve houses in rural & urban areas.',
    benefit: 'Housing Interest Subsidy',
    category: 'Housing',
    link: 'https://pmaymis.gov.in/'
  },
  {
    name: 'Atal Pension Yojana (APY)',
    desc: 'Pension scheme guaranteeing minimum monthly pension for unorganized sector.',
    benefit: '₹1,000 - ₹5,000 / month pension',
    category: 'Social Security',
    link: 'https://www.npscra.nsdl.co.in/'
  },
  {
    name: 'PM Suraksha Bima Yojana (PMSBY)',
    desc: 'Extremely affordable accident insurance cover for death or disability.',
    benefit: '₹2 Lakh accidental cover',
    category: 'Insurance',
    link: 'https://www.jansuraksha.gov.in/'
  },
  {
    name: 'PM Shram Yogi Maan-dhan (PM-SYM)',
    desc: 'Voluntary pension contribution scheme for unorganized workers.',
    benefit: '₹3,000 / month pension',
    category: 'Social Security',
    link: 'https://maandhan.in/'
  }
];


export const VOLUNTEERS_LIST = [
  {
    volunteer_id: 'V001',
    name: 'Rahul Sharma',
    age: 21,
    gender: 'Male',
    skills: ['Teaching', 'Public Speaking'],
    location: 'Ahmedabad',
    availability_hours_per_week: 10,
    preferred_cause: 'Education',
    experience_level: 'Beginner',
    ngo_preference: 'Youth Development NGO',
    email: 'rahul.sharma@example.com'
  },
  {
    volunteer_id: 'V002',
    name: 'Sam Patel',
    age: 22,
    gender: 'Male',
    skills: ['Medical Assistance', 'First Aid'],
    location: 'Mumbai',
    availability_hours_per_week: 8,
    preferred_cause: 'Healthcare',
    experience_level: 'Student',
    ngo_preference: 'Health NGO',
    email: 'sam.patel@example.com'
  },
  {
    volunteer_id: 'V003',
    name: 'Aman Verma',
    age: 19,
    gender: 'Male',
    skills: ['Coding', 'Web Development'],
    location: 'Mumbai',
    availability_hours_per_week: 12,
    preferred_cause: 'Technology',
    experience_level: 'Beginner',
    ngo_preference: 'Education NGO',
    email: 'aman.verma@example.com'
  },
  {
    volunteer_id: 'V004',
    name: 'Neha Joshi',
    age: 26,
    gender: 'Female',
    skills: ['Event Management', 'Fundraising'],
    location: 'Pune',
    availability_hours_per_week: 15,
    preferred_cause: 'Community Service',
    experience_level: 'Advanced',
    ngo_preference: 'Social Welfare NGO',
    email: 'neha.joshi@example.com'
  },
  {
    volunteer_id: 'V005',
    name: 'Ravi Mehta',
    age: 30,
    gender: 'Male',
    skills: ['Driving', 'Logistics Support'],
    location: 'Delhi',
    availability_hours_per_week: 20,
    preferred_cause: 'Disaster Relief',
    experience_level: 'Intermediate',
    ngo_preference: 'Emergency NGO',
    email: 'ravi.mehta@example.com'
  },
  {
    volunteer_id: 'V006',
    name: 'Isha Shah',
    age: 22,
    gender: 'Female',
    skills: ['Teaching', 'Child Care'],
    location: 'Ahmedabad',
    availability_hours_per_week: 9,
    preferred_cause: 'Education',
    experience_level: 'Beginner',
    ngo_preference: 'School NGO',
    email: 'isha.shah@example.com'
  },
  {
    volunteer_id: 'V007',
    name: 'Karan Singh',
    age: 28,
    gender: 'Male',
    skills: ['Medical Assistance', 'Awareness Campaigns'],
    location: 'Jaipur',
    availability_hours_per_week: 14,
    preferred_cause: 'Healthcare',
    experience_level: 'Advanced',
    ngo_preference: 'Health NGO',
    email: 'karan.singh@example.com'
  },
  {
    volunteer_id: 'V008',
    name: 'Anjali Desai',
    age: 23,
    gender: 'Female',
    skills: ['Content Writing', 'Design'],
    location: 'Surat',
    availability_hours_per_week: 11,
    preferred_cause: 'Media Awareness',
    experience_level: 'Intermediate',
    ngo_preference: 'Social NGO',
    email: 'anjali.desai@example.com'
  },
  {
    volunteer_id: 'V009',
    name: 'Dev Patel',
    age: 25,
    gender: 'Male',
    skills: ['Photography', 'Event Coverage'],
    location: 'Vadodara',
    availability_hours_per_week: 10,
    preferred_cause: 'Awareness',
    experience_level: 'Intermediate',
    ngo_preference: 'NGO Media Team',
    email: 'dev.patel@example.com'
  },
  {
    volunteer_id: 'V010',
    name: 'Sneha Rao',
    age: 27,
    gender: 'Female',
    skills: ['Counseling', 'Public Speaking'],
    location: 'Bangalore',
    availability_hours_per_week: 16,
    preferred_cause: 'Mental Health',
    experience_level: 'Advanced',
    ngo_preference: 'Mental Health NGO',
    email: 'sneha.rao@example.com'
  }
];
