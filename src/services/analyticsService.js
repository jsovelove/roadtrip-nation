// Analytics service with mock data for the roadtrip-nation demo app

// Generate random data within ranges
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomFloat = (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Mock theme data
const themes = [
  'Leadership', 'Innovation', 'Entrepreneurship', 'Career Change', 
  'Work-Life Balance', 'Education', 'Technology', 'Creativity',
  'Social Impact', 'Diversity', 'Sustainability', 'Mental Health'
];

// Generate theme engagement data
const generateThemeEngagement = () => {
  const themeEngagement = {};
  
  themes.forEach(theme => {
    themeEngagement[theme] = {
      viewCount: randomInt(500, 2500),
      avgTimeSpent: randomInt(180, 600), // in seconds
      completionRate: randomFloat(0.5, 0.95),
      userCount: randomInt(200, 1200),
      bookmarkCount: randomInt(50, 500)
    };
  });
  
  return themeEngagement;
};

// Generate video analytics data
const generateVideoAnalytics = () => {
  const videoIds = [
    'video-123', 'video-456', 'video-789', 'video-101', 
    'video-202', 'video-303', 'video-404', 'video-505'
  ];
  
  const videoAnalytics = {};
  
  videoIds.forEach(id => {
    // Generate drop-off points (3-5 points)
    const dropOffPoints = [];
    const numDropoffs = randomInt(3, 5);
    
    for (let i = 0; i < numDropoffs; i++) {
      const minute = randomInt(1, 15);
      const second = randomInt(0, 59);
      dropOffPoints.push({
        timePoint: `${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`,
        dropRate: randomFloat(0.05, 0.4)
      });
    }
    
    // Generate engagement peaks (4-6 points)
    const engagementPeaks = [];
    const numPeaks = randomInt(4, 6);
    
    for (let i = 0; i < numPeaks; i++) {
      const minute = randomInt(1, 20);
      const second = randomInt(0, 59);
      engagementPeaks.push({
        timePoint: `${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`,
        engagement: randomFloat(0.7, 0.98)
      });
    }
    
    // Generate replayed segments (1-3 segments)
    const replaySegments = [];
    const numReplays = randomInt(1, 3);
    
    for (let i = 0; i < numReplays; i++) {
      const startMin = randomInt(1, 10);
      const startSec = randomInt(0, 59);
      const endMin = startMin + randomInt(0, 3);
      const endSec = randomInt(0, 59);
      
      replaySegments.push({
        start: `${startMin.toString().padStart(2, '0')}:${startSec.toString().padStart(2, '0')}`,
        end: `${endMin.toString().padStart(2, '0')}:${endSec.toString().padStart(2, '0')}`,
        replayCount: randomInt(30, 300)
      });
    }
    
    videoAnalytics[id] = {
      title: `Video ${id.split('-')[1]}`,
      totalViews: randomInt(1000, 5000),
      uniqueViewers: randomInt(800, 3000),
      completionRate: randomFloat(0.5, 0.85),
      avgWatchTime: randomInt(180, 900), // in seconds
      dropOffPoints,
      engagementPeaks,
      replaySegments,
      likes: randomInt(50, 500),
      shares: randomInt(10, 200),
      comments: randomInt(5, 100)
    };
  });
  
  return videoAnalytics;
};

// Generate trending topics over time
const generateTrendingTopics = () => {
  // Generate the last 6 months
  const dates = [];
  const currentDate = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(currentDate.getMonth() - i);
    dates.push(date.toISOString().slice(0, 7)); // YYYY-MM format
  }
  
  // Generate trending data for each topic
  const topics = {};
  themes.forEach(theme => {
    // Start with a base value
    let baseValue = randomInt(50, 200);
    const values = [];
    
    // Generate trend with some randomness and overall direction
    const trend = Math.random() > 0.5 ? 1 : -1; // upward or downward
    
    for (let i = 0; i < dates.length; i++) {
      // Apply trend and randomness
      baseValue += trend * randomInt(5, 30) + randomInt(-20, 20);
      // Ensure value doesn't go below minimum
      baseValue = Math.max(baseValue, 40);
      values.push(baseValue);
    }
    
    topics[theme] = values;
  });
  
  return { dates, topics };
};

