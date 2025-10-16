const mongoose = require('mongoose');
const Goal = require('../models/Goal');
const User = require('../models/User');
require('dotenv').config();

const seedGoals = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-guardian', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB for seeding goals...');

    // Find a test user or create one
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('Test user not found. Creating test user...');
      testUser = new User({
        email: 'test@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDBcQkqJESCjKQ2', // password: testpassword
        profile: {
          displayName: 'Test User',
          timezone: 'UTC',
          preferences: {
            theme: 'light',
            fontSize: 'medium',
            language: 'en'
          }
        },
        privacy: {
          cameraConsent: false,
          guardianSharing: true, // Enable sharing for goal testing
          shareFields: ['profile', 'studyTime', 'progress'],
          notifications: {
            inApp: true,
            email: false,
            studyReminders: true
          }
        }
      });
      await testUser.save();
      console.log('Test user created successfully');
    } else {
      // Ensure guardian sharing is enabled for testing
      testUser.privacy.guardianSharing = true;
      await testUser.save();
      console.log('Found existing test user, enabled guardian sharing');
    }

    // Remove existing goals for test user
    await Goal.deleteMany({ userId: testUser._id });
    console.log('Cleared existing goals for test user');

    // Sample goals data
    const sampleGoals = [
      {
        userId: testUser._id,
        title: 'Complete Mathematics Course',
        description: 'Finish the entire advanced calculus course including all assignments and practice problems',
        targetType: 'hours',
        targetValue: 120,
        progressValue: 35,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        visibility: 'shared',
        milestones: [
          {
            title: 'Complete Chapter 1-3',
            dueDate: new Date('2024-02-15'),
            done: true
          },
          {
            title: 'Midterm Preparation',
            dueDate: new Date('2024-03-15'),
            done: true
          },
          {
            title: 'Complete Chapter 4-6',
            dueDate: new Date('2024-04-15'),
            done: false
          },
          {
            title: 'Final Exam Preparation',
            dueDate: new Date('2024-06-01'),
            done: false
          }
        ]
      },
      {
        userId: testUser._id,
        title: 'Daily Study Sessions',
        description: 'Maintain consistent daily study habits with focused 2-hour sessions',
        targetType: 'sessions',
        targetValue: 100,
        progressValue: 67,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-04-30'),
        visibility: 'private',
        milestones: [
          {
            title: 'First Month Complete',
            dueDate: new Date('2024-01-31'),
            done: true
          },
          {
            title: 'Second Month Complete',
            dueDate: new Date('2024-02-29'),
            done: true
          },
          {
            title: 'Third Month Complete',
            dueDate: new Date('2024-03-31'),
            done: false
          },
          {
            title: 'Final Month Complete',
            dueDate: new Date('2024-04-30'),
            done: false
          }
        ]
      },
      {
        userId: testUser._id,
        title: 'Research Paper Tasks',
        description: 'Complete all tasks required for the machine learning research paper',
        targetType: 'tasks',
        targetValue: 25,
        progressValue: 18,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-05-15'),
        visibility: 'public',
        milestones: [
          {
            title: 'Literature Review',
            dueDate: new Date('2024-02-28'),
            done: true
          },
          {
            title: 'Data Collection',
            dueDate: new Date('2024-03-15'),
            done: true
          },
          {
            title: 'Methodology Design',
            dueDate: new Date('2024-03-30'),
            done: true
          },
          {
            title: 'Implementation',
            dueDate: new Date('2024-04-15'),
            done: false
          },
          {
            title: 'Results Analysis',
            dueDate: new Date('2024-04-30'),
            done: false
          },
          {
            title: 'Paper Writing',
            dueDate: new Date('2024-05-10'),
            done: false
          }
        ]
      },
      {
        userId: testUser._id,
        title: 'Language Learning Hours',
        description: 'Dedicate time to learning Spanish through various methods and practice',
        targetType: 'hours',
        targetValue: 50,
        progressValue: 22,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-15'),
        visibility: 'shared',
        milestones: [
          {
            title: 'Basic Vocabulary (500 words)',
            dueDate: new Date('2024-03-15'),
            done: true
          },
          {
            title: 'Grammar Fundamentals',
            dueDate: new Date('2024-05-15'),
            done: false
          },
          {
            title: 'Conversational Practice',
            dueDate: new Date('2024-08-15'),
            done: false
          },
          {
            title: 'Advanced Vocabulary (2000 words)',
            dueDate: new Date('2024-11-15'),
            done: false
          }
        ]
      },
      {
        userId: testUser._id,
        title: 'Weekly Programming Challenges',
        description: 'Solve coding challenges to improve algorithmic thinking and programming skills',
        targetType: 'tasks',
        targetValue: 52,
        progressValue: 15,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        visibility: 'private',
        milestones: [
          {
            title: 'Q1 Challenges (13 tasks)',
            dueDate: new Date('2024-03-31'),
            done: true
          },
          {
            title: 'Q2 Challenges (13 tasks)',
            dueDate: new Date('2024-06-30'),
            done: false
          },
          {
            title: 'Q3 Challenges (13 tasks)',
            dueDate: new Date('2024-09-30'),
            done: false
          },
          {
            title: 'Q4 Challenges (13 tasks)',
            dueDate: new Date('2024-12-31'),
            done: false
          }
        ]
      },
      {
        userId: testUser._id,
        title: 'Physical Fitness Sessions',
        description: 'Maintain regular exercise routine to support mental focus and overall health',
        targetType: 'sessions',
        targetValue: 150,
        progressValue: 89,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        visibility: 'shared',
        milestones: [
          {
            title: 'Build Exercise Habit (30 sessions)',
            dueDate: new Date('2024-03-01'),
            done: true
          },
          {
            title: 'Strength Building Phase (60 sessions)',
            dueDate: new Date('2024-06-01'),
            done: true
          },
          {
            title: 'Endurance Phase (90 sessions)',
            dueDate: new Date('2024-09-01'),
            done: false
          },
          {
            title: 'Advanced Training (150 sessions)',
            dueDate: new Date('2024-12-01'),
            done: false
          }
        ]
      }
    ];

    // Insert sample goals
    const createdGoals = await Goal.insertMany(sampleGoals);
    console.log(`Successfully created ${createdGoals.length} sample goals`);

    // Display summary
    for (const goal of createdGoals) {
      console.log(`- ${goal.title} (${goal.targetType}): ${goal.progressValue}/${goal.targetValue} (${goal.progressPercentage}%)`);
    }

    console.log('\nGoal seeding completed successfully!');
    console.log(`Test user ID: ${testUser._id}`);
    console.log('You can now test the Goal Tracker API endpoints');

  } catch (error) {
    console.error('Error seeding goals:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedGoals();
}

module.exports = seedGoals;