// Generate user demographic data
const generateUserDemographics = () => {
  return {
    ageGroups: [
      { group: '18-24', percentage: randomFloat(0.05, 0.2) },
      { group: '25-34', percentage: randomFloat(0.25, 0.4) },
      { group: '35-44', percentage: randomFloat(0.2, 0.3) },
      { group: '45-54', percentage: randomFloat(0.1, 0.2) },
      { group: '55+', percentage: randomFloat(0.05, 0.15) }
    ],
    genders: [
      { gender: 'Male', percentage: randomFloat(0.4, 0.6) },
      { gender: 'Female', percentage: randomFloat(0.4, 0.6) },
      { gender: 'Other', percentage: randomFloat(0.01, 0.05) }
    ],
    regions: [
      { region: 'North America', percentage: randomFloat(0.4, 0.6) },
      { region: 'Europe', percentage: randomFloat(0.15, 0.3) },
      { region: 'Asia', percentage: randomFloat(0.1, 0.25) },
      { region: 'South America', percentage: randomFloat(0.05, 0.15) },
      { region: 'Africa', percentage: randomFloat(0.02, 0.1) },
      { region: 'Oceania', percentage: randomFloat(0.02, 0.1) }
    ],
    devices: [
      { device: 'Desktop', percentage: randomFloat(0.4, 0.6) },
      { device: 'Mobile', percentage: randomFloat(0.3, 0.5) },
      { device: 'Tablet', percentage: randomFloat(0.05, 0.15) }
    ]
  };
};

// Generate engagement over time (daily for the last 30 days)
const generateEngagementOverTime = () => {
  const dates = [];
  const viewCounts = [];
  const uniqueUsers = [];
  const interactionRates = [];
  
  const currentDate = new Date();
  let baseViews = randomInt(100, 500);
  let baseUsers = randomInt(80, 300);
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - i);
    dates.push(date.toISOString().slice(0, 10)); // YYYY-MM-DD format
    
    // Simulate weekly patterns (higher on weekends)
    const dayOfWeek = date.getDay();
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.5 : 1;
    
    // Add some randomness but maintain a trend
    baseViews = Math.max(80, baseViews + randomInt(-30, 50));
    baseUsers = Math.max(50, baseUsers + randomInt(-20, 30));
    
    viewCounts.push(Math.round(baseViews * weekendMultiplier));
    uniqueUsers.push(Math.round(baseUsers * weekendMultiplier));
    interactionRates.push(randomFloat(0.1, 0.4));
  }
  
  return { dates, viewCounts, uniqueUsers, interactionRates };
};

// Compile all mock data
const fakeAnalyticsData = {
  themeEngagement: generateThemeEngagement(),
  videoAnalytics: generateVideoAnalytics(),
  trendingTopics: generateTrendingTopics(),
  userDemographics: generateUserDemographics(),
  engagementOverTime: generateEngagementOverTime()
};

// Export functions to access mock data
export const getThemeAnalytics = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(fakeAnalyticsData.themeEngagement);
    }, 800);
  });
};

export const getVideoAnalytics = (videoId) => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (videoId) {
        resolve(fakeAnalyticsData.videoAnalytics[videoId] || {});
      } else {
        resolve(fakeAnalyticsData.videoAnalytics);
      }
    }, 800);
  });
};

export const getTrendingTopics = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(fakeAnalyticsData.trendingTopics);
    }, 800);
  });
};

export const getUserDemographics = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(fakeAnalyticsData.userDemographics);
    }, 800);
  });
};

export const getEngagementOverTime = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(fakeAnalyticsData.engagementOverTime);
    }, 800);
  });
};

export const getAllAnalytics = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(fakeAnalyticsData);
    }, 1200);
  });
}; 